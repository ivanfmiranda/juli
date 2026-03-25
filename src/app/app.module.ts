import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CartModule, ConfigModule, SiteContextModule } from '@spartacus/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthInterceptor } from './core/auth/auth.interceptor';
import { ObservabilityInterceptor } from './core/services/observability.interceptor';
import { CommerceModule } from './core/commerce';
import { MinimalUserModule } from './core/user'; // Solução minimalista
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
import { SiteHeaderComponent } from './shared/components/site-header/site-header.component';
import { SiteFooterComponent } from './shared/components/site-footer/site-footer.component';
import { ProductCardComponent } from './shared/components/product-card/product-card.component';
import { SoftLoginPromptComponent } from './shared/components/soft-login-prompt/soft-login-prompt.component';
import { OrdersPageComponent } from './pages/orders-page/orders-page.component';
import { OrderDetailPageComponent } from './pages/order-detail-page/order-detail-page.component';
import { CmsComponentHostComponent } from './shared/cms-runtime/cms-component-host.component';
import { StrapiCmsModule } from './spartacus/strapi-cms.module';

import { JuliFeatureService } from './core/services/juli-feature.service';
import { JuliBrandingService } from './core/services/juli-branding.service';
import { tap } from 'rxjs/operators';

function initializeSaaSContext(featureService: JuliFeatureService, brandingService: JuliBrandingService): () => any {
  return () => featureService.init().pipe(
    tap(ctx => brandingService.applyBranding(ctx.branding))
  ).toPromise();
}

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
    CheckoutSummaryComponent,
    SiteHeaderComponent,
    SiteFooterComponent,
    ProductCardComponent,
    SoftLoginPromptComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    StoreModule.forRoot({}),
    EffectsModule.forRoot([]),
    AppRoutingModule,
    ConfigModule.withConfig({
      context: {
        baseSite: ['electronics'],
        currency: ['USD'],
        language: ['en']
      }
    }),
    SiteContextModule.forRoot(),
    CartModule.forRoot(),
    // UserTransitional_4_2_Module.forRoot(), // REMOVIDO - causa NullInjectorError
    MinimalUserModule.forRootMinimal(), // NOVO - configuração minimalista
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
      useClass: ObservabilityInterceptor,
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeSaaSContext,
      deps: [JuliFeatureService, JuliBrandingService],
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
