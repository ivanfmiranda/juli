import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { GuestSessionService } from './guest-session.service';
import { environment } from '../../../environments/environment';
import { TenantHostService } from '../services/tenant-host.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private readonly authService: AuthService,
    private readonly tenantHost: TenantHostService,
    private readonly guestSession: GuestSessionService
  ) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.authService.token;
    const isUbrisRequest = req.url.startsWith(environment.ubrisApiBaseUrl);

    if (!isUbrisRequest) {
      return next.handle(req);
    }

    const tenantContext = this.tenantHost.current();
    const headers: Record<string, string> = {
      'X-Tenant-Id': tenantContext.tenantId,
      'X-Channel': 'B2C'
    };
    if (!tenantContext.systemHost && tenantContext.baseSiteId) {
      headers['X-Base-Site'] = tenantContext.baseSiteId;
    }

    if (token) {
      headers.Authorization = token;
    } else {
      // Anonymous fallback: guest checkout requires a Bearer after the
      // Zero-Trust cutover. The guard pre-fetches the token before
      // navigation; this just propagates it to checkout requests.
      const guestAuth = this.guestSession.authorizationHeader();
      if (guestAuth && this.requiresGuestToken(req.url)) {
        headers.Authorization = guestAuth;
      }
    }

    return next.handle(req.clone({ setHeaders: headers })).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && this.authService.isAuthenticated) {
          this.authService.logout();
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Whether the URL belongs to the checkout funnel and therefore needs
   * a Bearer token (user or guest) after the Zero-Trust cutover. Other
   * permit-all paths (cart, tenant context) keep working anonymously.
   */
  private requiresGuestToken(url: string): boolean {
    return url.includes('/api/bff/checkout') || url.includes('/api/checkout');
  }
}
