import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { of } from 'rxjs';
import { catchError, finalize, switchMap, timeout } from 'rxjs/operators';
import { AuthService } from '../../core/auth/auth.service';
import { JuliCartFacade } from '../../core/commerce';
import { TenantBrandingApiService } from '../../core/services/tenant-branding-api.service';
import { JuliI18nService } from '../../core/i18n/i18n.service';

@Component({
  selector: 'app-login-page',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent implements OnInit {
  readonly form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  brandName = 'Juli';
  submitting = false;
  errorMessage?: string;
  warningMessage?: string;

  constructor(
    private readonly fb: UntypedFormBuilder,
    private readonly authService: AuthService,
    private readonly cartFacade: JuliCartFacade,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly cdr: ChangeDetectorRef,
    private readonly titleService: Title,
    private readonly brandingApi: TenantBrandingApiService,
    private readonly i18n: JuliI18nService,
  ) {}

  ngOnInit(): void {
    const config = this.brandingApi.snapshot;
    this.brandName = config.brandName;
    this.titleService.setTitle(`Login — ${config.brandName}`);
    this.cdr.markForCheck();
  }

  submit(): void {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    const username = this.form.value.username ?? '';
    const password = this.form.value.password ?? '';
    // Accept both `returnUrl` (used by guards and the checkout "já tenho conta"
    // link) and the legacy `redirect` param. Without this, logging in from
    // /login?returnUrl=/checkout fell back to '/' and dropped the buyer on
    // the home page mid-flow.
    const redirect = this.route.snapshot.queryParams['returnUrl']
      || this.route.snapshot.queryParams['redirect']
      || '/';

    this.submitting = true;
    this.errorMessage = undefined;
    this.warningMessage = undefined;

    this.authService.login(username, password).pipe(
      timeout(15000),
      switchMap(() => {
        if (!this.authService.hasAnonymousCart()) {
          return of(null);
        }

        return this.cartFacade.promoteAnonymousCart().pipe(
          catchError(() => {
            this.cartFacade.discardAnonymousCart();
            this.warningMessage = this.i18n.translate('login.cartPromotionWarning');
            this.cdr.markForCheck();
            return of(null);
          })
        );
      }),
      finalize(() => {
        this.submitting = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: () => {
        void this.router.navigateByUrl(redirect);
      },
      error: () => {
        this.errorMessage = this.i18n.translate('login.invalidCredentials');
        this.cdr.markForCheck();
      }
    });
  }
}
