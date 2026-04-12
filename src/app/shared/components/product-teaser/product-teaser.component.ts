import { ChangeDetectionStrategy, Component, Inject, Optional } from '@angular/core';
import { JULI_CMS_COMPONENT_DATA, JuliCmsComponentContext } from '../../../core/cms/tokens';
import { ProductTeaserComponentModel } from '../../../core/models/cms.model';
import { Observable, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { JuliCartFacade, UbrisProductConnector } from '../../../core/commerce';
import { JuliI18nService } from '../../../core/i18n/i18n.service';

interface JuliProduct {
  code?: string;
  name?: string;
  price?: { formattedValue?: string; value?: number; currencyIso?: string };
  images?: unknown;
  url?: string;
  [key: string]: unknown;
}

@Component({
  selector: 'app-product-teaser',
  templateUrl: './product-teaser.component.html',
  styleUrls: ['./product-teaser.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductTeaserComponent {
  data$: Observable<ProductTeaserComponentModel> = this.componentData.data$;

  product$: Observable<JuliProduct | null> = this.data$.pipe(
    switchMap(data => data.productCode ? this.productConnector.get(data.productCode) : of<JuliProduct | null>(null)),
    catchError(() => of<JuliProduct | null>(null))
  );

  constructor(
    @Optional() @Inject(JULI_CMS_COMPONENT_DATA) protected componentData: JuliCmsComponentContext<ProductTeaserComponentModel>,
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

  imageUrl(product: JuliProduct): string | undefined {
    const primary = (product.images as any)?.PRIMARY;
    return primary?.product?.url || primary?.thumbnail?.url || primary?.zoom?.url;
  }

  imageAlt(product: JuliProduct): string {
    const primary = (product.images as any)?.PRIMARY;
    return primary?.product?.altText || primary?.thumbnail?.altText || product.name || this.i18n.translate('commerce.viewProduct');
  }
}
