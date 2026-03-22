/**
 * User Payment Stub Adapter
 * 
 * ⚠️  ATENÇÃO: Este adapter existe APENAS para satisfazer a dependência de injeção
 * do UserTransitional_4_2_Module do Spartacus. NÃO implementa funcionalidade
 * de payment methods saved e NÃO deve ser usado para features de pagamento.
 * 
 * O JULI utiliza checkout custom próprio (JuliCheckoutFacade) com inicialização
 * de pagamento via Stripe/Pix através do payment-service. Não há saved payment
 * methods na arquitetura atual.
 * 
 * @see JuliCheckoutFacade
 * @see CheckoutPageComponent
 */

import { Injectable } from '@angular/core';
import { UserPaymentAdapter } from '@spartacus/core';
import { PaymentDetails } from '@spartacus/core';
import { Observable, throwError, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserPaymentPlaceholderAdapter implements UserPaymentAdapter {
  
  /**
   * Retorna lista vazia - JULI não usa saved payment methods
   */
  loadAll(_userId: string): Observable<PaymentDetails[]> {
    return of([]);
  }
  
  /**
   * Não suportado - JULI não usa saved payment methods
   */
  add(_userId: string, _paymentDetails: PaymentDetails): Observable<PaymentDetails> {
    return throwError(() => new Error('UserPaymentAdapter.add() not supported in JULI'));
  }
  
  /**
   * Não suportado - JULI não usa saved payment methods
   */
  update(_userId: string, _paymentDetailsId: string, _paymentDetails: PaymentDetails): Observable<PaymentDetails> {
    return throwError(() => new Error('UserPaymentAdapter.update() not supported in JULI'));
  }
  
  /**
   * Não suportado - JULI não usa saved payment methods
   */
  setDefault(_userId: string, _paymentDetailsId: string): Observable<PaymentDetails> {
    return throwError(() => new Error('UserPaymentAdapter.setDefault() not supported in JULI'));
  }
  
  /**
   * Não suportado - JULI não usa saved payment methods
   */
  delete(_userId: string, _paymentDetailsId: string): Observable<{}> {
    return of({});
  }
}
