import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { JuliI18nService } from './i18n.service';
import { TenantHostService } from '../services/tenant-host.service';

@Injectable()
export class LocaleInterceptor implements HttpInterceptor {
  constructor(
    private readonly i18n: JuliI18nService,
    private readonly tenantHost: TenantHostService
  ) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const isUbrisRequest = req.url.startsWith(environment.ubrisApiBaseUrl);
    const isStrapiRequest = req.url.startsWith(environment.strapiApiBaseUrl);
    if (!isUbrisRequest && !isStrapiRequest) {
      return next.handle(req);
    }

    const tenantContext = this.tenantHost.current();
    return next.handle(req.clone({
      setHeaders: {
        'Accept-Language': this.i18n.currentLocale,
        'X-Locale': this.i18n.currentLocale,
        'X-Tenant-Id': tenantContext.tenantId,
        'X-Base-Site': tenantContext.baseSiteId
      }
    }));
  }
}
