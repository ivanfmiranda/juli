import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthInterceptor } from './core/auth/auth.interceptor';
import { ObservabilityInterceptor } from './core/services/observability.interceptor';
import { CatalogVersionInterceptor } from './core/commerce/catalog-version.interceptor';
import { CommerceModule } from './core/commerce';
import { CmsPageComponent } from './pages/cms-page/cms-page.component';
import { PreviewEntryComponent } from './pages/preview-entry/preview-entry.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { ProductDetailComponent } from './pages/product-detail/product-detail.component';
import { CategoryPageComponent } from './pages/category-page/category-page.component';
import { SearchPageComponent } from './pages/search-page/search-page.component';
import { CartPageComponent } from './pages/cart-page/cart-page.component';
import { SiteHeaderComponent } from './shared/components/site-header/site-header.component';
import { SiteFooterComponent } from './shared/components/site-footer/site-footer.component';
import { ProductCardComponent } from './shared/components/product-card/product-card.component';
import { OrdersPageComponent } from './pages/orders-page/orders-page.component';
import { OrderDetailPageComponent } from './pages/order-detail-page/order-detail-page.component';
import { WishlistPageComponent } from './pages/wishlist-page/wishlist-page.component';
import { CmsComponentHostComponent } from './shared/cms-runtime/cms-component-host.component';
import { SmartEditOverlayDirective } from './shared/cms-runtime/smartedit-overlay.directive';
import { StrapiCmsModule } from './spartacus/strapi-cms.module';
import { PageRendererModule } from './pages/page-renderer/page-renderer.module';

import { JuliFeatureService } from './core/services/juli-feature.service';
import { JuliBrandingService } from './core/services/juli-branding.service';
import { tap, catchError } from 'rxjs/operators';
import { firstValueFrom, of } from 'rxjs';
import { JuliI18nService } from './core/i18n/i18n.service';
import { LocaleInterceptor } from './core/i18n/locale.interceptor';
import { JuliI18nModule } from './core/i18n/i18n.module';

function initializeSaaSContext(featureService: JuliFeatureService, brandingService: JuliBrandingService): () => Promise<any> {
  return () => firstValueFrom(
    featureService.init().pipe(
      tap(ctx => ctx?.branding && brandingService.applyBranding(ctx.branding)),
      catchError(err => {
        console.warn('[Juli] Tenant init failed, continuing:', err?.message ?? err);
        return of(null);
      })
    )
  );
}

function initializeLocale(i18n: JuliI18nService): () => void {
  return () => i18n.initialize();
}

@NgModule({ declarations: [
        AppComponent,
        LoginComponent,
        RegisterComponent,
        CmsPageComponent,
        ProductDetailComponent,
        CategoryPageComponent,
        SearchPageComponent,
        CartPageComponent,
        OrdersPageComponent,
        OrderDetailPageComponent,
        CmsComponentHostComponent,
        SmartEditOverlayDirective,
        PreviewEntryComponent,
        SiteHeaderComponent,
        SiteFooterComponent,
        ProductCardComponent,
        WishlistPageComponent
    ],
    bootstrap: [AppComponent], imports: [BrowserModule,
        BrowserAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        JuliI18nModule,
        AppRoutingModule,
        CommerceModule.forRoot(),
        StrapiCmsModule,
        PageRendererModule], providers: [
        {
            provide: HTTP_INTERCEPTORS,
            useClass: AuthInterceptor,
            multi: true
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: LocaleInterceptor,
            multi: true
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: ObservabilityInterceptor,
            multi: true
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: CatalogVersionInterceptor,
            multi: true
        },
        {
            provide: APP_INITIALIZER,
            useFactory: initializeSaaSContext,
            deps: [JuliFeatureService, JuliBrandingService],
            multi: true
        },
        {
            provide: APP_INITIALIZER,
            useFactory: initializeLocale,
            deps: [JuliI18nService],
            multi: true
        },
        provideHttpClient(withInterceptorsFromDi())
    ] })
export class AppModule {}
