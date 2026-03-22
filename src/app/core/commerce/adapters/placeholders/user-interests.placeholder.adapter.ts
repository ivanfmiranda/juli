/**
 * User Interests Placeholder Adapter
 * 
 * ⚠️  PLACEHOLDER - Capability Futura
 * 
 * Gerenciamento de interesses em produtos (back-in-stock notifications).
 * Não implementado no JULI atual.
 * 
 * Backend Ubris: Não suportado
 * Backend Hybris: Suportado via OCC (futuro)
 * 
 * @see docs/JULI-COMPATIBILITY-MATRIX.md
 */

import { Injectable } from '@angular/core';
import { UserInterestsAdapter, ProductInterestSearchResult, ProductInterestEntryRelation, NotificationType } from '@spartacus/core';
import { Observable, throwError, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserInterestsPlaceholderAdapter implements UserInterestsAdapter {
  
  /**
   * Lista de interesses do usuário - não implementado
   */
  getInterests(_userId: string, _pageSize?: number, _currentPage?: number, _sort?: string, _productCode?: string, _notificationType?: NotificationType): Observable<ProductInterestSearchResult> {
    return of({ results: [], pagination: { totalResults: 0, totalPages: 0 } } as ProductInterestSearchResult);
  }
  
  /**
   * Remover interesse - não implementado
   */
  removeInterest(_userId: string, _item: ProductInterestEntryRelation): Observable<any[]> {
    return of([]);
  }
  
  /**
   * Adicionar interesse - não implementado
   */
  addInterest(_userId: string, _productCode: string, _notificationType: NotificationType): Observable<any> {
    return throwError(() => new Error('UserInterestsAdapter.addInterest() not supported in JULI'));
  }
}
