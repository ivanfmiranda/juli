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
      categoryName: this.asString(category.name) || this.formatSlug(code),
      products,
      total: this.asNumber(response?.total, products.length),
      page: this.asNumber(response?.page, 0),
      pageSize: this.asNumber(response?.size, 12),
      sort: this.asString(response?.sort) ?? undefined,
      sorts: this.normalizeSorts(response?.sorts)
    };
  }

  private static readonly SORT_LABELS: Record<string, string> = {
    relevance: 'Relevância',
    price_asc: 'Preço: Menor para maior',
    price_desc: 'Preço: Maior para menor',
    name_asc: 'Nome A-Z',
    name_desc: 'Nome Z-A'
  };

  private normalizeSorts(value: unknown): Array<{ code: string; name: string; selected: boolean }> | undefined {
    if (!Array.isArray(value)) {
      return undefined;
    }

    const sorts = value
      .filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === 'object')
      .map(entry => {
        const code = this.asString(entry.code) ?? '';
        return {
          code,
          name: UbrisCategoryNormalizer.SORT_LABELS[code] ?? this.asString(entry.name) ?? code,
          selected: this.asBoolean(entry.selected)
        };
      })
      .filter(entry => entry.code.length > 0);

    return sorts.length > 0 ? sorts : undefined;
  }

  private static readonly SLUG_MAP: Record<string, string> = {
    promocoes: 'Promoções',
    eletronicos: 'Eletrônicos',
    smartphones: 'Smartphones',
    moda: 'Moda',
    casa: 'Casa',
    beleza: 'Beleza',
    motor: 'Motor e Componentes',
    transmissao: 'Transmissão e Câmbio',
    suspensao: 'Suspensão e Direção',
    freios: 'Freios',
    eletrica: 'Elétrica e Eletrônica',
    carroceria: 'Carroceria e Lataria',
    interior: 'Interior e Acabamento',
    arrefecimento: 'Arrefecimento',
    escapamento: 'Escapamento',
    rodas: 'Rodas e Pneus',
    pecas: 'Todas as Peças',
  };

  private formatSlug(slug: string): string {
    const lower = slug.toLowerCase();
    if (UbrisCategoryNormalizer.SLUG_MAP[lower]) {
      return UbrisCategoryNormalizer.SLUG_MAP[lower];
    }
    return slug.charAt(0).toUpperCase() + slug.slice(1).toLowerCase();
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

  private asBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      return value.trim().toLowerCase() === 'true';
    }
    return false;
  }
}
