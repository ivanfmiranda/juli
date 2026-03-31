import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { TenantHostService } from '../services/tenant-host.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private readonly authService: AuthService,
    private readonly tenantHost: TenantHostService
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
}
