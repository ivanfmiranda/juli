/**
 * Placeholder Adapters
 * 
 * Adapters temporários para capabilities do Spartacus que ainda não foram
 * implementadas no JULI ou não são suportadas pelo backend atual.
 * 
 * Esses adapters existem para:
 * 1. Satisfazer dependências de injeção do Spartacus Core
 * 2. Documentar capabilities futuras
 * 3. Permitir graceful degradation (não quebrar a aplicação)
 * 
 * Quando uma capability for implementada para um backend específico,
 * o adapter placeholder deve ser substituído por uma implementação real
 * na pasta correspondente (ubris/ ou hybris/).
 * 
 * @see docs/JULI-COMPATIBILITY-MATRIX.md
 */

// User Management - Checkout custom do JULI
export { UserAddressPlaceholderAdapter } from './user-address.placeholder.adapter';
export { UserPaymentPlaceholderAdapter } from './user-payment.placeholder.adapter';
export { UserConsentPlaceholderAdapter } from './user-consent.placeholder.adapter';

// B2B Features - Não suportado (JULI é B2C)
export { UserCostCenterPlaceholderAdapter } from './user-cost-center.placeholder.adapter';

// Customer Engagement - Capabilities futuras
export { CustomerCouponPlaceholderAdapter } from './customer-coupon.placeholder.adapter';
export { UserInterestsPlaceholderAdapter } from './user-interests.placeholder.adapter';

// Subscription/B2B Orders - Capabilities futuras
export { UserReplenishmentOrderPlaceholderAdapter } from './user-replenishment-order.placeholder.adapter';

// Nota: UserNotificationPreferenceAdapter foi removido.
// O problema de DI foi resolvido substituindo UserTransitional_4_2_Module
// por CustomUserTransitionalModule que não inclui NotificationPreferenceEffects.
// @see src/app/core/user/custom-user-transitional.module.ts
