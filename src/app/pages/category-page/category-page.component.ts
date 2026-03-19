import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Product } from '@spartacus/core';
import { Observable, combineLatest } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { JuliCartFacade, UbrisCategoryFacade } from '../../core/commerce';

@Component({
  selector: 'app-category-page',
  templateUrl: './category-page.component.html',
  styleUrls: ['./category-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoryPageComponent {
  private readonly pageSize = 12;
  readonly vm$: Observable<{ code: string; name: string; products: Product[]; total: number; page: number; totalPages: number }> = combineLatest([
    this.route.paramMap.pipe(map(params => params.get('code') || '')),
    this.route.queryParamMap.pipe(map(params => Math.max(Number(params.get('page') || '0') || 0, 0)))
  ]).pipe(
    switchMap(([code, page]) => this.categoryFacade.get(code, page, this.pageSize).pipe(
      map(result => ({
        code: result.categoryCode,
        name: result.categoryName,
        products: result.products,
        total: result.total,
        page: result.page,
        totalPages: Math.max(Math.ceil(result.total / (result.pageSize || this.pageSize)), 1)
      }))
    ))
  );

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly categoryFacade: UbrisCategoryFacade,
    private readonly cartFacade: JuliCartFacade
  ) {}

  addToCart(productCode?: string): void {
    if (!productCode) {
      return;
    }
    this.cartFacade.addEntry(productCode, 1).subscribe({ error: () => undefined });
  }

  changePage(page: number): void {
    if (page < 0) {
      return;
    }

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge'
    });
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
