import { Injectable } from '@angular/core';
import { CartEntryAdapter, CartModification } from '@spartacus/core';
import { Observable, throwError } from 'rxjs';
import { UbrisCartConnector } from '../connectors/cart.connector';

@Injectable()
export class JuliSpartacusCartEntryAdapter extends CartEntryAdapter {
  constructor(private readonly connector: UbrisCartConnector) {
    super();
  }

  add(_userId: string, cartId: string, productCode: string, quantity: number = 1): Observable<CartModification> {
    return this.connector.addEntry(cartId, productCode, quantity);
  }

  update(_userId: string, _cartId: string, _entryNumber: string, _qty: number, _pickupStore?: string): Observable<CartModification> {
    return throwError(() => new Error('Cart entry quantity update is not supported by gateway-bff yet'));
  }

  remove(_userId: string, _cartId: string, _entryNumber: string): Observable<any> {
    return throwError(() => new Error('Cart entry removal is not supported by gateway-bff yet'));
  }
}
