/**
 * Category Page Component (PLP)
 * 
 * Product Listing Page com design moderno e funcionalidades completas:
 * - Grid de produtos responsivo
 * - Paginação
 * - Sorting
 * - Empty state
 * - Loading state
 * - Breadcrumbs
 */

import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import {
  JuliProductService,
  JuliProductListing,
  JuliProductLoadingState,
} from '../../core/commerce';
import { JuliCartFacade } from '../../core/commerce';
import { JuliI18nService } from '../../core/i18n/i18n.service';
import { TenantHostService } from '../../core/services/tenant-host.service';

/**
 * ViewModel para a página
 */
interface CategoryPageViewModel {
  listing: JuliProductListing | null;
  loading: boolean;
  error?: string;
}

@Component({
  selector: 'app-category-page',
  templateUrl: './category-page.component.html',
  styleUrls: ['./category-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoryPageComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly defaultPageSize = 12;

  readonly vm$: Observable<CategoryPageViewModel> = this.juliProductService.listing$.pipe(
    map(listing => ({
      listing,
      loading: false,
    }))
  );

  readonly loading$ = this.juliProductService.listingLoading$;
  readonly error$ = this.juliProductService.listingError$;
  readonly Math = Math; // Expõe Math para o template

  private siteName: string;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly juliProductService: JuliProductService,
    private readonly cartFacade: JuliCartFacade,
    public readonly i18n: JuliI18nService,
    private readonly titleService: Title,
    private readonly tenantHost: TenantHostService
  ) {
    const tenantId = this.tenantHost.currentTenantId();
    this.siteName = tenantId && tenantId !== 'default'
      ? tenantId.charAt(0).toUpperCase() + tenantId.slice(1)
      : 'Juli Store';
  }

  ngOnInit(): void {
    // Observa mudanças nos parâmetros da rota
    this.route.paramMap.pipe(
      takeUntil(this.destroy$),
      map(params => params.get('code') || '')
    ).subscribe(categoryCode => {
      if (categoryCode) {
        this.loadListing(categoryCode);
      }
    });

    // Observa query params (página, ordenação)
    this.route.queryParamMap.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      const categoryCode = this.route.snapshot.paramMap.get('code') || '';
      if (categoryCode) {
        this.loadListing(categoryCode);
      }
    });

    // Set page title when listing loads
    this.juliProductService.listing$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(listing => {
      if (listing?.name) {
        this.titleService.setTitle(`${listing.name} — ${this.siteName}`);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.juliProductService.clearListing();
  }

  /**
   * Carrega a listagem de produtos
   */
  private loadListing(categoryCode: string): void {
    const page = Math.max(Number(this.route.snapshot.queryParamMap.get('page') || '0'), 0);
    const sort = this.route.snapshot.queryParamMap.get('sort') || undefined;

    this.juliProductService.loadCategoryListing(
      categoryCode,
      page,
      this.defaultPageSize,
      sort
    );
  }

  /**
   * Muda de página
   */
  changePage(page: number): void {
    if (page < 0) return;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge'
    });
  }

  /**
   * Muda a ordenação
   */
  changeSort(sortCode: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { sort: sortCode, page: 0 },
      queryParamsHandling: 'merge'
    });
  }

  /**
   * Adiciona produto ao carrinho
   */
  addToCart(productCode: string): void {
    if (!productCode) return;

    this.cartFacade.addEntry(productCode, 1).subscribe({
      error: () => undefined
    });
  }

  /**
   * Tenta recarregar a listagem
   */
  retryLoad(): void {
    const categoryCode = this.route.snapshot.paramMap.get('code') || '';
    if (categoryCode) {
      this.loadListing(categoryCode);
    }
  }

  /**
   * Retorna mensagem de estoque
   */
  getStockMessage(stock: { status: string; quantity?: number }): string {
    switch (stock.status) {
      case 'IN_STOCK':
        return this.i18n.translate('category.stockInStock');
      case 'LOW_STOCK':
        return this.i18n.translate('category.stockLow', { quantity: stock.quantity || 'few' });
      case 'OUT_OF_STOCK':
        return this.i18n.translate('category.stockOut');
      default:
        return this.i18n.translate('category.stockUnknown');
    }
  }

  /**
   * Gera array de números de página para paginação
   */
  getPageNumbers(pagination: { currentPage: number; totalPages: number }): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    const halfVisible = Math.floor(maxVisible / 2);

    let start = Math.max(0, pagination.currentPage - halfVisible);
    let end = Math.min(pagination.totalPages - 1, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(0, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  /**
   * Retorna o código do sort selecionado
   */
  getSelectedSort(sorts: { code: string; selected: boolean }[]): string {
    const sortParam = this.route.snapshot.queryParamMap.get('sort');
    if (sortParam && sorts.some(s => s.code === sortParam)) {
      return sortParam;
    }
    return sorts[0]?.code || 'relevance';
  }
}
