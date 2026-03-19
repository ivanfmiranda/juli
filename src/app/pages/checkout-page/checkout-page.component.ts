import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { AuthService } from '../../core/auth/auth.service';
import {
  JuliCartFacade,
  JuliCheckoutAddressUpsertRequest,
  JuliCheckoutFacade,
  JuliCheckoutAddressState,
  JuliCheckoutDeliveryModeSelection,
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
    paymentMethod: ['card', Validators.required]
  });

  private readonly destroy$ = new Subject<void>();

  checkoutId?: string;
  savedAddress?: JuliCheckoutAddressState;
  deliveryOptions: JuliDeliveryOption[] = [];
  selectedDeliveryCode?: string;
  reviewSnapshot?: JuliCheckoutReviewSnapshot;
  reviewStale = false;
  loadingDelivery = false;
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
      this.invalidateReview('Checkout data changed. Save address and reload delivery before reviewing again.');
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
    this.statusMessage = 'Saving address and loading delivery options...';

    const request: JuliCheckoutAddressUpsertRequest = {
      checkoutId: this.checkoutId,
      cartId,
      customerId: session.username,
      userType: session.userType || 'B2C',
      paymentMethod: this.form.value.paymentMethod || 'card',
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
        this.invalidateReview(undefined);
        this.loadDeliveryOptions(savedAddress.checkoutId);
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

    this.reviewing = true;
    this.errorMessage = undefined;
    this.statusMessage = 'Refreshing checkout review...';

    this.checkoutFacade.setDeliveryMode(this.checkoutId, this.selectedDeliveryCode).pipe(
      finalize(() => {
        this.reviewing = false;
      })
    ).subscribe({
      next: selection => {
        this.selectedDeliveryCode = selection.deliveryMode.code;
        this.runReview(selection);
      },
      error: error => {
        this.errorMessage = error?.error?.message || error?.message || 'Selecting delivery mode failed';
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
      || this.form.invalid
      || !this.checkoutId
      || !this.selectedDeliveryCode
      || this.deliveryOptions.length === 0;
  }

  get placeOrderDisabled(): boolean {
    return this.submitting
      || this.reviewing
      || this.loadingDelivery
      || this.reviewStale
      || !this.reviewSnapshot?.readyToPlace;
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

  private loadDeliveryOptions(checkoutId: string): void {
    this.checkoutFacade.deliveryOptions(checkoutId).subscribe({
      next: optionsState => {
        this.deliveryOptions = optionsState.options.filter(option => option.available);
        this.selectedDeliveryCode = optionsState.selectedCode
          || this.deliveryOptions.find(option => option.available)?.code;
        if (this.deliveryOptions.length === 0) {
          this.statusMessage = undefined;
          this.errorMessage = 'No delivery modes are currently available for this checkout.';
          return;
        }
        this.statusMessage = 'Delivery options loaded. Select a mode and refresh review.';
      },
      error: error => {
        this.errorMessage = error?.error?.message || error?.message || 'Loading delivery options failed';
        this.statusMessage = undefined;
      }
    });
  }

  private runReview(selection: JuliCheckoutDeliveryModeSelection): void {
    if (!this.checkoutId) {
      return;
    }

    this.checkoutFacade.review(this.checkoutId).subscribe({
      next: review => {
        this.reviewSnapshot = review;
        this.reviewStale = false;
        this.selectedDeliveryCode = review.deliveryMode?.code || selection.deliveryMode.code;
        this.errorMessage = review.errors[0];
        this.statusMessage = review.messages[0] || (review.readyToPlace ? 'Checkout review is ready.' : 'Checkout review requires fixes.');
      },
      error: error => {
        this.errorMessage = error?.error?.message || error?.message || 'Checkout review failed';
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
