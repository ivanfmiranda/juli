import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of, Subject, Subscription, timer } from 'rxjs';
import { finalize, switchMap, takeUntil } from 'rxjs/operators';
import { loadStripe, Stripe, StripeCardElement, StripeElements } from '@stripe/stripe-js';
import { AuthService } from '../../core/auth/auth.service';
import { SoftLoginPromptComponent } from '../../shared/components/soft-login-prompt/soft-login-prompt.component';
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
    paymentMethod: ['CARD', Validators.required]
  });

  private readonly destroy$ = new Subject<void>();
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
  
  // UI State
  currentStepId = 'address';
  summaryExpanded = false;
  showCopyToast = false;
  showSoftLoginPrompt = false;

  readonly checkoutSteps: CheckoutStep[] = [
    { id: 'address', label: 'Address', completed: false, active: true },
    { id: 'delivery', label: 'Delivery', completed: false, active: false },
    { id: 'payment', label: 'Payment', completed: false, active: false },
    { id: 'review', label: 'Review', completed: false, active: false }
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly cartFacade: JuliCartFacade,
    private readonly checkoutFacade: JuliCheckoutFacade,
    private readonly router: Router
  ) {
    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.resetPaymentState();
      this.invalidateReview('Checkout data changed. Re-apply payment before reviewing again.');
    });
  }

  ngAfterViewChecked(): void {
    if (!this.pendingStripeMount || !this.stripeCardElementHost || !this.showStripeCardForm) {
      return;
    }
    this.pendingStripeMount = false;
    void this.mountStripeCardElement();
  }

  saveAddressAndLoadDelivery(): void {
    // Check if user is authenticated
    if (!this.authService.isAuthenticated) {
      this.showSoftLoginPrompt = true;
      return;
    }

    const session = this.authService.currentSession;
    const cartId = this.cartFacade.currentCartId;
    if (!session || !cartId || this.form.invalid || this.loadingDelivery || this.reviewing || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    this.loadingDelivery = true;
    this.errorMessage = undefined;
    this.statusMessage = 'Saving address and loading checkout options...';

    const request: JuliCheckoutAddressUpsertRequest = {
      checkoutId: this.checkoutId,
      cartId,
      customerId: session.username,
      userType: session.userType || 'B2C',
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
      }
    };

    this.checkoutFacade.saveAddress(request).pipe(
      finalize(() => {
        this.loadingDelivery = false;
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
      },
      error: error => {
        this.errorMessage = error?.error?.message || error?.message || 'Saving checkout address failed';
        this.statusMessage = undefined;
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
    this.statusMessage = 'Applying delivery mode and initializing payment...';

    this.checkoutFacade.setDeliveryMode(this.checkoutId, this.selectedDeliveryCode).pipe(
      switchMap(() => this.checkoutFacade.initializePayment(this.checkoutId!, this.selectedPaymentMethodCode!)),
      switchMap(initialized => {
        this.paymentInitialization = initialized;
        return this.checkoutFacade.paymentStatus(this.checkoutId!);
      }),
      finalize(() => {
        this.initializingPayment = false;
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
          this.statusMessage = 'Secure card session initialized. Enter card details and confirm payment before reviewing the checkout.';
          return;
        }
        if (this.showPixAction) {
          this.startPaymentStatusPolling();
          this.statusMessage = 'Pix payment initialized. Complete the QR/copy-and-paste action and wait for payment confirmation before reviewing.';
          return;
        }
        this.statusMessage = this.paymentReadyForReview
          ? 'Payment is ready. You can refresh the checkout review now.'
          : (paymentStatus.detail || 'Payment initialized. Refresh the payment status before reviewing.');
      },
      error: error => {
        this.errorMessage = error?.error?.message || error?.message || 'Initializing payment failed';
        this.statusMessage = undefined;
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
      this.errorMessage = 'Stripe card client payload is incomplete.';
      return;
    }

    try {
      this.confirmingPayment = true;
      this.errorMessage = undefined;
      this.statusMessage = 'Confirming card payment with Stripe...';
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
        this.errorMessage = result.error.message || 'Card payment confirmation failed.';
        this.statusMessage = undefined;
        return;
      }

      await this.refreshPaymentStatusOnce('Card payment confirmed. Refreshing payment status...');
    } catch (error: any) {
      this.errorMessage = error?.message || 'Card payment confirmation failed.';
      this.statusMessage = undefined;
    } finally {
      this.confirmingPayment = false;
    }
  }

  async refreshPaymentStatus(): Promise<void> {
    await this.refreshPaymentStatusOnce('Refreshing payment status...');
  }

  review(): void {
    if (!this.checkoutId || !this.paymentStatus || this.reviewing || this.submitting || this.loadingDelivery || this.loadingPaymentMethods) {
      return;
    }

    this.reviewing = true;
    this.errorMessage = undefined;
    this.statusMessage = 'Refreshing payment state and checkout review...';

    this.checkoutFacade.paymentStatus(this.checkoutId).pipe(
      switchMap(paymentStatus => {
        this.paymentStatus = paymentStatus;
        return this.checkoutFacade.review(this.checkoutId!);
      }),
      finalize(() => {
        this.reviewing = false;
      })
    ).subscribe({
      next: review => {
        this.reviewSnapshot = review;
        this.reviewStale = false;
        this.selectedDeliveryCode = review.deliveryMode?.code || this.selectedDeliveryCode;
        this.errorMessage = review.errors[0];
        this.statusMessage = review.messages[0] || (review.readyToPlace ? 'Checkout review is ready.' : 'Checkout review requires fixes.');
        this.currentStepId = 'review';
        this.updateSteps();
      },
      error: error => {
        this.errorMessage = error?.error?.message || error?.message || 'Refreshing checkout review failed';
        this.statusMessage = undefined;
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
    this.statusMessage = 'Submitting checkout...';

    this.checkoutFacade.submitById(this.checkoutId).pipe(
      finalize(() => {
        this.submitting = false;
      })
    ).subscribe({
      next: result => {
        if (result.checkoutId) {
          void this.router.navigate(['/checkout/confirmation', result.checkoutId]);
          return;
        }
        this.errorMessage = result.lastError || 'Checkout failed';
      },
      error: error => {
        this.errorMessage = error?.error?.message || error?.message || 'Checkout failed';
        this.statusMessage = undefined;
      }
    });
  }

  selectDeliveryMode(code: string): void {
    this.selectedDeliveryCode = code;
    this.resetPaymentState();
    if (this.reviewSnapshot && this.reviewSnapshot.deliveryMode?.code !== code) {
      this.invalidateReview('Delivery mode changed. Re-apply payment before place-order.');
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
        step.description = 'Completed';
      } else if (step.id === 'delivery' && this.selectedDeliveryCode) {
        step.description = this.selectedDelivery?.name || 'Selected';
      } else if (step.id === 'payment' && this.paymentStatus) {
        step.description = this.paymentStatus.status || 'In progress';
      } else if (step.id === 'review' && this.reviewSnapshot?.readyToPlace) {
        step.description = 'Ready';
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

  formatMoney(value?: number, currency = 'USD'): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return '-';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(value);
  }

  ngOnDestroy(): void {
    this.stopPaymentStatusPolling();
    this.unmountStripeCardElement();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCheckoutOptions(checkoutId: string): void {
    this.loadingPaymentMethods = true;
    this.checkoutFacade.deliveryOptions(checkoutId).pipe(
      switchMap(optionsState => forkJoin({
        delivery: of(optionsState),
        payment: this.checkoutFacade.paymentMethods(checkoutId)
      })),
      finalize(() => {
        this.loadingPaymentMethods = false;
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
          this.errorMessage = 'No delivery modes are currently available for this checkout.';
          return;
        }
        if (this.paymentMethods.length === 0) {
          this.statusMessage = undefined;
          this.errorMessage = 'No payment methods are currently available for this checkout.';
          return;
        }
        this.statusMessage = 'Delivery and payment options loaded. Apply payment after choosing delivery and payment method.';
      },
      error: error => {
        this.errorMessage = error?.error?.message || error?.message || 'Loading checkout options failed';
        this.statusMessage = undefined;
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
      this.paymentStatus = await this.checkoutFacade.paymentStatus(this.checkoutId).toPromise();
      this.updateSteps();
      if (this.paymentReadyForReview) {
        this.stopPaymentStatusPolling();
        this.statusMessage = 'Payment is ready. Refresh the checkout review now.';
      } else if (this.showPixAction) {
        this.startPaymentStatusPolling();
        this.statusMessage = this.paymentStatus?.detail || 'Pix payment is still pending customer confirmation.';
      } else {
        this.statusMessage = this.paymentStatus?.detail || 'Payment status refreshed.';
      }
      this.invalidateReview(undefined);
    } catch (error: any) {
      this.errorMessage = error?.error?.message || error?.message || 'Refreshing payment status failed';
      this.statusMessage = undefined;
    } finally {
      this.refreshingPaymentStatus = false;
    }
  }

  private startPaymentStatusPolling(): void {
    if (!this.checkoutId || !this.paymentStatus || this.isPaymentTerminal(this.paymentStatus.status)) {
      return;
    }
    this.stopPaymentStatusPolling();
    this.paymentStatusPolling = timer(3000, 3000).pipe(
      switchMap(() => this.checkoutFacade.paymentStatus(this.checkoutId!)),
      takeUntil(this.destroy$)
    ).subscribe({
      next: status => {
        this.paymentStatus = status;
        if (this.isPaymentTerminal(status.status)) {
          this.stopPaymentStatusPolling();
          this.statusMessage = this.paymentReadyForReview
            ? 'Payment confirmed. Refresh the checkout review now.'
            : (status.detail || 'Payment reached a terminal state.');
        }
      },
      error: error => {
        this.stopPaymentStatusPolling();
        this.errorMessage = error?.error?.message || error?.message || 'Polling payment status failed';
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

  onSoftLogin(): void {
    this.showSoftLoginPrompt = false;
    // Navigate to login page with returnUrl
    this.router.navigate(['/login'], { 
      queryParams: { returnUrl: '/checkout' }
    });
  }

  onContinueBrowsing(): void {
    this.showSoftLoginPrompt = false;
    // Navigate to cart page
    this.router.navigate(['/cart']);
  }
}
