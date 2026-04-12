import { Injectable } from '@angular/core';
import { UbrisStorefrontList, SearchConfig } from '../models/ubris-commerce.models';
import { UbrisProductNormalizer } from './product.normalizer';

interface ProductSearchPage {
  freeTextSearch?: string;
  products?: Array<{ name?: string; code?: string; [key: string]: unknown }>;
  pagination?: { currentPage?: number; pageSize?: number; totalResults?: number; totalPages?: number };
  [key: string]: unknown;
}

interface Suggestion {
  value?: string;
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class UbrisSearchNormalizer {
  constructor(private readonly productNormalizer: UbrisProductNormalizer) {}

  normalize(response: UbrisStorefrontList<Record<string, unknown>> | undefined, query: string, config?: SearchConfig): ProductSearchPage {
    const products = (response?.items ?? [])
      .map(item => this.productNormalizer.normalize(item))
      .filter((product): product is NonNullable<ReturnType<UbrisProductNormalizer['normalize']>> => !!product);
    const pageSize = response?.size ?? config?.pageSize ?? 12;
    const totalResults = response?.total ?? products.length;

    return {
      freeTextSearch: query,
      products,
      pagination: {
        currentPage: response?.page ?? config?.currentPage ?? 0,
        pageSize,
        totalResults,
        totalPages: Math.ceil(totalResults / (pageSize || 1))
      }
    };
  }

  suggestions(page: ProductSearchPage): Suggestion[] {
    return (page.products ?? []).slice(0, 5).map(product => ({ value: product.name ?? product.code }));
  }
}
