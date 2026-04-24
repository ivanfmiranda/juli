import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, timeout } from 'rxjs/operators';
import { AuthService } from '../../core/auth/auth.service';
import { JuliI18nService } from '../../core/i18n/i18n.service';
import { TenantBrandingApiService } from '../../core/services/tenant-branding-api.service';

/**
 * "Redefinir senha" — lands from the email link with ?token=<plaintext>,
 * collects the new password, and hits {@code /api/auth/password-reset/confirm}.
 * All 4xx from the backend map to a single "invalid or expired" copy because
 * the backend deliberately uses a generic {@code INVALID_TOKEN} error code
 * to avoid leaking the exact failure mode (missing vs expired vs consumed).
 */
@Component({
  selector: 'app-reset-password-page',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResetPasswordComponent implements OnInit {
  readonly form = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required]
  }, { validators: this.matchPasswordsValidator() });

  brandName = 'Juli';
  token: string | null = null;
  submitting = false;
  tokenMissing = false;
  errorMessage?: string;

  constructor(
    private readonly fb: UntypedFormBuilder,
    private readonly authService: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
    private readonly titleService: Title,
    private readonly brandingApi: TenantBrandingApiService,
    private readonly i18n: JuliI18nService,
  ) {}

  ngOnInit(): void {
    const config = this.brandingApi.snapshot;
    this.brandName = config.brandName;
    this.titleService.setTitle(`${this.i18n.translate('auth.resetPassword.title')} — ${config.brandName}`);

    const rawToken = this.route.snapshot.queryParamMap.get('token');
    this.token = rawToken && rawToken.trim() ? rawToken : null;
    this.tokenMissing = this.token === null;
  }

  submit(): void {
    if (this.form.invalid || this.submitting || !this.token) {
      this.form.markAllAsTouched();
      return;
    }

    const password = this.form.value.password ?? '';

    this.submitting = true;
    this.errorMessage = undefined;

    this.authService.confirmPasswordReset(this.token, password).pipe(
      timeout(15000),
      finalize(() => {
        this.submitting = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: () => {
        void this.router.navigate(['/login'], { queryParams: { reset: 'success' } });
      },
      error: (err: unknown) => {
        const status = (err instanceof HttpErrorResponse) ? err.status : 0;
        if (status === 400 || status === 401) {
          this.errorMessage = this.i18n.translate('auth.resetPassword.invalidToken');
        } else {
          this.errorMessage = this.i18n.translate('auth.resetPassword.genericError');
        }
        this.cdr.markForCheck();
      }
    });
  }

  private matchPasswordsValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const password = group.get('password')?.value ?? '';
      const confirmPassword = group.get('confirmPassword')?.value ?? '';
      if (!confirmPassword) {
        return null;
      }
      return password === confirmPassword ? null : { passwordMismatch: true };
    };
  }
}
