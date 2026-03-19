import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { finalize, switchMap, takeUntil } from 'rxjs/operators';
import { AuthService } from '../../core/auth/auth.service';
import {
  JuliCartFacade,
  JuliCheckoutAddressUpsertRequest,
  JuliCheckoutFacade,
  JuliCheckoutReviewSnapshot
} from '../../core/commerce';

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
  reviewSnapshot?: JuliCheckoutReviewSnapshot;
  reviewStale = false;
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
      if (this.reviewSnapshot) {
        this.reviewSnapshot = undefined;
        this.reviewStale = true;
        this.statusMessage = 'Checkout review is stale. Refresh review before place-order.';
      }
    });
  }

  review(): void {
    const session = this.authService.currentSession;
    const cartId = this.cartFacade.currentCartId;
    if (!session || !cartId || this.form.invalid || this.reviewing || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    this.reviewing = true;
    this.errorMessage = undefined;
    this.statusMessage = undefined;

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
      switchMap(savedAddress => {
        this.checkoutId = savedAddress.checkoutId;
        return this.checkoutFacade.review(savedAddress.checkoutId);
      }),
      finalize(() => {
        this.reviewing = false;
      })
    ).subscribe({
      next: review => {
        this.reviewSnapshot = review;
        this.reviewStale = false;
        this.errorMessage = review.errors[0];
        this.statusMessage = review.messages[0] || (review.readyToPlace ? 'Checkout review is ready.' : undefined);
      },
      error: error => {
        this.errorMessage = error?.error?.message || error?.message || 'Checkout review failed';
      }
    });
  }

  submit(): void {
    if (!this.checkoutId || !this.reviewSnapshot?.readyToPlace || this.reviewStale || this.submitting || this.reviewing) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.errorMessage = undefined;

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
      }
    });
  }

  get reviewButtonDisabled(): boolean {
    return this.reviewing || this.submitting || this.form.invalid;
  }

  get placeOrderDisabled(): boolean {
    return this.submitting
      || this.reviewing
      || this.reviewStale
      || !this.reviewSnapshot?.readyToPlace;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
