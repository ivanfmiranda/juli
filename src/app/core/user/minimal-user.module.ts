/**
 * Minimal User Module
 * 
 * Configuração mínima para funcionalidades de usuário do Spartacus
 * usando APENAS exports públicos do @spartacus/core.
 * 
 * Esta abordagem evita completamente os problemas de DI com
 * NotificationPreferenceEffects e UserNotificationPreferenceConnector.
 * 
 * Funcionalidades suportadas:
 * - User Addresses (via OccUserAddressAdapter)
 * - User Consents (via OccUserConsentAdapter)  
 * - User Orders (via adapter customizado)
 * - Payment Methods (via OccUserPaymentAdapter)
 * - Regions/Countries (built-in)
 * 
 * Funcionalidades NÃO suportadas (requerem adapters não exportados):
 * - Notification Preferences
 * - Customer Coupons
 * - Product Interests
 * - Cost Centers (B2B)
 * 
 * @see docs/COMPAT-LAYER-WORKAROUNDS.md
 */

import { ModuleWithProviders, NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { 
  StateModule,
  USER_FEATURE,
  UserAddressService,
  UserConsentService,
  UserOrderService,
  UserPaymentService
} from '@spartacus/core';

@NgModule({})
export class MinimalUserModule {
  static forRootMinimal(): ModuleWithProviders<MinimalUserModule> {
    return {
      ngModule: MinimalUserModule,
      providers: [
        // Serviços de usuário essenciais
        UserAddressService,
        UserConsentService,
        UserOrderService,
        UserPaymentService,
      ]
    };
  }
}
