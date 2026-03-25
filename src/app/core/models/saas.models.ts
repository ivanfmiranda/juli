export enum FeatureStatus {
  ENABLED = 'ENABLED',
  DISABLED = 'DISABLED',
  READ_ONLY = 'READ_ONLY',
  HIDDEN = 'HIDDEN',
  DEGRADED = 'DEGRADED'
}

export interface FeatureEntitlement {
  featureCode: string;
  status: FeatureStatus;
  limit?: number;
  currentUsage?: number;
  message?: string; // Mensagem customizada para upgrade (ex: "Upgrade para PRO para editar")
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  TRIAL = 'TRIAL',
  PAST_DUE = 'PAST_DUE',
  SUSPENDED = 'SUSPENDED',
  CANCELLED = 'CANCELLED'
}

export interface SubscriptionSummary {
  planCode: string;
  planName: string;
  status: SubscriptionStatus;
  billingCycle: 'MONTHLY' | 'YEARLY';
  nextBillingDate?: string;
  trialEndDate?: string;
  isGracePeriod: boolean;
}

export interface TenantBranding {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  faviconUrl?: string;
  customCssVariables?: Record<string, string>;
}

export interface TenantContext {
  tenantId: string;
  tenantName: string;
  slug: string;
  branding: TenantBranding;
  subscription: SubscriptionSummary;
  entitlements: FeatureEntitlement[];
}

export interface UsageLimitSummary {
  featureCode: string;
  label: string;
  limit: number;
  usage: number;
  unit: string;
  isSoftLimitReached: boolean;
  isHardLimitReached: boolean;
}
