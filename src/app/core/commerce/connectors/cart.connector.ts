import { Injectable } from '@angular/core';
import { Cart, CartModification } from '@spartacus/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UbrisCartAdapter, CartPromotionResponse } from '../adapters/cart.adapter';
import { UbrisCartNormalizer } from '../normalizers/cart.normalizer';

export interface ConnectorCartPromotionResult {
  cart: Cart;
  mergeOccurred: boolean;
  cartChanged: boolean;
  warnings: any[];
}

@Injectable({ providedIn: 'root' })
export class UbrisCartConnector {
  constructor(
    private readonly adapter: UbrisCartAdapter,
    private readonly normalizer: UbrisCartNormalizer
  ) {}

  create(customerId: string): Observable<Cart> {
    return this.adapter.create(customerId).pipe(
      map(response => this.normalizer.normalize(response.data))
    );
  }

  createAnonymous(anonymousToken: string): Observable<Cart> {
    return this.adapter.createAnonymous(anonymousToken).pipe(
      map(response => this.normalizer.normalize(response.data))
    );
  }

  load(cartId: string): Observable<Cart> {
    return this.adapter.load(cartId).pipe(
      map(response => this.normalizer.normalize(response.data))
    );
  }

  loadAnonymous(cartId: string, anonymousToken: string): Observable<Cart> {
    return this.adapter.loadAnonymous(cartId, anonymousToken).pipe(
      map(response => this.normalizer.normalize(response.data))
    );
  }

  addEntry(cartId: string, sku: string, quantity: number): Observable<CartModification> {
    return this.adapter.addEntry(cartId, sku, quantity).pipe(
      map(response => this.normalizer.normalizeModification(response.data, sku, quantity))
    );
  }

  addEntryAnonymous(
    cartId: string,
    sku: string,
    quantity: number,
    anonymousToken: string
  ): Observable<CartModification> {
    return this.adapter.addEntryAnonymous(cartId, sku, quantity, anonymousToken).pipe(
      map(response => this.normalizer.normalizeModification(response.data, sku, quantity))
    );
  }

  delete(cartId: string): Observable<void> {
    return this.adapter.delete(cartId).pipe(
      map(() => undefined)
    );
  }

  deleteAnonymous(cartId: string, anonymousToken: string): Observable<void> {
    return this.adapter.deleteAnonymous(cartId, anonymousToken).pipe(
      map(() => undefined)
    );
  }

  promoteAnonymousCart(
    anonymousToken: string,
    customerId: string
  ): Observable<ConnectorCartPromotionResult> {
    return this.adapter.promoteAnonymousCart(anonymousToken, customerId).pipe(
      map(response => {
        const data = response.data as CartPromotionResponse | undefined;
        if (!data?.cart) {
          throw new Error('Cart promotion response is missing cart payload');
        }
        return {
          cart: this.normalizer.normalize(data.cart),
          mergeOccurred: !!data.mergeOccurred,
          cartChanged: !!data.cartChanged,
          warnings: data.warnings ?? []
        };
      })
    );
  }
}
