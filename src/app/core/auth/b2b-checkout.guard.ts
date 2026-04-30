import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, combineLatest, of } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { GuestSessionService } from './guest-session.service';
import { SiteChannelService } from '../services/site-channel.service';
import { JuliCartFacade } from '../commerce';

/**
 * Guard for {@code /checkout}. Forces authentication when the buyer
 * cannot complete the order anonymously:
 *
 * <ul>
 *   <li><b>B2B-only tenant</b> — checkout always requires a logged-in
 *       buyer; the order needs to resolve to a company/unit and the
 *       fulfillment chain has no anonymous path.</li>
 *   <li><b>HYBRID tenant + cart with B2B-only entries</b> — the cart
 *       carries unit-scoped products. Even on a HYBRID tenant we cannot
 *       process a B2B order without identity (no contract pricing, no
 *       approval chain, no NF-e for the buyer's unit).</li>
 * </ul>
 *
 * Pure B2C tenants and HYBRID tenants whose cart is fully consumer
 * fall through and reach the guest checkout flow.
 */
@Injectable({ providedIn: 'root' })
export class B2bCheckoutGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    private readonly siteChannel: SiteChannelService,
    private readonly cartFacade: JuliCartFacade,
    private readonly guestSession: GuestSessionService,
    private readonly router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    return combineLatest([
      this.siteChannel.channel$,
      this.auth.session$,
      this.cartFacade.cart$
    ]).pipe(
      take(1),
      switchMap(([channel, session, cart]) => {
        if (session) return of<boolean | UrlTree>(true);

        const cartIsB2bOnly = !!cart?.hasB2bOnlyEntries;
        const tenantIsB2b = channel === 'B2B';
        if (tenantIsB2b || cartIsB2bOnly) {
          const reason = tenantIsB2b ? 'b2b-only' : 'b2b-cart';
          return of<boolean | UrlTree>(this.router.createUrlTree(['/login'], {
            queryParams: { returnUrl: '/checkout', reason }
          }));
        }

        // B2C anônimo passa, mas precisa de um guest-token Bearer pra
        // bater nas rotas /api/bff/checkout/** (que saíram do permit-all
        // após o cutover de ZT). Pré-fetcha aqui antes de liberar a rota
        // pra checkout-page entrar com o token na mão.
        return this.guestSession.ensure(cart?.code ?? null).pipe(
          map(token => token ? true : this.router.createUrlTree(['/cart'], {
            queryParams: { error: 'guest-token-failed' }
          }))
        );
      })
    );
  }
}
