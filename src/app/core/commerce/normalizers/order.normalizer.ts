import { Injectable } from '@angular/core';
import { Order, OrderHistoryList, OrderEntry, Price, ReturnRequest } from '@spartacus/core';

type NormalizeHistoryOptions = {
  currentPage?: number;
  pageSize?: number;
  sort?: string;
  userId?: string;
};

@Injectable({ providedIn: 'root' })
export class UbrisOrderNormalizer {
  normalize(rawOrders: Record<string, unknown>[] | Record<string, unknown> | undefined): OrderHistoryList {
    return this.normalizeHistoryList(rawOrders);
  }

  normalizeHistoryList(
    rawOrders: Record<string, unknown>[] | Record<string, unknown> | undefined,
    options: NormalizeHistoryOptions = {}
  ): OrderHistoryList {
    if (Array.isArray(rawOrders)) {
      return this.normalizeLegacyHistoryList(rawOrders, options);
    }

    const source = this.asRecord(rawOrders);
    const currentSort = this.firstNonBlank(source, 'sort') ?? options.sort ?? 'byDateDesc';
    const items = this.asRecordList(source.items ?? source.results ?? source.orders);
    const orders = items.map(order => this.normalizeOrderHistory(order));
    const pageSize = Math.max(this.asNumber(source.pageSize, options.pageSize ?? orders.length), 1);
    const currentPage = Math.max(this.asNumber(source.currentPage, options.currentPage ?? 0), 0);
    const totalResults = Math.max(this.asNumber(source.totalResults, orders.length), 0);
    const totalPages = Math.max(this.asNumber(source.totalPages, totalResults === 0 ? 1 : Math.ceil(totalResults / pageSize)), 1);

    return {
      orders,
      pagination: {
        currentPage,
        pageSize,
        totalResults,
        totalPages
      },
      sorts: this.normalizeSorts(source.sorts, currentSort)
    };
  }

  normalizeOrderDetail(raw: Record<string, unknown> | undefined, userId?: string): Order {
    const source = raw ?? {};
    const placedValue = this.firstNonBlank(source, 'placedAt', 'updatedAt', 'createdAt');
    const totalItems = this.asNumber(source.totalItems, this.sumQuantities(source.entries) ?? 0);
    const currency = this.firstNonBlank(source, 'currency') ?? 'BRL';
    const rawStatus = this.firstNonBlank(source, 'status') ?? 'CREATED';

    return {
      code: this.firstNonBlank(source, 'id', 'orderId') ?? undefined,
      status: this.mapStatus(rawStatus),
      statusDisplay: this.mapStatusDisplay(rawStatus),
      created: this.asDate(placedValue) ?? undefined,
      totalPrice: this.normalizePrice(source.total, currency),
      totalPriceWithTax: this.normalizePrice(this.pickPriceCandidate(source, 'totalWithTax', 'totalPriceWithTax', 'grandTotal', 'total'), currency),
      subTotal: this.normalizePrice(this.pickPriceCandidate(source, 'subtotal', 'subTotal', 'netTotal'), currency),
      totalTax: this.normalizePrice(this.pickPriceCandidate(source, 'tax', 'totalTax'), currency),
      totalItems: totalItems > 0 ? totalItems : undefined,
      user: userId ? { uid: userId } : undefined,
      entries: this.normalizeEntries(source.entries)
    };
  }

  private normalizeOrderHistory(raw: Record<string, unknown>) {
    const placedValue = this.firstNonBlank(raw, 'placedAt', 'updatedAt', 'createdAt');
    const currency = this.firstNonBlank(raw, 'currency') ?? 'BRL';
    const rawStatus = this.firstNonBlank(raw, 'status') ?? 'CREATED';

    return {
      code: this.firstNonBlank(raw, 'id', 'orderId') ?? undefined,
      status: this.mapStatus(rawStatus),
      statusDisplay: this.mapStatusDisplay(rawStatus),
      placed: this.asDate(placedValue) ?? undefined,
      total: this.normalizePrice(raw.total, currency)
    };
  }

