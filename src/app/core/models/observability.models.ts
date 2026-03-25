export enum JuliEvent {
  // Cart
  CART_ENTRY_ADDED = 'CART_ENTRY_ADDED',
  CART_ENTRY_UPDATED = 'CART_ENTRY_UPDATED',
  CART_ENTRY_REMOVED = 'CART_ENTRY_REMOVED',
  CART_PROMOTED = 'CART_PROMOTED',
  // Checkout
  CHECKOUT_STEP_COMPLETED = 'CHECKOUT_STEP_COMPLETED',
  CHECKOUT_STATE_CHANGED = 'CHECKOUT_STATE_CHANGED',
  // Payment
  PAYMENT_STARTED = 'PAYMENT_STARTED',
  PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  // Order
  ORDER_PLACED = 'ORDER_PLACED',
  ORDER_PLACE_FAILED = 'ORDER_PLACE_FAILED',
  ORDER_RECONCILIATION_STARTED = 'ORDER_RECONCILIATION_STARTED',
  ORDER_RECONCILIATION_RESOLVED = 'ORDER_RECONCILIATION_RESOLVED',
  ORDER_CANCEL_REQUESTED = 'ORDER_CANCEL_REQUESTED',
  ORDER_CANCEL_FAILED = 'ORDER_CANCEL_FAILED',
  // Monetization / SaaS
  ENTITLEMENT_DENIED = 'ENTITLEMENT_DENIED',
  PLAN_LIMIT_REACHED = 'PLAN_LIMIT_REACHED',
  UPGRADE_PROMPT_SHOWN = 'UPGRADE_PROMPT_SHOWN',
  TENANT_SWITCHED = 'TENANT_SWITCHED',
  SUBSCRIPTION_EXPIRED = 'SUBSCRIPTION_EXPIRED'
}

export enum JuliErrorCategory {
  UI = 'UI',
  INTEGRATION = 'INTEGRATION',
  BACKEND = 'BACKEND',
  PAYMENT = 'PAYMENT',
  CONSISTENCY = 'CONSISTENCY',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN'
}

export interface JuliError {
  code: string;
  category: JuliErrorCategory;
  source: string;
  operation: string;
  retriable: boolean;
  userMessage: string;
  technicalMessage?: string;
  correlationId?: string;
  timestamp: string;
  originalError?: any;
}

export interface JuliLog {
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  event?: JuliEvent | string;
  message: string;
  correlationId?: string;
  context?: Record<string, any>;
  timestamp: string;
}
