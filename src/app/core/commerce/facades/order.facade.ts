import { Injectable } from '@angular/core';
import { OrderHistoryList, UserOrderService } from '@spartacus/core';
import { Observable, defer } from 'rxjs';
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

  clear(): void {
    this.userOrderService.clearOrderList();
  }
}
