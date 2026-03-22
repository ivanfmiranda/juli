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

  getConsignmentTracking(_orderCode: string, _consignmentCode: string, _userId?: string): Observable<ConsignmentTracking> {
    return throwError(() => new Error('Consignment tracking is not supported in juli yet.'));
  }

  createReturnRequest(_userId: string, _returnRequestInput: ReturnRequestEntryInputList): Observable<ReturnRequest> {
    return throwError(() => new Error('Return requests are not supported in juli yet.'));
  }

  loadReturnRequestDetail(_userId: string, _returnRequestCode: string): Observable<ReturnRequest> {
    return throwError(() => new Error('Return request details are not supported in juli yet.'));
  }

  loadReturnRequestList(
    _userId: string,
    _pageSize: number,
    _currentPage: number,
    _sort: string
  ): Observable<ReturnRequestList> {
    return throwError(() => new Error('Return request lists are not supported in juli yet.'));
  }

  cancel(_userId: string, _orderCode: string, _cancelRequestInput: CancellationRequestEntryInputList): Observable<{}> {
    return throwError(() => new Error('Order cancellation is not supported in juli yet.'));
  }

  cancelReturnRequest(
    _userId: string,
    _returnRequestCode: string,
    _returnRequestModification: ReturnRequestModification
  ): Observable<{}> {
    return throwError(() => new Error('Return request cancellation is not supported in juli yet.'));
  }
}
