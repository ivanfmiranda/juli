import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { finalize, timeout } from 'rxjs/operators';
import { AuthService } from '../../core/auth/auth.service';
import { JuliI18nService } from '../../core/i18n/i18n.service';
import { TenantBrandingApiService } from '../../core/services/tenant-branding-api.service';

/**
 * "Esqueci minha senha" — collects the email and hits
 * {@code /api/auth/password-reset/request}. The backend always returns 204
 * (anti-enumeration), so after any successful round-trip we show the generic
 * "check your inbox" message regardless of whether the email is on file.
 */
@Component({
  selector: 'app-forgot-password-page',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForgotPasswordComponent implements OnInit {
  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  brandName = 'Juli';
  submitting = false;
  submitted = false;
  errorMessage?: string;

  constructor(
    private readonly fb: UntypedFormBuilder,
    private readonly authService: AuthService,
    private readonly cdr: ChangeDetectorRef,
    private readonly titleService: Title,
    private readonly brandingApi: TenantBrandingApiService,
    private readonly i18n: JuliI18nService,
  ) {}

  ngOnInit(): void {
    const config = this.brandingApi.snapshot;
    this.brandName = config.brandName;
    this.titleService.setTitle(`${this.i18n.translate('auth.forgotPassword.title')} — ${config.brandName}`);
  }

  submit(): void {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    const email = (this.form.value.email ?? '').trim();

    this.submitting = true;
    this.errorMessage = undefined;

    this.authService.requestPasswordReset(email).pipe(
      timeout(15000),
      finalize(() => {
        this.submitting = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: () => {
        // Always show the inbox confirmation — backend swallows "unknown
        // email" on purpose, and the UI must not leak that signal either.
        this.submitted = true;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = this.i18n.translate('auth.forgotPassword.genericError');
        this.cdr.markForCheck();
      }
    });
  }
}
