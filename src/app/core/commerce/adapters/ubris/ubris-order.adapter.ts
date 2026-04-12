import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { JuliOrder, JuliOrderHistoryList, JuliOrderStatus, JuliOrderSummary } from '../../models/juli-order.model';
import { environment } from '../../../../../environments/environment';
import { GatewayEnvelope } from '../../models/ubris-commerce.models';
import { UbrisOrderNormalizer } from '../../normalizers/order.normalizer';
import { TenantHostService } from '../../../services/tenant-host.service';

@Injectable({ providedIn: 'root' })
export class UbrisOrderAdapter {
  constructor(
    private readonly http: HttpClient,
    private readonly normalizer: UbrisOrderNormalizer,
    private readonly tenantHost: TenantHostService
  ) {}

  load(userId: string, orderCode: string): Observable<JuliOrder> {
    return this.http.get<GatewayEnvelope<Record<string, unknown>>>(
      `${environment.ubrisApiBaseUrl}/api/bff/query/orders/${encodeURIComponent(orderCode)}`
    ).pipe(
      map(response => this.toJuliOrder(this.normalizer.normalizeOrderDetail(response.data, userId), userId))
    );
  }

  loadHistory(userId: string, pageSize = 20, currentPage = 0, sort = 'byDateDesc'): Observable<JuliOrderHistoryList> {
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
      map(response => this.toJuliHistoryList(this.normalizer.normalizeHistoryList(response.data, { currentPage, pageSize, sort, userId })))
    );
  }

  cancelOrder(userId: string, orderCode: string): Observable<void> {
    return this.http.post<GatewayEnvelope<void>>(
      `${environment.ubrisApiBaseUrl}/api/bff/orders/${encodeURIComponent(orderCode)}/cancel`,
      { userId }
    ).pipe(map(() => undefined));
  }

  createReturnRequestInternal(userId: string, orderCode: string, entries: unknown): Observable<GatewayEnvelope<Record<string, unknown>>> {
    return this.http.post<GatewayEnvelope<Record<string, unknown>>>(
      `${environment.ubrisApiBaseUrl}/api/bff/orders/${encodeURIComponent(orderCode)}/returns`,
      { userId, entries }
    );
  }

  private toJuliOrder(raw: any, userId?: string): JuliOrder {
    const currency = raw.totalPrice?.currencyIso ?? raw.totalPriceWithTax?.currencyIso ?? 'BRL';
    return {
      code: raw.code ?? 'UNKNOWN',
      status: this.mapStatus(raw.status),
      createdAt: raw.created instanceof Date ? raw.created : new Date(raw.created ?? Date.now()),
      updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : undefined,
      userId: raw.user?.uid ?? userId,
      subTotal: raw.subTotal ?? { value: 0, currencyIso: currency, formattedValue: '-' },
      totalTax: raw.totalTax,
      totalWithTax: raw.totalPriceWithTax ?? raw.totalPrice ?? { value: 0, currencyIso: currency, formattedValue: '-' },
      total: raw.totalPrice,
      entries: (raw.entries ?? []).map((entry: any, index: number) => ({
        entryNumber: entry.entryNumber ?? index,
        quantity: entry.quantity ?? 1,
        product: {
          code: entry.product?.code ?? 'UNKNOWN',
          name: entry.product?.name ?? entry.product?.code ?? 'Produto'
        },
        basePrice: entry.basePrice ?? { value: 0, currencyIso: currency, formattedValue: '-' },
        totalPrice: entry.totalPrice ?? { value: 0, currencyIso: currency, formattedValue: '-' }
      })),
      totalItems: raw.totalItems ?? raw.entries?.length ?? 0
    };
  }

  private toJuliHistoryList(raw: any): JuliOrderHistoryList {
    const orders: JuliOrderSummary[] = (raw.orders ?? []).map((order: any) => ({
      code: order.code ?? 'UNKNOWN',
      status: this.mapStatus(order.status),
      createdAt: order.placed instanceof Date ? order.placed : new Date(order.placed ?? Date.now()),
      total: order.total ?? { value: 0, currencyIso: 'BRL', formattedValue: '-' },
      totalItems: order.totalItems ?? 0,
      cancellable: false,
      returnable: false
    }));

    return {
      orders,
      pagination: {
        currentPage: raw.pagination?.currentPage ?? 0,
        pageSize: raw.pagination?.pageSize ?? 10,
        totalResults: raw.pagination?.totalResults ?? orders.length,
        totalPages: raw.pagination?.totalPages ?? 1
      },
      sorts: (raw.sorts ?? []).map((sort: any) => ({
        code: sort.code ?? '',
        name: sort.name ?? sort.code ?? '',
        selected: sort.selected ?? false
      }))
    };
  }

  private mapStatus(status: string | undefined): JuliOrderStatus {
    if (!status) return 'UNKNOWN';
    const upper = status.toUpperCase();
    const valid: JuliOrderStatus[] = ['PENDING', 'PROCESSING', 'READY', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED', 'REFUNDED', 'ON_HOLD', 'COMPLETED', 'UNKNOWN'];
    if (valid.includes(upper as JuliOrderStatus)) return upper as JuliOrderStatus;
    const mappings: Record<string, JuliOrderStatus> = {
      CREATED: 'PENDING', ON_CHECK: 'PROCESSING', PICKING: 'PROCESSING',
      PAID: 'PROCESSING', CANCELED: 'CANCELLED', CLOSED: 'COMPLETED'
    };
    return mappings[upper] ?? 'UNKNOWN';
  }
}