  private mapStatus(status: string): string {
    const mapping: Record<string, string> = {
      'CREATED': 'CREATED',
      'PAID': 'PAID',
      'PROCESSING': 'PROCESSING',
      'SHIPPED': 'SHIPPED',
      'DELIVERED': 'DELIVERED',
      'CANCELLED': 'CANCELLED'
    };
    return mapping[(status || '').toUpperCase()] ?? 'UNKNOWN';
  }

  private mapStatusDisplay(status: string): string {
    const mapping: Record<string, string> = {
      'CREATED': 'Order Created',
      'PAID': 'Payment Confirmed',
      'PROCESSING': 'Processing Order',
      'SHIPPED': 'Order Shipped',
      'DELIVERED': 'Order Delivered',
      'CANCELLED': 'Order Cancelled'
    };
    return mapping[(status || '').toUpperCase()] ?? status;
  }

  private normalizePrice(raw: unknown, fallbackCurrency: string = 'BRL'): Price | undefined {
    if (raw && typeof raw === 'object') {
      const price = raw as Record<string, unknown>;
      const currencyIso = this.firstNonBlank(price, 'currency') ?? fallbackCurrency;
      const amount = this.asNumber(price.raw, 0);
      return {
        currencyIso,
        value: amount,
        formattedValue: this.firstNonBlank(price, 'formatted') ?? this.formatCurrency(amount, currencyIso)
      };
    }
    if (typeof raw === 'number' || typeof raw === 'string') {
      const amount = this.asNumber(raw, 0);
      return {
        currencyIso: fallbackCurrency,
        value: amount,
        formattedValue: this.formatCurrency(amount, fallbackCurrency)
      };
    }
    return undefined;
  }

