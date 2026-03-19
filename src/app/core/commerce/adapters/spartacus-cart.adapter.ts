import { Injectable } from '@angular/core';
import { Cart, CartAdapter } from '@spartacus/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { UbrisCartConnector } from '../connectors/cart.connector';
import { JuliCartIdStorageService } from '../services/cart-id.storage.service';

@Injectable()
export class JuliSpartacusCartAdapter extends CartAdapter {
  private readonly currentCartId = 'current';

  constructor(
    private readonly connector: UbrisCartConnector,
    private readonly cartIdStorage: JuliCartIdStorageService
  ) {
    super();
  }

  loadAll(userId: string): Observable<Cart[]> {
    const cartId = this.cartIdStorage.read(userId);
    if (!cartId) {
      return of([]);
    }

    return this.connector.load(cartId).pipe(
      map(cart => [cart]),
      catchError(() => of([]))
    );
  }

  load(_userId: string, cartId: string): Observable<Cart> {
    const resolvedCartId = this.resolveCartId(_userId, cartId);
    if (!resolvedCartId) {
      return of(this.emptyCart());
    }
    return this.connector.load(resolvedCartId);
  }

  create(userId: string, _oldCartId?: string, _toMergeCartGuid?: string): Observable<Cart> {
    return this.connector.create(userId);
  }

  delete(userId: string, cartId: string): Observable<{}> {
    const resolvedCartId = this.resolveCartId(userId, cartId);
    if (!resolvedCartId) {
      this.cartIdStorage.clear(userId);
      return of({});
    }

    return this.connector.delete(resolvedCartId).pipe(
      map(() => {
        this.cartIdStorage.clear(userId);
        return {};
      })
    );
  }

  addEmail(_userId: string, _cartId: string, _email: string): Observable<{}> {
    return of({});
  }

  private resolveCartId(userId: string, cartId: string): string | null {
    if (cartId !== this.currentCartId) {
      return cartId;
    }
    return this.cartIdStorage.read(userId);
  }

  private emptyCart(): Cart {
    return {
      code: this.currentCartId,
      entries: [],
      totalItems: 0,
      totalUnitCount: 0
    };
  }
}
