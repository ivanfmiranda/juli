/**
 * Custom Effects Array for Transitional 4.2
 * 
 * This is a modified version of Spartacus's effectsTransitional_4_2 array
 * that excludes NotificationPreferenceEffects to avoid the NullInjectorError
 * for UserNotificationPreferenceConnector.
 * 
 * The connector is not exported from @spartacus/core public API, making it
 * impossible to provide a proper implementation without deep imports that
 * cause token mismatches.
 * 
 * @see SOLUTION-NotificationPreference-DI-Issue.md for full explanation
 */

// Deep imports from Spartacus ESM2015 build
// These are necessary because the effects are not exported from public API
import { BillingCountriesEffect } from '@spartacus/core/esm2015/src/user/store/effects/billing-countries.effect';
import { ClearMiscsDataEffect } from '@spartacus/core/esm2015/src/user/store/effects/clear-miscs-data.effect';
import { CustomerCouponEffects } from '@spartacus/core/esm2015/src/user/store/effects/customer-coupon.effect';
import { DeliveryCountriesEffects } from '@spartacus/core/esm2015/src/user/store/effects/delivery-countries.effect';
import { UserPaymentMethodsEffects } from '@spartacus/core/esm2015/src/user/store/effects/payment-methods.effect';
import { ProductInterestsEffect } from '@spartacus/core/esm2015/src/user/store/effects/product-interests.effect';
import { RegionsEffects } from '@spartacus/core/esm2015/src/user/store/effects/regions.effect';
import { UserAddressesEffects } from '@spartacus/core/esm2015/src/user/store/effects/user-addresses.effect';
import { UserConsentsEffect } from '@spartacus/core/esm2015/src/user/store/effects/user-consents.effect';
import { UserCostCenterEffects } from '@spartacus/core/esm2015/src/user/store/effects/user-cost-center.effect';

/**
 * Custom effects array - excludes NotificationPreferenceEffects
 * 
 * Original array from Spartacus includes:
 * - ClearMiscsDataEffect
 * - DeliveryCountriesEffects
 * - RegionsEffects
 * - UserAddressesEffects
 * - UserPaymentMethodsEffects
 * - BillingCountriesEffect
 * - UserConsentsEffect
 * - CustomerCouponEffects
 * - NotificationPreferenceEffects ❌ (REMOVED - requires unexported connector)
 * - ProductInterestsEffect
 * - UserCostCenterEffects
 */
export const customEffectsTransitional_4_2: any[] = [
  ClearMiscsDataEffect,
  DeliveryCountriesEffects,
  RegionsEffects,
  UserAddressesEffects,
  UserPaymentMethodsEffects,
  BillingCountriesEffect,
  UserConsentsEffect,
  CustomerCouponEffects,
  // NotificationPreferenceEffects - EXCLUDED to avoid DI error
  ProductInterestsEffect,
  UserCostCenterEffects,
];

/**
 * Debug utility to log registered effects
 */
export function logRegisteredEffects(): void {
  if (typeof window !== 'undefined' && (window as any).__spartacus_debug) {
    console.log('[CustomEffectsTransitional_4_2] Registered effects:', 
      customEffectsTransitional_4_2.map(e => e.name || e.constructor?.name || 'Unknown')
    );
  }
}
