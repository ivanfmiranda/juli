/**
 * Ubris Product Normalizer
 * 
 * Implementação do ProductNormalizer para o backend Ubris.
 * Converte respostas do Gateway Ubris para o modelo canônico JuliProduct.
 * 
 * Endpoints Ubris suportados:
 * - GET /api/storefront/product/{code} - Detalhes do produto
 * - GET /api/bff/storefront/category/{code} - Listagem de categoria
 */

import { Injectable } from '@angular/core';
import {
  JuliProductSummary,
  JuliProductDetail,
  JuliProductListing,
  JuliMedia,
  JuliMediaType,
  JuliPrice,
  JuliStock,
  JuliStockStatus,
  JuliProductAttribute,
  JuliCategorySummary,
  JuliProductVariant,
} from '../models/juli-product.model';
import {
  ProductNormalizer,
  ProductNormalizerUtils,
  COMMON_STOCK_MAPPINGS,
} from './product-normalizer.interface';
import { JuliI18nService } from '../../i18n/i18n.service';

/**
 * Estrutura esperada de produto Ubris
 */
interface UbrisProductRaw {
  code?: string;
  sku?: string;
  productCode?: string;
  name?: string;
  productName?: string;
  description?: string;
  summary?: string;
  price?: number | { raw?: number; value?: number; amount?: number };
  originalPrice?: number;
  currency?: string;
  images?: UbrisImageRaw[];
  stock?: {
    status?: string;
    level?: number;
    availability?: string;
  };
  categories?: UbrisCategoryRaw[];
  attributes?: UbrisAttributeRaw[];
  variants?: UbrisVariantRaw[];
  brand?: { code?: string; name?: string; logoUrl?: string };
  manufacturerSku?: string;
  ean?: string;
  weight?: number;
  dimensions?: { width?: number; height?: number; depth?: number; unit?: string };
  rating?: number;
  reviewCount?: number;
  tags?: string[];
  classification?: string;
}

interface UbrisImageRaw {
  id?: string;
  url?: string;
  altText?: string;
  title?: string;
  contentHash?: string;
  type?: string;
  order?: number;
  width?: number;
  height?: number;
}

interface UbrisCategoryRaw {
  code?: string;
  name?: string;
  description?: string;
  imageUrl?: string;
  url?: string;
  level?: number;
  parentCode?: string;
}

interface UbrisAttributeRaw {
  code?: string;
  name?: string;
  value?: string | number | boolean;
  formattedValue?: string;
  unit?: string;
  featured?: boolean;
}

interface UbrisVariantRaw {
  code?: string;
  name?: string;
  attributes?: Record<string, string>;
  price?: number;
  stock?: { status?: string; level?: number };
  imageUrl?: string;
  available?: boolean;
  default?: boolean;
}

@Injectable({ providedIn: 'root' })
export class UbrisProductNormalizer implements ProductNormalizer {

  constructor(private readonly i18n: JuliI18nService) {}

  /**
   * Normaliza um produto para resumo (PLP)
   */
  normalizeSummary(rawData: unknown): JuliProductSummary | null {
    const source = ProductNormalizerUtils.asRecord(rawData);
    const raw = source as UbrisProductRaw;
    
    const code = ProductNormalizerUtils.firstNonBlank(source, 'code', 'sku', 'productCode');
    if (!code) return null;

    const name = ProductNormalizerUtils.firstNonBlank(source, 'name', 'productName') ?? code;
    const currency = ProductNormalizerUtils.firstNonBlank(source, 'currency') ?? 'BRL';
    const price = this.normalizePrice(source, currency);
    const stock = this.normalizeStock(source);
    const images = this.normalizeImages(raw.images, name);
    const mainImage = images.find(img => img.primary) ?? images[0];
    
    return {
      code,
      name,
      slug: this.generateSlug(name, code),
      url: `/product/${encodeURIComponent(code)}`,
      price,
      mainImage,
      additionalImages: images.slice(1),
      stock,
      categories: this.normalizeCategories(raw.categories),
      classification: this.normalizeClassification(raw.classification),
      rating: raw.rating,
      reviewCount: raw.reviewCount,
      available: stock.status !== 'OUT_OF_STOCK',
      metadata: {
        _source: 'ubris',
        _raw: source,
      },
    };
  }