  private formatCurrency(value: number, currency: string): string {
    const locale = currency === 'BRL' ? 'pt-BR' : currency === 'USD' ? 'en-US' : 'pt-BR';
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
    } catch {
      return `${currency} ${value.toFixed(2)}`;
    }
  }

  private normalizeEntries(rawEntries: unknown): OrderEntry[] | undefined {
    if (!Array.isArray(rawEntries)) {
      return undefined;
    }

    const entries = rawEntries
      .filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === 'object')
      .map((entry, index) => {
        const productCode = this.firstNonBlank(entry, 'sku', 'productCode') ?? this.firstNonBlank(this.asRecord(entry.product), 'code', 'sku');
        const productName = this.firstNonBlank(entry, 'name') ?? this.firstNonBlank(this.asRecord(entry.product), 'name');
        const currency = this.firstNonBlank(entry, 'currency') ?? 'BRL';
        const quantity = this.asNumber(entry.quantity, 0);
        return {
          entryNumber: this.asNumber(entry.entryNumber, index),
          quantity: quantity > 0 ? quantity : undefined,
          basePrice: this.normalizePrice(this.pickPriceCandidate(entry, 'unitPrice', 'basePrice', 'price'), currency),
          totalPrice: this.normalizePrice(this.pickPriceCandidate(entry, 'lineTotal', 'totalPrice', 'total'), currency),
          product: productCode ? {
            code: productCode,
            name: productName ?? undefined
          } : undefined,
          customizations: entry.customizations ?? null
        };
      });

    return entries.length > 0 ? entries : undefined;
  }

  normalizeReturnRequest(raw: Record<string, unknown> | undefined): ReturnRequest {
    const source = raw ?? {};
    const orderCode = this.firstNonBlank(source, 'orderCode');
    return {
      order: orderCode ? { code: orderCode } : undefined,
      code: this.firstNonBlank(source, 'code', 'returnId') ?? undefined,
      status: (this.firstNonBlank(source, 'status') as any) ?? 'RECEIVED',
      returnEntries: this.normalizeReturnEntries(source.entries ?? source.returnEntries),
      cancellable: this.asBoolean(source.cancellable)
    };
  }

  private normalizeReturnEntries(raw: unknown): any[] {
    if (!Array.isArray(raw)) {
      return [];
    }
    return raw.map(entry => ({
      orderEntry: {
        product: { code: entry.sku || entry.productCode }
      },
      quantity: entry.quantity,
      returnReason: entry.reason
    }));
  }

  private pickPriceCandidate(source: Record<string, unknown>, ...keys: string[]): unknown {
    for (const key of keys) {
      if (key in source) {
        return source[key];
      }
    }
    return undefined;
  }

  private normalizeLegacyHistoryList(rawOrders: Record<string, unknown>[], options: NormalizeHistoryOptions): OrderHistoryList {
    const sortedOrders = this.sortOrders(rawOrders, options.sort);
    const pageSize = Math.max(options.pageSize ?? sortedOrders.length ?? 0, 1);
    const currentPage = Math.max(options.currentPage ?? 0, 0);
    const totalResults = sortedOrders.length;
    const totalPages = totalResults === 0 ? 1 : Math.ceil(totalResults / pageSize);
    const fromIndex = Math.min(currentPage * pageSize, totalResults);
    const toIndex = Math.min(fromIndex + pageSize, totalResults);
    const orders = sortedOrders.slice(fromIndex, toIndex).map(order => this.normalizeOrderHistory(order));

    return {
      orders,
      pagination: {
        currentPage,
        pageSize,
        totalResults,
        totalPages
      },
      sorts: this.defaultSorts(options.sort ?? 'byDateDesc')
    };
  }

  private sortOrders(rawOrders: Record<string, unknown>[], sort?: string): Record<string, unknown>[] {
    const normalizedSort = (sort ?? 'byDateDesc').toLowerCase();
    const orders = [...rawOrders];
    if (normalizedSort === 'bydatedesc') {
      return orders.sort((left, right) => this.dateValue(right) - this.dateValue(left));
    }
    if (normalizedSort === 'bydateasc') {
      return orders.sort((left, right) => this.dateValue(left) - this.dateValue(right));
    }
    if (normalizedSort === 'bytotaldesc') {
      return orders.sort((left, right) => this.totalValue(right) - this.totalValue(left));
    }
    if (normalizedSort === 'bytotalasc') {
      return orders.sort((left, right) => this.totalValue(left) - this.totalValue(right));
    }
    return orders;
  }

  private normalizeSorts(rawSorts: unknown, currentSort: string) {
    const sorts = this.asRecordList(rawSorts)
      .map(sort => ({
        code: this.firstNonBlank(sort, 'code') ?? '',
        name: this.firstNonBlank(sort, 'name') ?? this.firstNonBlank(sort, 'code') ?? '',
        selected: this.asBoolean(sort.selected)
      }))
      .filter(sort => sort.code.length > 0);

    if (sorts.length > 0) {
      return sorts;
    }

    return this.defaultSorts(currentSort);
  }

  private defaultSorts(currentSort: string) {
    return [
      { code: 'byDateDesc', name: 'Newest', selected: currentSort === 'byDateDesc' },
      { code: 'byDateAsc', name: 'Oldest', selected: currentSort === 'byDateAsc' },
      { code: 'byTotalDesc', name: 'Highest total', selected: currentSort === 'byTotalDesc' },
      { code: 'byTotalAsc', name: 'Lowest total', selected: currentSort === 'byTotalAsc' }
    ];
  }

  private dateValue(raw: Record<string, unknown>): number {
    const value = this.asDate(this.firstNonBlank(raw, 'placedAt', 'updatedAt', 'createdAt'));
    return value?.getTime() ?? 0;
  }

  private totalValue(raw: Record<string, unknown>): number {
    return this.asNumber(raw.total, 0);
  }

  private sumQuantities(rawEntries: unknown): number | undefined {
    if (!Array.isArray(rawEntries)) {
      return undefined;
    }
    const total = rawEntries
      .filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === 'object')
      .reduce((sum, entry) => sum + this.asNumber(entry.quantity, 0), 0);
    return total > 0 ? total : undefined;
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  }

  private asRecordList(value: unknown): Record<string, unknown>[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value.filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === 'object');
  }

  private firstNonBlank(source: Record<string, unknown>, ...keys: string[]): string | null {
    for (const key of keys) {
      const value = source[key];
      if (value === null || value === undefined) {
        continue;
      }
      const str = String(value).trim();
      if (str.length > 0) {
        return str;
      }
    }
    return null;
  }

  private asNumber(value: unknown, fallback: number): number {
    if (typeof value === 'number' && !Number.isNaN(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? fallback : parsed;
    }
    return fallback;
  }

  private asBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      return value.trim().toLowerCase() === 'true';
    }
    return false;
  }

  private asDate(value: string | null): Date | null {
    if (!value) {
      return null;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
}
