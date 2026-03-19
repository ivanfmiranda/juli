import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UbrisCheckoutAdapter } from '../adapters/checkout.adapter';
import {
  JuliCheckoutAddressState,
  JuliCheckoutAddressUpsertRequest,
  JuliCheckoutResult,
  JuliCheckoutReviewSnapshot,
  JuliCheckoutSubmission
} from '../models/ubris-commerce.models';

@Injectable({ providedIn: 'root' })
export class UbrisCheckoutConnector {
  constructor(private readonly adapter: UbrisCheckoutAdapter) {}

  saveAddress(body: JuliCheckoutAddressUpsertRequest): Observable<JuliCheckoutAddressState> {
    return this.adapter.saveAddress(body).pipe(
      map(response => {
        const data = response.data ?? {} as JuliCheckoutAddressState;
        return {
          checkoutId: this.requireString((data as any).checkoutId),
          cartId: this.requireString((data as any).cartId),
          customerId: this.requireString((data as any).customerId),
          userType: this.requireString((data as any).userType),
          paymentMethod: this.requireString((data as any).paymentMethod),
          status: this.requireString((data as any).status),
          address: (data as any).address,
          updatedAt: this.asString((data as any).updatedAt) ?? undefined
        };
      })
    );
  }

  review(checkoutId: string): Observable<JuliCheckoutReviewSnapshot> {
    return this.adapter.review(checkoutId).pipe(
      map(response => {
        const data = response.data ?? {} as JuliCheckoutReviewSnapshot;
        return {
          checkoutId: this.requireString((data as any).checkoutId),
          cartId: this.requireString((data as any).cartId),
          customerId: this.requireString((data as any).customerId),
          userType: this.requireString((data as any).userType),
          paymentMethod: this.requireString((data as any).paymentMethod),
          status: this.requireString((data as any).status),
          address: (data as any).address,
          items: Array.isArray((data as any).items) ? (data as any).items : [],
          totalItems: this.asNumber((data as any).totalItems) ?? 0,
          subTotal: this.asNumber((data as any).subTotal),
          totalTax: this.asNumber((data as any).totalTax),
          total: this.asNumber((data as any).total),
          currency: this.asString((data as any).currency) ?? undefined,
          stockValidated: Boolean((data as any).stockValidated),
          pricingValidated: Boolean((data as any).pricingValidated),
          addressValidated: Boolean((data as any).addressValidated),
          readyToPlace: Boolean((data as any).readyToPlace),
          messages: this.asStringArray((data as any).messages),
          warnings: this.asStringArray((data as any).warnings),
          errors: this.asStringArray((data as any).errors),
          updatedAt: this.asString((data as any).updatedAt) ?? undefined
        };
      })
    );
  }

  submitById(checkoutId: string): Observable<JuliCheckoutResult> {
    return this.adapter.submitById(checkoutId).pipe(
      map(response => response.data ?? {})
    );
  }

  submit(body: JuliCheckoutSubmission): Observable<JuliCheckoutResult> {
    return this.adapter.submit(body).pipe(
      map(response => response.data ?? {})
    );
  }

  status(checkoutId: string): Observable<JuliCheckoutResult> {
    return this.adapter.getStatus(checkoutId).pipe(
      map(response => {
        const data = response.data ?? {};
        const status = this.asString(data.status) ?? this.asString(data.state) ?? (this.asString(data.orderId) ? 'COMPLETED' : 'UNKNOWN');
        const lastError = this.asString(data.lastError) ?? this.asString(data.errorMessage) ?? undefined;
        return {
          checkoutId: this.asString(data.checkoutId) ?? checkoutId,
          status,
          approvalRequired: Boolean(data.approvalRequired),
          orderId: this.asString(data.orderId) ?? this.asString(data.id) ?? undefined,
          lastError,
          detail: this.asString(data.detail) ?? lastError ?? undefined,
          retries: this.asNumber(data.retries),
          createdAt: this.asString(data.createdAt) ?? undefined,
          updatedAt: this.asString(data.updatedAt) ?? undefined
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

  private asNumber(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    const parsed = Number(this.asString(value));
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private asStringArray(value: unknown): string[] {
    return Array.isArray(value)
      ? value.map(item => this.asString(item)).filter((item): item is string => !!item)
      : [];
  }

  private requireString(value: unknown): string {
    return this.asString(value) ?? '';
  }
}
