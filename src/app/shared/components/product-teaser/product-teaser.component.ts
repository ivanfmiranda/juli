import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CmsComponentData } from '@spartacus/storefront';
import { ProductTeaserComponentModel } from '../../../core/models/cms.model';
import { Observable, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { Product } from '@spartacus/core';
import { JuliCartFacade, UbrisProductConnector } from '../../../core/commerce';
import { JuliI18nService } from '../../../core/i18n/i18n.service';

@Component({
  selector: 'app-product-teaser',
  templateUrl: './product-teaser.component.html',
  styleUrls: ['./product-teaser.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductTeaserComponent {
  data$: Observable<ProductTeaserComponentModel> = this.componentData.data$;

  product$: Observable<Product | null> = this.data$.pipe(
    switchMap(data => data.productCode ? this.productConnector.get(data.productCode) : of<Product | null>(null)),
    catchError(() => of<Product | null>(null))
  );

  constructor(
    protected componentData: CmsComponentData<ProductTeaserComponentModel>,
    protected productConnector: UbrisProductConnector,
    private readonly cartFacade: JuliCartFacade,
    private readonly i18n: JuliI18nService
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
    return primary?.product?.altText || primary?.thumbnail?.altText || product.name || this.i18n.translate('commerce.viewProduct');
  }
}