  /**
   * Normaliza um produto completo (PDP)
   */
  normalizeDetail(rawData: unknown): JuliProductDetail | null {
    const summary = this.normalizeSummary(rawData);
    if (!summary) return null;

    const source = ProductNormalizerUtils.asRecord(rawData);
    const raw = source as UbrisProductRaw;
    const currency = ProductNormalizerUtils.firstNonBlank(source, 'currency') ?? 'BRL';

    const gallery = this.normalizeImages(raw.images, summary.name);
    const attributes = this.normalizeAttributes(raw.attributes);
    const featuredAttributes = attributes.filter(attr => attr.featured);
    const variants = this.normalizeVariants(raw.variants, currency);

    return {
      ...summary,
      summary: raw.summary,
      description: raw.description,
      gallery,
      attributes,
      featuredAttributes,
      variants,
      relatedProducts: [], // Preencher se o Ubris retornar
      similarProducts: [], // Preencher se o Ubris retornar
      brand: raw.brand ? {
        code: raw.brand.code ?? 'unknown',
        name: raw.brand.name ?? 'Unknown',
        logoUrl: raw.brand.logoUrl,
      } : undefined,
      manufacturerSku: raw.manufacturerSku,
      ean: raw.ean,
      weight: raw.weight,
      dimensions: raw.dimensions ? {
        width: raw.dimensions.width ?? 0,
        height: raw.dimensions.height ?? 0,
        depth: raw.dimensions.depth ?? 0,
        unit: raw.dimensions.unit ?? 'cm',
      } : undefined,
      tags: raw.tags,
      deliveryInfo: {
        message: this.getDeliveryMessage(summary.stock.status),
      },
    };
  }

  /**
   * Normaliza uma listagem de produtos
   */
  normalizeListing(
    categoryCode: string,
    rawData: unknown,
    page: number,
    pageSize: number
  ): JuliProductListing {
    const source = ProductNormalizerUtils.asRecord(
      ProductNormalizerUtils.extractData(rawData) ?? rawData
    );
    
    // Extrair produtos
    const rawProducts = ProductNormalizerUtils.asArray<Record<string, unknown>>(
      source.items ?? source.products ?? source.results ?? []
    );
    
    const products = rawProducts
      .map(p => this.normalizeSummary(p))
      .filter((p): p is JuliProductSummary => p !== null);

    // Extrair informações de paginação
    const totalResults = ProductNormalizerUtils.asNumber(
      source.total ?? source.totalResults ?? products.length,
      products.length
    );
    const totalPages = Math.max(Math.ceil(totalResults / pageSize), 1);
    const currentPage = Math.max(page, 0);

    // Extrair nome da categoria
    const categoryName = ProductNormalizerUtils.firstNonBlank(
      source,
      'categoryName',
      'name',
      'category'
    ) ?? categoryCode;

    return {
      code: categoryCode,
      name: categoryName,
      description: ProductNormalizerUtils.firstNonBlank(source, 'description'),
      products,
      pagination: {
        currentPage,
        pageSize,
        totalResults,
        totalPages,
        hasNext: currentPage < totalPages - 1,
        hasPrevious: currentPage > 0,
      },
      sorts: this.getDefaultSorts(),
      facets: this.normalizeFacets(source.facets),
      breadcrumbs: this.normalizeBreadcrumbs(source.breadcrumbs),
    };
  }

  /**
   * Mapeia status de estoque do Ubris para JuliStockStatus
   */
  mapStockStatus(backendStatus: string | undefined): JuliStockStatus {
    if (!backendStatus) return 'UNKNOWN';
    
    const normalized = COMMON_STOCK_MAPPINGS[backendStatus] ??
                      COMMON_STOCK_MAPPINGS[backendStatus.toUpperCase()] ??
                      COMMON_STOCK_MAPPINGS[backendStatus.toLowerCase()];
    
    return normalized ?? 'UNKNOWN';
  }

  // ==================== Métodos Privados ====================

