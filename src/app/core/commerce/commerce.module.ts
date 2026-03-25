/**
 * Commerce Module
 * 
 * Módulo central de e-commerce do JULI.
 * 
 * Suporte Multi-Backend:
 * - Ubris: Backend atual (microservices Java)
 * - Hybris: SAP Commerce Cloud (futuro - OCC API)
 * 
 * Estrutura de Adapters:
 * - Real/Bridge: Implementações funcionais
 * - Placeholder: Stubs para DI (capabilities futuras)
 * 
 * @see docs/JULI-COMPATIBILITY-MATRIX.md
 */

import { APP_INITIALIZER, ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  CartAdapter, 
  CartEntryAdapter, 
  CartValidationAdapter, 
  CartVoucherAdapter, 
  SaveCartAdapter, 
  SiteAdapter, 
  UserAddressAdapter, 
  UserConsentAdapter,
  UserCostCenterAdapter,
  CustomerCouponAdapter,
  UserInterestsAdapter,
  UserOrderAdapter, 
  UserPaymentAdapter,
  UserReplenishmentOrderAdapter,
  // Spartacus OCC Adapters (funcionais para backend SAP Commerce)
  OccUserAddressAdapter,
  OccUserConsentAdapter,
  OccUserPaymentAdapter,
  // Connectors (para uso direto se necessário)
  UserAddressConnector,
  UserConsentConnector,
  UserOrderConnector,
  UserPaymentConnector,
} from '@spartacus/core';

// Spartacus Native Adapters (mantidos para funcionalidade básica)
import { JuliSpartacusCartAdapter } from './adapters/spartacus-cart.adapter';
import { JuliSpartacusCartEntryAdapter } from './adapters/spartacus-cart-entry.adapter';
import { JuliSpartacusCartValidationAdapter, JuliSpartacusCartVoucherAdapter, JuliSpartacusSaveCartAdapter } from './adapters/spartacus-cart-support.adapter';
import { JuliSpartacusSiteAdapter } from './adapters/spartacus-site.adapter';
import { JuliSpartacusCheckoutAdapter } from './adapters/spartacus-checkout.adapter';

// Ubris Adapters (Backend Ativo)
import { UbrisOrderAdapter } from './adapters/ubris/ubris-order.adapter';
import { JuliSpartacusOrderAdapter } from './adapters/spartacus-order.adapter';
import { 
CheckoutAdapter, 
CheckoutDeliveryAdapter, 
CheckoutPaymentAdapter,
UserAddressAdapter,
UserConsentAdapter,
UserPaymentAdapter
} from '@spartacus/core';
// Placeholder Adapters (Capabilities Futuras)
import { 
  // B2B Features
  UserCostCenterPlaceholderAdapter,
  // Customer Engagement
  CustomerCouponPlaceholderAdapter,
  UserInterestsPlaceholderAdapter,
  // Subscription/B2B Orders
  UserReplenishmentOrderPlaceholderAdapter
} from './adapters/placeholders';

// Serviços
import { SpartacusUserContextBridgeService } from './services/spartacus-user-context.bridge';

function initializeSpartacusUserContext(bridge: SpartacusUserContextBridgeService): () => void {
  return () => bridge.init();
}

@NgModule({
  imports: [CommonModule]
})
export class CommerceModule {
  static forRoot(): ModuleWithProviders<CommerceModule> {
    return {
      ngModule: CommerceModule,
      providers: [
        // === ADAPTERS REAIS/BRIDGE (Funcionais) ===
        
        // Cart & Checkout (Spartacus Native)
        { provide: CartAdapter, useClass: JuliSpartacusCartAdapter },
        { provide: CartEntryAdapter, useClass: JuliSpartacusCartEntryAdapter },
        { provide: SiteAdapter, useClass: JuliSpartacusSiteAdapter },
        { provide: CartVoucherAdapter, useClass: JuliSpartacusCartVoucherAdapter },
        { provide: CartValidationAdapter, useClass: JuliSpartacusCartValidationAdapter },
        { provide: SaveCartAdapter, useClass: JuliSpartacusSaveCartAdapter },
        
        // Orders (Ubris Backend)
        { provide: UserOrderAdapter, useClass: JuliSpartacusOrderAdapter },

        // Checkout & Payment (Ubris Backend)
        { provide: CheckoutAdapter, useClass: JuliSpartacusCheckoutAdapter },
        { provide: CheckoutDeliveryAdapter, useClass: JuliSpartacusCheckoutAdapter },
        { provide: CheckoutPaymentAdapter, useClass: JuliSpartacusCheckoutAdapter },
        
        // ==========================================
        // USER ADAPTERS - Configuração MINIMAL
        // ==========================================
        
        // OPÇÃO A: Spartacus OCC Adapters (para backend SAP Commerce)
        // ✅ Funcionam com MinimalUserModule
        // ✅ Usam API pública do Spartacus
        { provide: UserAddressAdapter, useClass: OccUserAddressAdapter },
        { provide: UserConsentAdapter, useClass: OccUserConsentAdapter },
        { provide: UserPaymentAdapter, useClass: OccUserPaymentAdapter },
        
        // OPÇÃO B: Custom Adapters (se tiver seus próprios backends)
        // Substitua pelos seus adapters quando necessário
        // { provide: UserAddressAdapter, useClass: YourCustomAddressAdapter },
        // { provide: UserConsentAdapter, useClass: YourCustomConsentAdapter },
        // { provide: UserPaymentAdapter, useClass: YourCustomPaymentAdapter },
        
        // OPÇÃO C: Placeholders (NÃO RECOMENDADO para uso real)
        // Apenas para desenvolvimento/documentação
        // { provide: UserAddressAdapter, useClass: UserAddressPlaceholderAdapter },
        // { provide: UserConsentAdapter, useClass: UserConsentPlaceholderAdapter },
        // { provide: UserPaymentAdapter, useClass: UserPaymentPlaceholderAdapter },
        
        // ==========================================
        // CONNECTORS - Para MinimalUserModule
        // ==========================================
        // Estes são providos automaticamente pelos adapters acima,
        // mas listados aqui para clareza
        // UserAddressConnector - provido via UserAddressAdapter
        // UserConsentConnector - provido via UserConsentAdapter
        // UserOrderConnector - provido via UserOrderAdapter
        // UserPaymentConnector - provido via UserPaymentAdapter
        
        // === PLACEHOLDERS (Capabilities Não Implementadas) ===
        
        // B2B Features - Não suportado atualmente
        { provide: UserCostCenterAdapter, useClass: UserCostCenterPlaceholderAdapter },
        
        // Customer Engagement - Capabilities futuras
        { provide: CustomerCouponAdapter, useClass: CustomerCouponPlaceholderAdapter },
        { provide: UserInterestsAdapter, useClass: UserInterestsPlaceholderAdapter },
        
        // Subscription/B2B Orders - Capabilities futuras
        { provide: UserReplenishmentOrderAdapter, useClass: UserReplenishmentOrderPlaceholderAdapter },
        
        // Inicialização
        {
          provide: APP_INITIALIZER,
          useFactory: initializeSpartacusUserContext,
          deps: [SpartacusUserContextBridgeService],
          multi: true
        }
      ]
    };
  }
}
