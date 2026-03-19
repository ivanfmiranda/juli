import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { OrderHistoryList } from '@spartacus/core';
import { AuthService } from '../../core/auth/auth.service';
import { JuliOrderFacade } from '../../core/commerce';

@Component({
  selector: 'app-orders-page',
  templateUrl: './orders-page.component.html',
  styleUrls: ['./orders-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrdersPageComponent {
  readonly orders$: Observable<OrderHistoryList> = this.authService.session$.pipe(
    filter((session): session is NonNullable<typeof session> => !!session?.username),
    switchMap(session => this.orderFacade.list(session.username))
  );

  constructor(private readonly authService: AuthService, private readonly orderFacade: JuliOrderFacade) {}
}