  private normalizePrice(source: Record<string, unknown>, currency: string): JuliPrice {
    const rawPrice = source.price;
    let value = 0;
    let originalValue: number | undefined;

    if (typeof rawPrice === 'number') {
      value = rawPrice;
    } else if (typeof rawPrice === 'object' && rawPrice !== null) {
      const priceObj = rawPrice as Record<string, unknown>;
      value = ProductNormalizerUtils.asNumber(
        priceObj.raw ?? priceObj.value ?? priceObj.amount,
        0
      );
    }

    // Verificar preço original (para promoções)
    const rawOriginal = source.originalPrice;
    if (typeof rawOriginal === 'number') {
      originalValue = rawOriginal;
    }

    const discounted = originalValue !== undefined && originalValue > value;
    const discountPercentage = discounted && originalValue
      ? ProductNormalizerUtils.calculateDiscountPercentage(originalValue, value)
      : undefined;

    return {
      value,
      currencyIso: currency,
      formattedValue: ProductNormalizerUtils.formatPrice(value, currency),
      originalValue: discounted ? originalValue : undefined,
      originalFormattedValue: discounted
        ? ProductNormalizerUtils.formatPrice(originalValue!, currency)
        : undefined,
      discounted,
      discountPercentage,
    };
  }

  private normalizeStock(source: Record<string, unknown>): JuliStock {
    const rawStock = ProductNormalizerUtils.asRecord(source.stock);
    const status = this.mapStockStatus(
      ProductNormalizerUtils.firstNonBlank(
        rawStock ?? {},
        'status',
        'availability'
      ) ?? ProductNormalizerUtils.firstNonBlank(source, 'stockStatus', 'availability')
    );

    const quantity = rawStock?.level !== undefined
      ? ProductNormalizerUtils.asNumber(rawStock.level, undefined)
      : undefined;

    return {
      status,
      quantity,
      availabilityMessage: this.getAvailabilityMessage(status, quantity),
    };
  }

  private normalizeImages(rawImages: unknown, fallbackAlt: string): JuliMedia[] {
    const images = ProductNormalizerUtils.asArray<UbrisImageRaw>(rawImages);

    return images.map((img, index): JuliMedia => {
      const id = img.id ?? String(index);
      const hash = img.contentHash;
      const versionQuery = hash ? `?v=${encodeURIComponent(hash)}` : '';

      const rawUrl = img.url ?? `/img/pdp/${encodeURIComponent(id)}${versionQuery}`;
      // Route catalog media through thumbor so the PDP gallery serves right-sized
      // thumbnails/zooms instead of the original blob. See product.normalizer.ts
      // for the matching card variant.
      const isCatalogOrigin = typeof img.url === 'string' && img.url.startsWith('/api/catalog/img/');
      const cardUrl = isCatalogOrigin
        ? `/thumbor/unsafe/800x800/smart/ubris-commerce-core:8082${img.url}`
        : rawUrl;
      const thumbUrl = isCatalogOrigin
        ? `/thumbor/unsafe/300x300/smart/ubris-commerce-core:8082${img.url}`
        : `${rawUrl}?w=300`;
      const zoomUrl = isCatalogOrigin
        ? `/thumbor/unsafe/1200x1200/smart/ubris-commerce-core:8082${img.url}`
        : `${rawUrl}?w=1200`;

      return {
        id,
        url: cardUrl,
        type: (img.type?.toUpperCase() as JuliMediaType) ?? 'IMAGE',
        altText: img.altText ?? fallbackAlt,
        title: img.title,
        thumbnailUrl: thumbUrl,
        zoomUrl,
        width: img.width,
        height: img.height,
        primary: index === 0,
        order: img.order ?? index,
      };
    });
  }

  private normalizeCategories(rawCategories: unknown): JuliCategorySummary[] {
    const categories = ProductNormalizerUtils.asArray<UbrisCategoryRaw>(rawCategories);
    
    return categories.map(cat => ({
      code: cat.code ?? 'unknown',
      name: cat.name ?? cat.code ?? 'Unknown',
      description: cat.description,
      imageUrl: cat.imageUrl,
      url: cat.url ?? `/c/${encodeURIComponent(cat.code ?? '')}`,
      level: cat.level,
      parentCode: cat.parentCode,
    }));
  }

  private normalizeAttributes(rawAttributes: unknown): JuliProductAttribute[] {
    const attributes = ProductNormalizerUtils.asArray<UbrisAttributeRaw>(rawAttributes);
    
    return attributes.map(attr => ({
      code: attr.code ?? 'unknown',
      name: attr.name ?? attr.code ?? 'Unknown',
      value: attr.value ?? '',
      formattedValue: attr.formattedValue ?? String(attr.value ?? ''),
      unit: attr.unit,
      featured: attr.featured ?? false,
    }));
  }

