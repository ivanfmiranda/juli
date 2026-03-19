import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { GatewayEnvelope } from '../models/ubris-commerce.models';

@Injectable({ providedIn: 'root' })
export class UbrisOrderAdapter {
  constructor(private readonly http: HttpClient) {}

  list(customerId: string): Observable<GatewayEnvelope<Record<string, unknown>[]>> {
    const params = new HttpParams()
      .set('tenantId', 'default')
      .set('customerId', customerId);

    return this.http.get<GatewayEnvelope<Record<string, unknown>[]>>(
      `${environment.ubrisApiBaseUrl}/api/bff/query/orders`,
      { params }
    );
  }
}
