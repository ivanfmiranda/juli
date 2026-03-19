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
}

export interface JuliCategoryPage {
  categoryCode: string;
  categoryName: string;
  products: any[];
  total: number;
  page: number;
  pageSize: number;
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
  items: JuliCheckoutReviewItem[];
  totalItems: number;
  subTotal?: number;
  totalTax?: number;
  total?: number;
  currency?: string;
  stockValidated: boolean;
  pricingValidated: boolean;
  addressValidated: boolean;
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
