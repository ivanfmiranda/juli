import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, Input, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { JuliCartFacade, JuliProductListing, JuliProductService } from '../../../core/commerce';

@Component({
  selector: 'app-product-listing-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="loading-state" *ngIf="loading$ | async">
      <div class="skeleton-grid">
        <div class="skeleton-card" *ngFor="let i of [1,2,3,4,5,6,7,8]">
          <div class="skeleton-image"></div>
          <div class="skeleton-content">
            <div class="skeleton-line short"></div>
            <div class="skeleton-line"></div>
            <div class="skeleton-line short"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="error-state" *ngIf="error$ | async as error">
      <div class="error-icon">⚠️</div>
      <h3>{{ errorTitleKey | juliTranslate }}</h3>
      <p>{{ error }}</p>
      <button class="btn-primary" (click)="retryLoad()">{{ 'category.retry' | juliTranslate }}</button>
    </div>

    <ng-container *ngIf="(listing$ | async) as listing">
      <section class="products-section" *ngIf="listing.products?.length; else noProducts">
        <div class="products-grid">
          <app-product-card
            *ngFor="let product of listing.products"
            [product]="product"
            (addToCart)="addToCart($event)">
          </app-product-card>
        </div>

        <footer class="pagination" *ngIf="listing.pagination.totalPages > 1">
          <button type="button" class="btn-page"
                  (click)="changePage(listing.pagination.currentPage - 1)"
                  [disabled]="!listing.pagination.hasPrevious">
            ← {{ 'category.previous' | juliTranslate }}
          </button>

          <div class="page-numbers">
            <button *ngFor="let pageNum of getPageNumbers(listing.pagination)"
                    type="button" class="btn-page-number"
                    [class.active]="pageNum === listing.pagination.currentPage"
                    (click)="changePage(pageNum)">
              {{ pageNum + 1 }}
            </button>
          </div>

          <button type="button" class="btn-page"
                  (click)="changePage(listing.pagination.currentPage + 1)"
                  [disabled]="!listing.pagination.hasNext">
            {{ 'category.next' | juliTranslate }} →
          </button>
        </footer>
      </section>

      <ng-template #noProducts>
        <div class="empty-state">
          <div class="empty-icon">{{ emptyIcon }}</div>
          <h3>{{ emptyTitleKey | juliTranslate }}</h3>
          <p>{{ emptyHintKey | juliTranslate }}</p>
          <a routerLink="/" class="btn-primary">{{ 'category.explore' | juliTranslate }}</a>
        </div>
      </ng-template>
    </ng-container>
  `,
  styleUrls: ['../../category-page/category-page.component.scss'],
})
export class ProductListingBlockComponent implements OnInit {
  @Input() props: any = {};
  private readonly destroyRef = inject(DestroyRef);

  readonly listing$: Observable<JuliProductListing | null> = this.juliProductService.listing$;
  readonly loading$ = this.juliProductService.listingLoading$;
  readonly error$ = this.juliProductService.listingError$;

  constructor(
    private readonly juliProductService: JuliProductService,
    private readonly cartFacade: JuliCartFacade,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.listing$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.cdr.markForCheck());
  }

  get errorTitleKey(): string { return this.props?.errorTitleKey || 'category.errorTitle'; }
  get emptyTitleKey(): string {
    return this.props?.emptyTitleKey
      || (this.props?.source === 'search' ? 'search.noProducts' : 'category.emptyTitle');
  }
  get emptyHintKey(): string {
    return this.props?.emptyHintKey
      || (this.props?.source === 'search' ? 'search.noProductsHint' : 'category.emptyHint');
  }
  get emptyIcon(): string {
    return this.props?.emptyIcon || '📭';
  }

  changePage(page: number): void {
    if (page < 0) return;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge',
    });
  }

  addToCart(productCode: string): void {
    if (!productCode) return;
    this.cartFacade.addEntry(productCode, 1).subscribe({ error: () => undefined });
  }

  retryLoad(): void {
    // Re-emits the same params to trigger a reload via the shell.
    const cur = this.route.snapshot.queryParamMap;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { _r: Date.now(), page: cur.get('page') || 0 },
      queryParamsHandling: 'merge',
    });
  }

  getPageNumbers(pagination: { currentPage: number; totalPages: number }): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    const halfVisible = Math.floor(maxVisible / 2);

    let start = Math.max(0, pagination.currentPage - halfVisible);
    const end = Math.min(pagination.totalPages - 1, start + maxVisible - 1);
    if (end - start < maxVisible - 1) {
      start = Math.max(0, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }
}
