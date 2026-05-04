import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, Input, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { JuliCartFacade, JuliProductDetail, JuliProductService, JuliProductVariant, JuliProductVariantSelection } from '../../../core/commerce';
import { AuthService } from '../../../core/auth/auth.service';
import { JuliI18nService } from '../../../core/i18n/i18n.service';
import { JuliQuoteService, QuoteItemPayload } from '../../../core/commerce/services/juli-quote.service';
import { B2bAssignment, B2bContextService } from '../../../core/user/b2b-context.service';
import { WishlistService } from '../../../core/commerce/services/wishlist.service';

@Component({
  selector: 'app-product-detail-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="loading-state" *ngIf="loading$ | async" role="status" aria-live="polite">
      <div class="spinner" aria-hidden="true"></div>
      <p>{{ 'pdp.loading' | juliTranslate }}</p>
    </div>

    <div class="error-state" *ngIf="error$ | async as error" role="alert">
      <div class="error-icon" aria-hidden="true">⚠️</div>
      <h3>{{ 'pdp.errorTitle' | juliTranslate }}</h3>
      <p>{{ error }}</p>
      <div class="error-actions">
        <button class="btn-secondary" (click)="goBack()">{{ 'pdp.goBack' | juliTranslate }}</button>
        <button class="btn-primary" (click)="retryLoad()">{{ 'pdp.retry' | juliTranslate }}</button>
      </div>
    </div>

    <ng-container *ngIf="(product$ | async) as product">
      <ng-container *ngIf="(variantSelection$ | async) as selection">
        <nav class="breadcrumbs" role="navigation" aria-label="Breadcrumb">
          <a routerLink="/">{{ 'pdp.home' | juliTranslate }}</a>
          <span class="separator">/</span>
          <ng-container *ngIf="product.categories?.length; else productOnly">
            <ng-container *ngFor="let category of product.categories">
              <a [routerLink]="category.url">{{ category.name }}</a>
              <span class="separator">/</span>
            </ng-container>
          </ng-container>
          <ng-template #productOnly></ng-template>
          <span class="current">{{ product.name }}</span>
        </nav>

        <div class="product-main">
          <section class="product-gallery">
            <div class="main-image">
              <button class="nav-btn prev" *ngIf="product.gallery && product.gallery.length > 1"
                      [attr.aria-label]="'pdp.galleryPrev' | juliTranslate"
                      (click)="previousImage(product.gallery.length)">←</button>

              <img *ngIf="product.gallery?.[selectedImageIndex]?.url"
                   [src]="product.gallery![selectedImageIndex].url"
                   [alt]="product.gallery![selectedImageIndex].altText || product.name">

              <div class="image-placeholder" *ngIf="!product.gallery?.length">
                <span aria-hidden="true">📦</span>
              </div>

              <button class="nav-btn next" *ngIf="product.gallery && product.gallery.length > 1"
                      [attr.aria-label]="'pdp.galleryNext' | juliTranslate"
                      (click)="nextImage(product.gallery.length)">→</button>

              <div class="zoom-hint" *ngIf="product.gallery?.[selectedImageIndex]?.zoomUrl">
                {{ 'pdp.zoomHint' | juliTranslate }}
              </div>
            </div>

            <div class="thumbnails" *ngIf="product.gallery && product.gallery.length > 1">
              <button *ngFor="let image of product.gallery; let i = index"
                      class="thumb"
                      [class.active]="i === selectedImageIndex"
                      (click)="selectImage(i)">
                <img [src]="image.thumbnailUrl || image.url" [alt]="image.altText || ''">
              </button>
            </div>
          </section>

          <section class="product-info">
            <div class="product-brand" *ngIf="product.brand">{{ product.brand.name }}</div>
            <h1 class="product-name">{{ product.name }}</h1>

            <div class="product-rating" *ngIf="product.rating">
              <span class="stars">{{ '⭐'.repeat(Math.floor(product.rating)) }}</span>
              <span class="rating-value">{{ product.rating | number:'1.1-1' }}</span>
              <span class="reviews">{{ 'pdp.reviews' | juliTranslate:{ count: product.reviewCount } }}</span>
            </div>

            <div class="product-price">
              <span class="current-price" [class.on-sale]="product.price.discounted">
                {{ product.price.formattedValue }}
              </span>
              <span class="original-price" *ngIf="product.price.discounted">
                {{ product.price.originalFormattedValue }}
              </span>
              <span class="discount-badge" *ngIf="product.price.discounted">
                -{{ product.price.discountPercentage }}%
              </span>
            </div>

            <p class="product-summary" *ngIf="product.summary">{{ product.summary }}</p>

            <div class="product-stock" [class]="getStockClass(product.stock.status)">
              {{ getStockMessage(product) }}
            </div>

            <div class="product-variants" *ngIf="product.variants?.length">
              <div class="variant-group" *ngFor="let attrName of getVariantAttributeNames(product.variants!)">
                <label>{{ attrName }}:</label>
                <div class="variant-options">
                  <button *ngFor="let value of getUniqueAttributeValues(product.variants!, attrName)"
                          class="variant-btn"
                          [class.selected]="isAttributeSelected(selection, attrName, value)"
                          [class.disabled]="!selection.valid && !isAttributeSelected(selection, attrName, value)"
                          (click)="selectVariantAttribute(attrName, value)">
                    {{ value }}
                  </button>
                </div>
              </div>
              <div class="variant-error" *ngIf="selection.errorMessage">{{ selection.errorMessage }}</div>
            </div>

            <div class="product-quantity">
              <label>{{ 'pdp.quantity' | juliTranslate }}</label>
              <div class="quantity-control">
                <button (click)="decreaseQuantity()" [disabled]="quantity <= 1">−</button>
                <input type="number" [(ngModel)]="quantity" min="1" [max]="product.stock.quantity ?? 99">
                <button (click)="increaseQuantity(product.stock.quantity)">+</button>
              </div>
            </div>

            <div class="product-actions">
              <button class="btn-add-cart"
                      [class.loading]="addingToCart"
                      [disabled]="!canAddToCart(product, selection) || addingToCart"
                      (click)="addToCart(product, selection)">
                <span *ngIf="addingToCart">{{ 'pdp.adding' | juliTranslate }}</span>
                <span *ngIf="!addingToCart && canAddToCart(product, selection)">{{ 'pdp.addToCart' | juliTranslate }}</span>
                <span *ngIf="!addingToCart && !canAddToCart(product, selection)">{{ 'pdp.unavailable' | juliTranslate }}</span>
              </button>

              <button class="btn-wishlist"
                      [class.saved]="isSaved$ | async"
                      (click)="toggleWishlist(product)"
                      [title]="(isSaved$ | async) ? ('wishlist.remove' | juliTranslate) : ('wishlist.add' | juliTranslate)">
                {{ (isSaved$ | async) ? '❤️' : '🤍' }}
              </button>
            </div>

            <div class="b2b-actions" *ngIf="(b2bContext$ | async) as assignment">
              <ng-container *ngIf="assignment?.companyId">
                <button class="btn-request-quote"
                        [class.loading]="requestingQuote"
                        [disabled]="requestingQuote"
                        (click)="requestQuote(product, selection)">
                  <span *ngIf="!requestingQuote">{{ 'pdp.requestQuote' | juliTranslate }}</span>
                  <span *ngIf="requestingQuote">{{ 'pdp.sending' | juliTranslate }}</span>
                </button>
                <p class="b2b-hint">
                  {{ 'pdp.quoteHint.prefix' | juliTranslate }}
                  <strong>{{ assignment.companyName || ('pdp.yourCompany' | juliTranslate) }}</strong>
                  <ng-container *ngIf="assignment.unitName"> {{ 'pdp.quoteHint.unit' | juliTranslate:{ unit: assignment.unitName } }}</ng-container>
                  {{ 'pdp.quoteHint.suffix' | juliTranslate }}
                </p>
              </ng-container>
            </div>

            <div class="cart-feedback cart-error" *ngIf="addToCartError">
              {{ addToCartError }}
              <button class="btn-link" (click)="addToCartError = undefined">&times;</button>
            </div>
            <div class="cart-feedback cart-error" *ngIf="quoteError">
              {{ quoteError }}
              <button class="btn-link" (click)="quoteError = null">&times;</button>
            </div>

            <div class="delivery-info" *ngIf="product.deliveryInfo">
              <div class="delivery-item">
                <span class="icon" aria-hidden="true">🚚</span>
                <span>{{ product.deliveryInfo.message }}</span>
              </div>
              <div class="delivery-item" *ngIf="product.deliveryInfo.freeShipping">
                <span class="icon" aria-hidden="true">✓</span>
                <span>{{ 'pdp.freeShipping' | juliTranslate }}</span>
              </div>
            </div>

            <div class="product-sku" *ngIf="product.manufacturerSku || product.ean">
              <span *ngIf="product.manufacturerSku">{{ 'pdp.sku' | juliTranslate }}: {{ product.manufacturerSku }}</span>
              <span *ngIf="product.ean">{{ 'pdp.ean' | juliTranslate }}: {{ product.ean }}</span>
            </div>
          </section>
        </div>

        <div class="product-details">
          <div class="tabs">
            <button class="tab-btn active">{{ 'pdp.tabDescription' | juliTranslate }}</button>
            <button class="tab-btn" *ngIf="product.attributes?.length">{{ 'pdp.tabSpecifications' | juliTranslate }}</button>
            <button class="tab-btn">{{ 'pdp.tabReviews' | juliTranslate }}</button>
          </div>

          <div class="tab-content" *ngIf="product.description">
            <div class="description" [innerHTML]="product.description"></div>
          </div>

          <div class="tab-content" *ngIf="product.attributes?.length">
            <table class="attributes-table">
              <tr *ngFor="let attr of product.attributes">
                <th>{{ attr.name }}</th>
                <td>{{ attr.formattedValue || attr.value }} {{ attr.unit }}</td>
              </tr>
            </table>
          </div>
        </div>
      </ng-container>
    </ng-container>
  `,
  styleUrls: ['../../product-detail/product-detail.component.scss'],
})
export class ProductDetailBlockComponent implements OnInit {
  @Input() props: any = {};
  private readonly destroyRef = inject(DestroyRef);
  readonly Math = Math;

  readonly product$ = this.juliProductService.detail$;
  readonly loading$ = this.juliProductService.detailLoading$;
  readonly error$ = this.juliProductService.detailError$;
  readonly variantSelection$ = this.juliProductService.variantSelection$;
  readonly b2bContext$: Observable<B2bAssignment | null>;

  selectedImageIndex = 0;
  quantity = 1;
  addingToCart = false;
  addToCartError?: string;
  requestingQuote = false;
  quoteError: string | null = null;
  isSaved$: Observable<boolean> | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly juliProductService: JuliProductService,
    private readonly cartFacade: JuliCartFacade,
    private readonly cdr: ChangeDetectorRef,
    private readonly i18n: JuliI18nService,
    private readonly quoteService: JuliQuoteService,
    private readonly b2bContext: B2bContextService,
    readonly auth: AuthService,
    readonly wishlistService: WishlistService,
  ) {
    this.b2bContext$ = this.b2bContext.context$;
  }

  ngOnInit(): void {
    this.product$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(product => {
      this.selectedImageIndex = 0;
      this.quantity = 1;
      if (product?.code) {
        this.isSaved$ = this.wishlistService.isSaved$(product.code);
        if (this.auth.isAuthenticated) this.wishlistService.checkSku(product.code);
      }
      this.cdr.markForCheck();
    });
  }

  selectImage(index: number): void { this.selectedImageIndex = index; }
  nextImage(len: number): void { this.selectedImageIndex = (this.selectedImageIndex + 1) % len; }
  previousImage(len: number): void { this.selectedImageIndex = (this.selectedImageIndex - 1 + len) % len; }

  selectVariantAttribute(code: string, value: string): void {
    this.juliProductService.updateVariantAttribute(code, value);
  }

  isAttributeSelected(s: JuliProductVariantSelection, code: string, value: string): boolean {
    return s.attributes[code] === value;
  }

  getUniqueAttributeValues(variants: JuliProductVariant[], code: string): string[] {
    const values = new Set<string>();
    variants.forEach(v => { if (v.attributes?.[code]) values.add(v.attributes[code]); });
    return Array.from(values);
  }

  getVariantAttributeNames(variants: JuliProductVariant[]): string[] {
    if (!variants?.length) return [];
    return Object.keys(variants[0].attributes || {});
  }

  increaseQuantity(max?: number): void { if (max === undefined || this.quantity < max) this.quantity++; }
  decreaseQuantity(): void { if (this.quantity > 1) this.quantity--; }

  addToCart(product: JuliProductDetail, selection: JuliProductVariantSelection): void {
    if (this.addingToCart) return;
    const code = selection.variantCode || product.code;
    this.addingToCart = true;
    this.addToCartError = undefined;
    this.cartFacade.addEntry(code, this.quantity).subscribe({
      next: () => { this.addingToCart = false; this.cdr.markForCheck(); this.router.navigate(['/cart']); },
      error: err => {
        this.addingToCart = false;
        this.addToCartError = err?.error?.message || err?.message || this.i18n.translate('pdp.addToCartError');
        this.cdr.markForCheck();
      },
    });
  }

  requestQuote(product: JuliProductDetail, selection: JuliProductVariantSelection): void {
    if (this.requestingQuote) return;
    const a = this.b2bContext.current();
    if (!a || !a.companyId) { this.quoteError = this.i18n.translate('pdp.quoteError.noB2B'); this.cdr.markForCheck(); return; }
    const sku = selection.variantCode || product.code;
    if (!sku) { this.quoteError = this.i18n.translate('pdp.quoteError.noSku'); this.cdr.markForCheck(); return; }
    const p = product as unknown as Record<string, any>;
    const unitPrice = typeof p?.price?.value === 'number' ? p.price.value : 0;
    const currency = p?.price?.currencyIso || 'BRL';
    const items: QuoteItemPayload[] = [{ sku, quantity: this.quantity, unitPrice, priceSource: 'STOREFRONT' }];
    this.requestingQuote = true;
    this.quoteError = null;
    this.cdr.markForCheck();
    this.quoteService.create({ companyId: a.companyId, unitId: a.unitId ?? null, currency, items }).subscribe({
      next: created => { this.requestingQuote = false; this.router.navigate(['/account/quotes', created.id]); },
      error: err => {
        this.requestingQuote = false;
        this.quoteError = (err?.error?.message || err?.message) ?? this.i18n.translate('pdp.quoteError.failed');
        this.cdr.markForCheck();
      },
    });
  }

  canAddToCart(product: JuliProductDetail, s: JuliProductVariantSelection): boolean {
    if (!product.available) return false;
    if (product.variants && product.variants.length > 0) return s.valid;
    return product.stock.status !== 'OUT_OF_STOCK';
  }

  getStockMessage(product: JuliProductDetail): string {
    switch (product.stock.status) {
      case 'IN_STOCK': return this.i18n.translate('pdp.stockInStock');
      case 'LOW_STOCK': return this.i18n.translate('pdp.stockLow', { quantity: product.stock.quantity });
      case 'OUT_OF_STOCK': return this.i18n.translate('pdp.stockOut');
      default: return this.i18n.translate('pdp.stockUnknown');
    }
  }

  getStockClass(status: string): string { return `stock-${status.toLowerCase()}`; }

  retryLoad(): void {
    const code = this.route.snapshot.paramMap.get('code') || '';
    if (code) this.juliProductService.loadProductDetail(code);
  }

  goBack(): void { this.router.navigate(['/']); }

  toggleWishlist(product: JuliProductDetail): void {
    if (!this.auth.isAuthenticated) { this.router.navigate(['/login']); return; }
    this.wishlistService.toggle(product.code, product.code).subscribe({ error: () => {} });
  }
}
