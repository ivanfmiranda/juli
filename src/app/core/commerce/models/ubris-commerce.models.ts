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

export interface JuliCheckoutResult {
  checkoutId?: string;
  status?: string;
  approvalRequired?: boolean;
  orderId?: string;
  lastError?: string;
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