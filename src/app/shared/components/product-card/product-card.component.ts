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

import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { JuliProductSummary } from '../../../core/commerce/models/juli-product.model';

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductCardComponent {
  @Input() product!: JuliProductSummary;
  @Input() showQuickAdd = true;
  @Input() layout: 'grid' | 'list' = 'grid';
  
  @Output() addToCart = new EventEmitter<string>();

  readonly Math = Math;

  /**
   * Retorna a classe CSS para o badge de classificação
   */
  getClassificationBadge(): { text: string; class: string } | null {
    switch (this.product.classification) {
      case 'NEW':
        return { text: 'Novo', class: 'badge-new' };
      case 'BESTSELLER':
        return { text: 'Top', class: 'badge-top' };
      case 'SALE':
        return { text: `${this.product.price.discountPercentage}% OFF`, class: 'badge-sale' };
      case 'LIMITED':
        return { text: 'Últimas', class: 'badge-limited' };
      default:
        return null;
    }
  }

  /**
   * Retorna mensagem de estoque
   */
  getStockMessage(): string {
    switch (this.product.stock.status) {
      case 'IN_STOCK':
        return '✓ Em estoque';
      case 'LOW_STOCK':
        return `⚠️ Apenas ${this.product.stock.quantity} un.`;
      case 'OUT_OF_STOCK':
        return '✗ Esgotado';
      default:
        return 'Consultar';
    }
  }

  /**
   * Retorna classe CSS para estoque
   */
  getStockClass(): string {
    return `stock-${this.product.stock.status.toLowerCase()}`;
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
}
