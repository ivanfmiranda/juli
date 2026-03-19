import { APP_INITIALIZER, ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartAdapter, CartEntryAdapter, CartValidationAdapter, CartVoucherAdapter, SaveCartAdapter, SiteAdapter, UserOrderAdapter } from '@spartacus/core';
import { JuliSpartacusCartAdapter } from './adapters/spartacus-cart.adapter';
import { JuliSpartacusCartEntryAdapter } from './adapters/spartacus-cart-entry.adapter';
import { JuliSpartacusCartValidationAdapter, JuliSpartacusCartVoucherAdapter, JuliSpartacusSaveCartAdapter } from './adapters/spartacus-cart-support.adapter';
import { JuliSpartacusSiteAdapter } from './adapters/spartacus-site.adapter';
import { SpartacusUserContextBridgeService } from './services/spartacus-user-context.bridge';
import { UbrisOrderAdapter } from './adapters/order.adapter';

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
        {
          provide: CartAdapter,
          useClass: JuliSpartacusCartAdapter
        },
        {
          provide: CartEntryAdapter,
          useClass: JuliSpartacusCartEntryAdapter
        },
        {
          provide: SiteAdapter,
          useClass: JuliSpartacusSiteAdapter
        },
        {
          provide: CartVoucherAdapter,
          useClass: JuliSpartacusCartVoucherAdapter
        },
        {
          provide: CartValidationAdapter,
          useClass: JuliSpartacusCartValidationAdapter
        },
        {
          provide: SaveCartAdapter,
          useClass: JuliSpartacusSaveCartAdapter
        },
        {
          provide: UserOrderAdapter,
          useClass: UbrisOrderAdapter
        },
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
