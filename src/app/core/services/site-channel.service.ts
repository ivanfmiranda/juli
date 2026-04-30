import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/**
 * Commercial channel of the active storefront — sourced from
 * {@code /api/bff/tenant/context} which the gateway-bff resolves from
 * the tenant's {@code base_site.channel}. Drives storefront-side
 * decisions that depend on the merchant's mode rather than the buyer's
 * membership (which is in {@link B2bContextService}). Examples:
 *
 * <ul>
 *   <li>Hide consumer-facing surfaces on a B2B-only tenant (gate the
 *       whole storefront behind login).</li>
 *   <li>Default the cart "Solicitar Cotação" entry point to be more
 *       prominent on HYBRID tenants.</li>
 *   <li>Tweak copy / wording when the tenant is B2B (e.g. "comprar"
 *       vs. "solicitar").</li>
 * </ul>
 *
 * Resolution is best-effort: a failed fetch defaults to {@code B2C} so
 * the storefront keeps rendering — better to risk showing the consumer
 * UX on a flaky tenant-config call than to leave the buyer staring at a
 * blocked page.
 */
export type SiteChannel = 'B2C' | 'B2B' | 'HYBRID';

interface TenantContextResponse {
  tenantId?: string;
  baseSiteId?: string;
  channel?: string;
  locale?: string;
  currency?: string;
  country?: string;
}

interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  message?: string | null;
}

@Injectable({ providedIn: 'root' })
export class SiteChannelService {
  private readonly subject = new BehaviorSubject<SiteChannel>('B2C');
  readonly channel$: Observable<SiteChannel> = this.subject.asObservable();

  constructor(private readonly http: HttpClient) {}

  /**
   * Fetch the channel once at app boot. Returns an Observable so the app
   * initializer can wait on it (kept short — failure falls through to
   * the B2C default within ~3s).
   */
  init(): Observable<SiteChannel> {
    return this.http
      .get<ApiResponse<TenantContextResponse>>(`${environment.ubrisApiBaseUrl}/api/bff/tenant/context`)
      .pipe(
        map(response => this.parseChannel(response?.data?.channel)),
        catchError(() => of<SiteChannel>('B2C')),
        tap(channel => this.subject.next(channel))
      );
  }

  current(): SiteChannel {
    return this.subject.value;
  }

  /** True when the tenant operates in pure B2B mode (no consumer flow). */
  isB2bOnly(): boolean {
    return this.subject.value === 'B2B';
  }

  /** True when the tenant operates in either B2B or HYBRID mode. */
  hasB2bSurface(): boolean {
    const c = this.subject.value;
    return c === 'B2B' || c === 'HYBRID';
  }

  private parseChannel(raw: string | undefined): SiteChannel {
    if (!raw) return 'B2C';
    const upper = raw.trim().toUpperCase();
    if (upper === 'B2B') return 'B2B';
    if (upper === 'HYBRID') return 'HYBRID';
    return 'B2C';
  }
}
