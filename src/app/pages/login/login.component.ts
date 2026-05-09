import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Inject, NgZone, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { of } from 'rxjs';
import { catchError, finalize, switchMap, timeout } from 'rxjs/operators';
import { AuthService, AuthSession, isMfaPending } from '../../core/auth/auth.service';
import { JuliCartFacade } from '../../core/commerce';
import { TenantBrandingApiService } from '../../core/services/tenant-branding-api.service';
import { JuliI18nService } from '../../core/i18n/i18n.service';
import { environment } from '../../../environments/environment';

declare const google: any;

/**
 * Three sequential states the page may be in:
 *
 *  - PASSWORD: traditional username + password form (also where the
 *    Google button lives if {@code googleClientId} is configured).
 *  - MFA: backend returned a {@code roles=[MFA_PENDING]} session; we
 *    render a 6-digit input and call {@code /mfa/verify}.
 *  - PROMOTING: cart promotion is running between successful auth and
 *    the post-login redirect; the form is locked.
 */
type LoginPhase = 'PASSWORD' | 'MFA' | 'PROMOTING';

@Component({
  selector: 'app-login-page',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent implements OnInit, AfterViewInit {
  readonly form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  readonly mfaForm = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$|^[A-Za-z0-9_-]{8,}$/)]]
  });

  brandName = 'Juli';
  phase: LoginPhase = 'PASSWORD';
  submitting = false;
  errorMessage?: string;
  warningMessage?: string;

  readonly googleEnabled = !!environment.googleClientId;

  @ViewChild('googleButton') googleButton?: ElementRef<HTMLDivElement>;

  /** mfa-pending JWT held in memory (never persisted) until /mfa/verify exchanges it. */
  private pendingToken?: string;

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
    private readonly zone: NgZone,
    @Inject(PLATFORM_ID) private readonly platformId: Object,
  ) {}

  ngOnInit(): void {
    const config = this.brandingApi.snapshot;
    this.brandName = config.brandName;
    this.titleService.setTitle(`Login — ${config.brandName}`);
    this.cdr.markForCheck();
  }

  ngAfterViewInit(): void {
    if (this.googleEnabled) {
      this.bootstrapGoogle();
    }
  }

  submit(): void {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    const username = this.form.value.username ?? '';
    const password = this.form.value.password ?? '';

    this.submitting = true;
    this.errorMessage = undefined;
    this.warningMessage = undefined;

    this.authService.login(username, password).pipe(
      timeout(15000),
      finalize(() => {
        this.submitting = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: session => this.handleAuthOutcome(session),
      error: () => {
        this.errorMessage = this.i18n.translate('login.invalidCredentials');
        this.cdr.markForCheck();
      }
    });
  }

  submitMfa(): void {
    if (this.mfaForm.invalid || this.submitting || !this.pendingToken) {
      this.mfaForm.markAllAsTouched();
      return;
    }
    const code = String(this.mfaForm.value.code ?? '').trim();

    this.submitting = true;
    this.errorMessage = undefined;

    this.authService.verifyMfa(this.pendingToken, code).pipe(
      timeout(15000),
      finalize(() => {
        this.submitting = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: session => {
        this.pendingToken = undefined;
        this.handleAuthOutcome(session);
      },
      error: () => {
        this.errorMessage = this.i18n.translate('login.invalidMfaCode');
        this.cdr.markForCheck();
      }
    });
  }

  cancelMfa(): void {
    this.pendingToken = undefined;
    this.phase = 'PASSWORD';
    this.mfaForm.reset();
    this.cdr.markForCheck();
  }

  /**
   * Inspect a TokenResponse — branch into MFA-pending UI if applicable;
   * otherwise promote anonymous cart and redirect.
   */
  private handleAuthOutcome(session: AuthSession): void {
    if (isMfaPending(session)) {
      this.pendingToken = session.accessToken;
      this.phase = 'MFA';
      this.cdr.markForCheck();
      return;
    }

    this.phase = 'PROMOTING';
    this.cdr.markForCheck();

    const redirect = this.route.snapshot.queryParams['returnUrl']
      || this.route.snapshot.queryParams['redirect']
      || '/';

    const promote$ = this.authService.hasAnonymousCart()
      ? this.cartFacade.promoteAnonymousCart().pipe(
          catchError(() => {
            this.cartFacade.discardAnonymousCart();
            this.warningMessage = this.i18n.translate('login.cartPromotionWarning');
            this.cdr.markForCheck();
            return of(null);
          })
        )
      : of(null);

    promote$.pipe(
      switchMap(() => of(null)),
      finalize(() => this.cdr.markForCheck())
    ).subscribe({
      next: () => void this.router.navigateByUrl(redirect)
    });
  }

  // ─── Google Identity Services ──────────────────────────────────────────

  private bootstrapGoogle(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const onLoad = () => this.zone.run(() => this.initGoogleButton());
    const existing = document.querySelector('script[data-juli-gis="1"]');
    if (existing) {
      onLoad();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset['juliGis'] = '1';
    script.onload = onLoad;
    document.head.appendChild(script);
  }

  private initGoogleButton(): void {
    if (typeof google === 'undefined' || !this.googleButton) return;
    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (resp: { credential?: string }) => {
        if (!resp?.credential) return;
        this.zone.run(() => this.onGoogleCredential(resp.credential!));
      },
      ux_mode: 'popup',
      auto_select: false
    });
    google.accounts.id.renderButton(this.googleButton.nativeElement, {
      theme: 'outline',
      size: 'large',
      width: 320,
      text: 'continue_with',
      logo_alignment: 'left'
    });
  }

  private onGoogleCredential(idToken: string): void {
    this.submitting = true;
    this.errorMessage = undefined;

    this.authService.loginWithGoogle(idToken).pipe(
      timeout(15000),
      finalize(() => {
        this.submitting = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: session => this.handleAuthOutcome(session),
      error: () => {
        this.errorMessage = this.i18n.translate('login.googleSignInFailed');
        this.cdr.markForCheck();
      }
    });
  }
}
