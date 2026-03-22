import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { GatewayEnvelope } from '../models/ubris-commerce.models';

export interface CartPromotionResponse {
  cart: Record<string, unknown>;
  mergeOccurred: boolean;
  cartChanged: boolean;
  warnings: any[];
}

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

  createAnonymous(anonymousToken: string): Observable<GatewayEnvelope<Record<string, unknown>>> {
    const headers = new HttpHeaders({
      'X-Anonymous-Token': anonymousToken
    });

    return this.http.post<GatewayEnvelope<Record<string, unknown>>>(
      `${environment.ubrisApiBaseUrl}/api/bff/cart`,
      {
        currency: 'USD',
        region: 'BR'
      },
      { headers }
    );
  }

  load(cartId: string): Observable<GatewayEnvelope<Record<string, unknown>>> {
    return this.http.get<GatewayEnvelope<Record<string, unknown>>>(
      `${environment.ubrisApiBaseUrl}/api/bff/cart/${encodeURIComponent(cartId)}`
    );
  }

  loadAnonymous(cartId: string, anonymousToken: string): Observable<GatewayEnvelope<Record<string, unknown>>> {
    const headers = new HttpHeaders({
      'X-Anonymous-Token': anonymousToken
    });

    return this.http.get<GatewayEnvelope<Record<string, unknown>>>(
      `${environment.ubrisApiBaseUrl}/api/bff/cart/${encodeURIComponent(cartId)}`,
      { headers }
    );
  }

  addEntry(cartId: string, sku: string, quantity: number): Observable<GatewayEnvelope<Record<string, unknown>>> {
    return this.http.post<GatewayEnvelope<Record<string, unknown>>>(
      `${environment.ubrisApiBaseUrl}/api/bff/cart/${encodeURIComponent(cartId)}/entries`,
      { sku, quantity }
    );
  }

  addEntryAnonymous(
    cartId: string,
    sku: string,
    quantity: number,
    anonymousToken: string
  ): Observable<GatewayEnvelope<Record<string, unknown>>> {
    const headers = new HttpHeaders({
      'X-Anonymous-Token': anonymousToken
    });

    return this.http.post<GatewayEnvelope<Record<string, unknown>>>(
      `${environment.ubrisApiBaseUrl}/api/bff/cart/${encodeURIComponent(cartId)}/entries`,
      { sku, quantity },
      { headers }
    );
  }

  delete(cartId: string): Observable<GatewayEnvelope<string>> {
    return this.http.delete<GatewayEnvelope<string>>(
      `${environment.ubrisApiBaseUrl}/api/bff/cart/${encodeURIComponent(cartId)}`
    );
  }

  deleteAnonymous(cartId: string, anonymousToken: string): Observable<GatewayEnvelope<string>> {
    const headers = new HttpHeaders({
      'X-Anonymous-Token': anonymousToken
    });

    return this.http.delete<GatewayEnvelope<string>>(
      `${environment.ubrisApiBaseUrl}/api/bff/cart/${encodeURIComponent(cartId)}`,
      { headers }
    );
  }

  promoteAnonymousCart(
    anonymousToken: string,
    customerId: string
  ): Observable<GatewayEnvelope<CartPromotionResponse>> {
    // Generate idempotency key for this promotion attempt
    const idempotencyKey = this.generateIdempotencyKey();
    
    return this.http.post<GatewayEnvelope<CartPromotionResponse>>(
      `${environment.ubrisApiBaseUrl}/api/bff/cart/promote`,
      {
        anonymousToken,
        customerId,
        idempotencyKey
      }
    );
  }

  private generateIdempotencyKey(): string {
    // Generate a unique key based on timestamp and random value
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return `${timestamp}-${random}`;
  }
}
