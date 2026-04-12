import { Injectable } from '@angular/core';
import { JuliOrder, JuliOrderHistoryList } from '../models/juli-order.model';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { UbrisOrderAdapter } from '../adapters/ubris/ubris-order.adapter';
import { UbrisOrderNormalizer } from '../normalizers/order.normalizer';
import { JuliObservabilityService } from '../../services/observability.service';
import { JuliEvent } from '../../models/observability.models';

@Injectable({ providedIn: 'root' })
export class UbrisOrderConnector {
  constructor(
    private readonly adapter: UbrisOrderAdapter,
    private readonly normalizer: UbrisOrderNormalizer,
    private readonly obs: JuliObservabilityService
  ) {}

  load(userId: string, orderCode: string): Observable<JuliOrder> {
    return this.adapter.load(userId, orderCode);
  }

  loadHistory(
    userId: string,
    pageSize?: number,
    currentPage?: number,
    sort?: string
  ): Observable<JuliOrderHistoryList> {
    return this.adapter.loadHistory(userId, pageSize, currentPage, sort);
  }

  cancel(userId: string, orderCode: string): Observable<void> {
    this.obs.emitEvent(JuliEvent.ORDER_CANCEL_REQUESTED, { userId, orderCode });
    return this.adapter.cancelOrder(userId, orderCode).pipe(
      tap({
        error: (err) => this.obs.emitEvent(JuliEvent.ORDER_CANCEL_FAILED, { orderCode, error: err })
      })
    );
  }

  createReturnRequest(userId: string, orderCode: string, entries: unknown): Observable<unknown> {
    return this.adapter.createReturnRequestInternal(userId, orderCode, entries).pipe(
      map(response => this.normalizer.normalizeReturnRequest(response.data))
    );
  }
}
