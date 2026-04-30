import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

/**
 * Wire-shape for `POST /api/bff/quotes`. The BFF proxies straight to
 * `ubris-b2b-platform`'s {@code QuoteCreateRequest} so the field names
 * match the upstream record exactly.
 */
export interface QuoteItemPayload {
  sku: string;
  quantity: number;
  unitPrice: number;
  /** Where the price came from — e.g. STOREFRONT, NEGOTIATED, RULE_ENGINE. */
  priceSource?: string;
}

export interface QuoteCreatePayload {
  companyId?: string | null;
  unitId?: string | null;
  currency: string;
  notes?: string | null;
  /** ISO date (YYYY-MM-DD) — server defaults the validity if omitted. */
  validUntil?: string | null;
  items: QuoteItemPayload[];
}

/**
 * Storefront-side identifier set returned after a successful create.
 * The upstream {@code QuoteResponse} has a richer payload (status,
 * approvalRequestId, etc.); we only surface what the cart redirect
 * needs and let the detail page fetch the rest.
 */
export interface QuoteCreated {
  id: string;
  quoteCode?: string | null;
  status?: string;
  approvalRequestId?: string | null;
}

interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  message?: string | null;
}

@Injectable({ providedIn: 'root' })
export class JuliQuoteService {
  constructor(private readonly http: HttpClient) {}

  create(payload: QuoteCreatePayload): Observable<QuoteCreated> {
    return this.http
      .post<ApiResponse<QuoteCreated>>(`${environment.ubrisApiBaseUrl}/api/bff/quotes`, payload)
      .pipe(
        map(response => {
          const data = response?.data;
          if (!data || !data.id) {
            throw new Error(response?.message || 'Quote response missing id');
          }
          return data;
        })
      );
  }

  list(customerId: string): Observable<QuoteCreated[]> {
    const params = new URLSearchParams({ customerId });
    return this.http
      .get<ApiResponse<QuoteCreated[]>>(
        `${environment.ubrisApiBaseUrl}/api/bff/quotes?${params.toString()}`
      )
      .pipe(map(response => response?.data ?? []));
  }

  get(quoteId: string): Observable<QuoteCreated & Record<string, unknown>> {
    return this.http
      .get<ApiResponse<QuoteCreated & Record<string, unknown>>>(
        `${environment.ubrisApiBaseUrl}/api/bff/quotes/${encodeURIComponent(quoteId)}`
      )
      .pipe(map(response => response?.data as QuoteCreated & Record<string, unknown>));
  }
}
