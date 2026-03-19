import { Injectable } from '@angular/core';
import { Order, OrderHistoryList, UserOrderService } from '@spartacus/core';
import { Observable, defer } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class JuliOrderFacade {
  private lastUsername: string | null = null;

  constructor(
    private readonly authService: AuthService,
    private readonly userOrderService: UserOrderService
  ) {
    this.authService.session$.subscribe(session => {
      const username = session?.username ?? null;
      if (username !== this.lastUsername) {
        this.lastUsername = username;
        this.userOrderService.clearOrderList();
      }
    });
  }

  list(pageSize: number = 20, currentPage: number = 0, sort: string = 'byDateDesc'): Observable<OrderHistoryList> {
    return defer(() => {
      this.userOrderService.clearOrderList();
      this.userOrderService.loadOrderList(pageSize, currentPage, sort);
      return this.userOrderService.getOrderHistoryList(pageSize);
    });
  }

  get(orderCode: string): Observable<Order> {
    return defer(() => {
      this.userOrderService.clearOrderDetails();
      this.userOrderService.loadOrderDetails(orderCode);
      return this.userOrderService.getOrderDetails().pipe(
        filter(order => !!order && order.code === orderCode)
      );
    });
  }

  clear(): void {
    this.userOrderService.clearOrderList();
  }

  clearDetail(): void {
    this.userOrderService.clearOrderDetails();
  }
}
