import { Injectable } from '@angular/core';
import { CartModificationList, CartValidationAdapter, CartVoucherAdapter, SaveCartAdapter, SaveCartResult } from '@spartacus/core';
import { Observable, of, throwError } from 'rxjs';

@Injectable()
export class JuliSpartacusCartVoucherAdapter extends CartVoucherAdapter {
  add(_userId: string, _cartId: string, _voucherId: string): Observable<{}> {
    return throwError(new Error('Cart vouchers are not supported by gateway-bff'));
  }

  remove(_userId: string, _cartId: string, _voucherId: string): Observable<{}> {
    return throwError(new Error('Cart vouchers are not supported by gateway-bff'));
  }
}

@Injectable()
export class JuliSpartacusCartValidationAdapter extends CartValidationAdapter {
  validate(_cartId: string, _userId: string): Observable<CartModificationList> {
    return of({});
  }
}

@Injectable()
export class JuliSpartacusSaveCartAdapter extends SaveCartAdapter {
  saveCart(_userId: string, _cartId: string, _saveCartName?: string, _saveCartDescription?: string): Observable<SaveCartResult> {
    return throwError(new Error('Save cart is not supported by gateway-bff'));
  }
}
