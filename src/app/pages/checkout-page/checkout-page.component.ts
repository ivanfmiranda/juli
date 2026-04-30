import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { trigger, transition, style, animate } from '@angular/animations';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom, forkJoin, of, Subscription, timer } from 'rxjs';
import { catchError, finalize, map, switchMap } from 'rxjs/operators';
import type { Stripe, StripeCardElement, StripeElements } from '@stripe/stripe-js';
import { AuthService } from '../../core/auth/auth.service';
import { JuliI18nService } from '../../core/i18n/i18n.service';
import { ProfileAddressService } from '../../core/commerce/services/profile-address.service';
import { JuliSavedAddress } from '../../core/commerce/models/ubris-commerce.models';
// SoftLoginPromptComponent intentionally not imported here — guest
// checkout removed the modal trigger from this page. The component
// stays in SharedComponentsModule for other surfaces.
import {
  JuliCartFacade,
  JuliCheckoutAddressState,
  JuliCheckoutAddressUpsertRequest,
  JuliCheckoutFacade,
  JuliCheckoutPaymentInitializeState,
  JuliCheckoutPaymentMethod,
  JuliCheckoutPaymentStatus,
  JuliCheckoutReviewSnapshot
} from '../../core/commerce';
import { JuliDeliveryOption } from '../../core/commerce/models/ubris-commerce.models';
import { CheckoutStep } from '../../shared/components/checkout-stepper/checkout-stepper.component';
import { B2bAssignment, B2bContextService } from '../../core/user/b2b-context.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-checkout-page',
  templateUrl: './checkout-page.component.html',
  styleUrls: ['./checkout-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('150ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ]
})
export class CheckoutPageComponent implements OnDestroy, AfterViewChecked {
  @ViewChild('stripeCardElementHost')
  stripeCardElementHost?: ElementRef<HTMLDivElement>;

  readonly cart$ = this.cartFacade.cart$;
  // Guest fields (email + cpf) ficam vazios e sem validators até a
  // primeira interação no caminho não-logado; ativamos os validators em
  // ngOnInit quando detectamos que não há sessão.
  readonly form = this.fb.group({
    fullName: ['', Validators.required],
    line1: ['', Validators.required],
    line2: [''],
    city: ['', Validators.required],
    region: [''],
    postalCode: ['', Validators.required],
    countryIso: ['BR', Validators.required],
    phone: [''],
    notes: [''],
    paymentMethod: ['CARD', Validators.required],
    guestEmail: [''],
    guestCpf: ['']
  });

  private readonly destroyRef = inject(DestroyRef);
  private paymentStatusPolling?: Subscription;
  private stripe?: Stripe | null;
  private stripeElements?: StripeElements;
  private stripeCardElement?: StripeCardElement;
  private pendingStripeMount = false;

  checkoutId?: string;
  savedAddress?: JuliCheckoutAddressState;
  deliveryOptions: JuliDeliveryOption[] = [];
  paymentMethods: JuliCheckoutPaymentMethod[] = [];
  selectedDeliveryCode?: string;
  paymentInitialization?: JuliCheckoutPaymentInitializeState;
  paymentStatus?: JuliCheckoutPaymentStatus;
  reviewSnapshot?: JuliCheckoutReviewSnapshot;
  reviewStale = false;
  loadingDelivery = false;
  loadingPaymentMethods = false;
  initializingPayment = false;
  refreshingPaymentStatus = false;
  confirmingPayment = false;
  reviewing = false;
  submitting = false;
  errorMessage?: string;
  statusMessage?: string;

  // Saved address picker
  profileAddresses: JuliSavedAddress[] = [];
  selectedProfileAddressId?: string;
  useNewAddress = false;
  addressesLoading = false;

  // UI State
  currentStepId = 'address';
  summaryExpanded = false;
  showCopyToast = false;
  usingUnitAddress = false;

  // B2B context — quando preenchido, o banner sobre as opções de entrega
  // explica que o catálogo logístico vem do contrato corporativo.
  readonly b2bContext$: Observable<B2bAssignment | null>;

