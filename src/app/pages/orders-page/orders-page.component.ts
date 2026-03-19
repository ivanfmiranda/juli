import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
import { OrderHistoryList } from '@spartacus/core';
import { JuliOrderFacade } from '../../core/commerce';

@Component({
  selector: 'app-orders-page',
  templateUrl: './orders-page.component.html',
  styleUrls: ['./orders-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrdersPageComponent implements OnDestroy {
  readonly orders$: Observable<OrderHistoryList> = this.orderFacade.list();

  constructor(private readonly orderFacade: JuliOrderFacade) {}

  ngOnDestroy(): void {
    this.orderFacade.clear();
  }
}
