import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { GatewayEnvelope, JuliCheckoutSubmission, JuliCheckoutResult } from '../models/ubris-commerce.models';

@Injectable({ providedIn: 'root' })
export class UbrisCheckoutAdapter {
  constructor(private readonly http: HttpClient) {}

  submit(body: JuliCheckoutSubmission): Observable<GatewayEnvelope<JuliCheckoutResult>> {
    return this.http.post<GatewayEnvelope<JuliCheckoutResult>>(
      `${environment.ubrisApiBaseUrl}/api/bff/checkout/submit`,
      body
    );
  }

  getStatus(checkoutId: string): Observable<GatewayEnvelope<Record<string, unknown>>> {
    return this.http.get<GatewayEnvelope<Record<string, unknown>>>(
      `${environment.ubrisApiBaseUrl}/api/bff/order-process/sagas/${encodeURIComponent(checkoutId)}`
    );
  }
}
