import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { JuliCartFacade } from '../../core/commerce';
import { UbrisProductAdapter } from '../../core/commerce/adapters/product.adapter';
import { JuliQuoteService, QuoteItemPayload } from '../../core/commerce/services/juli-quote.service';
import { B2bAssignment, B2bContextService } from '../../core/user/b2b-context.service';

@Component({
  selector: 'app-cart-page',
  templateUrl: './cart-page.component.html',
  styleUrls: ['./cart-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CartPageComponent {
  readonly cart$ = this.cartFacade.cart$;
  readonly itemCount$ = this.cartFacade.itemCount$;
  readonly loading$ = this.cartFacade.loading$;
  readonly b2bContext$: Observable<B2bAssignment | null> = this.b2bContext.context$;
  reloading = true;
  updating = false;
  requestingQuote = false;
  quoteError: string | null = null;
  productImages: Record<string, string> = {};

  constructor(
    private readonly cartFacade: JuliCartFacade,
    private readonly cdr: ChangeDetectorRef,
    private readonly productAdapter: UbrisProductAdapter,
    private readonly quoteService: JuliQuoteService,
    private readonly b2bContext: B2bContextService,
    private readonly router: Router
  ) {
    this.cartFacade.reload().subscribe({
      next: () => { this.reloading = false; this.cdr.markForCheck(); },
      error: () => { this.reloading = false; this.cdr.markForCheck(); },
      complete: () => { this.reloading = false; this.cdr.markForCheck(); }
    });
    this.cart$.subscribe(cart => {
      if (cart?.entries) {
        for (const entry of cart.entries) {
          const code = entry.product?.code;
          if (code && !this.productImages[code]) {
            this.productAdapter.get(code).subscribe({
              next: res => {
                const data = res?.data as any;
                const images = data?.images;
                if (Array.isArray(images) && images.length > 0) {
                  this.productImages[code] = images[0].url;
                  this.cdr.markForCheck();
                }
              },
              error: () => {}
            });
          }
        }
      }
    });
  }

  incrementQuantity(entry: any): void {
    if (this.updating) return;
    this.updating = true;
    this.cartFacade.updateEntry(entry.product?.code, (entry.quantity ?? 0) + 1).subscribe({
      next: () => { this.updating = false; this.cdr.detectChanges(); },
      error: () => { this.updating = false; this.cdr.detectChanges(); }
    });
  }

  decrementQuantity(entry: any): void {
    if (this.updating) return;
    const newQty = (entry.quantity ?? 0) - 1;
    this.updating = true;
    if (newQty <= 0) {
      this.cartFacade.removeEntry(entry.product?.code).subscribe({
        next: () => { this.updating = false; this.cdr.detectChanges(); },
        error: () => { this.updating = false; this.cdr.detectChanges(); }
      });
    } else {
      this.cartFacade.updateEntry(entry.product?.code, newQty).subscribe({
        next: () => { this.updating = false; this.cdr.detectChanges(); },
        error: () => { this.updating = false; this.cdr.detectChanges(); }
      });
    }
  }

  removeItem(entry: any): void {
    if (this.updating) return;
    this.updating = true;
    this.cartFacade.removeEntry(entry.product?.code).subscribe({
      next: () => { this.updating = false; this.cdr.detectChanges(); },
      error: () => { this.updating = false; this.cdr.detectChanges(); }
    });
  }

  getProductImage(entry: any): string | null {
    const code = entry?.product?.code;
    return code ? this.productImages[code] ?? null : null;
  }

  /**
   * Convert the current cart into a B2B quote request. Visible only to
   * buyers with an active B2B assignment — the storefront keeps the
   * normal "Finalizar compra" button alongside, so the merchant can
   * still pay direct without the approval workflow when the cart is
   * within their spending limit.
   *
   * <p>The mapping is intentionally minimal: SKU + qty + unit price as
   * displayed in the cart. Notes/validUntil are left for the quote
   * detail page where the buyer can refine. {@code priceSource} marks
   * "STOREFRONT" so the b2b-platform's rule engine knows the price
   * came from the public catalog (not negotiated).
   */
  requestQuote(): void {
    if (this.requestingQuote) return;
    const assignment = this.b2bContext.current();
    if (!assignment || !assignment.companyId) {
      this.quoteError = 'Conta sem vínculo com empresa B2B.';
      this.cdr.markForCheck();
      return;
    }
    this.cart$.pipe(take(1)).subscribe({
      next: cart => {
        const entries = (cart?.entries ?? []) as Array<Record<string, any>>;
        const items: QuoteItemPayload[] = [];
        let currency = 'BRL';
        for (const entry of entries) {
          const sku = entry?.product?.code;
          const quantity = Number(entry?.quantity ?? 0);
          // Cart exposes basePrice as { value, currencyIso, formattedValue }.
          // Fall back to totalPrice / quantity if basePrice isn't present.
          const basePrice = entry?.basePrice?.value;
          const totalPrice = entry?.totalPrice?.value;
          const unitPrice = typeof basePrice === 'number'
            ? basePrice
            : (typeof totalPrice === 'number' && quantity > 0 ? totalPrice / quantity : 0);
          const detectedCurrency = entry?.basePrice?.currencyIso || entry?.totalPrice?.currencyIso;
          if (detectedCurrency && typeof detectedCurrency === 'string') currency = detectedCurrency;
          if (!sku || quantity <= 0) continue;
          items.push({ sku, quantity, unitPrice, priceSource: 'STOREFRONT' });
        }
        if (items.length === 0) {
          this.quoteError = 'Carrinho vazio — adicione produtos antes de solicitar cotação.';
          this.cdr.markForCheck();
          return;
        }
        this.requestingQuote = true;
        this.quoteError = null;
        this.cdr.markForCheck();
        this.quoteService.create({
          companyId: assignment.companyId,
          unitId: assignment.unitId ?? null,
          currency,
          items
        }).subscribe({
          next: created => {
            this.requestingQuote = false;
            this.router.navigate(['/account/quotes', created.id]);
          },
          error: err => {
            this.requestingQuote = false;
            this.quoteError = (err?.error?.message || err?.message) ?? 'Falha ao solicitar cotação.';
            this.cdr.markForCheck();
          }
        });
      }
    });
  }
}
