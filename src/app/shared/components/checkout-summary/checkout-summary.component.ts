import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter } from '@angular/core';
import { JuliI18nService } from '../../../core/i18n/i18n.service';
// JuliCart type from commerce facade
interface CartEntry {
  product?: { name?: string };
  quantity?: number;
  totalPrice?: { formattedValue?: string; value?: number; currencyIso?: string };
}

interface JuliCart {
  entries?: CartEntry[];
  totalItems?: number;
  subTotal?: { value?: number; currencyIso?: string };
  totalPrice?: { value?: number; currencyIso?: string; formattedValue?: string };
}
import { 
  JuliDeliveryOption, 
  JuliCheckoutPaymentStatus, 
  JuliCheckoutReviewSnapshot 
} from '../../../core/commerce/models/ubris-commerce.models';

@Component({
  selector: 'app-checkout-summary',
  templateUrl: './checkout-summary.component.html',
  styleUrls: ['./checkout-summary.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckoutSummaryComponent {
  constructor(private readonly i18n: JuliI18nService) {}

  @Input() cart: JuliCart | null = null;
  @Input() selectedDelivery: JuliDeliveryOption | null = null;
  @Input() paymentStatus: JuliCheckoutPaymentStatus | null | undefined = null;
  @Input() reviewSnapshot: JuliCheckoutReviewSnapshot | null | undefined = null;
  @Input() loading = false;
  @Input() mobileExpanded = false;
  
  @Output() mobileToggle = new EventEmitter<void>();

  get subtotal(): number {
    return this.cart?.subTotal?.value || this.cart?.totalPrice?.value || 0;
  }

  get deliveryCost(): number {
    return this.selectedDelivery?.cost || 0;
  }

  get total(): number {
    if (this.reviewSnapshot?.total) {
      return this.reviewSnapshot.total;
    }
    return this.subtotal + this.deliveryCost;
  }

  get currency(): string {
    return this.reviewSnapshot?.currency 
      || this.selectedDelivery?.currency 
      || this.cart?.totalPrice?.currencyIso 
      || 'USD';
  }

  get itemCount(): number {
    return this.cart?.totalItems || this.cart?.entries?.length || 0;
  }

  formatMoney(value: number): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return '-';
    }
    return new Intl.NumberFormat(this.i18n.currentLocale, {
      style: 'currency',
      currency: this.currency
    }).format(value);
  }

  get paymentStatusIcon(): string {
    const status = this.paymentStatus?.status?.toUpperCase();
    switch (status) {
      case 'AUTHORIZED':
      case 'CAPTURED':
        return '✓';
      case 'FAILED':
      case 'CANCELLED':
        return '✕';
      case 'PENDING_CUSTOMER_ACTION':
        return '⏳';
      default:
        return '○';
    }
  }

  get paymentStatusClass(): string {
    const status = this.paymentStatus?.status?.toUpperCase();
    switch (status) {
      case 'AUTHORIZED':
      case 'CAPTURED':
        return 'status-success';
      case 'FAILED':
      case 'CANCELLED':
        return 'status-error';
      case 'PENDING_CUSTOMER_ACTION':
        return 'status-pending';
      default:
        return 'status-neutral';
    }
  }

  onMobileToggle(): void {
    this.mobileToggle.emit();
  }
}
