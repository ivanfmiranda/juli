import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, Validators } from '@angular/forms';
import { finalize, timeout } from 'rxjs/operators';
import { AuthService } from '../../core/auth/auth.service';
import { TenantBrandingApiService } from '../../core/services/tenant-branding-api.service';
import { JuliI18nService } from '../../core/i18n/i18n.service';

@Component({
  selector: 'app-register-page',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterComponent implements OnInit {
  readonly form = this.fb.group({
    username: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required]
  });

  brandName = 'Juli';
  submitting = false;
  errorMessage?: string;
  successMessage?: string;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
    private readonly brandingApi: TenantBrandingApiService,
    private readonly i18n: JuliI18nService,
  ) {}

  ngOnInit(): void {
    this.brandName = this.brandingApi.snapshot.brandName;
  }

  submit(): void {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    const username = this.form.value.username ?? '';
    const password = this.form.value.password ?? '';
    const confirmPassword = this.form.value.confirmPassword ?? '';

    if (password !== confirmPassword) {
      this.errorMessage = this.i18n.translate('register.passwordMismatch');
      this.cdr.markForCheck();
      return;
    }

    this.submitting = true;
    this.errorMessage = undefined;
    this.successMessage = undefined;

    this.authService.register(username, password).pipe(
      timeout(15000),
      finalize(() => {
        this.submitting = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: () => {
        void this.router.navigateByUrl('/');
      },
      error: (err) => {
        const msg = err?.error?.message || err?.message || '';
        if (msg.toLowerCase().includes('conflict') || msg.toLowerCase().includes('already')) {
          this.errorMessage = this.i18n.translate('register.emailConflict');
        } else {
          this.errorMessage = this.i18n.translate('register.genericError');
        }
        this.cdr.markForCheck();
      }
    });
  }
}
