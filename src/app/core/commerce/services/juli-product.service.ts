/**
 * Juli Product Service
 * 
 * Serviço de produtos backend-agnostic do JULI.
 * 
 * Responsabilidades:
 * - Abstrair qualquer implementação específica de backend
 * - Trabalhar apenas com modelos canônicos (JuliProduct)
 * - Orquestrar loading states e caching
 * - Gerenciar estado de variações selecionadas
 */

import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { catchError, distinctUntilChanged, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import {
  JuliProductSummary,
  JuliProductDetail,
  JuliProductListing,
  JuliProductLoadingState,
  JuliProductVariantSelection,
  JuliMedia,
} from '../models/juli-product.model';
import { UbrisProductConnector } from '../connectors/product.connector';
import { UbrisCategoryConnector } from '../connectors/category.connector';
import { UbrisProductSearchConnector } from '../connectors/search.connector';
import { JuliI18nService } from '../../i18n/i18n.service';

/**
 * Estado completo do módulo de produtos
 */
interface ProductState {
  listing: JuliProductListing | null;
  detail: JuliProductDetail | null;
  loading: JuliProductLoadingState;
  variantSelection: JuliProductVariantSelection;
}

const initialState: ProductState = {
  listing: null,
  detail: null,
  loading: {
    listingLoading: false,
    detailLoading: false,
  },
  variantSelection: {
    attributes: {},
    valid: false,
  },
};

@Injectable({ providedIn: 'root' })
export class JuliProductService implements OnDestroy {
  private readonly state = new BehaviorSubject<ProductState>(initialState);
  private readonly destroy$ = new Subject<void>();

  // Selectors públicos
  readonly listing$: Observable<JuliProductListing | null> = this.state.pipe(
    map(s => s.listing),
    distinctUntilChanged()
  );

  readonly detail$: Observable<JuliProductDetail | null> = this.state.pipe(
    map(s => s.detail),
    distinctUntilChanged()
  );

  readonly loading$: Observable<JuliProductLoadingState> = this.state.pipe(
    map(s => s.loading),
    distinctUntilChanged()
  );

  readonly variantSelection$: Observable<JuliProductVariantSelection> = this.state.pipe(
    map(s => s.variantSelection),
    distinctUntilChanged()
  );

  readonly listingLoading$ = this.loading$.pipe(map(l => l.listingLoading));
  readonly detailLoading$ = this.loading$.pipe(map(l => l.detailLoading));
  readonly listingError$ = this.loading$.pipe(map(l => l.listingError));
  readonly detailError$ = this.loading$.pipe(map(l => l.detailError));

  constructor(
    private readonly productConnector: UbrisProductConnector,
    private readonly categoryConnector: UbrisCategoryConnector,
    private readonly searchConnector: UbrisProductSearchConnector,
    private readonly i18n: JuliI18nService,
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.state.complete();
  }

  // ==================== LISTING (PLP) ====================

  /**
   * Carrega listagem de produtos por categoria
   */
  loadCategoryListing(
    categoryCode: string,
    page: number = 0,
    pageSize: number = 12,
    sort?: string
  ): void {
    this.setListingLoading(true);

    this.categoryConnector.get(categoryCode, page, pageSize, sort).pipe(
      takeUntil(this.destroy$),
      // Mapeia JuliCategoryPage para JuliProductListing
      map(categoryPage => this.mapCategoryPageToListing(categoryPage, page, pageSize, sort)),
      tap(listing => {
        this.patchState({
          listing,
          loading: { ...this.state.value.loading, listingLoading: false, listingError: undefined }
        });
      }),
      catchError(error => {
        this.patchState({
          loading: {
            ...this.state.value.loading,
            listingLoading: false,
            listingError: this.extractErrorMessage(error)
          }
        });
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Carrega listagem de produtos por query de busca.
   * Mapeia o resultado do search connector para a mesma forma JuliProductListing usada pela PLP,
   * para que o componente da search page reuse o layout da category page.
   */
  loadSearchListing(
    query: string,
    page: number = 0,
    pageSize: number = 12,
    sort?: string
  ): void {
    this.setListingLoading(true);

    this.searchConnector.search(query, { currentPage: page, pageSize, ...(sort ? { sort } : {}) } as any).pipe(
      takeUntil(this.destroy$),
      map(searchPage => this.mapSearchPageToListing(searchPage, query, page, pageSize, sort)),
      tap(listing => {
        this.patchState({
          listing,
          loading: { ...this.state.value.loading, listingLoading: false, listingError: undefined }
        });
      }),
      catchError(error => {
        this.patchState({
          loading: {
            ...this.state.value.loading,
            listingLoading: false,
            listingError: this.extractErrorMessage(error)
          }
        });
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Limpa a listagem
   */
  clearListing(): void {
    this.patchState({ listing: null });
  }

  // ==================== DETAIL (PDP) ====================

  /**
   * Carrega detalhes de um produto
   */
  loadProductDetail(productCode: string): void {
    this.setDetailLoading(true);
    this.resetVariantSelection();

    this.productConnector.get(productCode).pipe(
      takeUntil(this.destroy$),
      // Mapeia Product do Spartacus para JuliProductDetail
      map(product => this.mapSpartacusProductToDetail(product)),
      tap(detail => {
        this.patchState({
          detail,
          loading: { ...this.state.value.loading, detailLoading: false, detailError: undefined }
        });
        // Seleciona variante padrão se existir
        if (detail.variants && detail.variants.length > 0) {
          const defaultVariant = detail.variants.find(v => v.default) ?? detail.variants[0];
          if (defaultVariant) {
            this.selectVariant(defaultVariant.code, defaultVariant.attributes);
          }
        }
      }),
      catchError(error => {
        this.patchState({
          loading: {
            ...this.state.value.loading,
            detailLoading: false,
            detailError: this.extractErrorMessage(error)
          }
        });
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Limpa os detalhes do produto
   */
  clearDetail(): void {
    this.patchState({ detail: null });
    this.resetVariantSelection();
  }

  // ==================== VARIANTS ====================

  /**
   * Seleciona uma variante
   */
  selectVariant(variantCode: string, attributes: Record<string, string>): void {
    const detail = this.state.value.detail;
    if (!detail || !detail.variants) return;

    const variant = detail.variants.find(v => v.code === variantCode);
    if (!variant) return;

    const valid = variant.available;
    const errorMessage = valid ? undefined : this.i18n.translate('productService.variantUnavailable');

    this.patchState({
      variantSelection: {
        variantCode,
        attributes,
        valid,
        errorMessage,
      },
    });
  }

  /**
   * Reseta a seleção de variante
   */
  resetVariantSelection(): void {
    this.patchState({
      variantSelection: {
        attributes: {},
        valid: false,
      },
    });
  }

  /**
   * Atualiza atributo de variante
   */
  updateVariantAttribute(attributeCode: string, value: string): void {
    const currentSelection = this.state.value.variantSelection;
    const newAttributes = { ...currentSelection.attributes, [attributeCode]: value };

    // Tenta encontrar variante que corresponda aos atributos selecionados
    const detail = this.state.value.detail;
    if (detail?.variants) {
      const matchingVariant = detail.variants.find(variant => {
        return Object.entries(newAttributes).every(
          ([key, val]) => variant.attributes?.[key] === val
        );
      });

      if (matchingVariant) {
        this.selectVariant(matchingVariant.code, newAttributes);
      } else {
        // Atualiza atributos sem variante válida
        this.patchState({
          variantSelection: {
            attributes: newAttributes,
            valid: false,
            errorMessage: this.i18n.translate('productService.combinationUnavailable'),
          },
        });
      }
    }
  }

  // ==================== HELPERS PRIVADOS ====================

  private patchState(partial: Partial<ProductState>): void {
    this.state.next({
      ...this.state.value,
      ...partial
    });
  }

  private setListingLoading(loading: boolean): void {
    this.patchState({
      loading: { ...this.state.value.loading, listingLoading: loading }
    });
  }

  private setDetailLoading(loading: boolean): void {
    this.patchState({
      loading: { ...this.state.value.loading, detailLoading: loading }
    });
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as Record<string, unknown>).message);
    }
    return this.i18n.translate('productService.unknownError');
  }

  /**
   * Mapeia JuliCategoryPage para JuliProductListing
   */
  private mapCategoryPageToListing(
    categoryPage: any,
    page: number,
    pageSize: number,
    requestedSort?: string
  ): JuliProductListing {
    const products: JuliProductSummary[] = (categoryPage.products || []).map((p: any) =>
      this.mapSpartacusProductToSummary(p)
    );

    const total = categoryPage.total ?? products.length;
    const resolvedPage = categoryPage.page ?? page;
    const resolvedPageSize = categoryPage.pageSize ?? pageSize;
    const totalPages = Math.max(Math.ceil(total / resolvedPageSize), 1);
    const selectedSort = this.normalizeListingSort(categoryPage.sort || requestedSort);

    return {
      code: categoryPage.categoryCode,
      name: categoryPage.categoryName,
      products,
      pagination: {
        currentPage: resolvedPage,
        pageSize: resolvedPageSize,
        totalResults: total,
        totalPages,
        hasNext: resolvedPage < totalPages - 1,
        hasPrevious: resolvedPage > 0,
      },
      sorts: this.normalizeCategorySorts(categoryPage.sorts, selectedSort),
    };
  }

  /**
   * Mapeia o resultado do UbrisProductSearchConnector para JuliProductListing.
   * Os produtos já vêm como JuliProductSummary (vindo do UbrisProductNormalizer no search.normalizer),
   * então não há necessidade de mapSpartacusProductToSummary.
   */
  private mapSearchPageToListing(
    searchPage: any,
    query: string,
    page: number,
    pageSize: number,
    requestedSort?: string
  ): JuliProductListing {
    const products: JuliProductSummary[] = Array.isArray(searchPage?.products) ? searchPage.products : [];
    const pagination = searchPage?.pagination || {};
    const total = pagination.totalResults ?? products.length;
    const resolvedPage = pagination.currentPage ?? page;
    const resolvedPageSize = pagination.pageSize ?? pageSize;
    const totalPages = Math.max(Math.ceil(total / (resolvedPageSize || 1)), 1);
    const selectedSort = this.normalizeListingSort(searchPage?.sort || requestedSort);

    return {
      code: `search:${query}`,
      name: this.i18n.translate('search.resultsFor', { query }),
      products,
      pagination: {
        currentPage: resolvedPage,
        pageSize: resolvedPageSize,
        totalResults: total,
        totalPages,
        hasNext: resolvedPage < totalPages - 1,
        hasPrevious: resolvedPage > 0,
      },
      sorts: this.normalizeCategorySorts(searchPage?.sorts, selectedSort),
    };
  }

  private normalizeCategorySorts(rawSorts: any[] | undefined, selectedSort: string): JuliProductListing['sorts'] {
    if (Array.isArray(rawSorts) && rawSorts.length > 0) {
      const mapped = rawSorts
        .filter(sort => !!sort && typeof sort === 'object')
        .map((sort: any) => {
          const code = this.normalizeListingSort(sort.code);
          return {
            code,
            name: sort.name || code,
            selected: code === selectedSort
          };
        })
        .filter(sort => !!sort.code);

      if (mapped.length > 0) {
        return mapped;
      }
    }

    return [
      { code: 'relevance', name: this.i18n.translate('normalizer.sortRelevance'), selected: selectedSort === 'relevance' },
      { code: 'name_asc', name: this.i18n.translate('normalizer.sortNameAsc'), selected: selectedSort === 'name_asc' },
      { code: 'name_desc', name: this.i18n.translate('normalizer.sortNameDesc'), selected: selectedSort === 'name_desc' },
      { code: 'price_asc', name: this.i18n.translate('normalizer.sortPriceAsc'), selected: selectedSort === 'price_asc' },
      { code: 'price_desc', name: this.i18n.translate('normalizer.sortPriceDesc'), selected: selectedSort === 'price_desc' },
    ];
  }

  private normalizeListingSort(sort?: string): string {
    switch ((sort || '').trim().toLowerCase()) {
      case 'name-asc':
      case 'name_asc':
      case 'name,asc':
      case 'title-asc':
      case 'title_asc':
      case 'title,asc':
        return 'name_asc';
      case 'name-desc':
      case 'name_desc':
      case 'name,desc':
      case 'title-desc':
      case 'title_desc':
      case 'title,desc':
        return 'name_desc';
      case 'price-asc':
      case 'price_asc':
      case 'price,asc':
        return 'price_asc';
      case 'price-desc':
      case 'price_desc':
      case 'price,desc':
        return 'price_desc';
      default:
        return 'relevance';
    }
  }

  /**
   * Mapeia Product do Spartacus para JuliProductSummary
   */
  private mapSpartacusProductToSummary(product: any): JuliProductSummary {
    const price = product.price || {};
    const stock = product.stock || {};
    const images = this.mapSpartacusImages(product.images);

    return {
      code: product.code || 'unknown',
      name: product.name || 'Produto',
      slug: this.generateSlug(product.name, product.code),
      url: product.url || `/product/${encodeURIComponent(product.code || '')}`,
      price: {
        value: price.value || 0,
        currencyIso: price.currencyIso || 'BRL',
        formattedValue: price.formattedValue || 'R$ 0,00',
      },
      mainImage: images[0],
      additionalImages: images.slice(1),
      stock: {
        status: this.mapStockStatus(stock.stockLevelStatus),
        quantity: stock.stockLevel,
      },
      available: stock.stockLevelStatus !== 'outOfStock',
      metadata: { _source: 'spartacus' },
    };
  }

  /**
   * Mapeia Product do Spartacus para JuliProductDetail
   */
  private mapSpartacusProductToDetail(product: any): JuliProductDetail {
    const summary = this.mapSpartacusProductToSummary(product);
    const images = this.mapSpartacusImages(product.images, product._galleryRaw);

    return {
      ...summary,
      description: product.description,
      gallery: images,
      attributes: (product.classifications || []).flatMap((c: any) =>
        (c.features || []).map((f: any) => ({
          code: f.code,
          name: f.name,
          value: f.featureValues?.[0]?.value || '',
          formattedValue: f.featureValues?.[0]?.value || '',
        }))
      ),
      featuredAttributes: [],
      variants: [], // TODO: Mapear variantes se disponíveis
      relatedProducts: [],
      similarProducts: [],
      brand: product.baseOptions?.[0]?.options?.[0]?.variantOptionQualifiers?.find(
        (q: any) => q.qualifier === 'brand'
      )?.value,
      tags: [],
    };
  }

  /**
   * Mapeia imagens do Spartacus
   */
  private mapSpartacusImages(images: any, rawGallery?: any[]): JuliMedia[] {
    // Prefer raw gallery if available (Ubris format with all images)
    if (Array.isArray(rawGallery) && rawGallery.length > 0) {
      return rawGallery
        .filter((img: any) => img && (img.url || img.id))
        .map((img: any, index: number): JuliMedia => {
          const id = img.id || String(index);
          const hash = img.contentHash;
          const versionQuery = hash ? `?v=${encodeURIComponent(hash)}` : '';
          const url = img.url || `/img/pdp/${encodeURIComponent(id)}${versionQuery}`;
          return {
            id,
            url,
            type: 'IMAGE',
            altText: img.altText || '',
            thumbnailUrl: url,
            zoomUrl: url,
            primary: index === 0,
            order: img.position ?? img.order ?? index,
          };
        });
    }

    if (!images) return [];

    // Handle Spartacus PRIMARY format (fallback, single image)
    const primary = images.PRIMARY;
    if (primary?.product) {
      return [{
        id: 'primary',
        url: primary.product.url,
        type: 'IMAGE',
        altText: primary.product.altText,
        primary: true,
        order: 0,
      }];
    }

    // Handle raw images array (Ubris format)
    if (Array.isArray(images)) {
      return images
        .filter((img: any) => img && (img.url || img.id))
        .map((img: any, index: number): JuliMedia => ({
          id: img.id || String(index),
          url: img.url || `/img/pdp/${encodeURIComponent(img.id)}`,
          type: 'IMAGE',
          altText: img.altText || '',
          primary: index === 0,
          order: img.position ?? index,
        }));
    }

    return [];
  }

  /**
   * Mapeia status de estoque
   */
  private mapStockStatus(status: string): 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN' {
    const mappings: Record<string, any> = {
      'inStock': 'IN_STOCK',
      'lowStock': 'LOW_STOCK',
      'outOfStock': 'OUT_OF_STOCK',
    };
    return mappings[status] || 'UNKNOWN';
  }

  /**
   * Gera slug amigável
   */
  private generateSlug(name: string, code: string): string {
    if (!name) return code;
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return `${slug}-${code.toLowerCase()}`;
  }
}
