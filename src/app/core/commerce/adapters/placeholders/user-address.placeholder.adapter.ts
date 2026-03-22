/**
 * User Address Stub Adapter
 * 
 * ⚠️  ATENÇÃO: Este adapter existe APENAS para satisfazer a dependência de injeção
 * do UserTransitional_4_2_Module do Spartacus. NÃO implementa funcionalidade
 * de address book e NÃO deve ser usado para features de endereço.
 * 
 * O JULI utiliza checkout custom próprio (JuliCheckoutFacade) com formulário
 * de endereço inline. Não há saved addresses nem address book na arquitetura atual.
 * 
 * @see JuliCheckoutFacade
 * @see CheckoutPageComponent
 */

import { Injectable } from '@angular/core';
import { UserAddressAdapter } from '@spartacus/core';
import { Address, AddressValidation } from '@spartacus/core';
import { Observable, throwError, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserAddressPlaceholderAdapter implements UserAddressAdapter {
  
  /**
   * Retorna lista vazia - JULI não usa saved addresses
   */
  loadAll(_userId: string): Observable<Address[]> {
    return of([]);
  }
  
  /**
   * Não suportado - JULI não usa saved addresses
   */
  add(_userId: string, _address: Address): Observable<Address> {
    return throwError(() => new Error('UserAddressAdapter.add() not supported in JULI'));
  }
  
  /**
   * Não suportado - JULI não usa saved addresses
   */
  update(_userId: string, _addressId: string, _address: Address): Observable<Address> {
    return throwError(() => new Error('UserAddressAdapter.update() not supported in JULI'));
  }
  
  /**
   * Retorna ACCEPT para não quebrar validações acidentais
   * mas não executa validação real
   */
  verify(_userId: string, _address: Address): Observable<AddressValidation> {
    return of({ decision: 'ACCEPT' } as AddressValidation);
  }
  
  /**
   * Não suportado - JULI não usa saved addresses
   */
  delete(_userId: string, _addressId: string): Observable<{}> {
    return of({});
  }
}
