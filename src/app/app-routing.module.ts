import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/auth/auth.guard';
import { B2bAccessGuard } from './core/auth/b2b-access.guard';
import { B2bCheckoutGuard } from './core/auth/b2b-checkout.guard';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { CmsPageComponent } from './pages/cms-page/cms-page.component';
import { ProductDetailComponent } from './pages/product-detail/product-detail.component';
import { CategoryPageComponent } from './pages/category-page/category-page.component';
import { SearchPageComponent } from './pages/search-page/search-page.component';
import { CartPageComponent } from './pages/cart-page/cart-page.component';
import { OrdersPageComponent } from './pages/orders-page/orders-page.component';
import { OrderDetailPageComponent } from './pages/order-detail-page/order-detail-page.component';
import { AccountQuotesPageComponent } from './pages/account-quotes-page/account-quotes-page.component';
import { AccountQuoteDetailPageComponent } from './pages/account-quote-detail-page/account-quote-detail-page.component';
import { AccountApprovalsInboxPageComponent } from './pages/account-approvals-inbox-page/account-approvals-inbox-page.component';
import { WishlistPageComponent } from './pages/wishlist-page/wishlist-page.component';
import { AccountAddressesPageComponent } from './pages/account-addresses-page/account-addresses-page.component';
import { ReturnsPageComponent } from './pages/returns-page/returns-page.component';
import { NotFoundPageComponent } from './core/cms/fallback';
import { PreviewEntryComponent } from './pages/preview-entry/preview-entry.component';
import { PageRendererComponent } from './pages/page-renderer/page-renderer.component';

const routes: Routes = [
  // Auth
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'recuperar-senha', component: ForgotPasswordComponent },
  { path: 'redefinir-senha', component: ResetPasswordComponent },
  // English/legacy aliases — the password-reset email link sent by the
  // backend (PasswordResetService.buildResetLink) points at /reset-password,
  // so both paths must render the same component.
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },

  // Homepage (PageRenderer with slug='home')
  // B2bAccessGuard kicks in only when base_site.channel === 'B2B' (pure
  // B2B tenant). HYBRID and B2C tenants pass through unchanged.
  { path: '', pathMatch: 'full', component: PageRendererComponent, canActivate: [B2bAccessGuard] },

  // Commerce
  { path: 'product/:code', component: ProductDetailComponent, canActivate: [B2bAccessGuard] },
  { path: 'c/:code', component: CategoryPageComponent, canActivate: [B2bAccessGuard] },
  { path: 'search', component: SearchPageComponent, canActivate: [B2bAccessGuard] },
  { path: 'cart', component: CartPageComponent, canActivate: [B2bAccessGuard] },
  // Guest-friendly: B2bCheckoutGuard substitui o AuthGuard antigo.
  // Anônimo entra direto quando o tenant é B2C e o cart não tem entries
  // B2B-only; os demais cenários (tenant B2B, cart com produto unit-scoped)
  // redirecionam pra /login com returnUrl=/checkout.
  { path: 'checkout', loadChildren: () => import('./pages/checkout-page/checkout.module').then(m => m.CheckoutModule), canActivate: [B2bCheckoutGuard] },

  // Account
  { path: 'account/orders/:code', component: OrderDetailPageComponent, canActivate: [AuthGuard] },
  { path: 'account/orders', component: OrdersPageComponent, canActivate: [AuthGuard] },
  { path: 'account/quotes/:id', component: AccountQuoteDetailPageComponent, canActivate: [AuthGuard] },
  { path: 'account/quotes', component: AccountQuotesPageComponent, canActivate: [AuthGuard] },
  { path: 'account/inbox-aprovacoes', component: AccountApprovalsInboxPageComponent, canActivate: [AuthGuard] },
  { path: 'account/wishlist', component: WishlistPageComponent, canActivate: [AuthGuard] },
  { path: 'account/addresses', component: AccountAddressesPageComponent, canActivate: [AuthGuard] },
  { path: 'account/returns', component: ReturnsPageComponent, canActivate: [AuthGuard] },

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
