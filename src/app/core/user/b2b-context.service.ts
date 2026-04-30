import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';

/**
 * Wire-shape returned by `GET /api/bff/me/b2b-context` (proxies the
 * `UserAssignmentResponse` from `ubris-b2b-platform`). All fields beyond
 * `username` are nullable — the merchant model lets a buyer be linked to
 * a company without a sub-unit, and the `role` decides whether they see
 * approver-side surfaces.
 */
export interface B2bAssignment {
  username: string;
  companyId?: string | null;
  companyName?: string | null;
  unitId?: string | null;
  unitName?: string | null;
  // Endereço da unidade — vem do upstream b2b-platform como denormalização
  // do {@code UnitEntity}; o checkout B2B usa esses campos pra pré-popular
  // o form, com fallback para o endereço default do profile quando line1
  // estiver vazio.
  unitLine1?: string | null;
  unitLine2?: string | null;
  unitCity?: string | null;
  unitRegion?: string | null;
  unitPostalCode?: string | null;
  unitCountryIso?: string | null;
  role?: string | null;
  active?: boolean;
}

interface ApiResponse<T> {
  success?: boolean;
  data?: T | null;
  message?: string | null;
}

/**
 * Resolves and caches the authenticated buyer's B2B membership. Drives
 * which storefront surfaces unlock corporate UX (header company badge,
 * "Solicitar cotação" on cart, "Minhas cotações" in the account, the
 * approval-aware checkout). Subscribes to {@link AuthService.session$}
 * so the context is fetched on login, retained across the session and
 * cleared on logout — buyers without a membership see {@code null}
 * here and the storefront falls back to the standard B2C flow.
 *
 * <p>Ergonomics: the upstream BFF endpoint maps {@code 404} to {@code
 * null}, so we treat {@code data == null} as "no membership" rather
 * than an error. Only HTTP failures bubble up via the inner `catchError`
 * and degrade silently to {@code null} — better to render B2C than to
 * block the page on a transient assignment lookup hiccup.
 */
@Injectable({ providedIn: 'root' })
export class B2bContextService {
  private readonly subject = new BehaviorSubject<B2bAssignment | null>(null);
  readonly context$: Observable<B2bAssignment | null> = this.subject.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly auth: AuthService
  ) {
    // Refresh the context whenever the session identity changes — login
    // produces a non-null session, logout produces null. distinctUntilChanged
    // keeps redundant emits (token rotations on the same user) from
    // refetching needlessly.
    this.auth.session$.pipe(
      map(session => session?.username ?? null),
      distinctUntilChanged(),
      switchMap(username => {
        if (!username) {
          this.subject.next(null);
          return of(null);
        }
        return this.fetch();
      })
    ).subscribe();
  }

  /** Snapshot accessor — null when there is no membership or fetch failed. */
  current(): B2bAssignment | null {
    return this.subject.value;
  }

  /** Convenience flag — true when the buyer has any active company link. */
  isB2b(): boolean {
    const assignment = this.subject.value;
    return Boolean(assignment && assignment.active && assignment.companyId);
  }

  /**
   * Force a re-fetch. Useful after assignment writes (admin attaches the
   * buyer to a company, role gets bumped, etc.) when the storefront
   * doesn't naturally re-login but should reflect the new context.
   */
  refresh(): Observable<B2bAssignment | null> {
    return this.fetch();
  }

  private fetch(): Observable<B2bAssignment | null> {
    return this.http
      .get<ApiResponse<B2bAssignment>>(`${environment.ubrisApiBaseUrl}/api/bff/me/b2b-context`)
      .pipe(
        map(response => {
          if (!response || response.data == null) return null;
          return response.data;
        }),
        catchError(() => of(null)),
        tap(assignment => this.subject.next(assignment))
      );
  }
}
