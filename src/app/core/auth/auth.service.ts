import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { TenantHostService } from '../services/tenant-host.service';

export interface AnonymousPrincipal {
  anonymousId: string;
  principalType: 'ANONYMOUS';
  createdAt: Date;
}

// Re-export for convenience
export type { AnonymousPrincipal as AnonymousPrincipalType };

export interface AuthSession {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  expiresAt?: number;
  username: string;
  userType?: string;
  roles: string[];
}

type LoginEnvelope = {
  success?: boolean;
  data?: AuthSession;
  message?: string | null;
};

export interface TotpSetupPayload {
  factorId: string;
  secret: string;
  otpAuthUri: string;
  recoveryCodes: string[];
}

/** Backend BFF wraps responses in {success, data} for some endpoints; unwrap when present. */
function unwrap<T>(r: any): T {
  if (r && typeof r === 'object' && 'data' in r) return r.data as T;
  return r as T;
}

/** A session token in the MFA-pending state — short TTL, no roles, only good for /mfa/verify. */
export function isMfaPending(session: AuthSession | null | undefined): boolean {
  return !!session && Array.isArray(session.roles) && session.roles.includes('MFA_PENDING');
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly sessionSubject: BehaviorSubject<AuthSession | null>;
  private readonly anonymousPrincipalSubject: BehaviorSubject<AnonymousPrincipal | null>;

  readonly session$: Observable<AuthSession | null>;
  readonly anonymousPrincipal$: Observable<AnonymousPrincipal | null>;

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
    private readonly tenantHost: TenantHostService
  ) {
    this.sessionSubject = new BehaviorSubject<AuthSession | null>(this.restoreSession());
    this.anonymousPrincipalSubject = new BehaviorSubject<AnonymousPrincipal | null>(this.restoreAnonymousPrincipal());
    this.session$ = this.sessionSubject.asObservable();
    this.anonymousPrincipal$ = this.anonymousPrincipalSubject.asObservable();
  }

  private storageKey(base: string): string {
    const tenant = this.tenantHost.currentTenantId();
    return `${base}.${tenant}`;
  }

  login(username: string, password: string): Observable<AuthSession> {
    return this.http.post<LoginEnvelope>(`${environment.ubrisApiBaseUrl}/api/bff/auth/login`, {
      username,
      password,
      tenantId: this.tenantHost.currentTenantId()
    }).pipe(
      map(response => {
        if (!response?.data?.accessToken) {
          throw new Error(response?.message || 'Login failed');
        }
        return response.data;
      }),
      tap(session => {
        this.persistSession(session);
      })
    );
  }

  register(username: string, password: string): Observable<AuthSession> {
    return this.http.post<LoginEnvelope>(`${environment.ubrisApiBaseUrl}/api/bff/auth/register`, {
      username,
      password,
      tenantId: this.tenantHost.currentTenantId()
    }).pipe(
      map(response => {
        if (!response?.data?.accessToken) {
          throw new Error(response?.message || 'Registration failed');
        }
        return response.data;
      }),
      tap(session => {
        this.persistSession(session);
      })
    );
  }

  /**
   * Kick off a password-reset email. Backend (ubris-tenant-identity) always
   * replies 204 — even when the email is unknown — so callers MUST NOT try
   * to surface "user not found" to the UI. The void Observable just tells
   * the caller the request round-tripped successfully.
   */
  requestPasswordReset(email: string): Observable<void> {
    return this.http.post<void>(`${environment.ubrisApiBaseUrl}/api/bff/auth/password-reset/request`, {
      email,
      tenantId: this.tenantHost.currentTenantId()
    });
  }

  /**
   * Consume the opaque token that was emailed and set a new password. A
   * 4xx from the backend (generic INVALID_TOKEN) surfaces as an RxJS error
   * so the UI can show the "invalid or expired" message.
   */
  confirmPasswordReset(token: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${environment.ubrisApiBaseUrl}/api/bff/auth/password-reset/confirm`, {
      token,
      newPassword,
      tenantId: this.tenantHost.currentTenantId()
    });
  }

  /**
   * Sign in via a Google ID token obtained from Google Identity Services.
   * Backend may respond with a session JWT OR a {@code roles=[MFA_PENDING]}
   * envelope when the user has MFA enabled — caller is responsible for
   * inspecting the result and stitching in the second factor flow.
   */
  loginWithGoogle(idToken: string): Observable<AuthSession> {
    return this.http.post<LoginEnvelope>(`${environment.ubrisApiBaseUrl}/api/bff/auth/social/google`, {
      idToken,
      tenantId: this.tenantHost.currentTenantId()
    }).pipe(
      map(response => {
        if (!response?.data?.accessToken) {
          throw new Error(response?.message || 'Google sign-in failed');
        }
        return response.data;
      }),
      tap(session => {
        // MFA-pending tokens have roles=[MFA_PENDING] and short TTL —
        // we do NOT call persistSession here; the caller must finish
        // the second factor and then call setSession on the upgraded JWT.
        if (!isMfaPending(session)) {
          this.persistSession(session);
        }
      })
    );
  }

  /**
   * Trade an mfa-pending token + 6-digit code for a full session JWT.
   * The pending token from {@link login} or {@link loginWithGoogle}
   * is forwarded as the bearer.
   */
  verifyMfa(pendingToken: string, code: string): Observable<AuthSession> {
    return this.http.post<LoginEnvelope>(
      `${environment.ubrisApiBaseUrl}/api/bff/auth/mfa/verify`,
      { code },
      { headers: { Authorization: `Bearer ${pendingToken}` } }
    ).pipe(
      map(response => {
        if (!response?.data?.accessToken) {
          throw new Error(response?.message || 'MFA verification failed');
        }
        return response.data;
      }),
      tap(session => this.persistSession(session))
    );
  }

  // ─── MFA management (used by /account/security) ──────────────────────

  /** Begin TOTP enrollment — returns secret + otpauth URI + recovery codes (1×). */
  startTotpSetup(): Observable<TotpSetupPayload> {
    return this.http.post<{ data: TotpSetupPayload } | TotpSetupPayload>(
      `${environment.ubrisApiBaseUrl}/api/bff/mfa/totp/setup`,
      {}
    ).pipe(map(r => unwrap<TotpSetupPayload>(r)));
  }

  activateTotp(code: number): Observable<void> {
    return this.http.post<void>(
      `${environment.ubrisApiBaseUrl}/api/bff/mfa/totp/activate`,
      { code }
    );
  }

  disableTotp(): Observable<void> {
    return this.http.delete<void>(`${environment.ubrisApiBaseUrl}/api/bff/mfa/totp`);
  }

  totpStatus(): Observable<{ required: boolean }> {
    return this.http.get<{ data: { required: boolean } } | { required: boolean }>(
      `${environment.ubrisApiBaseUrl}/api/bff/mfa/totp/status`
    ).pipe(map(r => unwrap<{ required: boolean }>(r)));
  }

  logout(): void {
    localStorage.removeItem(this.storageKey('juli.session'));
    this.sessionSubject.next(null);
    void this.router.navigate(['/login']);
  }

  get token(): string | null {
    const session = this.sessionSubject.value;
    if (!session?.accessToken) {
      return null;
    }
    if (session.expiresAt && Date.now() >= session.expiresAt) {
      this.clearSession();
      return null;
    }
    const tokenType = session.tokenType || 'Bearer';
    return `${tokenType} ${session.accessToken}`;
  }

  clearSession(): void {
    localStorage.removeItem(this.storageKey('juli.session'));
    this.sessionSubject.next(null);
  }

  get isAuthenticated(): boolean {
    return !!this.token;
  }

  get currentSession(): AuthSession | null {
    return this.sessionSubject.value;
  }

  get currentAnonymousPrincipal(): AnonymousPrincipal | null {
    return this.anonymousPrincipalSubject.value;
  }

  generateAnonymousId(): string {
    const browserCrypto = typeof crypto !== 'undefined'
      ? (crypto as Crypto & { randomUUID?: () => string })
      : undefined;

    if (browserCrypto?.randomUUID) {
      return browserCrypto.randomUUID();
    }

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
      const random = (Math.random() * 16) | 0;
      const value = char === 'x' ? random : (random & 0x3) | 0x8;
      return value.toString(16);
    });
  }

  createAnonymousPrincipal(): AnonymousPrincipal {
    const anonymousPrincipal: AnonymousPrincipal = {
      anonymousId: this.generateAnonymousId(),
      principalType: 'ANONYMOUS',
      createdAt: new Date()
    };
    this.persistAnonymousPrincipal(anonymousPrincipal);
    return anonymousPrincipal;
  }

  hasAnonymousCart(): boolean {
    // Check both the principal and localStorage
    if (this.anonymousPrincipalSubject.value !== null) {
      return true;
    }
    // Also check localStorage directly for cross-tab scenarios
    if (typeof localStorage !== 'undefined') {
      const cartData = localStorage.getItem(this.storageKey('juli.anon.cart'));
      if (cartData) {
        try {
          const parsed = JSON.parse(cartData);
          // Check if token is not expired
          if (parsed.expiresAt && new Date(parsed.expiresAt) > new Date()) {
            return true;
          }
        } catch {
          return false;
        }
      }
    }
    return false;
  }

  clearAnonymousPrincipal(): void {
    localStorage.removeItem(this.storageKey('juli.anon.principal'));
    this.anonymousPrincipalSubject.next(null);
  }

  /**
   * Restores or creates an anonymous principal with a specific anonymousId.
   * Used when restoring an anonymous cart from storage.
   */
  restoreAnonymousPrincipalWithId(anonymousId: string): AnonymousPrincipal {
    const anonymousPrincipal: AnonymousPrincipal = {
      anonymousId,
      principalType: 'ANONYMOUS',
      createdAt: new Date()
    };
    this.persistAnonymousPrincipal(anonymousPrincipal);
    return anonymousPrincipal;
  }

  private persistAnonymousPrincipal(anonymousPrincipal: AnonymousPrincipal): void {
    localStorage.setItem(this.storageKey('juli.anon.principal'), JSON.stringify(anonymousPrincipal));
    this.anonymousPrincipalSubject.next(anonymousPrincipal);
  }

  private restoreAnonymousPrincipal(): AnonymousPrincipal | null {
    const key = this.storageKey('juli.anon.principal');
    const raw = localStorage.getItem(key);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw);
      return {
        ...parsed,
        createdAt: new Date(parsed.createdAt)
      } as AnonymousPrincipal;
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  }

  private persistSession(session: AuthSession): void {
    if (!session.expiresAt && session.expiresIn) {
      session.expiresAt = Date.now() + session.expiresIn * 1000;
    }
    localStorage.setItem(this.storageKey('juli.session'), JSON.stringify(session));
    this.sessionSubject.next(session);
  }

  private restoreSession(): AuthSession | null {
    const key = this.storageKey('juli.session');
    const raw = localStorage.getItem(key);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AuthSession;
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  }
}
