import { Injectable } from '@angular/core';
import { OrderHistoryList } from '@spartacus/core';

@Injectable({ providedIn: 'root' })
export class UbrisOrderNormalizer {
  normalize(rawOrders: Record<string, unknown>[] | undefined): OrderHistoryList {
    const orders = Array.isArray(rawOrders) ? rawOrders.map(order => this.normalizeOrder(order)) : [];
    return {
      orders,
      pagination: {
        currentPage: 0,
        pageSize: orders.length,
        totalResults: orders.length,
        totalPages: 1
      }
    };
  }

  private normalizeOrder(raw: Record<string, unknown>) {
    const placedValue = this.firstNonBlank(raw, 'placedAt', 'updatedAt', 'createdAt');
    return {
      code: this.firstNonBlank(raw, 'id', 'orderId') ?? undefined,
      status: this.firstNonBlank(raw, 'status') ?? undefined,
      placed: this.asDate(placedValue) ?? undefined,
      total: this.normalizePrice(raw.total)
    };
  }

  private normalizePrice(raw: unknown) {
    if (raw && typeof raw === 'object') {
      const price = raw as Record<string, unknown>;
      const currencyIso = this.firstNonBlank(price, 'currency') ?? 'USD';
      const amount = this.asNumber(price.raw, 0);
      return {
        currencyIso,
        value: amount,
        formattedValue: this.firstNonBlank(price, 'formatted') ?? `${currencyIso} ${amount.toFixed(2)}`
      };
    }
    return undefined;
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
