/**
 * Search Page Component
 *
 * Usa o mesmo layout (grid de produtos, sort, paginação, loading/empty states)
 * da Category PLP via JuliProductService.listing$, mantendo apenas o header
 * específico da busca ("Resultados para ...").
 */

import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnDestroy, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  JuliCartFacade,
  JuliProductListing,
  JuliProductService,
} from '../../core/commerce';
import { JuliI18nService } from '../../core/i18n/i18n.service';
import { TenantHostService } from '../../core/services/tenant-host.service';

interface SearchPageViewModel {
  query: string;
  listing: JuliProductListing | null;
  loading: boolean;
}

@Component({
  selector: 'app-search-page',
  templateUrl: './search-page.component.html',
  styleUrls: ['./search-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchPageComponent implements OnInit, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);
  private readonly defaultPageSize = 12;

  readonly vm$: Observable<SearchPageViewModel> = this.juliProductService.listing$.pipe(
    map(listing => ({
      query: this.route.snapshot.queryParamMap.get('q') || '',
      listing,
      loading: false,
    }))
  );

  readonly loading$ = this.juliProductService.listingLoading$;
  readonly error$ = this.juliProductService.listingError$;

  private readonly siteName: string;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly juliProductService: JuliProductService,
    private readonly cartFacade: JuliCartFacade,
    public readonly i18n: JuliI18nService,
    private readonly titleService: Title,
    tenantHost: TenantHostService,
  ) {
    const tenantId = tenantHost.currentTenantId();
    this.siteName = tenantId && tenantId !== 'default'
      ? tenantId.charAt(0).toUpperCase() + tenantId.slice(1)
      : 'Juli Store';
  }

  ngOnInit(): void {
    // Observa query params (q, página, ordenação) e recarrega a listagem.
    this.route.queryParamMap.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(params => {
      const query = (params.get('q') || '').trim();
      if (!query) {
        this.juliProductService.clearListing();
        this.titleService.setTitle(`Busca — ${this.siteName}`);
        return;
      }
      const page = Math.max(Number(params.get('page') || '0'), 0);
      const sort = params.get('sort') || undefined;
      this.juliProductService.loadSearchListing(query, page, this.defaultPageSize, sort);
      this.titleService.setTitle(`${this.i18n.translate('search.resultsFor', { query })} — ${this.siteName}`);
    });
  }

  ngOnDestroy(): void {
    this.juliProductService.clearListing();
  }

  changePage(page: number): void {
    if (page < 0) return;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge',
    });
  }

  changeSort(sortCode: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { sort: sortCode, page: 0 },
      queryParamsHandling: 'merge',
    });
  }

  addToCart(productCode: string): void {
    if (!productCode) return;
    this.cartFacade.addEntry(productCode, 1).subscribe({ error: () => undefined });
  }

  retryLoad(): void {
    const query = (this.route.snapshot.queryParamMap.get('q') || '').trim();
    if (!query) return;
    const page = Math.max(Number(this.route.snapshot.queryParamMap.get('page') || '0'), 0);
    const sort = this.route.snapshot.queryParamMap.get('sort') || undefined;
    this.juliProductService.loadSearchListing(query, page, this.defaultPageSize, sort);
  }

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

  getSelectedSort(sorts: { code: string; selected: boolean }[]): string {
    const sortParam = this.route.snapshot.queryParamMap.get('sort');
    if (sortParam && sorts.some(s => s.code === sortParam)) {
      return sortParam;
    }
    return sorts[0]?.code || 'relevance';
  }
}
