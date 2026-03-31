import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { JuliCartFacade } from '../../core/commerce';
import { UbrisProductAdapter } from '../../core/commerce/adapters/product.adapter';

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
  updating = false;
  productImages: Record<string, string> = {};

  constructor(
    private readonly cartFacade: JuliCartFacade,
    private readonly cdr: ChangeDetectorRef,
    private readonly productAdapter: UbrisProductAdapter
  ) {
    this.cartFacade.reload().subscribe({ error: () => undefined });
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
      next: () => { this.updating = false; this.cdr.markForCheck(); },
      error: () => { this.updating = false; this.cdr.markForCheck(); }
    });
  }

  decrementQuantity(entry: any): void {
    if (this.updating) return;
    const newQty = (entry.quantity ?? 0) - 1;
    this.updating = true;
    if (newQty <= 0) {
      this.cartFacade.removeEntry(entry.product?.code).subscribe({
        next: () => { this.updating = false; this.cdr.markForCheck(); },
        error: () => { this.updating = false; this.cdr.markForCheck(); }
      });
    } else {
      this.cartFacade.updateEntry(entry.product?.code, newQty).subscribe({
        next: () => { this.updating = false; this.cdr.markForCheck(); },
        error: () => { this.updating = false; this.cdr.markForCheck(); }
      });
    }
  }

  removeItem(entry: any): void {
    if (this.updating) return;
    this.updating = true;
    this.cartFacade.removeEntry(entry.product?.code).subscribe({
      next: () => { this.updating = false; this.cdr.markForCheck(); },
      error: () => { this.updating = false; this.cdr.markForCheck(); }
    });
  }

  getProductImage(entry: any): string | null {
    const code = entry?.product?.code;
    return code ? this.productImages[code] ?? null : null;
  }
}
