import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { GatewayEnvelope } from '../models/ubris-commerce.models';

@Injectable({ providedIn: 'root' })
export class UbrisCartAdapter {
  constructor(private readonly http: HttpClient) {}

  create(customerId: string): Observable<GatewayEnvelope<Record<string, unknown>>> {
    return this.http.post<GatewayEnvelope<Record<string, unknown>>>(
      `${environment.ubrisApiBaseUrl}/api/bff/cart`,
      {
        customerId,
        currency: 'USD',
        region: 'BR'
      }
    );
  }

  load(cartId: string): Observable<GatewayEnvelope<Record<string, unknown>>> {
    return this.http.get<GatewayEnvelope<Record<string, unknown>>>(
      `${environment.ubrisApiBaseUrl}/api/bff/cart/${encodeURIComponent(cartId)}`
    );
  }

  addEntry(cartId: string, sku: string, quantity: number): Observable<GatewayEnvelope<Record<string, unknown>>> {
    return this.http.post<GatewayEnvelope<Record<string, unknown>>>(
      `${environment.ubrisApiBaseUrl}/api/bff/cart/${encodeURIComponent(cartId)}/entries`,
      { sku, quantity }
    );
  }

  delete(cartId: string): Observable<GatewayEnvelope<string>> {
    return this.http.delete<GatewayEnvelope<string>>(
      `${environment.ubrisApiBaseUrl}/api/bff/cart/${encodeURIComponent(cartId)}`
    );
  }
}
