import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Product } from '@spartacus/core';
import { CmsComponentData } from '@spartacus/storefront';
import { Observable, combineLatest, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { UbrisCategoryConnector, UbrisProductConnector, UbrisProductSearchConnector } from '../../../core/commerce';
import { ProductGridComponentModel } from '../../../core/models/cms.model';
import { JuliI18nService } from '../../../core/i18n/i18n.service';

interface ProductGridVm {
  data: ProductGridComponentModel;
  products: Product[];
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
    protected readonly componentData: CmsComponentData<ProductGridComponentModel>,
    private readonly productConnector: UbrisProductConnector,
    private readonly categoryConnector: UbrisCategoryConnector,
    private readonly searchConnector: UbrisProductSearchConnector,
    public readonly i18n: JuliI18nService
  ) {}

  trackByProduct = (_index: number, product: Product) => product.code ?? _index;

  imageUrl(product: Product): string | undefined {
    const primary = (product.images as any)?.PRIMARY;
    return primary?.product?.url || primary?.thumbnail?.url || primary?.zoom?.url;
  }

  private resolveProducts(data: ProductGridComponentModel): Observable<Product[]> {
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
        map(page => page.products ?? [])
      );
    }

    return of([]);
  }
}
