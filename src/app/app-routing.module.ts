import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/auth/auth.guard';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { CmsPageComponent } from './pages/cms-page/cms-page.component';
import { ProductDetailComponent } from './pages/product-detail/product-detail.component';
import { CategoryPageComponent } from './pages/category-page/category-page.component';
import { SearchPageComponent } from './pages/search-page/search-page.component';
import { CartPageComponent } from './pages/cart-page/cart-page.component';
import { OrdersPageComponent } from './pages/orders-page/orders-page.component';
import { OrderDetailPageComponent } from './pages/order-detail-page/order-detail-page.component';
import { WishlistPageComponent } from './pages/wishlist-page/wishlist-page.component';
import { NotFoundPageComponent } from './core/cms/fallback';
import { PreviewEntryComponent } from './pages/preview-entry/preview-entry.component';
import { PageRendererComponent } from './pages/page-renderer/page-renderer.component';

const routes: Routes = [
  // Auth
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // Homepage (PageRenderer with slug='home')
  { path: '', pathMatch: 'full', component: PageRendererComponent },

  // Commerce
  { path: 'product/:code', component: ProductDetailComponent },
  { path: 'c/:code', component: CategoryPageComponent },
  { path: 'search', component: SearchPageComponent },
  { path: 'cart', component: CartPageComponent },
  { path: 'checkout', loadChildren: () => import('./pages/checkout-page/checkout.module').then(m => m.CheckoutModule), canActivate: [AuthGuard] },

  // Account
  { path: 'account/orders/:code', component: OrderDetailPageComponent, canActivate: [AuthGuard] },
  { path: 'account/orders', component: OrdersPageComponent, canActivate: [AuthGuard] },
  { path: 'account/wishlist', component: WishlistPageComponent, canActivate: [AuthGuard] },

  // CMS Preview
  { path: 'preview', component: PreviewEntryComponent },
  { path: 'page/preview/:slug', component: CmsPageComponent, data: { preview: true } },

  // Legacy CMS routes (backwards compat)
  { path: 'page/:slug', component: CmsPageComponent },
  { path: 'pages/:slug', component: PageRendererComponent },

  // Clean CMS pages (catch-all — must be last before **)
  { path: ':slug', component: PageRendererComponent },
  { path: '**', component: NotFoundPageComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'enabled' })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
