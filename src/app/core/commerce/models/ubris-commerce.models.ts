import { SearchConfig } from '@spartacus/core';

export interface GatewayEnvelope<T> {
  success?: boolean;
  data?: T;
  message?: string | null;
}

export interface UbrisStorefrontList<T> {
  items?: T[];
  total?: number;
  page?: number;
  size?: number;
  query?: string;
  category?: Record<string, unknown>;
  sort?: string;
  sorts?: UbrisSortOption[];
}

export interface UbrisSortOption {
  code?: string;
  name?: string;
  selected?: boolean;
}

export interface JuliCategoryPage {
  categoryCode: string;
  categoryName: string;
  products: any[];
  total: number;
  page: number;
  pageSize: number;
  sort?: string;
  sorts?: Array<{ code: string; name: string; selected: boolean }>;
}

export interface JuliCartState {
  cartId?: string;
  cart?: any;
}

export interface JuliCheckoutSubmission {
  cartId: string;
  customerId: string;
  userType: string;
  addressLine: string;
  paymentMethod: string;
}

export interface JuliCheckoutAddress {
  id?: string;
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postalCode: string;
  countryIso: string;
  phone?: string;
  notes?: string;
}

export interface JuliCheckoutAddressUpsertRequest {
  checkoutId?: string;
  cartId: string;
  customerId: string;
  userType: string;
  paymentMethod: string;
  address: JuliCheckoutAddress;
}

export interface JuliCheckoutAddressState {
  checkoutId: string;
  cartId: string;
  customerId: string;
  userType: string;
  paymentMethod: string;
  status: string;
  address: JuliCheckoutAddress;
  updatedAt?: string;
}

export interface JuliDeliveryOption {
  code: string;
  name: string;
  description?: string;
  cost?: number;
  currency?: string;
  estimatedDays: number;
  available: boolean;
  type: string;
}

export interface JuliCheckoutDeliveryOptionsState {
  checkoutId: string;
  status: string;
  selectedCode?: string;
  options: JuliDeliveryOption[];
  updatedAt?: string;
}

export interface JuliCheckoutDeliveryModeSelection {
  checkoutId: string;
  status: string;
  deliveryMode: JuliDeliveryOption;
  updatedAt?: string;
}

export interface JuliCheckoutPaymentCapability {
  supportsCard: boolean;
  supportsPix: boolean;
  supportsApplePay: boolean;
  supportsGooglePay: boolean;
  supportsSamsungPay: boolean;
  supportsManualCapture: boolean;
  supportsRefund: boolean;
  supportsPartialRefund: boolean;
}

export interface JuliCheckoutPaymentMethod {
  code: string;
  label: string;
  supported: boolean;
  provider: string;
  capabilities: JuliCheckoutPaymentCapability;
}

export interface JuliCheckoutPaymentMethodsState {
  checkoutId: string;
  availableMethods: JuliCheckoutPaymentMethod[];
  updatedAt?: string;
}

export interface JuliCheckoutPaymentInitializeState {
  checkoutId: string;
  paymentSessionId: string;
  provider: string;
  method: string;
  status: string;
  clientPayload: Record<string, unknown>;
  requiresCustomerAction: boolean;
  detail?: string;
  providerReference?: string;
  updatedAt?: string;
}

export interface JuliCheckoutPaymentStatus {
  checkoutId: string;
  paymentSessionId: string;
  provider: string;
  method: string;
  status: string;
  detail?: string;
  providerReference?: string;
  clientPayload: Record<string, unknown>;
  requiresCustomerAction: boolean;
  nextAction: Record<string, unknown>;
  updatedAt?: string;
}

export interface JuliCheckoutReviewItem {
  productCode: string;
  quantity: number;
  unitPrice?: number;
  lineTotal?: number;
  stockAvailable: boolean;
}

export interface JuliCheckoutReviewSnapshot {
  checkoutId: string;
  cartId: string;
  customerId: string;
  userType: string;
  paymentMethod: string;
  status: string;
  address: JuliCheckoutAddress;
  deliveryMode?: JuliDeliveryOption;
  payment?: JuliCheckoutPaymentStatus;
  deliveryCost?: number;
  items: JuliCheckoutReviewItem[];
  totalItems: number;
  subTotal?: number;
  totalTax?: number;
  total?: number;
  currency?: string;
  stockValidated: boolean;
  pricingValidated: boolean;
  addressValidated: boolean;
  deliveryValidated: boolean;
  paymentValidated: boolean;
  readyToPlace: boolean;
  messages: string[];
  warnings: string[];
  errors: string[];
  updatedAt?: string;
}

export interface JuliCheckoutResult {
  checkoutId?: string;
  status?: string;
  approvalRequired?: boolean;
  orderId?: string;
  lastError?: string;
  detail?: string;
  retries?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface JuliOrderSummary {
  id: string;
  status: string;
  totalFormatted: string;
  placedAt: string;
}

export interface JuliCategoryQuery {
  code: string;
  page?: number;
  size?: number;
}

export interface JuliSearchQuery {
  query: string;
  config?: SearchConfig;
}

export interface PromoteResult {
  cart: unknown;
  mergeOccurred: boolean;
  cartChanged: boolean;
  mergeReport: {
    itemsAdded: number;
    quantitiesMerged: number;
    warnings: Array<{
      type: string;
      sku: string;
      requestedQuantity?: number;
      actualQuantity?: number;
      reason?: string;
    }>;
  };
}
