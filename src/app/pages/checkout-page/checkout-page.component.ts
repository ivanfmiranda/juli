import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, forkJoin, of } from 'rxjs';
import { finalize, switchMap, takeUntil } from 'rxjs/operators';
import { AuthService } from '../../core/auth/auth.service';
import {
  JuliCartFacade,
  JuliCheckoutAddressUpsertRequest,
  JuliCheckoutPaymentInitializeState,
  JuliCheckoutPaymentMethod,
  JuliCheckoutPaymentStatus,
  JuliCheckoutFacade,
  JuliCheckoutAddressState,
  JuliCheckoutReviewSnapshot
} from '../../core/commerce';
import { JuliDeliveryOption } from '../../core/commerce/models/ubris-commerce.models';

@Component({
  selector: 'app-checkout-page',
  templateUrl: './checkout-page.component.html',
  styleUrls: ['./checkout-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckoutPageComponent implements OnDestroy {
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
  reviewing = false;
  submitting = false;
  errorMessage?: string;
  statusMessage?: string;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly cartFacade: JuliCartFacade,
    private readonly checkoutFacade: JuliCheckoutFacade,
    private readonly router: Router
  ) {
    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.invalidateReview('Checkout data changed. Save address and reload delivery/payment before reviewing again.');
    });
  }

  saveAddressAndLoadDelivery(): void {
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
        this.paymentInitialization = undefined;
        this.paymentStatus = undefined;
        this.invalidateReview(undefined);
        this.loadCheckoutOptions(savedAddress.checkoutId);
      },
      error: error => {
        this.errorMessage = error?.error?.message || error?.message || 'Saving checkout address failed';
        this.statusMessage = undefined;
      }
    });
  }

  review(): void {
    if (!this.checkoutId || !this.selectedDeliveryCode || this.reviewing || this.submitting || this.loadingDelivery) {
      this.form.markAllAsTouched();
      return;
    }

    const selectedPaymentMethod = this.selectedPaymentMethodCode;
    if (!selectedPaymentMethod) {
      this.errorMessage = 'Select a payment method before reviewing the checkout.';
      return;
    }

    this.reviewing = true;
    this.errorMessage = undefined;
    this.statusMessage = 'Refreshing checkout review and payment state...';

    this.checkoutFacade.setDeliveryMode(this.checkoutId, this.selectedDeliveryCode).pipe(
      switchMap(selection => this.checkoutFacade.initializePayment(this.checkoutId!, selectedPaymentMethod).pipe(
        switchMap(initialized => this.checkoutFacade.paymentStatus(this.checkoutId!).pipe(
          switchMap(paymentStatus => {
            this.paymentInitialization = initialized;
            this.paymentStatus = paymentStatus;
            return this.checkoutFacade.review(this.checkoutId!);
          })
        ))
      )),
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
    if (this.reviewSnapshot && this.reviewSnapshot.deliveryMode?.code !== code) {
      this.invalidateReview('Delivery mode changed. Refresh review before place-order.');
    }
  }

  get reviewButtonDisabled(): boolean {
    return this.reviewing
      || this.submitting
      || this.loadingDelivery
      || this.loadingPaymentMethods
      || this.form.invalid
      || !this.checkoutId
      || !this.selectedDeliveryCode
      || this.deliveryOptions.length === 0
      || this.paymentMethods.length === 0
      || !this.selectedPaymentMethodCode;
  }

  get placeOrderDisabled(): boolean {
    return this.submitting
      || this.reviewing
      || this.loadingDelivery
      || this.loadingPaymentMethods
      || this.reviewStale
      || !this.reviewSnapshot?.readyToPlace;
  }

  get selectedPaymentMethodCode(): string | undefined {
    const selected = this.form.value.paymentMethod || undefined;
    return selected || this.paymentMethods.find(method => method.supported)?.code;
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
        this.statusMessage = 'Delivery and payment options loaded. Select the checkout options and refresh review.';
      },
      error: error => {
        this.errorMessage = error?.error?.message || error?.message || 'Loading checkout options failed';
        this.statusMessage = undefined;
      }
    });
  }

  private invalidateReview(message?: string): void {
    this.reviewSnapshot = undefined;
    this.reviewStale = Boolean(this.checkoutId || this.savedAddress || this.deliveryOptions.length > 0);
    if (message) {
      this.statusMessage = message;
    }
  }
}
