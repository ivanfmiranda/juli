/**
 * Customer Coupon Placeholder Adapter
 * 
 * ⚠️  PLACEHOLDER - Capability Futura
 * 
 * Gerenciamento de cupons de cliente (my coupons, claim coupon).
 * Não implementado no JULI atual.
 * 
 * Backend Ubris: Não suportado
 * Backend Hybris: Suportado via OCC (futuro)
 * 
 * @see docs/JULI-COMPATIBILITY-MATRIX.md
 */

import { Injectable } from '@angular/core';
import { CustomerCouponAdapter, CustomerCouponSearchResult, CustomerCouponNotification, CustomerCoupon2Customer } from '@spartacus/core';
import { Observable, throwError, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CustomerCouponPlaceholderAdapter implements CustomerCouponAdapter {
  
  /**
   * Lista de cupons do cliente - não implementado
   */
  getCustomerCoupons(_userId: string, _pageSize: number, _currentPage: number, _sort: string): Observable<CustomerCouponSearchResult> {
    return of({ coupons: [], pagination: { totalResults: 0, totalPages: 0 } } as CustomerCouponSearchResult);
  }
  
  /**
   * Habilitar notificação de cupom - não implementado
   */
  turnOnNotification(_userId: string, _couponCode: string): Observable<CustomerCouponNotification> {
    return throwError(new Error('CustomerCouponAdapter.turnOnNotification() not supported in JULI'));
  }
  
  /**
   * Desabilitar notificação de cupom - não implementado
   */
  turnOffNotification(_userId: string, _couponCode: string): Observable<{}> {
    return throwError(new Error('CustomerCouponAdapter.turnOffNotification() not supported in JULI'));
  }
  
  /**
   * Resgatar cupom - não implementado
   */
  claimCustomerCoupon(_userId: string, _couponCode: string): Observable<CustomerCoupon2Customer> {
    return throwError(new Error('CustomerCouponAdapter.claimCustomerCoupon() not supported in JULI'));
  }
}
