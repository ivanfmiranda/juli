import { Injectable } from '@angular/core';
import { JuliCart, JuliCartEntry } from '../facades/cart.facade';

type Cart = JuliCart;
interface CartModification {
  statusCode: string;
  quantity?: number;
  quantityAdded?: number;
  entry?: JuliCartEntry;
}

@Injectable({ providedIn: 'root' })
export class UbrisCartNormalizer {
  normalize(raw: Record<string, unknown> | null | undefined): Cart {
    const entries = Array.isArray(raw?.entries)
      ? raw!.entries.map((entry, index) => this.normalizeEntry(entry as Record<string, unknown>, index))
      : [];
    const currencyIso = this.firstNonBlank(raw ?? {}, 'currency') ?? 'BRL';

    return {
      code: this.firstNonBlank(raw ?? {}, 'id') ?? undefined,
      entries,
      subTotal: this.money(raw?.subtotal, currencyIso),
      totalTax: this.money(raw?.tax, currencyIso),
      totalPrice: this.money(raw?.total, currencyIso),
      totalItems: entries.length,
      totalUnitCount: entries.reduce((sum, entry) => sum + (entry.quantity ?? 0), 0)
    };
  }

  normalizeModification(raw: Record<string, unknown> | null | undefined, productCode: string, quantity: number): CartModification {
    return {
      statusCode: 'success',
      quantity,
      quantityAdded: quantity,
      entry: {
        product: {
          code: productCode
        },
        quantity
      }
    };
  }

  private normalizeEntry(raw: Record<string, unknown>, index: number) {
    const currencyIso = this.firstNonBlank(raw, 'currency') ?? 'BRL';
    const productCode = this.firstNonBlank(raw, 'productCode', 'sku', 'code') ?? `entry-${index}`;
    return {
      entryNumber: this.asNumber(raw.entryNumber, index),
      quantity: this.asNumber(raw.quantity, 0),
      product: {
        code: productCode,
        name: this.firstNonBlank(raw, 'name', 'productName') ?? productCode
      },
      basePrice: this.money(raw.unitPrice, currencyIso),
      totalPrice: this.money(raw.lineTotal, currencyIso),
      customizations: raw.customizations ?? null,
      updateable: true // Agora suportamos atualização
    };
  }

  private money(value: unknown, currencyIso: string) {
    const amount = this.asNumber(value, 0);
    return {
      currencyIso,
      value: amount,
      formattedValue: this.formatCurrency(amount, currencyIso)
    };
  }

  private formatCurrency(value: number, currency: string): string {
    const locale = currency === 'BRL' ? 'pt-BR' : currency === 'USD' ? 'en-US' : 'pt-BR';
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
    } catch {
      return `${currency} ${value.toFixed(2)}`;
    }
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
}