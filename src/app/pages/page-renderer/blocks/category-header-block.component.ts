import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, Input, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { JuliProductListing, JuliProductService } from '../../../core/commerce';

@Component({
  selector: 'app-category-header-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="category-header" *ngIf="(listing$ | async) as listing">
      <nav class="breadcrumbs" role="navigation" aria-label="Breadcrumb" *ngIf="listing.breadcrumbs?.length">
        <a routerLink="/">{{ 'category.home' | juliTranslate }}</a>
        <span class="separator">/</span>
        <ng-container *ngFor="let crumb of listing.breadcrumbs; let last = last">
          <a *ngIf="!last" [routerLink]="crumb.url">{{ crumb.name }}</a>
          <span *ngIf="!last" class="separator">/</span>
          <span *ngIf="last" class="current">{{ crumb.name }}</span>
        </ng-container>
      </nav>

      <h1 class="category-title">{{ listing.name }}</h1>
      <p class="category-description" *ngIf="listing.description">{{ listing.description }}</p>

      <div class="category-meta">
        <span class="results-count">
          {{ 'category.productsCount' | juliTranslate:{ count: listing.pagination.totalResults, suffix: listing.pagination.totalResults !== 1 ? 's' : '' } }}
        </span>

        <div class="sort-control" *ngIf="listing.sorts?.length">
          <label for="cat-sort-select">{{ 'category.sortBy' | juliTranslate }}</label>
          <select id="cat-sort-select" (change)="changeSort($any($event.target).value)">
            <option *ngFor="let sort of listing.sorts"
                    [value]="sort.code"
                    [selected]="sort.code === selectedSort(listing.sorts)">
              {{ sort.name }}
            </option>
          </select>
        </div>
      </div>
    </header>
  `,
  styleUrls: ['../../category-page/category-page.component.scss'],
})
export class CategoryHeaderBlockComponent implements OnInit {
  @Input() props: any = {};
  private readonly destroyRef = inject(DestroyRef);

  readonly listing$: Observable<JuliProductListing | null> = this.juliProductService.listing$;

  constructor(
    private readonly juliProductService: JuliProductService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.listing$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.cdr.markForCheck());
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
