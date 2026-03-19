import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { CartModule, ConfigModule, SiteContextModule, UserTransitional_4_2_Module } from '@spartacus/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthInterceptor } from './core/auth/auth.interceptor';
import { CommerceModule } from './core/commerce';
import { CmsPageComponent } from './pages/cms-page/cms-page.component';
import { LoginComponent } from './pages/login/login.component';
import { ProductDetailComponent } from './pages/product-detail/product-detail.component';
import { CategoryPageComponent } from './pages/category-page/category-page.component';
import { SearchPageComponent } from './pages/search-page/search-page.component';
import { CartPageComponent } from './pages/cart-page/cart-page.component';
import { CheckoutPageComponent } from './pages/checkout-page/checkout-page.component';
import { OrdersPageComponent } from './pages/orders-page/orders-page.component';
import { CmsComponentHostComponent } from './shared/cms-runtime/cms-component-host.component';
import { StrapiCmsModule } from './spartacus/strapi-cms.module';

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
    OrdersPageComponent,
    CmsComponentHostComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
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
    UserTransitional_4_2_Module.forRoot(),
    CommerceModule.forRoot(),
    StrapiCmsModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
