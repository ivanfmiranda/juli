import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

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
  username: string;
  userType?: string;
  roles: string[];
}

type LoginEnvelope = {
  success?: boolean;
  data?: AuthSession;
  message?: string | null;
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly storageKey = 'juli.session';
  private readonly anonStorageKey = 'juli.anon.principal';
  private readonly sessionSubject = new BehaviorSubject<AuthSession | null>(this.restoreSession());
  private readonly anonymousPrincipalSubject = new BehaviorSubject<AnonymousPrincipal | null>(this.restoreAnonymousPrincipal());

  readonly session$ = this.sessionSubject.asObservable();
  readonly anonymousPrincipal$ = this.anonymousPrincipalSubject.asObservable();

  constructor(private readonly http: HttpClient, private readonly router: Router) {}

  login(username: string, password: string): Observable<AuthSession> {
    return this.http.post<LoginEnvelope>(`${environment.ubrisApiBaseUrl}/api/bff/auth/login`, {
      username,
      password
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

  logout(): void {
    localStorage.removeItem(this.storageKey);
    this.sessionSubject.next(null);
    void this.router.navigate(['/login']);
  }

  get token(): string | null {
    const session = this.sessionSubject.value;
    if (!session?.accessToken) {
      return null;
    }
    const tokenType = session.tokenType || 'Bearer';
    return `${tokenType} ${session.accessToken}`;
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
      const cartData = localStorage.getItem('juli.anon.cart');
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
    localStorage.removeItem(this.anonStorageKey);
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
    localStorage.setItem(this.anonStorageKey, JSON.stringify(anonymousPrincipal));
    this.anonymousPrincipalSubject.next(anonymousPrincipal);
  }

  private restoreAnonymousPrincipal(): AnonymousPrincipal | null {
    const raw = localStorage.getItem(this.anonStorageKey);
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
      localStorage.removeItem(this.anonStorageKey);
      return null;
    }
  }

  private persistSession(session: AuthSession): void {
    localStorage.setItem(this.storageKey, JSON.stringify(session));
    this.sessionSubject.next(session);
  }

  private restoreSession(): AuthSession | null {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AuthSession;
    } catch {
      localStorage.removeItem(this.storageKey);
      return null;
    }
  }
}
