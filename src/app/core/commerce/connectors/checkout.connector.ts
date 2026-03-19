import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UbrisCheckoutAdapter } from '../adapters/checkout.adapter';
import { JuliCheckoutResult, JuliCheckoutSubmission } from '../models/ubris-commerce.models';

@Injectable({ providedIn: 'root' })
export class UbrisCheckoutConnector {
  constructor(private readonly adapter: UbrisCheckoutAdapter) {}

  submit(body: JuliCheckoutSubmission): Observable<JuliCheckoutResult> {
    return this.adapter.submit(body).pipe(
      map(response => response.data ?? {})
    );
  }

  status(checkoutId: string): Observable<JuliCheckoutResult> {
    return this.adapter.getStatus(checkoutId).pipe(
      map(response => {
        const data = response.data ?? {};
        return {
          checkoutId: this.asString(data.checkoutId) ?? checkoutId,
          status: this.asString(data.state) ?? this.asString(data.status) ?? 'UNKNOWN',
          approvalRequired: Boolean(data.approvalRequired),
          orderId: this.asString(data.orderId) ?? this.asString(data.id) ?? undefined,
          lastError: this.asString(data.lastError) ?? this.asString(data.errorMessage) ?? undefined
        };
      })
    );
  }

  private asString(value: unknown): string | null {
    if (value === null || value === undefined) {
      return null;
    }
    const str = String(value).trim();
    return str.length > 0 ? str : null;
  }
}