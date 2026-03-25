import { Injectable } from '@angular/core';
import {
  Address,
  CheckoutAdapter,
  CheckoutDeliveryAdapter,
  CheckoutPaymentAdapter,
  DeliveryMode,
  Order,
  PaymentDetails
} from '@spartacus/core';
import { Observable, throwError, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { UbrisCheckoutConnector } from '../connectors/checkout.connector';
import { JuliCheckoutSubmission } from '../models/ubris-commerce.models';

@Injectable({ providedIn: 'root' })
export class JuliSpartacusCheckoutAdapter implements CheckoutAdapter, CheckoutDeliveryAdapter, CheckoutPaymentAdapter {
  constructor(private readonly connector: UbrisCheckoutConnector) {}

  // === CheckoutDeliveryAdapter ===

  createAddress(userId: string, cartId: string, address: Address): Observable<Address> {
    return this.connector.saveAddress({
      cartId,
      customerId: userId,
      userType: userId === 'anonymous' ? 'ANONYMOUS' : 'REGISTERED',
      paymentMethod: 'credit_card', // Defaulting for now
      address: {
        fullName: `${address.firstName} ${address.lastName}`,
        line1: address.line1 ?? '',
        line2: address.line2,
        city: address.town ?? '',
        region: address.region?.isocode ?? '',
        postalCode: address.postalCode ?? '',
        countryIso: address.country?.isocode ?? 'US',
        phone: address.phone
      }
    }).pipe(map(() => address)); // Return original address as confirmation
  }

  setAddress(userId: string, cartId: string, addressId: string): Observable<any> {
    // Ubris saves address directly, so setAddress might be redundant or just a re-save
    // For now, we assume createAddress handles it.
    return of({});
  }

  clearCheckoutDeliveryAddress(userId: string, cartId: string): Observable<any> {
    return of({});
  }

  getSupportedDeliveryModes(userId: string, cartId: string): Observable<DeliveryMode[]> {
    // Start checkout session/get options
    // Assuming cartId is used as checkoutId or we have a way to map
    return this.connector.deliveryOptions(cartId).pipe(
      map(state => state.options.map(opt => ({
        code: opt.code,
        name: opt.name,
        description: opt.description,
        deliveryCost: {
          currencyIso: opt.currency ?? 'USD',
          value: opt.cost ?? 0,
          formattedValue: `${opt.currency ?? '$'}${opt.cost}`
        }
      })))
    );
  }

  setDeliveryMode(userId: string, cartId: string, deliveryModeId: string): Observable<any> {
    return this.connector.setDeliveryMode(cartId, deliveryModeId);
  }

  clearCheckoutDeliveryMode(userId: string, cartId: string): Observable<any> {
    return of({});
  }

  // === CheckoutPaymentAdapter ===

  create(userId: string, cartId: string, paymentDetails: PaymentDetails): Observable<PaymentDetails> {
    // In Ubris, payment creation initializes the intent.
    // paymentDetails.code could carry the method (e.g., 'stripe_credit_card')
    const method = paymentDetails.code ?? 'credit_card';
    return this.connector.initializePayment(cartId, method).pipe(
      map(state => ({
        code: state.paymentSessionId, // Use session ID as payment detail code
        accountHolderName: 'Stripe', // Placeholder
        cardType: { code: state.method, name: state.provider }
      }))
    );
  }

  set(userId: string, cartId: string, paymentDetailsId: string): Observable<any> {
    // Payment is set during create/initialize
    return of({});
  }

  // === CheckoutAdapter (Place Order) ===

  placeOrder(userId: string, cartId: string, termsChecked: boolean): Observable<Order> {
    const submission: JuliCheckoutSubmission = {
      cartId,
      customerId: userId,
      userType: userId === 'anonymous' ? 'ANONYMOUS' : 'REGISTERED',
      addressLine: 'default', // Placeholder, backend uses saved address
      paymentMethod: 'credit_card' // Placeholder, backend uses initialized payment
    };

    return this.connector.submit(submission).pipe(
      map(result => ({
        code: result.orderId ?? 'unknown',
        guid: result.checkoutId,
        // Basic order structure to satisfy Spartacus
        entries: [], 
        paymentInfo: { accountHolderName: 'Paid' },
        totalPrice: { value: 0 },
        user: { uid: userId }
      }))
    );
  }

  loadCheckoutDetails(userId: string, cartId: string): Observable<any> {
    return this.connector.status(cartId).pipe(
      map(status => ({
        deliveryAddress: {}, // Would need to fetch from review/status
        deliveryMode: { code: 'standard' },
        paymentInfo: { code: 'credit_card' }
      }))
    );
  }

  clearCheckoutData(userId: string, cartId: string): Observable<any> {
    return of({});
  }
}
