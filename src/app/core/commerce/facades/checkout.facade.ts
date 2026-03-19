import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
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
import { UbrisCheckoutConnector } from '../connectors/checkout.connector';

@Injectable({ providedIn: 'root' })
export class JuliCheckoutFacade {
  constructor(private readonly connector: UbrisCheckoutConnector) {}

  saveAddress(body: JuliCheckoutAddressUpsertRequest): Observable<JuliCheckoutAddressState> {
    return this.connector.saveAddress(body);
  }

  deliveryOptions(checkoutId: string): Observable<JuliCheckoutDeliveryOptionsState> {
    return this.connector.deliveryOptions(checkoutId);
  }

  setDeliveryMode(checkoutId: string, code: string): Observable<JuliCheckoutDeliveryModeSelection> {
    return this.connector.setDeliveryMode(checkoutId, code);
  }

  paymentMethods(checkoutId: string): Observable<JuliCheckoutPaymentMethodsState> {
    return this.connector.paymentMethods(checkoutId);
  }

  initializePayment(checkoutId: string, methodCode: string): Observable<JuliCheckoutPaymentInitializeState> {
    return this.connector.initializePayment(checkoutId, methodCode);
  }

  paymentStatus(checkoutId: string): Observable<JuliCheckoutPaymentStatus> {
    return this.connector.paymentStatus(checkoutId);
  }

  review(checkoutId: string): Observable<JuliCheckoutReviewSnapshot> {
    return this.connector.review(checkoutId);
  }

  submitById(checkoutId: string): Observable<JuliCheckoutResult> {
    return this.connector.submitById(checkoutId);
  }

  submit(body: JuliCheckoutSubmission): Observable<JuliCheckoutResult> {
    return this.connector.submit(body);
  }

  status(checkoutId: string): Observable<JuliCheckoutResult> {
    return this.connector.status(checkoutId);
  }
}
