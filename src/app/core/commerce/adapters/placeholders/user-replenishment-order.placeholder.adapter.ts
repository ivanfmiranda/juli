/**
 * User Replenishment Order Placeholder Adapter
 * 
 * ⚠️  PLACEHOLDER - Capability Futura (B2B/Subscription)
 * 
 * Pedidos de reposição automática vinculados ao usuário.
 * Não implementado no JULI atual.
 * 
 * Backend Ubris: Não suportado
 * Backend Hybris: Suportado via B2B Commerce (futuro)
 * 
 * @see docs/JULI-COMPATIBILITY-MATRIX.md
 */

import { Injectable } from '@angular/core';
import { UserReplenishmentOrderAdapter, ReplenishmentOrder, ReplenishmentOrderList, OrderHistoryList } from '@spartacus/core';
import { Observable, throwError, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserReplenishmentOrderPlaceholderAdapter implements UserReplenishmentOrderAdapter {
  
  /**
   * Detalhes de um replenishment - não implementado
   */
  load(_userId: string, _replenishmentOrderCode: string): Observable<ReplenishmentOrder> {
    return throwError(() => new Error('UserReplenishmentOrderAdapter.load() not supported in JULI'));
  }
  
  /**
   * Histórico de pedidos de um replenishment - não implementado
   */
  loadReplenishmentDetailsHistory(_userId: string, _replenishmentOrderCode: string, _pageSize?: number, _currentPage?: number, _sort?: string): Observable<OrderHistoryList> {
    return of({ orders: [], pagination: { totalResults: 0, totalPages: 0 } } as OrderHistoryList);
  }
  
  /**
   * Cancelar replenishment - não implementado
   */
  cancelReplenishmentOrder(_userId: string, _replenishmentOrderCode: string): Observable<ReplenishmentOrder> {
    return throwError(() => new Error('UserReplenishmentOrderAdapter.cancelReplenishmentOrder() not supported in JULI'));
  }
  
  /**
   * Histórico de replenishments do usuário - não implementado
   */
  loadHistory(_userId: string, _pageSize?: number, _currentPage?: number, _sort?: string): Observable<ReplenishmentOrderList> {
    return of({ replenishmentOrders: [], pagination: { totalResults: 0, totalPages: 0 } } as ReplenishmentOrderList);
  }
}
