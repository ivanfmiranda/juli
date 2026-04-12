import { Injectable } from '@angular/core';
import { JuliCart, JuliCartEntry } from '../facades/cart.facade';
import { Observable } from 'rxjs';

type Cart = JuliCart;
interface CartModification {
  statusCode?: string;
  quantity?: number;
  quantityAdded?: number;
  entry?: JuliCartEntry;
}
import { map, tap } from 'rxjs/operators';
import { UbrisCartAdapter, CartPromotionResponse } from '../adapters/cart.adapter';
import { UbrisCartNormalizer } from '../normalizers/cart.normalizer';
import { JuliObservabilityService } from '../../services/observability.service';
import { JuliEvent } from '../../models/observability.models';

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
    private readonly normalizer: UbrisCartNormalizer,
    private readonly obs: JuliObservabilityService
  ) {}

  fetchAnonymousToken(anonymousId: string): Observable<string> {
    return this.adapter.fetchAnonymousToken(anonymousId).pipe(
      map(response => (response.data as any).token as string)
    );
  }

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

  addEntry(
    cartId: string,
    sku: string,
    quantity: number,
    options?: { customizations?: any; forceNewEntry?: boolean }
  ): Observable<CartModification> {
    return this.adapter.addEntry(cartId, sku, quantity, options).pipe(
      map(response => this.normalizer.normalizeModification(response.data, sku, quantity)),
      tap(mod => this.obs.emitEvent(JuliEvent.CART_ENTRY_ADDED, { cartId, sku, quantity, mod }))
    );
  }

  addEntryAnonymous(
    cartId: string,
    sku: string,
    quantity: number,
    anonymousToken: string,
    options?: { customizations?: any; forceNewEntry?: boolean }
  ): Observable<CartModification> {
    return this.adapter.addEntryAnonymous(cartId, sku, quantity, anonymousToken, options).pipe(
      map(response => this.normalizer.normalizeModification(response.data, sku, quantity)),
      tap(mod => this.obs.emitEvent(JuliEvent.CART_ENTRY_ADDED, { cartId, sku, quantity, mod, anonymous: true }))
    );
  }

  updateEntry(cartId: string, entryNumber: string | number, quantity: number): Observable<CartModification> {
    return this.adapter.updateEntry(cartId, entryNumber, quantity).pipe(
      map(response => this.normalizer.normalizeModification(response.data, `entry-${entryNumber}`, quantity)),
      tap(mod => this.obs.emitEvent(JuliEvent.CART_ENTRY_UPDATED, { cartId, entryNumber, quantity, mod }))
    );
  }

  updateEntryAnonymous(
    cartId: string,
    entryNumber: string | number,
    quantity: number,
    anonymousToken: string
  ): Observable<CartModification> {
    return this.adapter.updateEntryAnonymous(cartId, entryNumber, quantity, anonymousToken).pipe(
      map(response => this.normalizer.normalizeModification(response.data, `entry-${entryNumber}`, quantity)),
      tap(mod => this.obs.emitEvent(JuliEvent.CART_ENTRY_UPDATED, { cartId, entryNumber, quantity, mod, anonymous: true }))
    );
  }

  removeEntry(cartId: string, entryNumber: string | number): Observable<void> {
    return this.adapter.removeEntry(cartId, entryNumber).pipe(
      tap(() => this.obs.emitEvent(JuliEvent.CART_ENTRY_REMOVED, { cartId, entryNumber })),
      map(() => undefined)
    );
  }

  removeEntryAnonymous(
    cartId: string,
    entryNumber: string | number,
    anonymousToken: string
  ): Observable<void> {
    return this.adapter.removeEntryAnonymous(cartId, entryNumber, anonymousToken).pipe(
      tap(() => this.obs.emitEvent(JuliEvent.CART_ENTRY_REMOVED, { cartId, entryNumber, anonymous: true })),
      map(() => undefined)
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
    anonymousCartId: string,
    anonymousToken: string,
    customerId: string
  ): Observable<ConnectorCartPromotionResult> {
    return this.adapter.promoteAnonymousCart(anonymousCartId, anonymousToken, customerId).pipe(
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
      }),
      tap(result => this.obs.emitEvent(JuliEvent.CART_PROMOTED, { customerId, result }))
    );
  }
}

