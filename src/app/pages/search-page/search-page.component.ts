import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Product, ProductSearchPage } from '@spartacus/core';
import { Observable, combineLatest, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { JuliCartFacade, UbrisProductSearchConnector } from '../../core/commerce';
import { JuliI18nService } from '../../core/i18n/i18n.service';
import { TenantHostService } from '../../core/services/tenant-host.service';

@Component({
  selector: 'app-search-page',
  templateUrl: './search-page.component.html',
  styleUrls: ['./search-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchPageComponent {
  private readonly pageSize = 12;
  readonly vm$: Observable<{ query: string; page: ProductSearchPage; products: Product[]; total: number }> = combineLatest([
    this.route.queryParamMap.pipe(map(params => params.get('q') || '')),
    this.route.queryParamMap.pipe(map(params => Math.max(Number(params.get('page') || '0') || 0, 0)))
  ]).pipe(
    switchMap(([query, page]) => {
      if (!query.trim()) {
        return of({
          query,
          page: { freeTextSearch: query, products: [], pagination: { currentPage: 0, pageSize: this.pageSize, totalResults: 0, totalPages: 0 } } as ProductSearchPage,
          products: [],
          total: 0
        });
      }

      return this.searchConnector.search(query, { currentPage: page, pageSize: this.pageSize }).pipe(
        map(result => ({
          query,
          page: result,
          products: result.products ?? [],
          total: result.pagination?.totalResults ?? (result.products?.length ?? 0)
        })),
        tap(result => this.titleService.setTitle(
          result.query ? `Busca: ${result.query} — ${this.siteName}` : `Busca — ${this.siteName}`
        ))
      );
    })
  );

  private readonly siteName: string;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly searchConnector: UbrisProductSearchConnector,
    private readonly cartFacade: JuliCartFacade,
    public readonly i18n: JuliI18nService,
    private readonly titleService: Title,
    tenantHost: TenantHostService
  ) {
    const tenantId = tenantHost.currentTenantId();
    this.siteName = tenantId && tenantId !== 'default'
      ? tenantId.charAt(0).toUpperCase() + tenantId.slice(1)
      : 'Juli Store';
  }

  addToCart(productCode?: string): void {
    if (!productCode) {
      return;
    }
    this.cartFacade.addEntry(productCode, 1).subscribe({ error: () => undefined });
  }

  changePage(query: string, page: number): void {
    if (!query.trim() || page < 0) {
      return;
    }

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: query, page },
      queryParamsHandling: 'merge'
    });
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
