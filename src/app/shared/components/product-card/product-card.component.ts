/**
 * Product Card Component
 * 
 * Card de produto premium para listagens.
 * 
 * Features:
 * - Imagem com hover effect
 * - Badges (Novo, Promoção, Top)
 * - Preço com desconto
 * - Quick add to cart
 * - Rating
 * - Stock status
 */

import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Observable, of } from 'rxjs';
import { JuliProductSummary } from '../../../core/commerce/models/juli-product.model';
import { WishlistService } from '../../../core/commerce/services/wishlist.service';
import { AuthService } from '../../../core/auth/auth.service';
import { JuliI18nService } from '../../../core/i18n/i18n.service';

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductCardComponent implements OnChanges {
  @Input() product!: JuliProductSummary;
  @Input() showQuickAdd = true;
  @Input() layout: 'grid' | 'list' = 'grid';
  /** How many installments to surface on the card ("ou 12x de R$ …"). */
  @Input() installments = 12;

  @Output() addToCart = new EventEmitter<string>();

  readonly Math = Math;

  isSaved$: Observable<boolean> = of(false);

  constructor(
    private readonly i18n: JuliI18nService,
    private readonly wishlist: WishlistService,
    private readonly auth: AuthService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['product'] && this.product?.code) {
      this.isSaved$ = this.wishlist.isSaved$(this.product.code);
      if (this.auth.isAuthenticated) {
        this.wishlist.checkSku(this.product.code);
      }
    }
  }

  /**
   * Retorna a classe CSS para o badge de classificação
   */
  getClassificationBadge(): { text: string; class: string } | null {
    switch (this.product.classification) {
      case 'NEW':
        return { text: this.i18n.translate('productCard.badgeNew'), class: 'badge-new' };
      case 'BESTSELLER':
        return { text: this.i18n.translate('productCard.badgeTop'), class: 'badge-top' };
      case 'SALE':
        return { text: this.i18n.translate('productCard.badgeSale', { percentage: this.product.price.discountPercentage }), class: 'badge-sale' };
      case 'LIMITED':
        return { text: this.i18n.translate('productCard.badgeLimited'), class: 'badge-limited' };
      default:
        return null;
    }
  }

  /**
   * Retorna mensagem de estoque (mantido para compatibilidade)
   */
  getStockMessage(): string {
    switch (this.product.stock.status) {
      case 'IN_STOCK':
        return this.i18n.translate('productCard.stockInStock');
      case 'LOW_STOCK':
        return this.i18n.translate('productCard.stockLow', { quantity: this.product.stock.quantity });
      case 'OUT_OF_STOCK':
        return this.i18n.translate('productCard.stockOut');
      default:
        return this.i18n.translate('productCard.stockUnknown');
    }
  }

  /**
   * Retorna classe CSS para estoque (mantido para compatibilidade)
   */
  getStockClass(): string {
    return `stock-${this.product.stock.status.toLowerCase()}`;
  }

  /**
   * Retorna objeto acessível para indicador de estoque.
   * Usa ponto colorido via CSS + texto visível + ariaLabel para leitores de tela.
   */
  getStockStatus(): { label: string; cssClass: string; ariaLabel: string } {
    switch (this.product.stock.status) {
      case 'IN_STOCK':
        return {
          label: this.i18n.translate('productCard.stockInStock'),
          cssClass: 'stock-indicator stock-available',
          ariaLabel: this.i18n.translate('productCard.stockInStock'),
        };
      case 'LOW_STOCK':
        return {
          label: this.i18n.translate('productCard.stockLow', { quantity: this.product.stock.quantity }),
          cssClass: 'stock-indicator stock-low',
          ariaLabel: this.i18n.translate('productCard.stockLowAria'),
        };
      case 'OUT_OF_STOCK':
        return {
          label: this.i18n.translate('productCard.stockOut'),
          cssClass: 'stock-indicator stock-out',
          ariaLabel: this.i18n.translate('productCard.stockOut'),
        };
      default:
        return {
          label: this.i18n.translate('productCard.stockUnknown'),
          cssClass: 'stock-indicator stock-out',
          ariaLabel: this.i18n.translate('productCard.stockUnknown'),
        };
    }
  }

  /**
   * Parcela sem juros exibida no card. Não substitui o PDP — é um hint
   * comercial comum no varejo BR (cliente decide pela parcela, não pelo
   * preço cheio). Null quando o preço ou parcelas for inválido, ou
   * quando a parcela cai abaixo do piso mínimo (R$ 20) — regra comum
   * entre adquirentes e também usada por Mercado Livre / Magalu.
   */
  getInstallment(): { count: number; amount: string } | null {
    const price = this.product?.price;
    if (!price || this.installments < 2) return null;
    const total = price.value;
    if (!total || total <= 0) return null;
    const each = total / this.installments;
    const minPerInstallment = 20;
    if (each < minPerInstallment) {
      // Retry with fewer installments so we still show something useful.
      const maxCount = Math.max(2, Math.floor(total / minPerInstallment));
      if (maxCount < 2) return null;
      return {
        count: maxCount,
        amount: this.formatCurrency(total / maxCount, price.currencyIso),
      };
    }
    return {
      count: this.installments,
      amount: this.formatCurrency(each, price.currencyIso),
    };
  }

  private formatCurrency(value: number, currencyIso: string): string {
    try {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: currencyIso || 'BRL',
      }).format(value);
    } catch {
      return `R$ ${value.toFixed(2)}`;
    }
  }

  /**
   * Emite evento de add to cart
   */
  onAddToCart(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.product.available && this.product.stock.status !== 'OUT_OF_STOCK') {
      this.addToCart.emit(this.product.code);
    }
  }

  onToggleWishlist(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (!this.auth.isAuthenticated || !this.product.code) return;

    this.wishlist.toggle(this.product.code, this.product.code).subscribe({
      error: () => { /* silent — user not logged in or network issue */ }
    });
  }
}
