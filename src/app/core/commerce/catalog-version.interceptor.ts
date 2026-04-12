import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PreviewTokenService } from '../cms/services/preview-token.service';
import { environment } from '../../../environments/environment';

@Injectable()
export class CatalogVersionInterceptor implements HttpInterceptor {
  constructor(private readonly previewToken: PreviewTokenService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!req.url.startsWith(environment.ubrisApiBaseUrl)) {
      return next.handle(req);
    }

    const catalogVersion = this.previewToken.getCatalogVersion();
    if (!catalogVersion || catalogVersion.toUpperCase() === 'ONLINE') {
      return next.handle(req);
    }

    const modified = req.clone({
      params: req.params.set('catalogVersion', catalogVersion.toUpperCase()),
    });
    return next.handle(modified);
  }
}
