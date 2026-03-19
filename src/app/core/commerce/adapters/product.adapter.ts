import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { GatewayEnvelope } from '../models/ubris-commerce.models';

@Injectable({ providedIn: 'root' })
export class UbrisProductAdapter {
  constructor(private readonly http: HttpClient) {}

  get(code: string): Observable<GatewayEnvelope<Record<string, unknown>>> {
    return this.http.get<GatewayEnvelope<Record<string, unknown>>>(
      `${environment.ubrisApiBaseUrl}/api/storefront/product/${encodeURIComponent(code)}`
    );
  }
}
