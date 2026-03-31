/**
 * AppModule - MINIMAL CONFIGURATION
 * 
 * Esta é a configuração MINIMAL usando apenas exports públicos do @spartacus/core.
 * 
 * Características:
 * ✅ Sem imports de paths internos (esm2015)
 * ✅ Sem UserTransitional_4_2_Module
 * ✅ Sem NotificationPreferenceEffects (causa do NullInjectorError)
 * ✅ Usa apenas API pública do Spartacus
 * ✅ Funcional para addresses, consents, orders
 * 
 * Trade-offs:
 * - Não inclui Notification Preferences (quebraria)
 * - Requer adapters funcionais (não placeholders)
 * - Pode perder algumas features avançadas (coupons, interests, etc)
 */

import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { 
  CartModule, 
  ConfigModule, 
  SiteContextModule,
  // Opcional: Import Spartacus OCC adapters se necessário
  // OccUserAddressAdapter,
  // OccUserConsentAdapter, 
  // OccUserOrderAdapter,
  // OccUserPaymentAdapter,
} from '@spartacus/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthInterceptor } from './core/auth/auth.interceptor';
import { CommerceModule } from './core/commerce';
import { MinimalUserModule } from './core/user'; // ✅ NOVO - Minimal, public API only
import { CmsPageComponent } from './pages/cms-page/cms-page.component';
import { LoginComponent } from './pages/login/login.component';
import { ProductDetailComponent } from './pages/product-detail/product-detail.component';
import { CategoryPageComponent } from './pages/category-page/category-page.component';
import { SearchPageComponent } from './pages/search-page/search-page.component';
import { CartPageComponent } from './pages/cart-page/cart-page.component';
import { CheckoutPageComponent } from './pages/checkout-page/checkout-page.component';
import { CheckoutConfirmationPageComponent } from './pages/checkout-confirmation-page/checkout-confirmation-page.component';
import { CheckoutStepperComponent } from './shared/components/checkout-stepper/checkout-stepper.component';
import { CheckoutSummaryComponent } from './shared/components/checkout-summary/checkout-summary.component';
import { OrdersPageComponent } from './pages/orders-page/orders-page.component';
import { OrderDetailPageComponent } from './pages/order-detail-page/order-detail-page.component';
import { CmsComponentHostComponent } from './shared/cms-runtime/cms-component-host.component';
import { StrapiCmsModule } from './spartacus/strapi-cms.module';
import { LocaleInterceptor } from './core/i18n/locale.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    CmsPageComponent,
    ProductDetailComponent,
    CategoryPageComponent,
    SearchPageComponent,
    CartPageComponent,
    CheckoutPageComponent,
    CheckoutConfirmationPageComponent,
    OrdersPageComponent,
    OrderDetailPageComponent,
    CmsComponentHostComponent,
    CheckoutStepperComponent,
    CheckoutSummaryComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    ReactiveFormsModule,
    StoreModule.forRoot({}),
    EffectsModule.forRoot([]),
    AppRoutingModule,
    
    // Spartacus Core
    ConfigModule.withConfig({
      context: {
        baseSite: ['electronics'],
        currency: ['USD'],
        language: ['en']
      }
    }),
    SiteContextModule.forRoot(),
    CartModule.forRoot(),
    
    // ==========================================
    // OPÇÃO 1: MinimalUserModule (RECOMENDADO)
    // ==========================================
    // Usa apenas API pública, sem deep imports
    // Os adapters DEVEM ser providos no CommerceModule
    MinimalUserModule.forRootMinimal(),
    
    // ==========================================
    // OPÇÃO 2: MinimalUserModule com Adapters
    // ==========================================
    // Use esta opção se quiser configurar adapters aqui
    // MinimalUserModule.forRoot({
    //   addressAdapter: OccUserAddressAdapter,
    //   consentAdapter: OccUserConsentAdapter,
    //   orderAdapter: OccUserOrderAdapter,
    //   paymentAdapter: OccUserPaymentAdapter,
    // }),
    
    // ==========================================
    // OPÇÕES NÃO RECOMENDADAS (mantidas para referência)
    // ==========================================
    // UserTransitional_4_2_Module.forRoot(), // ❌ Causa NullInjectorError
    // CustomUserTransitionalModule.forRoot(), // ⚠️ Usa deep imports (frágil)
    
    // Custom Business Logic
    CommerceModule.forRoot(),
    StrapiCmsModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LocaleInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
