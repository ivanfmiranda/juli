import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, Input, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, combineLatest } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { JuliProductListing, JuliProductService } from '../../../core/commerce';

interface SearchHeaderViewModel {
  query: string;
  listing: JuliProductListing | null;
}

@Component({
  selector: 'app-search-header-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *ngIf="(vm$ | async) as vm">
      <div class="empty-state" *ngIf="!vm.query">
        <div class="empty-icon">🔎</div>
        <h3>{{ 'search.searchCatalog' | juliTranslate }}</h3>
        <p>{{ 'search.noProductsHint' | juliTranslate }}</p>
      </div>

      <header class="category-header" *ngIf="vm.query && vm.listing">
        <p class="eyebrow">{{ 'search.eyebrow' | juliTranslate }}</p>
        <h1 class="category-title">{{ 'search.resultsFor' | juliTranslate:{ query: vm.query } }}</h1>

        <div class="category-meta">
          <span class="results-count">
            {{ 'search.productsCount' | juliTranslate:{ count: vm.listing.pagination.totalResults } }}
          </span>

          <div class="sort-control" *ngIf="vm.listing.sorts?.length">
            <label for="search-sort-select">{{ 'category.sortBy' | juliTranslate }}</label>
            <select id="search-sort-select" (change)="changeSort($any($event.target).value)">
              <option *ngFor="let sort of vm.listing.sorts"
                      [value]="sort.code"
                      [selected]="sort.code === selectedSort(vm.listing.sorts)">
                {{ sort.name }}
              </option>
            </select>
          </div>
        </div>
      </header>
    </ng-container>
  `,
  styleUrls: ['../../search-page/search-page.component.scss'],
})
export class SearchHeaderBlockComponent implements OnInit {
  @Input() props: any = {};
  private readonly destroyRef = inject(DestroyRef);

  readonly vm$: Observable<SearchHeaderViewModel> = combineLatest([
    this.juliProductService.listing$,
    this.route.queryParamMap.pipe(startWith(this.route.snapshot.queryParamMap)),
  ]).pipe(map(([listing, params]) => ({
    query: (params.get('q') || '').trim(),
    listing,
  })));

  constructor(
    private readonly juliProductService: JuliProductService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.vm$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.cdr.markForCheck());
  }

  changeSort(sortCode: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { sort: sortCode, page: 0 },
      queryParamsHandling: 'merge',
    });
  }

  selectedSort(sorts: { code: string }[]): string {
    const sortParam = this.route.snapshot.queryParamMap.get('sort');
    if (sortParam && sorts.some(s => s.code === sortParam)) return sortParam;
    return sorts[0]?.code || 'relevance';
  }
}
