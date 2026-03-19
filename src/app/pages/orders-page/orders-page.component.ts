import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { OrderHistoryList } from '@spartacus/core';
import { JuliOrderFacade } from '../../core/commerce';

@Component({
  selector: 'app-orders-page',
  templateUrl: './orders-page.component.html',
  styleUrls: ['./orders-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrdersPageComponent implements OnDestroy {
  readonly pageSize = 10;
  readonly sortOptions = [
    { code: 'byDateDesc', label: 'Newest' },
    { code: 'byDateAsc', label: 'Oldest' },
    { code: 'byTotalDesc', label: 'Highest total' },
    { code: 'byTotalAsc', label: 'Lowest total' }
  ];

  readonly vm$: Observable<{ orders: OrderHistoryList; currentSort: string }> = this.route.queryParamMap.pipe(
    map(params => ({
      currentPage: Math.max(Number(params.get('page') ?? '0') || 0, 0),
      currentSort: params.get('sort') || 'byDateDesc'
    })),
    switchMap(({ currentPage, currentSort }) =>
      this.orderFacade.list(this.pageSize, currentPage, currentSort).pipe(
        map(orders => ({ orders, currentSort }))
      )
    )
  );

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly orderFacade: JuliOrderFacade
  ) {}

  changePage(page: number, currentSort: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        page: Math.max(page, 0),
        sort: currentSort
      },
      queryParamsHandling: 'merge'
    });
  }

  changeSort(sort: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        page: 0,
        sort
      },
      queryParamsHandling: 'merge'
    });
  }

  ngOnDestroy(): void {
    this.orderFacade.clear();
  }
}