  /** Convenience getter for the template — keeps *ngIf concise. */
  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated;
  }

  readonly checkoutSteps: CheckoutStep[] = [
    { id: 'address', label: '', completed: false, active: true },
    { id: 'delivery', label: '', completed: false, active: false },
    { id: 'payment', label: '', completed: false, active: false },
    { id: 'review', label: '', completed: false, active: false }
  ];

  constructor(
    private readonly fb: UntypedFormBuilder,
    private readonly authService: AuthService,
    private readonly cartFacade: JuliCartFacade,
    private readonly checkoutFacade: JuliCheckoutFacade,
    private readonly profileAddressService: ProfileAddressService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
    private readonly i18n: JuliI18nService,
    private readonly b2bContext: B2bContextService
  ) {
    this.b2bContext$ = this.b2bContext.context$;
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.resetPaymentState();
      this.invalidateReview('Checkout data changed. Re-apply payment before reviewing again.');
    });
    this.applyGuestValidators();
    this.loadProfileAddresses();
    this.applyB2bUnitAddress();
  }

  /**
   * Pre-fill the address form from the buyer's B2B unit when present.
   * Runs once at construction; if the unit carries no {@code line1}
   * (admin registered the legal entity but skipped the geocoding step)
   * we fall through and let {@code loadProfileAddresses} pick the
   * personal default. The form values are emitted silently so the
   * dirty-state listeners don't re-trigger payment resets.
   */
  private applyB2bUnitAddress(): void {
    if (!this.authService.isAuthenticated) return;
    const assignment = this.b2bContext.current();
    if (!assignment || !assignment.companyId || !assignment.unitLine1) return;
    this.form.patchValue({
      fullName: assignment.unitName || this.form.value.fullName,
      line1: assignment.unitLine1,
      line2: assignment.unitLine2 ?? '',
      city: assignment.unitCity ?? '',
      region: assignment.unitRegion ?? '',
      postalCode: assignment.unitPostalCode ?? '',
      countryIso: assignment.unitCountryIso ?? 'BR'
    }, { emitEvent: false });
    // Skip the saved-address picker UI — the unit address takes priority.
    this.useNewAddress = true;
    this.usingUnitAddress = true;
  }

  /**
   * Toggle validators on {@code guestEmail} / {@code guestCpf} based on
   * the current auth state. Logged-in checkouts ignore those fields and
   * keep them validator-free; anonymous checkouts require both. Called
   * once from the constructor — the storefront forces a re-render
   * (login/logout) before flipping between modes, so we don't need to
   * re-subscribe to {@code session$}.
   */
  private applyGuestValidators(): void {
    const emailControl = this.form.get('guestEmail');
    const cpfControl = this.form.get('guestCpf');
    if (!this.authService.isAuthenticated) {
      emailControl?.setValidators([Validators.required, Validators.email]);
      cpfControl?.setValidators([Validators.required, Validators.minLength(11), Validators.maxLength(14)]);
    } else {
      emailControl?.clearValidators();
      cpfControl?.clearValidators();
    }
    emailControl?.updateValueAndValidity({ emitEvent: false });
    cpfControl?.updateValueAndValidity({ emitEvent: false });
  }

  ngAfterViewChecked(): void {
    if (!this.pendingStripeMount || !this.stripeCardElementHost || !this.showStripeCardForm) {
      return;
    }
    this.pendingStripeMount = false;
    void this.mountStripeCardElement();
  }

  saveAddressAndLoadDelivery(): void {
    // Logado com endereço salvo selecionado: pré-preenche pra não falhar validators
    const session = this.authService.currentSession;
    if (session && !this.useNewAddress && this.selectedProfileAddressId) {
      const saved = this.profileAddresses.find(a => a.id === this.selectedProfileAddressId);
      if (saved) {
        this.form.patchValue({
          fullName: saved.fullName,
          line1: saved.line1,
          line2: saved.line2 ?? '',
          city: saved.city,
          region: saved.region ?? '',
          postalCode: saved.postalCode,
          countryIso: saved.countryIso,
          phone: saved.phone ?? '',
          notes: saved.notes ?? ''
        }, { emitEvent: false });
      }
    }

    if (this.form.invalid || this.loadingDelivery || this.reviewing || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    this.loadingDelivery = true;
    this.errorMessage = undefined;
    this.statusMessage = this.i18n.translate('checkout.savingAddress');

    // Ensure a cart exists before proceeding (handles cases where promotion failed)
    const cartReady$ = this.cartFacade.currentCartId
      ? of(this.cartFacade.currentCartId)
      : this.cartFacade.ensureCart().pipe(map(cart => cart.code!));

    cartReady$.pipe(
      switchMap(cartId => {
        const isGuest = !session;
        const request: JuliCheckoutAddressUpsertRequest = {
          checkoutId: this.checkoutId,
          cartId,
          // Logado: customerId vem da sessão. Guest: o BFF aceita email/cpf
          // como identidade alternativa (validador valida XOR no DTO).
          customerId: isGuest ? undefined : session.username,
          userType: session?.userType || 'B2C',
          paymentMethod: this.form.value.paymentMethod || 'CARD',
          address: {
            fullName: this.form.value.fullName || '',
            line1: this.form.value.line1 || '',
            line2: this.form.value.line2 || undefined,
            city: this.form.value.city || '',
            region: this.form.value.region || undefined,
            postalCode: this.form.value.postalCode || '',
            countryIso: this.form.value.countryIso || 'BR',
            phone: this.form.value.phone || undefined,
            notes: this.form.value.notes || undefined
          },
          guestEmail: isGuest ? (this.form.value.guestEmail || undefined) : undefined,
          guestCpf: isGuest ? (this.form.value.guestCpf || undefined) : undefined
        };
        return this.checkoutFacade.saveAddress(request);
      }),
      finalize(() => {
        this.loadingDelivery = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: savedAddress => {
        this.savedAddress = savedAddress;
        this.checkoutId = savedAddress.checkoutId;
        this.deliveryOptions = [];
        this.selectedDeliveryCode = undefined;
        this.paymentMethods = [];
        this.resetPaymentState();
        this.invalidateReview(undefined);
        this.loadCheckoutOptions(savedAddress.checkoutId);
        this.currentStepId = 'delivery';
        this.updateSteps();
        this.cdr.markForCheck();
      },
      error: error => {
        this.errorMessage = error?.error?.message || error?.message || this.i18n.translate('checkout.savingAddressFailed');
        this.statusMessage = undefined;
        this.cdr.markForCheck();
      }
    });
  }

  initializePayment(): void {
    if (!this.checkoutId || !this.selectedDeliveryCode || !this.selectedPaymentMethodCode || this.initializingPayment || this.loadingDelivery || this.loadingPaymentMethods || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.initializingPayment = true;
    this.errorMessage = undefined;
    this.statusMessage = this.i18n.translate('checkout.applyingPayment');

    this.checkoutFacade.setDeliveryMode(this.checkoutId, this.selectedDeliveryCode).pipe(
      switchMap(() => this.checkoutFacade.initializePayment(this.checkoutId!, this.selectedPaymentMethodCode!)),
      switchMap(initialized => {
        this.paymentInitialization = initialized;
        return this.checkoutFacade.paymentStatus(this.checkoutId!);
      }),
      finalize(() => {
        this.initializingPayment = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: paymentStatus => {
        this.paymentStatus = paymentStatus;
        this.reviewSnapshot = undefined;
        this.reviewStale = true;
        this.errorMessage = undefined;
        this.updateSteps();
        if (this.showStripeCardForm) {
          this.pendingStripeMount = true;
          this.statusMessage = this.i18n.translate('checkout.stripeHint');
          this.cdr.markForCheck();
          return;
        }
        if (this.showPixAction) {
          this.startPaymentStatusPolling();
          this.statusMessage = this.i18n.translate('checkout.pixPaymentHint');
          this.cdr.markForCheck();
          return;
        }
        this.statusMessage = this.paymentReadyForReview
          ? this.i18n.translate('checkout.paymentReady')
          : (paymentStatus.detail || this.i18n.translate('checkout.paymentInitialized'));
        this.cdr.markForCheck();
      },
      error: error => {
        this.errorMessage = error?.error?.message || error?.message || this.i18n.translate('checkout.paymentInitFailed');
        this.statusMessage = undefined;
        this.cdr.markForCheck();
      }
    });
  }

  async confirmCardPayment(): Promise<void> {
    if (!this.showStripeCardForm || !this.paymentInitialization || !this.stripeCardElement || this.confirmingPayment) {
      return;
    }

    const publishableKey = this.asString(this.paymentInitialization.clientPayload['publishableKey']);
    const clientSecret = this.asString(this.paymentInitialization.clientPayload['clientSecret']);
    if (!publishableKey || !clientSecret) {
      this.errorMessage = this.i18n.translate('checkout.stripePayloadIncomplete');
      return;
    }

    try {
      this.confirmingPayment = true;
      this.errorMessage = undefined;
      this.statusMessage = this.i18n.translate('checkout.confirmingCard');
      const stripe = await this.ensureStripe(publishableKey);
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: this.stripeCardElement,
          billing_details: {
            name: this.form.value.fullName || undefined,
            phone: this.form.value.phone || undefined,
            address: {
              city: this.form.value.city || undefined,
              country: this.form.value.countryIso || undefined,
              line1: this.form.value.line1 || undefined,
              line2: this.form.value.line2 || undefined,
              postal_code: this.form.value.postalCode || undefined,
              state: this.form.value.region || undefined
            }
          }
        }
      });

      if (result.error) {
        this.errorMessage = result.error.message || this.i18n.translate('checkout.cardConfirmFailed');
        this.statusMessage = undefined;
        return;
      }

      await this.refreshPaymentStatusOnce(this.i18n.translate('checkout.cardConfirmed'));
    } catch (error: any) {
      this.errorMessage = error?.message || this.i18n.translate('checkout.cardConfirmFailed');
      this.statusMessage = undefined;
    } finally {
      this.confirmingPayment = false;
    }
  }

  async refreshPaymentStatus(): Promise<void> {
    await this.refreshPaymentStatusOnce(this.i18n.translate('checkout.refreshingPayment'));
  }

  goToReview(): void {
    this.currentStepId = 'review';
    this.updateSteps();
    this.cdr.markForCheck();
    if (!this.reviewSnapshot || this.reviewStale) {
      this.review();
    }
  }

  review(): void {
    if (!this.checkoutId || !this.paymentStatus || this.reviewing || this.submitting || this.loadingDelivery || this.loadingPaymentMethods) {
      return;
    }

    this.reviewing = true;
    this.errorMessage = undefined;
    this.statusMessage = this.i18n.translate('checkout.reviewRefreshing');

    this.checkoutFacade.paymentStatus(this.checkoutId).pipe(
      switchMap(paymentStatus => {
        this.paymentStatus = paymentStatus;
        return this.checkoutFacade.review(this.checkoutId!);
      }),
      finalize(() => {
        this.reviewing = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: review => {
        this.reviewSnapshot = review;
        this.reviewStale = false;
        this.selectedDeliveryCode = review.deliveryMode?.code || this.selectedDeliveryCode;
        this.errorMessage = review.errors[0];
        this.statusMessage = review.messages[0] || (review.readyToPlace ? this.i18n.translate('checkout.reviewReady') : this.i18n.translate('checkout.reviewFixes'));
        this.currentStepId = 'review';
        this.updateSteps();
        this.cdr.markForCheck();
      },
      error: error => {
        this.errorMessage = error?.error?.message || error?.message || this.i18n.translate('checkout.reviewFailed');
        this.statusMessage = undefined;
        this.cdr.markForCheck();
      }
    });
  }

  submit(): void {
    if (!this.checkoutId || !this.reviewSnapshot?.readyToPlace || this.reviewStale || this.submitting || this.reviewing || this.loadingDelivery) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.errorMessage = undefined;
    this.statusMessage = this.i18n.translate('checkout.submitting');

    this.checkoutFacade.submitById(this.checkoutId).pipe(
      finalize(() => {
        this.submitting = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: result => {
        if (result.checkoutId) {
          this.cartFacade.clear();
          void this.router.navigate(['/checkout/confirmation', result.checkoutId]);
          return;
        }
        this.errorMessage = result.lastError || this.i18n.translate('checkout.submitFailed');
        this.cdr.markForCheck();
      },
      error: error => {
        this.errorMessage = error?.error?.message || error?.message || this.i18n.translate('checkout.submitFailed');
        this.statusMessage = undefined;
        this.cdr.markForCheck();
      }
    });
  }

  selectDeliveryMode(code: string): void {
    this.selectedDeliveryCode = code;
    this.resetPaymentState();
    if (this.reviewSnapshot && this.reviewSnapshot.deliveryMode?.code !== code) {
      this.invalidateReview(this.i18n.translate('checkout.deliveryChanged'));
    }
  }

  get selectedDelivery(): JuliDeliveryOption | null {
    return this.deliveryOptions.find(o => o.code === this.selectedDeliveryCode) || null;
  }

  get currentStep(): CheckoutStep | undefined {
    return this.checkoutSteps.find(s => s.id === this.currentStepId);
  }

  updateSteps(): void {
    const stepOrder = ['address', 'delivery', 'payment', 'review'];
    const currentIndex = stepOrder.indexOf(this.currentStepId);
    
    this.checkoutSteps.forEach((step, index) => {
      step.active = step.id === this.currentStepId;
      step.completed = index < currentIndex;
      
      // Update descriptions based on state
      if (step.id === 'address' && this.savedAddress) {
        step.description = this.i18n.translate('checkout.stepCompleted');
      } else if (step.id === 'delivery' && this.selectedDeliveryCode) {
        step.description = this.selectedDelivery?.name || this.i18n.translate('checkout.stepSelected');
      } else if (step.id === 'payment' && this.paymentStatus) {
        step.description = this.paymentStatus.status || this.i18n.translate('checkout.stepInProgress');
      } else if (step.id === 'review' && this.reviewSnapshot?.readyToPlace) {
        step.description = this.i18n.translate('checkout.stepReady');
      } else {
        step.description = undefined;
      }
    });
  }

  isStepCompleted(stepId: string): boolean {
    const stepOrder = ['address', 'delivery', 'payment', 'review'];
    const currentIndex = stepOrder.indexOf(this.currentStepId);
    const stepIndex = stepOrder.indexOf(stepId);
    return stepIndex < currentIndex;
  }

  isStepPending(stepId: string): boolean {
    const stepOrder = ['address', 'delivery', 'payment', 'review'];
    const currentIndex = stepOrder.indexOf(this.currentStepId);
    const stepIndex = stepOrder.indexOf(stepId);
    return stepIndex > currentIndex;
  }

  copyPixCode(code: unknown): void {
    const codeStr = String(code || '');
    if (!codeStr) return;
    navigator.clipboard.writeText(codeStr).then(() => {
      this.showCopyToast = true;
      setTimeout(() => this.showCopyToast = false, 2000);
    });
  }

  get reviewButtonDisabled(): boolean {
    return this.reviewing
      || this.submitting
      || this.loadingDelivery
      || this.loadingPaymentMethods
      || this.initializingPayment
      || this.confirmingPayment
      || this.form.invalid
      || !this.checkoutId
      || !this.selectedDeliveryCode
      || this.deliveryOptions.length === 0
      || this.paymentMethods.length === 0
      || !this.selectedPaymentMethodCode
      || !this.paymentReadyForReview;
  }

  get placeOrderDisabled(): boolean {
    return this.submitting
      || this.reviewing
      || this.loadingDelivery
      || this.loadingPaymentMethods
      || this.initializingPayment
      || this.confirmingPayment
      || this.reviewStale
      || !this.reviewSnapshot?.readyToPlace;
  }

  get selectedPaymentMethodCode(): string | undefined {
    const selected = this.form.value.paymentMethod || undefined;
    return selected || this.paymentMethods.find(method => method.supported)?.code;
  }

  get paymentReadyForReview(): boolean {
    const status = this.paymentStatus?.status?.toUpperCase();
    return status === 'AUTHORIZED' || status === 'CAPTURED';
  }

  get showStripeCardForm(): boolean {
    return this.paymentInitialization?.provider === 'STRIPE'
      && this.selectedPaymentMethodCode === 'CARD'
      && !!this.asString(this.paymentInitialization.clientPayload['publishableKey'])
      && !!this.asString(this.paymentInitialization.clientPayload['clientSecret']);
  }

  get showPixAction(): boolean {
    return this.selectedPaymentMethodCode === 'PIX'
      && !!this.pixActionPayload;
  }

  get pixActionPayload(): Record<string, unknown> | undefined {
    const payload = this.paymentStatus?.nextAction && Object.keys(this.paymentStatus.nextAction).length > 0
      ? this.paymentStatus.nextAction
      : this.paymentInitialization?.clientPayload;
    return payload && Object.keys(payload).length > 0 ? payload : undefined;
  }

  get pixExpiresAt(): string | undefined {
    return this.asString(this.pixActionPayload?.['expiresAt']);
  }

  formatMoney(value?: number, currency = this.i18n.currentCurrency): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return '-';
    }
    const locale = this.i18n.currentLocale;
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency
    }).format(value);
  }

  ngOnDestroy(): void {
    this.stopPaymentStatusPolling();
    this.unmountStripeCardElement();
  }

  private loadProfileAddresses(): void {
    if (!this.authService.isAuthenticated) {
      return;
    }
    this.addressesLoading = true;
    this.profileAddressService.listAddresses().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: addresses => {
        this.profileAddresses = addresses;
        const defaultAddr = addresses.find(a => a.defaultShipping) ?? addresses[0];
        if (defaultAddr) {
          this.selectedProfileAddressId = defaultAddr.id;
          this.useNewAddress = false;
        } else {
          this.useNewAddress = true;
        }
        this.addressesLoading = false;
        this.cdr.markForCheck();
        // Logado com endereço default → pula a address-step automaticamente.
        // O usuário pode voltar via "Trocar endereço" se quiser editar.
        if (defaultAddr && this.currentStepId === 'address' && !this.savedAddress) {
          this.saveAddressAndLoadDelivery();
        }
      },
      error: () => {
        this.addressesLoading = false;
        this.useNewAddress = true;
        this.cdr.markForCheck();
      }
    });
  }

  selectProfileAddress(id: string): void {
    this.selectedProfileAddressId = id;
    this.useNewAddress = false;
  }

  activateNewAddress(): void {
    this.selectedProfileAddressId = undefined;
    this.useNewAddress = true;
  }

  private loadCheckoutOptions(checkoutId: string): void {
    this.loadingPaymentMethods = true;
    this.checkoutFacade.deliveryOptions(checkoutId).pipe(
      switchMap(optionsState => forkJoin({
        delivery: of(optionsState),
        payment: this.checkoutFacade.paymentMethods(checkoutId).pipe(
          catchError(() => of({ checkoutId, availableMethods: [] as any[] }))
        )
      })),
      finalize(() => {
        this.loadingPaymentMethods = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: result => {
        const optionsState = result.delivery;
        this.deliveryOptions = optionsState.options.filter(option => option.available);
        this.selectedDeliveryCode = optionsState.selectedCode
          || this.deliveryOptions.find(option => option.available)?.code;
        this.paymentMethods = result.payment.availableMethods.filter(method => method.supported);
        const currentPaymentMethod = this.selectedPaymentMethodCode;
        const preferredPaymentMethod = this.paymentMethods.find(method => method.code === currentPaymentMethod)?.code
          || this.paymentMethods[0]?.code;
        if (preferredPaymentMethod) {
          this.form.patchValue({ paymentMethod: preferredPaymentMethod }, { emitEvent: false });
        }
        if (this.deliveryOptions.length === 0) {
          this.statusMessage = undefined;
          this.errorMessage = this.i18n.translate('checkout.noDeliveryModes');
          this.cdr.markForCheck();
          return;
        }
        if (this.paymentMethods.length === 0) {
          this.statusMessage = undefined;
          this.errorMessage = this.i18n.translate('checkout.noPaymentMethods');
          this.cdr.markForCheck();
          return;
        }
        this.statusMessage = this.i18n.translate('checkout.optionsLoaded');
        this.cdr.markForCheck();
      },
      error: error => {
        this.errorMessage = error?.error?.message || error?.message || this.i18n.translate('checkout.loadingOptionsFailed');
        this.statusMessage = undefined;
        this.cdr.markForCheck();
      }
    });
  }

  private async refreshPaymentStatusOnce(message: string): Promise<void> {
    if (!this.checkoutId || this.refreshingPaymentStatus) {
      return;
    }
    try {
      this.refreshingPaymentStatus = true;
      this.statusMessage = message;
      this.paymentStatus = await firstValueFrom(this.checkoutFacade.paymentStatus(this.checkoutId));
      this.updateSteps();
      if (this.paymentReadyForReview) {
        this.stopPaymentStatusPolling();
        this.statusMessage = this.i18n.translate('checkout.paymentConfirmed');
      } else if (this.showPixAction) {
        this.startPaymentStatusPolling();
        this.statusMessage = this.paymentStatus?.detail || this.i18n.translate('checkout.pixPending');
      } else {
        this.statusMessage = this.paymentStatus?.detail || this.i18n.translate('checkout.paymentRefreshed');
      }
      this.invalidateReview(undefined);
    } catch (error: any) {
      this.errorMessage = error?.error?.message || error?.message || this.i18n.translate('checkout.refreshPaymentFailed');
      this.statusMessage = undefined;
    } finally {
      this.refreshingPaymentStatus = false;
      this.cdr.markForCheck();
    }
  }

  private startPaymentStatusPolling(): void {
    if (!this.checkoutId || !this.paymentStatus || this.isPaymentTerminal(this.paymentStatus.status)) {
      return;
    }
    this.stopPaymentStatusPolling();
    this.paymentStatusPolling = timer(3000, 3000).pipe(
      switchMap(() => this.checkoutFacade.paymentStatus(this.checkoutId!)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: status => {
        this.paymentStatus = status;
        if (this.isPaymentTerminal(status.status)) {
          this.stopPaymentStatusPolling();
          this.statusMessage = this.paymentReadyForReview
            ? this.i18n.translate('checkout.paymentConfirmed')
            : (status.detail || this.i18n.translate('checkout.paymentTerminal'));
        }
        this.cdr.markForCheck();
      },
      error: error => {
        this.stopPaymentStatusPolling();
        this.errorMessage = error?.error?.message || error?.message || this.i18n.translate('checkout.pollPaymentFailed');
        this.cdr.markForCheck();
      }
    });
  }

  private stopPaymentStatusPolling(): void {
    this.paymentStatusPolling?.unsubscribe();
    this.paymentStatusPolling = undefined;
  }

  private isPaymentTerminal(status?: string): boolean {
    const normalized = status?.toUpperCase();
    return normalized === 'AUTHORIZED'
      || normalized === 'CAPTURED'
      || normalized === 'FAILED'
      || normalized === 'CANCELLED';
  }

  private async mountStripeCardElement(): Promise<void> {
    const publishableKey = this.paymentInitialization && this.asString(this.paymentInitialization.clientPayload['publishableKey']);
    const clientSecret = this.paymentInitialization && this.asString(this.paymentInitialization.clientPayload['clientSecret']);
    if (!publishableKey || !clientSecret || !this.stripeCardElementHost) {
      return;
    }
    const stripe = await this.ensureStripe(publishableKey);
    this.unmountStripeCardElement();
    this.stripeElements = stripe.elements({ clientSecret });
    this.stripeCardElement = this.stripeElements.create('card', {
      hidePostalCode: true
    });
    this.stripeCardElement.mount(this.stripeCardElementHost.nativeElement);
  }

  private async ensureStripe(publishableKey: string): Promise<Stripe> {
    if (!this.stripe) {
      const { loadStripe } = await import('@stripe/stripe-js');
      this.stripe = await loadStripe(publishableKey);
    }
    if (!this.stripe) {
      throw new Error('Unable to initialize Stripe client.');
    }
    return this.stripe;
  }

  private unmountStripeCardElement(): void {
    this.stripeCardElement?.unmount();
    this.stripeCardElement?.destroy();
    this.stripeCardElement = undefined;
    this.stripeElements = undefined;
    this.pendingStripeMount = false;
  }

  private resetPaymentState(): void {
    this.stopPaymentStatusPolling();
    this.unmountStripeCardElement();
    this.paymentInitialization = undefined;
    this.paymentStatus = undefined;
  }

  private invalidateReview(message?: string): void {
    this.reviewSnapshot = undefined;
    this.reviewStale = Boolean(this.checkoutId || this.savedAddress || this.deliveryOptions.length > 0);
    if (message) {
      this.statusMessage = message;
    }
  }

  private asString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value : undefined;
  }

}
