import { Injectable } from '@angular/core';
import { ImageType, Product } from '@spartacus/core';

@Injectable({ providedIn: 'root' })
export class UbrisProductNormalizer {
  normalize(raw: Record<string, unknown> | null | undefined): Product | null {
    if (!raw) {
      return null;
    }

    const code = this.firstNonBlank(raw, 'code', 'sku', 'productCode');
    if (!code) {
      return null;
    }

    const name = this.firstNonBlank(raw, 'name', 'productName') ?? code;
    const currencyIso = this.firstNonBlank(raw, 'currency') ?? 'USD';
    const priceValue = this.asNumber(raw.price, 0) ?? 0;
    const primary = this.mapPrimaryImage(raw.images, name);
    const stock = this.asRecord(raw.stock);
    const stockStatus = this.firstNonBlank(stock ?? {}, 'status')
      ?? this.firstNonBlank(raw, 'stockStatus', 'availability')
      ?? this.asString(raw.stock);

    return {
      code,
      name,
      summary: this.firstNonBlank(raw, 'description') ?? undefined,
      description: this.firstNonBlank(raw, 'description') ?? undefined,
      url: `/product/${encodeURIComponent(code)}`,
      price: {
        currencyIso,
        value: priceValue,
        formattedValue: `${currencyIso} ${priceValue.toFixed(2)}`
      },
      stock: {
        stockLevelStatus: this.normalizeStock(stockStatus),
        stockLevel: this.asNumber(stock?.level, undefined)
      },
      images: primary ? {
        PRIMARY: {
          thumbnail: primary,
          product: primary,
          zoom: primary
        }
      } : undefined
    };
  }

  private mapPrimaryImage(rawImages: unknown, fallbackAlt: string) {
    if (!Array.isArray(rawImages) || rawImages.length === 0) {
      return undefined;
    }

    const first = rawImages[0];
    if (!first || typeof first !== 'object') {
      return undefined;
    }

    const image = first as Record<string, unknown>;
    const id = this.asString(image.id);
    if (!id) {
      return undefined;
    }

    const hash = this.firstNonBlank(image, 'contentHash');
    const versionQuery = hash ? `?v=${encodeURIComponent(hash)}` : '';
    const url = `/img/pdp/${encodeURIComponent(id)}${versionQuery}`;

    return {
      altText: this.firstNonBlank(image, 'altText') ?? fallbackAlt,
      url,
      imageType: ImageType.PRIMARY
    };
  }

  private normalizeStock(value: string | null): string {
    if (!value) {
      return 'unknown';
    }
    const upper = value.toUpperCase();
    if (upper === 'IN_STOCK' || upper === 'LOW_STOCK') {
      return upper;
    }
    return 'outOfStock';
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }
    return value as Record<string, unknown>;
  }

  private firstNonBlank(source: Record<string, unknown>, ...keys: string[]): string | null {
    for (const key of keys) {
      const value = this.asString(source[key]);
      if (value) {
        return value;
      }
    }
    return null;
  }

  private asString(value: unknown): string | null {
    if (value === null || value === undefined) {
      return null;
    }
    const str = String(value).trim();
    return str.length > 0 ? str : null;
  }

  private asNumber(value: unknown, fallback: number | undefined): number | undefined {
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
