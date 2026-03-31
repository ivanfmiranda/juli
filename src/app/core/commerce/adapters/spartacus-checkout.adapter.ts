import { Injectable } from '@angular/core';
import {
  Address,
  DeliveryMode,
  Order,
  PaymentDetails,
  CardType
} from '@spartacus/core';
import {
  CheckoutAdapter,
  CheckoutDeliveryAdapter,
  CheckoutPaymentAdapter,
} from '@spartacus/checkout/core';
import { CheckoutDetails } from '@spartacus/checkout/core';
import { Observable, throwError, of } from 'rxjs';
import { map } from 'rxjs/operators';
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

  setAddress(_userId: string, _cartId: string, _addressId: string): Observable<any> {
    return of({});
  }

  setMode(userId: string, cartId: string, deliveryModeId: string): Observable<any> {
    return this.connector.setDeliveryMode(cartId, deliveryModeId);
  }

  getMode(_userId: string, _cartId: string): Observable<DeliveryMode> {
    return of({ code: 'standard' } as DeliveryMode);
  }

  getSupportedModes(userId: string, cartId: string): Observable<DeliveryMode[]> {
    return this.connector.deliveryOptions(cartId).pipe(
      map(state => state.options.map(opt => ({
        code: opt.code,
        name: opt.name,
        description: opt.description,
        deliveryCost: {
          currencyIso: opt.currency ?? 'BRL',
          value: opt.cost ?? 0,
          formattedValue: `${opt.currency ?? 'R$'}${opt.cost}`
        }
      })))
    );
  }

  // === CheckoutPaymentAdapter ===

  create(userId: string, cartId: string, paymentDetails: PaymentDetails): Observable<PaymentDetails> {
    const method = paymentDetails.id ?? 'credit_card';
    return this.connector.initializePayment(cartId, method).pipe(
      map(state => ({
        id: state.paymentSessionId,
        accountHolderName: 'Stripe',
        cardType: { code: state.method, name: state.provider }
      }))
    );
  }

  set(_userId: string, _cartId: string, _paymentDetailsId: string): Observable<any> {
    return of({});
  }

  loadCardTypes(): Observable<CardType[]> {
    return of([
      { code: 'visa', name: 'Visa' },
      { code: 'master', name: 'MasterCard' }
    ]);
  }

  // === CheckoutAdapter (Place Order) ===

  placeOrder(userId: string, cartId: string, termsChecked: boolean): Observable<Order> {
    const submission: JuliCheckoutSubmission = {
      cartId,
      customerId: userId,
      userType: userId === 'anonymous' ? 'ANONYMOUS' : 'REGISTERED',
      addressLine: 'default',
      paymentMethod: 'credit_card'
    };

    return this.connector.submit(submission).pipe(
      map(result => ({
        code: result.orderId ?? 'unknown',
        guid: result.checkoutId,
        entries: [], 
        paymentInfo: { accountHolderName: 'Paid' },
        totalPrice: { value: 0 },
        user: { uid: userId }
      }))
    );
  }

  loadCheckoutDetails(userId: string, cartId: string): Observable<CheckoutDetails> {
    return this.connector.review(cartId).pipe(
      map(snapshot => ({
        deliveryAddress: snapshot.address ? {
          firstName: snapshot.address.fullName?.split(' ')[0] ?? '',
          lastName: snapshot.address.fullName?.split(' ').slice(1).join(' ') ?? '',
          line1: snapshot.address.line1,
          line2: snapshot.address.line2,
          town: snapshot.address.city,
          region: { isocode: snapshot.address.region },
          postalCode: snapshot.address.postalCode,
          country: { isocode: snapshot.address.countryIso },
          phone: snapshot.address.phone
        } : {},
        deliveryMode: snapshot.deliveryMode ? {
          code: snapshot.deliveryMode.code,
          name: snapshot.deliveryMode.name,
          description: snapshot.deliveryMode.description,
          deliveryCost: {
            value: snapshot.deliveryMode.cost,
            currencyIso: snapshot.deliveryMode.currency ?? 'BRL'
          }
        } : {},
        paymentInfo: snapshot.payment ? {
          id: snapshot.payment.paymentSessionId,
          accountHolderName: 'Stripe',
          cardType: { code: snapshot.payment.method }
        } : {}
      } as CheckoutDetails))
    );
  }

  clearCheckoutDeliveryAddress(_userId: string, _cartId: string): Observable<any> {
    return of({});
  }

  clearCheckoutDeliveryMode(_userId: string, _cartId: string): Observable<any> {
    return of({});
  }
}
