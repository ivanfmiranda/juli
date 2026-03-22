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
    private readonly categoryConnector: UbrisCategoryConnector
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

    this.categoryConnector.get(categoryCode, page, pageSize).pipe(
      takeUntil(this.destroy$),
      // Mapeia JuliCategoryPage para JuliProductListing
      map(categoryPage => this.mapCategoryPageToListing(categoryPage, page, pageSize)),
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
    const errorMessage = valid ? undefined : 'Variante indisponível';

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
            errorMessage: 'Combinação não disponível',
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
    return 'Erro desconhecido';
  }

  /**
   * Mapeia JuliCategoryPage para JuliProductListing
   */
  private mapCategoryPageToListing(
    categoryPage: any,
    page: number,
    pageSize: number
  ): JuliProductListing {
    const products: JuliProductSummary[] = (categoryPage.products || []).map((p: any) =>
      this.mapSpartacusProductToSummary(p)
    );

    const total = categoryPage.total ?? products.length;
    const totalPages = Math.max(Math.ceil(total / pageSize), 1);

    return {
      code: categoryPage.categoryCode,
      name: categoryPage.categoryName,
      products,
      pagination: {
        currentPage: page,
        pageSize,
        totalResults: total,
        totalPages,
        hasNext: page < totalPages - 1,
        hasPrevious: page > 0,
      },
      sorts: [
        { code: 'relevance', name: 'Relevância', selected: true },
        { code: 'name-asc', name: 'Nome (A-Z)', selected: false },
        { code: 'price-asc', name: 'Menor Preço', selected: false },
        { code: 'price-desc', name: 'Maior Preço', selected: false },
      ],
    };
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
    const images = this.mapSpartacusImages(product.images);

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
  private mapSpartacusImages(images: any): JuliMedia[] {
    if (!images) return [];

    const primary = images.PRIMARY;
    if (!primary) return [];

    const imageList: JuliMedia[] = [];

    if (primary.product) {
      imageList.push({
        id: 'primary',
        url: primary.product.url,
        type: 'IMAGE',
        altText: primary.product.altText,
        primary: true,
        order: 0,
      });
    }

    return imageList;
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
