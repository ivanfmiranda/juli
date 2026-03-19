import { Injectable } from '@angular/core';
import { Cart, CartModification } from '@spartacus/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UbrisCartAdapter } from '../adapters/cart.adapter';
import { UbrisCartNormalizer } from '../normalizers/cart.normalizer';

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

  load(cartId: string): Observable<Cart> {
    return this.adapter.load(cartId).pipe(
      map(response => this.normalizer.normalize(response.data))
    );
  }

  addEntry(cartId: string, sku: string, quantity: number): Observable<CartModification> {
    return this.adapter.addEntry(cartId, sku, quantity).pipe(
      map(response => this.normalizer.normalizeModification(response.data, sku, quantity))
    );
  }

  delete(cartId: string): Observable<void> {
    return this.adapter.delete(cartId).pipe(
      map(() => undefined)
    );
  }
}
