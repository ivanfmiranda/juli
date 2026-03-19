import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/auth/auth.guard';
import { LoginComponent } from './pages/login/login.component';
import { CmsPageComponent } from './pages/cms-page/cms-page.component';
import { ProductDetailComponent } from './pages/product-detail/product-detail.component';
import { CategoryPageComponent } from './pages/category-page/category-page.component';
import { SearchPageComponent } from './pages/search-page/search-page.component';
import { CartPageComponent } from './pages/cart-page/cart-page.component';
import { CheckoutPageComponent } from './pages/checkout-page/checkout-page.component';
import { CheckoutConfirmationPageComponent } from './pages/checkout-confirmation-page/checkout-confirmation-page.component';
import { OrdersPageComponent } from './pages/orders-page/orders-page.component';
import { OrderDetailPageComponent } from './pages/order-detail-page/order-detail-page.component';
import { NotFoundPageComponent } from './core/cms/fallback';

const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  { path: '', pathMatch: 'full', redirectTo: 'page/home' },
  { path: 'page/preview/:slug', component: CmsPageComponent, data: { preview: true } },
  { path: 'page/:slug', component: CmsPageComponent },
  { path: 'terms', redirectTo: 'page/terms', pathMatch: 'full' },
  { path: 'privacy', redirectTo: 'page/privacy', pathMatch: 'full' },
  { path: 'product/:code', component: ProductDetailComponent },
  { path: 'c/:code', component: CategoryPageComponent },
  { path: 'search', component: SearchPageComponent },
  { path: 'cart', component: CartPageComponent, canActivate: [AuthGuard] },
  { path: 'checkout', component: CheckoutPageComponent, canActivate: [AuthGuard] },
  { path: 'checkout/confirmation/:checkoutId', component: CheckoutConfirmationPageComponent, canActivate: [AuthGuard] },
  { path: 'account/orders/:code', component: OrderDetailPageComponent, canActivate: [AuthGuard] },
  { path: 'account/orders', component: OrdersPageComponent, canActivate: [AuthGuard] },
  { path: '**', component: NotFoundPageComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'enabled' })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
