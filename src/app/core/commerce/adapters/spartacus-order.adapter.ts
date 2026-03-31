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
import { UbrisOrderConnector } from '../connectors/order.connector';

@Injectable({ providedIn: 'root' })
export class JuliSpartacusOrderAdapter extends UserOrderAdapter {
  constructor(protected connector: UbrisOrderConnector) {
    super();
  }

  load(userId: string, orderCode: string): Observable<Order> {
    return this.connector.load(userId, orderCode);
  }

  loadHistory(
    userId: string,
    pageSize?: number,
    currentPage?: number,
    sort?: string
  ): Observable<OrderHistoryList> {
    return this.connector.loadHistory(userId, pageSize, currentPage, sort);
  }

  getConsignmentTracking(
    _orderCode: string,
    _consignmentCode: string,
    _userId?: string
  ): Observable<ConsignmentTracking> {
    return throwError(new Error('Consignment tracking not supported yet'));
  }

  cancel(
    userId: string,
    orderCode: string,
    _cancelRequestInput: CancellationRequestEntryInputList
  ): Observable<{}> {
    return this.connector.cancel(userId, orderCode).pipe(map(() => ({})));
  }

  createReturnRequest(
    userId: string,
    returnRequestInput: ReturnRequestEntryInputList
  ): Observable<ReturnRequest> {
    // Note: orderCode should be part of the input or context
    const orderCode = (returnRequestInput as any).orderCode;
    return this.connector.createReturnRequest(userId, orderCode, returnRequestInput);
  }

  loadReturnRequestDetail(
    _userId: string,
    _returnRequestCode: string
  ): Observable<ReturnRequest> {
    return throwError(new Error('Return request detail not supported yet'));
  }

  loadReturnRequestList(
    _userId: string,
    _pageSize?: number,
    _currentPage?: number,
    _sort?: string
  ): Observable<ReturnRequestList> {
    return throwError(new Error('Return request list not supported yet'));
  }

  cancelReturnRequest(
    _userId: string,
    _returnRequestCode: string,
    _returnRequestModification: ReturnRequestModification
  ): Observable<{}> {
    return throwError(new Error('Cancel return request not supported yet'));
  }
}
