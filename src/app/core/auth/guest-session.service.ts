import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

interface GuestTokenResponseEnvelope {
  data?: {
    accessToken?: string;
    tokenType?: string;
    expiresIn?: number;
    guestId?: string;
  };
}

interface GuestSession {
  accessToken: string;
  tokenType: string;
  guestId: string;
  expiresAt: number;
}

/**
 * Holds the short-lived guest checkout JWT minted by tenant-identity.
 * The Zero-Trust cutover dropped permit-all from {@code /api/bff/checkout/**}
 * so anonymous buyers must present a Bearer to enter the funnel. The
 * guard requests this token before navigating into checkout; the auth
 * interceptor falls back to it on checkout requests when there is no
 * user session.
 *
 * <p>Token lives 15 min (TTL set server-side). We preempt expiry by
 * refreshing at 80% of TTL — same shape as
 * {@code ServiceTokenClient}'s cache. Stored only in memory: not
 * persisted to localStorage to keep it short-lived (a tab close drops
 * it; another tab can mint a fresh one anytime).
 */
@Injectable({ providedIn: 'root' })
export class GuestSessionService {
  private readonly subject = new BehaviorSubject<GuestSession | null>(null);
  readonly session$: Observable<GuestSession | null> = this.subject.asObservable();

  private inflight: Observable<GuestSession | null> | null = null;

  constructor(private readonly http: HttpClient) {}

  /**
   * Synchronous bearer accessor for the auth interceptor. Returns null
   * when no token has been minted or it has already expired.
   */
  authorizationHeader(): string | null {
    const session = this.subject.value;
    if (!session) return null;
    if (session.expiresAt && Date.now() >= session.expiresAt) return null;
    return `${session.tokenType} ${session.accessToken}`;
  }

  /**
   * Ensure we have a non-expired guest token. Returns the cached token
   * when fresh, otherwise mints a new one. {@code cartId} is optional —
   * pass it to bind the token to one cart so a leaked token can't be
   * replayed against another cart.
   */
  ensure(cartId?: string | null): Observable<GuestSession | null> {
    const current = this.subject.value;
    const fresh = current && current.expiresAt - Date.now() > 30_000; // >30s remaining
    if (fresh) return of(current);
    if (this.inflight) return this.inflight;
    this.inflight = this.fetch(cartId);
    this.inflight.subscribe({
      complete: () => { this.inflight = null; },
      error: () => { this.inflight = null; }
    });
    return this.inflight;
  }

  clear(): void {
    this.subject.next(null);
  }

  private fetch(cartId?: string | null): Observable<GuestSession | null> {
    const body: Record<string, unknown> = {};
    if (cartId) body['cartId'] = cartId;
    return this.http
      .post<GuestTokenResponseEnvelope>(`${environment.ubrisApiBaseUrl}/api/bff/auth/guest-token`, body)
      .pipe(
        map(response => {
          const data = response?.data;
          if (!data || !data.accessToken) return null;
          const expiresIn = data.expiresIn ?? 900;
          const session: GuestSession = {
            accessToken: data.accessToken,
            tokenType: data.tokenType ?? 'Bearer',
            guestId: data.guestId ?? '',
            // Refresh at 80% of TTL — leaves headroom for clock drift.
            expiresAt: Date.now() + Math.max(60_000, Math.floor(expiresIn * 1000 * 0.8))
          };
          this.subject.next(session);
          return session;
        }),
        catchError(() => {
          this.subject.next(null);
          return of(null);
        })
      );
  }
}
