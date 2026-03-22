/**
 * User Cost Center Placeholder Adapter
 * 
 * ⚠️  PLACEHOLDER - Capability Futura (B2B)
 * 
 * Gerenciamento de centros de custo para B2B.
 * Não implementado no JULI atual (B2C only).
 * 
 * Backend Ubris: Não suportado
 * Backend Hybris: Suportado via B2B Commerce (futuro)
 * 
 * @see docs/JULI-COMPATIBILITY-MATRIX.md
 */

import { Injectable } from '@angular/core';
import { UserCostCenterAdapter, CostCenter, EntitiesModel } from '@spartacus/core';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserCostCenterPlaceholderAdapter implements UserCostCenterAdapter {
  
  /**
   * Lista de centros de custo - não implementado (B2B)
   */
  loadActiveList(_userId: string): Observable<EntitiesModel<CostCenter>> {
    return of({ values: [] } as EntitiesModel<CostCenter>);
  }
}
