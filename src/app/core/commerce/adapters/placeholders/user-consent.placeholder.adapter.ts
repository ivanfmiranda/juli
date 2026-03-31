/**
 * User Consent Stub Adapter
 * 
 * ⚠️  ATENÇÃO: Este adapter existe APENAS para satisfazer a dependência de injeção
 * do UserTransitional_4_2_Module do Spartacus. NÃO implementa funcionalidade
 * de consent management e NÃO deve ser usado para features de consentimento.
 * 
 * O JULI não implementa consent management de cookies/gdpr via Spartacus.
 * Se necessário no futuro, será implementado de forma custom fora do Spartacus.
 * 
 * @see JuliCheckoutFacade
 * @see CheckoutPageComponent
 */

import { Injectable } from '@angular/core';
import { UserConsentAdapter } from '@spartacus/core';
import { ConsentTemplate } from '@spartacus/core';
import { Observable, throwError, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserConsentPlaceholderAdapter implements UserConsentAdapter {
  
  /**
   * Retorna lista vazia - JULI não usa consent templates do Spartacus
   */
  loadConsents(_userId: string): Observable<ConsentTemplate[]> {
    return of([]);
  }
  
  /**
   * Não suportado - JULI não usa consent management do Spartacus
   */
  giveConsent(_userId: string, _consentTemplateId: string, _consentTemplateVersion: number): Observable<ConsentTemplate> {
    return throwError(new Error('UserConsentAdapter.giveConsent() not supported in JULI'));
  }
  
  /**
   * Não suportado - JULI não usa consent management do Spartacus
   */
  withdrawConsent(_userId: string, _consentCode: string): Observable<{}> {
    return of({});
  }
}
