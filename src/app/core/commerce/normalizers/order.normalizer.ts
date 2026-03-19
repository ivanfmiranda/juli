import { Injectable } from '@angular/core';
import { Order, OrderHistoryList, OrderEntry, Price } from '@spartacus/core';

type NormalizeHistoryOptions = {
  currentPage?: number;
  pageSize?: number;
  sort?: string;
  userId?: string;
};

@Injectable({ providedIn: 'root' })
export class UbrisOrderNormalizer {
  normalize(rawOrders: Record<string, unknown>[] | undefined): OrderHistoryList {
    return this.normalizeHistoryList(rawOrders);
  }

  normalizeHistoryList(rawOrders: Record<string, unknown>[] | undefined, options: NormalizeHistoryOptions = {}): OrderHistoryList {
    const sortedOrders = this.sortOrders(Array.isArray(rawOrders) ? rawOrders : [], options.sort);
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
      sorts: []
    };
  }

  normalizeOrderDetail(raw: Record<string, unknown> | undefined, userId?: string): Order {
    const source = raw ?? {};
    const placedValue = this.firstNonBlank(source, 'placedAt', 'updatedAt', 'createdAt');
    const totalItems = this.asNumber(source.totalItems, this.sumQuantities(source.entries) ?? 0);
    const currency = this.firstNonBlank(source, 'currency') ?? 'USD';
    return {
      code: this.firstNonBlank(source, 'id', 'orderId') ?? undefined,
      status: this.firstNonBlank(source, 'status') ?? undefined,
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
    const currency = this.firstNonBlank(raw, 'currency') ?? 'USD';
    return {
      code: this.firstNonBlank(raw, 'id', 'orderId') ?? undefined,
      status: this.firstNonBlank(raw, 'status') ?? undefined,
      placed: this.asDate(placedValue) ?? undefined,
      total: this.normalizePrice(raw.total, currency)
    };
  }

  private normalizePrice(raw: unknown, fallbackCurrency: string = 'USD'): Price | undefined {
    if (raw && typeof raw === 'object') {
      const price = raw as Record<string, unknown>;
      const currencyIso = this.firstNonBlank(price, 'currency') ?? fallbackCurrency;
      const amount = this.asNumber(price.raw, 0);
      return {
        currencyIso,
        value: amount,
        formattedValue: this.firstNonBlank(price, 'formatted') ?? `${currencyIso} ${amount.toFixed(2)}`
      };
    }
    if (typeof raw === 'number' || typeof raw === 'string') {
      const amount = this.asNumber(raw, 0);
      return {
        currencyIso: fallbackCurrency,
        value: amount,
        formattedValue: `${fallbackCurrency} ${amount.toFixed(2)}`
      };
    }
    return undefined;
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
        const currency = this.firstNonBlank(entry, 'currency') ?? 'USD';
        const quantity = this.asNumber(entry.quantity, 0);
        return {
          entryNumber: this.asNumber(entry.entryNumber, index),
          quantity: quantity > 0 ? quantity : undefined,
          basePrice: this.normalizePrice(this.pickPriceCandidate(entry, 'unitPrice', 'basePrice', 'price'), currency),
          totalPrice: this.normalizePrice(this.pickPriceCandidate(entry, 'lineTotal', 'totalPrice', 'total'), currency),
          product: productCode ? {
            code: productCode,
            name: productName ?? undefined
          } : undefined
        };
      });

    return entries.length > 0 ? entries : undefined;
  }

  private pickPriceCandidate(source: Record<string, unknown>, ...keys: string[]): unknown {
    for (const key of keys) {
      if (key in source) {
        return source[key];
      }
    }
    return undefined;
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
    return orders;
  }

  private dateValue(raw: Record<string, unknown>): number {
    const value = this.asDate(this.firstNonBlank(raw, 'placedAt', 'updatedAt', 'createdAt'));
    return value?.getTime() ?? 0;
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

  private asDate(value: string | null): Date | null {
    if (!value) {
      return null;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
}
