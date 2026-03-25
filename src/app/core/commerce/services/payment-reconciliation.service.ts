import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap, take, tap } from 'rxjs/operators';
import { UbrisCheckoutConnector } from '../connectors/checkout.connector';
import { JuliCheckoutPaymentStatus, JuliCheckoutResult } from '../models/ubris-commerce.models';
import { JuliObservabilityService } from '../../services/observability.service';
import { JuliEvent } from '../../models/observability.models';

export type ReconciliationState = 
  | 'IDLE'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_AUTHORIZED'
  | 'PAYMENT_FAILED'
  | 'ORDER_PLACED'
  | 'ORDER_FAILED'
  | 'RECONCILIATION_REQUIRED';

@Injectable({ providedIn: 'root' })
export class UbrisPaymentReconciliationService {
  constructor(
    private readonly connector: UbrisCheckoutConnector,
    private readonly obs: JuliObservabilityService
  ) {}

  /**
   * Verifica o estado do checkout e pagamento para determinar a próxima ação.
   * Útil para recuperar sessões interrompidas ou após refresh.
   */
  checkState(checkoutId: string): Observable<ReconciliationState> {
    this.obs.emitEvent(JuliEvent.ORDER_RECONCILIATION_STARTED, { checkoutId });
    return this.connector.status(checkoutId).pipe(
      switchMap(status => {
        if (status.orderId) {
          this.obs.emitEvent(JuliEvent.ORDER_RECONCILIATION_RESOLVED, { checkoutId, orderId: status.orderId });
          return of('ORDER_PLACED' as ReconciliationState);
        }

        // Se não tem pedido, verifica o pagamento
        return this.connector.paymentStatus(checkoutId).pipe(
          map(payment => {
            const state = this.deriveState(payment);
            this.obs.log({ level: 'INFO', message: `Reconciliation check: ${state}`, correlationId: this.obs.getCorrelationId(), context: { checkoutId, paymentStatus: payment.status } });
            return state;
          }),
          catchError(() => of('IDLE' as ReconciliationState))
        );
      }),
      catchError(() => of('IDLE' as ReconciliationState))
    );
  }

  /**
   * Tenta recuperar um pedido perdido se o pagamento foi confirmado.
   * Usa idempotencyKey para segurança.
   */
  recoverOrder(checkoutId: string): Observable<JuliCheckoutResult> {
    return this.checkState(checkoutId).pipe(
      take(1),
      switchMap(state => {
        if (state === 'PAYMENT_AUTHORIZED') {
          // Pagamento ok, mas sem pedido. Tenta submeter novamente com chave idempotente baseada no checkoutId
          const idempotencyKey = `recover-${checkoutId}`;
          this.obs.log({ level: 'WARN', message: 'Attempting order recovery via reconciliation', correlationId: this.obs.getCorrelationId(), context: { checkoutId, idempotencyKey } });
          return this.connector.submitById(checkoutId, idempotencyKey);
        }
        if (state === 'ORDER_PLACED') {
          return this.connector.status(checkoutId);
        }
        return throwError(() => new Error(`Cannot recover order in state: ${state}`));
      })
    );
  }

  private deriveState(payment: JuliCheckoutPaymentStatus): ReconciliationState {
    switch (payment.status) {
      case 'AUTHORIZED':
      case 'CAPTURED':
        return 'PAYMENT_AUTHORIZED';
      case 'FAILED':
      case 'CANCELLED':
        return 'PAYMENT_FAILED';
      case 'PENDING':
      case 'REQUIRES_ACTION':
        return 'PAYMENT_PENDING';
      default:
        return 'IDLE'; // Ou RECONCILIATION_REQUIRED se status for ambíguo
    }
  }
}
