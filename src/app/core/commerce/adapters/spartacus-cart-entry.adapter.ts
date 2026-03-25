import { Injectable } from '@angular/core';
import { CartEntryAdapter, CartModification } from '@spartacus/core';
import { Observable, of, throwError } from 'rxjs';
import { UbrisCartConnector } from '../connectors/cart.connector';
import { AuthService } from '../../auth/auth.service';

@Injectable()
export class JuliSpartacusCartEntryAdapter extends CartEntryAdapter {
  constructor(
    private readonly connector: UbrisCartConnector,
    private readonly authService: AuthService
  ) {
    super();
  }

  add(userId: string, cartId: string, productCode: string, quantity: number = 1): Observable<CartModification> {
    const identity = this.parseProductIdentity(productCode);
    const sku = identity.productCode;
    const options = {
      customizations: identity.customizations,
      forceNewEntry: identity.forceNewEntry
    };

    if (userId === 'anonymous') {
      const anonId = this.authService.currentAnonymousPrincipal?.anonymousId;
      if (!anonId) {
        return throwError(() => new Error('Anonymous principal not found'));
      }
      return this.connector.addEntryAnonymous(cartId, sku, quantity, anonId, options);
    }
    return this.connector.addEntry(cartId, sku, quantity, options);
  }

  private parseProductIdentity(productCode: string): { productCode: string; customizations?: any; forceNewEntry?: boolean } {
    try {
      if (productCode.startsWith('{') && productCode.endsWith('}')) {
        const parsed = JSON.parse(productCode);
        if (parsed.productCode) {
          return parsed;
        }
      }
    } catch {
      // Not a JSON string, fallback to simple product code
    }
    return { productCode };
  }

  update(userId: string, cartId: string, entryNumber: string, qty: number): Observable<CartModification> {
    if (userId === 'anonymous') {
      const anonId = this.authService.currentAnonymousPrincipal?.anonymousId;
      if (!anonId) {
        return throwError(() => new Error('Anonymous principal not found'));
      }
      return this.connector.updateEntryAnonymous(cartId, entryNumber, qty, anonId);
    }
    return this.connector.updateEntry(cartId, entryNumber, qty);
  }

  remove(userId: string, cartId: string, entryNumber: string): Observable<any> {
    if (userId === 'anonymous') {
      const anonId = this.authService.currentAnonymousPrincipal?.anonymousId;
      if (!anonId) {
        return throwError(() => new Error('Anonymous principal not found'));
      }
      return this.connector.removeEntryAnonymous(cartId, entryNumber, anonId);
    }
    return this.connector.removeEntry(cartId, entryNumber);
  }
}