  private normalizeVariants(rawVariants: unknown, currency: string): JuliProductVariant[] {
    const variants = ProductNormalizerUtils.asArray<UbrisVariantRaw>(rawVariants);
    
    return variants.map(variant => {
      const variantStock = variant.stock?.status
        ? this.mapStockStatus(variant.stock.status)
        : 'UNKNOWN';
      
      return {
        code: variant.code ?? 'unknown',
        name: variant.name ?? 'Variant',
        attributes: variant.attributes ?? {},
        price: variant.price !== undefined
          ? {
              value: variant.price,
              currencyIso: currency,
              formattedValue: ProductNormalizerUtils.formatPrice(variant.price, currency),
            }
          : undefined,
        stock: {
          status: variantStock,
          quantity: variant.stock?.level,
        },
        imageUrl: variant.imageUrl,
        available: variant.available ?? variantStock !== 'OUT_OF_STOCK',
        default: variant.default ?? false,
      };
    });
  }

  private normalizeClassification(rawClassification: string | undefined): 'NEW' | 'BESTSELLER' | 'SALE' | 'LIMITED' | 'NONE' {
    if (!rawClassification) return 'NONE';
    
    const upper = rawClassification.toUpperCase();
    if (upper.includes('NEW')) return 'NEW';
    if (upper.includes('BEST') || upper.includes('TOP')) return 'BESTSELLER';
    if (upper.includes('SALE') || upper.includes('PROMO')) return 'SALE';
    if (upper.includes('LIMITED')) return 'LIMITED';
    return 'NONE';
  }

  private normalizeFacets(rawFacets: unknown): JuliProductListing['facets'] {
    // Implementar se o Ubris retornar facets
    return undefined;
  }

  private normalizeBreadcrumbs(rawBreadcrumbs: unknown): JuliProductListing['breadcrumbs'] {
    const breadcrumbs = ProductNormalizerUtils.asArray<{ name?: string; url?: string }>(rawBreadcrumbs);
    
    return breadcrumbs.map((crumb, index, arr) => ({
      name: crumb.name ?? 'Unknown',
      url: crumb.url ?? '#',
      current: index === arr.length - 1,
    }));
  }

  private getDefaultSorts(): JuliProductListing['sorts'] {
    return [
      { code: 'relevance', name: this.i18n.translate('normalizer.sortRelevance'), selected: true },
      { code: 'name-asc', name: this.i18n.translate('normalizer.sortNameAsc'), selected: false },
      { code: 'name-desc', name: this.i18n.translate('normalizer.sortNameDesc'), selected: false },
      { code: 'price-asc', name: this.i18n.translate('normalizer.sortPriceAsc'), selected: false },
      { code: 'price-desc', name: this.i18n.translate('normalizer.sortPriceDesc'), selected: false },
      { code: 'newest', name: this.i18n.translate('normalizer.sortNewest'), selected: false },
    ];
  }

  private getAvailabilityMessage(status: JuliStockStatus, quantity?: number): string {
    switch (status) {
      case 'IN_STOCK':
        return quantity !== undefined && quantity > 0
          ? this.i18n.translate('normalizer.availInStock', { quantity })
          : this.i18n.translate('normalizer.availInStockSimple');
      case 'LOW_STOCK':
        return quantity !== undefined && quantity > 0
          ? this.i18n.translate('normalizer.availLowStock', { quantity })
          : this.i18n.translate('normalizer.availLowStockSimple');
      case 'OUT_OF_STOCK':
        return this.i18n.translate('normalizer.availOutOfStock');
      default:
        return this.i18n.translate('normalizer.availUnknown');
    }
  }

  private getDeliveryMessage(status: JuliStockStatus): string {
    switch (status) {
      case 'IN_STOCK':
        return this.i18n.translate('normalizer.deliveryInStock');
      case 'LOW_STOCK':
        return this.i18n.translate('normalizer.deliveryLowStock');
      case 'OUT_OF_STOCK':
        return this.i18n.translate('normalizer.deliveryOutOfStock');
      default:
        return this.i18n.translate('normalizer.deliveryUnknown');
    }
  }

  private generateSlug(name: string, code: string): string {
    const slugFromName = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return `${slugFromName}-${code.toLowerCase()}`;
  }
}
