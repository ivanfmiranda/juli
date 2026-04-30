/**
 * Product Detail Page Component (PDP)
 * 
 * Product Detail Page com design moderno e funcionalidades completas:
 * - Galeria de imagens
 * - Informações de preço e estoque
 * - Seleção de variações (cor, tamanho)
 * - CTA de add to cart
 * - Descrição e atributos
 * - Produtos relacionados
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import {
  JuliProductService,
  JuliProductDetail,
  JuliProductVariant,
  JuliProductVariantSelection,
} from '../../core/commerce';
import { JuliCartFacade } from '../../core/commerce';
import { TenantHostService } from '../../core/services/tenant-host.service';
import { JuliI18nService } from '../../core/i18n/i18n.service';
import { ReviewService } from '../../core/commerce/services/review.service';
import { WishlistService } from '../../core/commerce/services/wishlist.service';
import { AuthService } from '../../core/auth/auth.service';
import { JuliQuoteService, QuoteItemPayload } from '../../core/commerce/services/juli-quote.service';
import { B2bAssignment, B2bContextService } from '../../core/user/b2b-context.service';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  readonly Math = Math;

  // Observables do serviço
  readonly product$ = this.juliProductService.detail$;
  readonly loading$ = this.juliProductService.detailLoading$;
  readonly error$ = this.juliProductService.detailError$;
  readonly variantSelection$ = this.juliProductService.variantSelection$;

  // Observables de reviews e wishlist
  readonly reviewSummary$ = this.reviewService.summary$;
  readonly myReview$ = this.reviewService.myReview$;
  readonly reviewLoading$ = this.reviewService.loading$;
  readonly reviewSubmitError$ = this.reviewService.submitError$;

  // Estado local
  selectedImageIndex = 0;
  quantity = 1;
  addingToCart = false;
  addToCartError?: string;
  requestingQuote = false;
  quoteError: string | null = null;

  // B2B context — quando o comprador tem assignment ativo, exibimos
  // "Solicitar Cotação" como ação alternativa ao "Adicionar ao carrinho".
  readonly b2bContext$: Observable<B2bAssignment | null>;

  // Estado de wishlist para o produto atual
  isSaved$: Observable<boolean> | null = null;

  // Estado do form de review
  reviewFormVisible = false;
  reviewRating = 5;
  reviewTitle = '';
  reviewBody = '';
  reviewSubmitting = false;
  reviewSuccess = false;

  private siteName: string;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly juliProductService: JuliProductService,
    private readonly cartFacade: JuliCartFacade,
    private readonly titleService: Title,
    private readonly tenantHost: TenantHostService,
    private readonly cdr: ChangeDetectorRef,
    private readonly i18n: JuliI18nService,
    private readonly quoteService: JuliQuoteService,
    private readonly b2bContext: B2bContextService,
    readonly reviewService: ReviewService,
    readonly wishlistService: WishlistService,
    readonly auth: AuthService,
  ) {
    const tenantId = this.tenantHost.currentTenantId();
    this.siteName = tenantId && tenantId !== 'default'
      ? tenantId.charAt(0).toUpperCase() + tenantId.slice(1)
      : 'Juli Store';
    this.b2bContext$ = this.b2bContext.context$;
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(
      takeUntil(this.destroy$),
      map(params => params.get('code') || '')
    ).subscribe(productCode => {
      if (productCode) {
        this.juliProductService.loadProductDetail(productCode);
        this.selectedImageIndex = 0;
        this.quantity = 1;
      }
    });

    this.product$.pipe(takeUntil(this.destroy$)).subscribe(product => {
      if (product?.name) {
        this.titleService.setTitle(`${product.name} — ${this.siteName}`);
      }
      if (product?.code) {
        this.reviewService.loadReviews(product.code);
        this.isSaved$ = this.wishlistService.isSaved$(product.code);
        if (this.auth.isAuthenticated) {
          this.reviewService.loadMyReview(product.code);
          this.wishlistService.checkSku(product.code);
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.juliProductService.clearDetail();
    this.reviewService.clear();
  }

  // ==================== GALERIA ====================

  /**
   * Seleciona imagem da galeria
   */
  selectImage(index: number): void {
    this.selectedImageIndex = index;
  }

  /**
   * Navega para próxima imagem
   */
  nextImage(galleryLength: number): void {
    this.selectedImageIndex = (this.selectedImageIndex + 1) % galleryLength;
  }

  /**
   * Navega para imagem anterior
   */
  previousImage(galleryLength: number): void {
    this.selectedImageIndex = (this.selectedImageIndex - 1 + galleryLength) % galleryLength;
  }

  // ==================== VARIANTES ====================

  /**
   * Seleciona um atributo de variação
   */
  selectVariantAttribute(attributeCode: string, value: string): void {
    this.juliProductService.updateVariantAttribute(attributeCode, value);
  }

  /**
   * Verifica se um valor de atributo está selecionado
   */
  isAttributeSelected(selection: JuliProductVariantSelection, code: string, value: string): boolean {
    return selection.attributes[code] === value;
  }

  /**
   * Obtém valores únicos de um atributo
   */
  getUniqueAttributeValues(variants: JuliProductVariant[], attributeCode: string): string[] {
    const values = new Set<string>();
    variants.forEach(variant => {
      if (variant.attributes?.[attributeCode]) {
        values.add(variant.attributes[attributeCode]);
      }
    });
    return Array.from(values);
  }

  /**
   * Obtém nomes dos atributos de variação
   */
  getVariantAttributeNames(variants: JuliProductVariant[]): string[] {
    if (!variants?.length) return [];
    return Object.keys(variants[0].attributes || {});
  }

  // ==================== QUANTIDADE ====================

  /**
   * Incrementa quantidade
   */
  increaseQuantity(max?: number): void {
    if (max === undefined || this.quantity < max) {
      this.quantity++;
    }
  }

  /**
   * Decrementa quantidade
   */
  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  // ==================== CART ====================

  /**
   * Adiciona ao carrinho
   */
  addToCart(product: JuliProductDetail, selection: JuliProductVariantSelection): void {
    if (this.addingToCart) return;

    const productCode = selection.variantCode || product.code;
    this.addingToCart = true;
    this.addToCartError = undefined;

    this.cartFacade.addEntry(productCode, this.quantity).subscribe({
      next: () => {
        this.addingToCart = false;
        this.cdr.markForCheck();
        this.router.navigate(['/cart']);
      },
      error: (err) => {
        this.addingToCart = false;
        this.addToCartError = err?.error?.message || err?.message || this.i18n.translate('pdp.addToCartError');
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Solicita cotação corporativa para o produto que está sendo visualizado.
   * Manda apenas a linha atual (SKU + qty + preço da vitrine) para
   * {@code POST /b2b/quotes}; o comprador completa o pedido na tela de
   * detalhe da cotação. {@code priceSource: STOREFRONT} sinaliza ao
   * b2b-platform que o preço veio do catálogo público (não negociado).
   */
  requestQuote(product: JuliProductDetail, selection: JuliProductVariantSelection): void {
    if (this.requestingQuote) return;
    const assignment = this.b2bContext.current();
    if (!assignment || !assignment.companyId) {
      this.quoteError = 'Conta sem vínculo com empresa B2B.';
      this.cdr.markForCheck();
      return;
    }
    const sku = selection.variantCode || product.code;
    if (!sku) {
      this.quoteError = 'Produto sem SKU disponível para cotação.';
      this.cdr.markForCheck();
      return;
    }
    const productAny = product as unknown as Record<string, any>;
    const priceValue = productAny?.price?.value;
    const unitPrice = typeof priceValue === 'number' ? priceValue : 0;
    const currency = productAny?.price?.currencyIso || 'BRL';
    const items: QuoteItemPayload[] = [
      { sku, quantity: this.quantity, unitPrice, priceSource: 'STOREFRONT' }
    ];
    this.requestingQuote = true;
    this.quoteError = null;
    this.cdr.markForCheck();
    this.quoteService.create({
      companyId: assignment.companyId,
      unitId: assignment.unitId ?? null,
      currency,
      items
    }).subscribe({
      next: created => {
        this.requestingQuote = false;
        this.router.navigate(['/account/quotes', created.id]);
      },
      error: err => {
        this.requestingQuote = false;
        this.quoteError = (err?.error?.message || err?.message) ?? 'Falha ao solicitar cotação.';
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Verifica se pode adicionar ao carrinho
   */
  canAddToCart(product: JuliProductDetail, selection: JuliProductVariantSelection): boolean {
    if (!product.available) return false;
    if (product.variants && product.variants.length > 0) {
      return selection.valid;
    }
    return product.stock.status !== 'OUT_OF_STOCK';
  }

  // ==================== HELPERS ====================

  /**
   * Retorna mensagem de estoque
   */
  getStockMessage(product: JuliProductDetail): string {
    switch (product.stock.status) {
      case 'IN_STOCK':
        return this.i18n.translate('pdp.stockInStock');
      case 'LOW_STOCK':
        return this.i18n.translate('pdp.stockLow', { quantity: product.stock.quantity });
      case 'OUT_OF_STOCK':
        return this.i18n.translate('pdp.stockOut');
      default:
        return this.i18n.translate('pdp.stockUnknown');
    }
  }

  /**
   * Retorna classe CSS do estoque
   */
  getStockClass(status: string): string {
    return `stock-${status.toLowerCase()}`;
  }

  /**
   * Tenta recarregar o produto
   */
  retryLoad(): void {
    const productCode = this.route.snapshot.paramMap.get('code') || '';
    if (productCode) {
      this.juliProductService.loadProductDetail(productCode);
    }
  }

  /**
   * Volta para a listagem
   */
  goBack(): void {
    this.router.navigate(['/']);
  }

  // ==================== WISHLIST ====================

  toggleWishlist(product: JuliProductDetail): void {
    if (!this.auth.isAuthenticated) {
      this.router.navigate(['/login']);
      return;
    }
    this.wishlistService.toggle(product.code, product.code).subscribe({
      error: () => {}
    });
  }

  // ==================== REVIEWS ====================

  openReviewForm(): void {
    if (!this.auth.isAuthenticated) {
      this.router.navigate(['/login']);
      return;
    }
    this.reviewFormVisible = true;
    this.reviewSuccess = false;
    this.cdr.markForCheck();
  }

  setReviewRating(rating: number): void {
    this.reviewRating = rating;
    this.cdr.markForCheck();
  }

  submitReview(sku: string): void {
    if (this.reviewSubmitting) return;
    this.reviewSubmitting = true;
    this.reviewSuccess = false;
    this.cdr.markForCheck();

    this.reviewService.submitReview({
      sku,
      rating: this.reviewRating,
      title: this.reviewTitle,
      body: this.reviewBody,
    }).subscribe({
      next: () => {
        this.reviewSubmitting = false;
        this.reviewSuccess = true;
        this.reviewFormVisible = false;
        this.reviewTitle = '';
        this.reviewBody = '';
        this.cdr.markForCheck();
      },
      error: () => {
        this.reviewSubmitting = false;
        this.cdr.markForCheck();
      }
    });
  }

  getStars(rating: number): boolean[] {
    return [1, 2, 3, 4, 5].map(i => i <= Math.floor(rating));
  }
}
