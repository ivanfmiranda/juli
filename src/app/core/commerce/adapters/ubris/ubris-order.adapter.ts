import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  CancellationRequestEntryInputList,
  ConsignmentTracking,
  Order,
  OrderHistoryList,
  ReturnRequest,
  ReturnRequestEntryInputList,
  ReturnRequestList,
  ReturnRequestModification,
  UserOrderAdapter
} from '@spartacus/core';
import { Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { GatewayEnvelope } from '../../models/ubris-commerce.models';
import { UbrisOrderNormalizer } from '../../normalizers/order.normalizer';

@Injectable({ providedIn: 'root' })
export class UbrisOrderAdapter implements UserOrderAdapter {
  constructor(
    private readonly http: HttpClient,
    private readonly normalizer: UbrisOrderNormalizer
  ) {}

  load(userId: string, orderCode: string): Observable<Order> {
    return this.http.get<GatewayEnvelope<Record<string, unknown>>>(
      `${environment.ubrisApiBaseUrl}/api/bff/query/orders/${encodeURIComponent(orderCode)}`
    ).pipe(
      map(response => this.normalizer.normalizeOrderDetail(response.data, userId))
    );
  }

  loadHistory(
    userId: string,
    pageSize: number = 20,
    currentPage: number = 0,
    sort: string = 'byDateDesc'
  ): Observable<OrderHistoryList> {
    const params = new HttpParams()
      .set('tenantId', 'default')
      .set('customerId', userId)
      .set('currentPage', String(currentPage))
      .set('pageSize', String(pageSize))
      .set('sort', sort);

    return this.http.get<GatewayEnvelope<Record<string, unknown>>>(
      `${environment.ubrisApiBaseUrl}/api/bff/query/orders`,
      { params }
    ).pipe(
      map(response => this.normalizer.normalizeHistoryList(response.data, {
        currentPage,
        pageSize,
        sort,
        userId
      }))
    );
  }

  cancel(userId: string, orderCode: string, _cancelRequestInput: CancellationRequestEntryInputList): Observable<{}> {
    return this.cancelOrder(userId, orderCode).pipe(map(() => ({})));
  }

  cancelOrder(userId: string, orderCode: string): Observable<void> {
    return this.http.post<GatewayEnvelope<void>>(
      `${environment.ubrisApiBaseUrl}/api/bff/orders/${encodeURIComponent(orderCode)}/cancel`,
      { userId }
    ).pipe(map(() => undefined));
  }

  createReturnRequest(userId: string, returnRequestInput: ReturnRequestEntryInputList): Observable<ReturnRequest> {
    // Note: Spartacus doesn't pass orderCode here, we might need a workaround or assume the input contains it
    // In many implementations, returnRequestInput has the orderCode or it's handled via a specific connector
    const orderCode = (returnRequestInput as any).orderCode; 
    return this.createReturnRequestInternal(userId, orderCode, returnRequestInput).pipe(
      map(response => this.normalizer.normalizeReturnRequest(response.data))
    );
  }

  createReturnRequestInternal(userId: string, orderCode: string, entries: ReturnRequestEntryInputList): Observable<GatewayEnvelope<Record<string, unknown>>> {
    return this.http.post<GatewayEnvelope<Record<string, unknown>>>(
      `${environment.ubrisApiBaseUrl}/api/bff/orders/${encodeURIComponent(orderCode)}/returns`,
      { userId, entries }
    );
  }

  getConsignmentTracking(_orderCode: string, _consignmentCode: string, _userId?: string): Observable<ConsignmentTracking> {


  cancelReturnRequest(
    _userId: string,
    _returnRequestCode: string,
    _returnRequestModification: ReturnRequestModification
  ): Observable<{}> {
    return throwError(() => new Error('Return request cancellation is not supported in juli yet.'));
  }
}
