import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private readonly authService: AuthService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.authService.token;
    const isUbrisRequest = req.url.startsWith(environment.ubrisApiBaseUrl);

    if (!isUbrisRequest) {
      return next.handle(req);
    }

    const headers: Record<string, string> = {
      'X-Tenant-Id': 'default',
      'X-Base-Site': 'electronics',
      'X-Channel': 'B2C'
    };

    if (token) {
      headers.Authorization = token;
    }

    return next.handle(req.clone({ setHeaders: headers }));
  }
}
