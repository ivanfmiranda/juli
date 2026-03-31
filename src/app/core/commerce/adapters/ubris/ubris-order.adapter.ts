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
import { TenantHostService } from '../../../services/tenant-host.service';

@Injectable({ providedIn: 'root' })
export class UbrisOrderAdapter extends UserOrderAdapter {
  constructor(
    private readonly http: HttpClient,
    private readonly normalizer: UbrisOrderNormalizer,
    private readonly tenantHost: TenantHostService
  ) {
    super();
  }

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
    const tenantContext = this.tenantHost.current();
    const params = new HttpParams()
      .set('tenantId', tenantContext.tenantId)
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
    return throwError(new Error('Consignment tracking not supported in ubris yet.'));
  }

  loadReturnRequestDetail(
    _userId: string,
    _returnRequestCode: string
  ): Observable<ReturnRequest> {
    return throwError(new Error('Return request detail not supported in ubris yet.'));
  }

  loadReturnRequestList(
    _userId: string,
    _pageSize?: number,
    _currentPage?: number,
    _sort?: string
  ): Observable<ReturnRequestList> {
    return throwError(new Error('Return request list not supported in ubris yet.'));
  }

  cancelReturnRequest(
    _userId: string,
    _returnRequestCode: string,
    _returnRequestModification: ReturnRequestModification
  ): Observable<{}> {
    return throwError(new Error('Return request cancellation is not supported in juli yet.'));
  }
}
