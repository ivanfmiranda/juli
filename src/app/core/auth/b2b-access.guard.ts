import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, combineLatest } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { SiteChannelService } from '../services/site-channel.service';

/**
 * Guard for tenants flagged as pure B2B. When the merchant chose B2B in
 * the wizard (no consumer flow at all), the storefront has no
 * meaningful entry for an anonymous visitor — they would land on a
 * catalog they can't transact with. This guard sends them to {@code
 * /login} until they authenticate.
 *
 * <p>HYBRID tenants are intentionally NOT gated — they accept both
 * consumer and corporate buyers, and the consumer flow must remain
 * usable without a session. B2C tenants are the default and never
 * trigger redirect.
 *
 * <p>Apply on any storefront route that should be authenticated for a
 * B2B-only tenant (homepage, product pages, cart, search). Routes that
 * already enforce auth via {@code AuthGuard} don't need this in
 * addition.
 */
@Injectable({ providedIn: 'root' })
export class B2bAccessGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    private readonly siteChannel: SiteChannelService,
    private readonly router: Router
  ) {}

  canActivate(): Observable<boolean | UrlTree> {
    return combineLatest([
      this.siteChannel.channel$,
      this.auth.session$
    ]).pipe(
      take(1),
      map(([channel, session]) => {
        if (channel !== 'B2B') return true;
        if (session) return true;
        return this.router.createUrlTree(['/login'], {
          queryParams: { reason: 'b2b-only' }
        });
      })
    );
  }
}
