import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Product } from '@spartacus/core';
import { JuliCartFacade, UbrisProductConnector } from '../../core/commerce';

@Component({
  selector: 'app-product-detail-page',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductDetailComponent {
  readonly product$: Observable<Product | null> = this.route.paramMap.pipe(
    map(params => params.get('code') || ''),
    switchMap(code => this.productConnector.get(code))
  );

  constructor(
    private readonly route: ActivatedRoute,
    private readonly productConnector: UbrisProductConnector,
    private readonly cartFacade: JuliCartFacade
  ) {}

  addToCart(productCode?: string): void {
    if (!productCode) {
      return;
    }
    this.cartFacade.addEntry(productCode, 1).subscribe({ error: () => undefined });
  }

  imageUrl(product: Product): string | undefined {
    const primary = (product.images as any)?.PRIMARY;
    return primary?.product?.url || primary?.thumbnail?.url || primary?.zoom?.url;
  }

  imageAlt(product: Product): string {
    const primary = (product.images as any)?.PRIMARY;
    return primary?.product?.altText || primary?.thumbnail?.altText || product.name || 'Product';
  }
}
