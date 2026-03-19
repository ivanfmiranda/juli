import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Order } from '@spartacus/core';
import { Observable } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { JuliOrderFacade } from '../../core/commerce';

@Component({
  selector: 'app-order-detail-page',
  templateUrl: './order-detail-page.component.html',
  styleUrls: ['./order-detail-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderDetailPageComponent implements OnDestroy {
  readonly order$: Observable<Order> = this.route.paramMap.pipe(
    map(params => params.get('code')),
    filter((code): code is string => !!code),
    switchMap(code => this.orderFacade.get(code))
  );

  constructor(
    private readonly route: ActivatedRoute,
    private readonly orderFacade: JuliOrderFacade
  ) {}

  ngOnDestroy(): void {
    this.orderFacade.clearDetail();
  }
}
