import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  GatewayEnvelope,
  JuliCheckoutAddressState,
  JuliCheckoutAddressUpsertRequest,
  JuliCheckoutDeliveryModeSelection,
  JuliCheckoutDeliveryOptionsState,
  JuliCheckoutPaymentInitializeState,
  JuliCheckoutPaymentMethodsState,
  JuliCheckoutPaymentStatus,
  JuliCheckoutResult,
  JuliCheckoutReviewSnapshot,
  JuliCheckoutSubmission
} from '../models/ubris-commerce.models';

@Injectable({ providedIn: 'root' })
export class UbrisCheckoutAdapter {
  constructor(private readonly http: HttpClient) {}

  saveAddress(body: JuliCheckoutAddressUpsertRequest): Observable<GatewayEnvelope<JuliCheckoutAddressState>> {
    return this.http.post<GatewayEnvelope<JuliCheckoutAddressState>>(
      `${environment.ubrisApiBaseUrl}/api/bff/checkout/address`,
      body
    );
  }

  getDeliveryOptions(checkoutId: string): Observable<GatewayEnvelope<JuliCheckoutDeliveryOptionsState>> {
    return this.http.get<GatewayEnvelope<JuliCheckoutDeliveryOptionsState>>(
      `${environment.ubrisApiBaseUrl}/api/bff/checkout/${encodeURIComponent(checkoutId)}/delivery-options`
    );
  }

  setDeliveryMode(checkoutId: string, code: string): Observable<GatewayEnvelope<JuliCheckoutDeliveryModeSelection>> {
    return this.http.put<GatewayEnvelope<JuliCheckoutDeliveryModeSelection>>(
      `${environment.ubrisApiBaseUrl}/api/bff/checkout/${encodeURIComponent(checkoutId)}/delivery-mode`,
      { code }
    );
  }

  getPaymentMethods(checkoutId: string): Observable<GatewayEnvelope<JuliCheckoutPaymentMethodsState>> {
    return this.http.get<GatewayEnvelope<JuliCheckoutPaymentMethodsState>>(
      `${environment.ubrisApiBaseUrl}/api/bff/checkout/${encodeURIComponent(checkoutId)}/payment-methods`
    );
  }

  initializePayment(checkoutId: string, methodCode: string): Observable<GatewayEnvelope<JuliCheckoutPaymentInitializeState>> {
    return this.http.post<GatewayEnvelope<JuliCheckoutPaymentInitializeState>>(
      `${environment.ubrisApiBaseUrl}/api/bff/checkout/${encodeURIComponent(checkoutId)}/payment/initialize`,
      { methodCode }
    );
  }

  getPaymentStatus(checkoutId: string): Observable<GatewayEnvelope<JuliCheckoutPaymentStatus>> {
    return this.http.get<GatewayEnvelope<JuliCheckoutPaymentStatus>>(
      `${environment.ubrisApiBaseUrl}/api/bff/checkout/${encodeURIComponent(checkoutId)}/payment/status`
    );
  }

  review(checkoutId: string): Observable<GatewayEnvelope<JuliCheckoutReviewSnapshot>> {
    return this.http.post<GatewayEnvelope<JuliCheckoutReviewSnapshot>>(
      `${environment.ubrisApiBaseUrl}/api/bff/checkout/${encodeURIComponent(checkoutId)}/review`,
      {}
    );
  }

  submitById(checkoutId: string): Observable<GatewayEnvelope<JuliCheckoutResult>> {
    return this.http.post<GatewayEnvelope<JuliCheckoutResult>>(
      `${environment.ubrisApiBaseUrl}/api/bff/checkout/${encodeURIComponent(checkoutId)}/submit`,
      {}
    );
  }

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
