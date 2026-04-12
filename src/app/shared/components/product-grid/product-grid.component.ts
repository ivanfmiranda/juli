import { ChangeDetectionStrategy, Component, Inject, Optional } from '@angular/core';
import { JULI_CMS_COMPONENT_DATA, JuliCmsComponentContext } from '../../../core/cms/tokens';
import { Observable, combineLatest, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { UbrisCategoryConnector, UbrisProductConnector, UbrisProductSearchConnector } from '../../../core/commerce';
import { ProductGridComponentModel } from '../../../core/models/cms.model';
import { JuliI18nService } from '../../../core/i18n/i18n.service';

interface JuliProduct {
  code?: string;
  name?: string;
  price?: { formattedValue?: string; value?: number; currencyIso?: string };
  images?: unknown;
  url?: string;
  [key: string]: unknown;
}

interface ProductGridVm {
  data: ProductGridComponentModel;
  products: JuliProduct[];
}

@Component({
  selector: 'app-product-grid',
  templateUrl: './product-grid.component.html',
  styleUrls: ['./product-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductGridComponent {
  readonly data$: Observable<ProductGridComponentModel> = this.componentData.data$;
  readonly vm$: Observable<ProductGridVm> = combineLatest([this.data$, this.i18n.locale$]).pipe(
    switchMap(([data]) => this.resolveProducts(data).pipe(map(products => ({ data, products })))),
    catchError(() => this.data$.pipe(map(data => ({ data, products: [] }))))
  );

  constructor(
    @Optional() @Inject(JULI_CMS_COMPONENT_DATA) protected readonly componentData: JuliCmsComponentContext<ProductGridComponentModel>,
    private readonly productConnector: UbrisProductConnector,
    private readonly categoryConnector: UbrisCategoryConnector,
    private readonly searchConnector: UbrisProductSearchConnector,
    public readonly i18n: JuliI18nService
  ) {}

  trackByProduct = (_index: number, product: JuliProduct) => product.code ?? _index;

  imageUrl(product: JuliProduct): string | undefined {
    const primary = (product.images as any)?.PRIMARY;
    return primary?.product?.url || primary?.thumbnail?.url || primary?.zoom?.url;
  }

  private resolveProducts(data: ProductGridComponentModel): Observable<JuliProduct[]> {
    if (data.productCodes?.length) {
      return forkJoin(data.productCodes.slice(0, data.pageSize).map(code => this.productConnector.get(code))).pipe(
        map(products => products.filter(product => !!product?.code))
      );
    }

    if (data.categoryCode) {
      return this.categoryConnector.get(data.categoryCode, 0, data.pageSize).pipe(
        map(page => page.products ?? [])
      );
    }

    if (data.searchQuery) {
      return this.searchConnector.search(data.searchQuery, { currentPage: 0, pageSize: data.pageSize }).pipe(
        map(page => (page.products ?? []) as JuliProduct[])
      );
    }

    return of([]);
  }
}
