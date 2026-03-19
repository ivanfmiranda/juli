import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../core/auth/auth.service';
import { JuliCartFacade, JuliCheckoutFacade } from '../../core/commerce';

@Component({
  selector: 'app-checkout-page',
  templateUrl: './checkout-page.component.html',
  styleUrls: ['./checkout-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckoutPageComponent {
  readonly cart$ = this.cartFacade.cart$;
  readonly form = this.fb.group({
    addressLine: ['', Validators.required],
    paymentMethod: ['card', Validators.required]
  });

  submitting = false;
  errorMessage?: string;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly cartFacade: JuliCartFacade,
    private readonly checkoutFacade: JuliCheckoutFacade,
    private readonly router: Router
  ) {}

  submit(): void {
    const session = this.authService.currentSession;
    const cartId = this.cartFacade.currentCartId;
    if (!session || !cartId || this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.errorMessage = undefined;

    this.checkoutFacade.submit({
      cartId,
      customerId: session.username,
      userType: session.userType || 'B2C',
      addressLine: this.form.value.addressLine || '',
      paymentMethod: this.form.value.paymentMethod || 'card'
    }).pipe(
      finalize(() => {
        this.submitting = false;
      })
    ).subscribe({
      next: result => {
        if (result.checkoutId) {
          this.cartFacade.clear();
          void this.router.navigate(['/account/orders'], { queryParams: { checkoutId: result.checkoutId } });
          return;
        }
        this.errorMessage = result.lastError || 'Checkout failed';
      },
      error: error => {
        this.errorMessage = error?.error?.message || error?.message || 'Checkout failed';
      }
    });
  }
}