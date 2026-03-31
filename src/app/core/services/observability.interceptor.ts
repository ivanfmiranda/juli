import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { JuliObservabilityService } from '../services/observability.service';
import { JuliErrorCategory } from '../models/observability.models';
import { environment } from '../../../environments/environment';

@Injectable()
export class ObservabilityInterceptor implements HttpInterceptor {
  constructor(private readonly obs: JuliObservabilityService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const isUbrisRequest = req.url.startsWith(environment.ubrisApiBaseUrl);
    
    if (!isUbrisRequest) {
      return next.handle(req);
    }

    const correlationId = this.obs.getCorrelationId();
    const startTime = Date.now();
    const operationName = this.getOperationName(req);

    // Enriquecendo a requisição com CorrelationID
    const authReq = req.clone({
      setHeaders: {
        'X-Correlation-ID': correlationId
      }
    });

    return next.handle(authReq).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          const latency = Date.now() - startTime;
          this.obs.log({
            level: 'INFO',
            message: `HTTP Response: ${req.method} ${req.url} - ${event.status} (${latency}ms)`,
            correlationId,
            context: { 
              latency, 
              status: event.status, 
              operation: operationName,
              // Evitar log de PII em payloads
              url: req.url
            },
            timestamp: new Date().toISOString()
          });
        }
      }),
      catchError((error: HttpErrorResponse) => {
        const latency = Date.now() - startTime;
        const category = this.mapErrorCategory(error);

        this.obs.reportError({
          code: `HTTP_${error.status}`,
          category,
          operation: operationName,
          userMessage: this.getUserMessage(error),
          technicalMessage: `HTTP Error: ${req.method} ${req.url} failed with status ${error.status} after ${latency}ms. Error: ${error.message}`,
          correlationId,
          originalError: error,
          retriable: this.isRetriable(error)
        });

        return throwError(error);
      })
    );
  }

  private getOperationName(req: HttpRequest<unknown>): string {
    // Tenta extrair um nome lógico baseado na URL
    const url = req.url;
    if (url.includes('/cart')) return 'CART_OP';
    if (url.includes('/checkout')) return 'CHECKOUT_OP';
    if (url.includes('/orders')) return 'ORDER_OP';
    if (url.includes('/auth')) return 'AUTH_OP';
    return 'UNKNOWN_HTTP_OP';
  }

  private mapErrorCategory(error: HttpErrorResponse): JuliErrorCategory {
    if (error.status === 0) return JuliErrorCategory.TIMEOUT;
    if (error.status >= 500) return JuliErrorCategory.BACKEND;
    if (error.status === 402) return JuliErrorCategory.PAYMENT;
    if (error.status === 409) return JuliErrorCategory.CONSISTENCY;
    return JuliErrorCategory.INTEGRATION;
  }

  private isRetriable(error: HttpErrorResponse): boolean {
    // 502, 503, 504 e 408 são geralmente retriáveis
    return [0, 408, 502, 503, 504].includes(error.status);
  }

  private getUserMessage(error: HttpErrorResponse): string {
    if (error.status === 0) return 'Conexão interrompida. Verifique sua internet.';
    if (error.status === 401) return 'Sua sessão expirou. Faça login novamente.';
    if (error.status === 403) return 'Você não tem permissão para realizar esta ação.';
    if (error.status === 404) return 'O recurso solicitado não foi encontrado.';
    return 'Ocorreu um erro no servidor. Tente novamente em instantes.';
  }
}
