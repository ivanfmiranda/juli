import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { filter, switchMap, take } from 'rxjs/operators';
import { JuliOrder, JuliOrderHistoryList } from '../models/juli-order.model';
import { AuthService } from '../../auth/auth.service';
import { UbrisOrderAdapter } from '../adapters/ubris/ubris-order.adapter';

@Injectable({ providedIn: 'root' })
export class JuliOrderFacade {

  constructor(
    private readonly authService: AuthService,
    private readonly orderAdapter: UbrisOrderAdapter
  ) {}

  list(pageSize: number = 20, currentPage: number = 0, sort: string = 'byDateDesc'): Observable<JuliOrderHistoryList> {
    return this.authService.session$.pipe(
      take(1),
      switchMap(session => {
        if (!session?.username) {
          return throwError(new Error('Usuário não autenticado'));
        }
        return this.orderAdapter.loadHistory(session.username, pageSize, currentPage, sort);
      })
    );
  }

  get(orderCode: string): Observable<JuliOrder> {
    return this.authService.session$.pipe(
      take(1),
      switchMap(session => {
        if (!session?.username) {
          return throwError(new Error('Usuário não autenticado'));
        }
        return this.orderAdapter.load(session.username, orderCode);
      }),
      filter(order => !!order && order.code === orderCode)
    );
  }

  clear(): void {
    // No-op: state is managed by JuliOrderService's BehaviorSubject
  }

  clearDetail(): void {
    // No-op: state is managed by JuliOrderService's BehaviorSubject
  }
}
