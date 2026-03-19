import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

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
  private readonly sessionSubject = new BehaviorSubject<AuthSession | null>(this.restoreSession());

  readonly session$ = this.sessionSubject.asObservable();

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
      tap(session => this.persistSession(session))
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
