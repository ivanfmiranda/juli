import { Injectable } from '@angular/core';
import { Product } from '@spartacus/core';
import { JuliCategoryPage, UbrisStorefrontList } from '../models/ubris-commerce.models';
import { UbrisProductNormalizer } from './product.normalizer';

@Injectable({ providedIn: 'root' })
export class UbrisCategoryNormalizer {
  constructor(private readonly productNormalizer: UbrisProductNormalizer) {}

  normalize(code: string, response: UbrisStorefrontList<Record<string, unknown>> | undefined): JuliCategoryPage {
    const category = response?.category ?? {};
    const products = (response?.items ?? [])
      .map(item => this.productNormalizer.normalize(item))
      .filter((product): product is Product => !!product);

    return {
      categoryCode: this.asString(category.code) ?? code,
      categoryName: this.asString(category.name) ?? code,
      products,
      total: this.asNumber(response?.total, products.length),
      page: this.asNumber(response?.page, 0),
      pageSize: this.asNumber(response?.size, 12)
    };
  }

  private asString(value: unknown): string | null {
    if (value === null || value === undefined) {
      return null;
    }
    const str = String(value).trim();
    return str.length > 0 ? str : null;
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