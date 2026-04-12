/**
 * Juli Order Service
 * 
 * Serviço de pedidos backend-agnostic do JULI.
 * 
 * Responsabilidades:
 * - Abstrair qualquer implementação específica de backend
 * - Trabalhar apenas com modelos canônicos (JuliOrder)
 * - Orquestrar loading states e caching
 * 
 * Design:
 * - Não depende de UserOrderService do Spartacus
 * - Usa OrderAdapter (que é provido por injeção)
 * - Expõe Observables de estado reativos
 * 
 * @see JuliOrder - Modelo canônico
 * @see OrderNormalizer - Interface de normalização
 * @see UbrisOrderAdapter - Implementação para Ubris
 */

import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { catchError, distinctUntilChanged, filter, map, takeUntil, tap } from 'rxjs/operators';
import { JuliOrder, JuliOrderHistoryList, JuliOrderLoadingState } from '../models/juli-order.model';
import { JuliOrderFacade } from '../facades/order.facade';

/**
 * Estado completo do módulo de pedidos
 */
interface OrderState {
  list: JuliOrderHistoryList | null;
  detail: JuliOrder | null;
  loading: JuliOrderLoadingState;
}

const initialState: OrderState = {
  list: null,
  detail: null,
  loading: {
    listLoading: false,
    detailLoading: false,
  },
};

@Injectable({ providedIn: 'root' })
export class JuliOrderService implements OnDestroy {
  private readonly state = new BehaviorSubject<OrderState>(initialState);
  private readonly destroy$ = new Subject<void>();
  
  // Selectors públicos
  readonly list$: Observable<JuliOrderHistoryList | null> = this.state.pipe(
    map(s => s.list),
    distinctUntilChanged()
  );
  
  readonly detail$: Observable<JuliOrder | null> = this.state.pipe(
    map(s => s.detail),
    distinctUntilChanged()
  );
  
  readonly loading$: Observable<JuliOrderLoadingState> = this.state.pipe(
    map(s => s.loading),
    distinctUntilChanged()
  );
  
  readonly listLoading$: Observable<boolean> = this.loading$.pipe(
    map(l => l.listLoading)
  );
  
  readonly detailLoading$: Observable<boolean> = this.loading$.pipe(
    map(l => l.detailLoading)
  );

  constructor(private readonly facade: JuliOrderFacade) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.state.complete();
  }

  /**
   * Carrega lista de pedidos
   * 
   * @param pageSize Tamanho da página
   * @param currentPage Página atual (0-based)
   * @param sort Ordenação
   */
  loadOrderList(
    pageSize: number = 10,
    currentPage: number = 0,
    sort: string = 'byDateDesc'
  ): void {
    this.setListLoading(true);
    
    this.facade.list(pageSize, currentPage, sort).pipe(
      takeUntil(this.destroy$),
      filter(list => list != null),
      tap(list => {
        this.patchState({
          list,
          loading: { ...this.state.value.loading, listLoading: false, listError: undefined }
        });
      }),
      catchError(error => {
        this.patchState({
          loading: {
            ...this.state.value.loading,
            listLoading: false,
            listError: this.extractErrorMessage(error)
          }
        });
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Carrega detalhes de um pedido
   * 
   * @param orderCode Código do pedido
   */
  loadOrderDetail(orderCode: string): void {
    this.setDetailLoading(true);
    
    this.facade.get(orderCode).pipe(
      takeUntil(this.destroy$),
      tap(order => {
        this.patchState({
          detail: order,
          loading: { ...this.state.value.loading, detailLoading: false, detailError: undefined }
        });
      }),
      catchError(error => {
        this.patchState({
          loading: {
            ...this.state.value.loading,
            detailLoading: false,
            detailError: this.extractErrorMessage(error)
          }
        });
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Limpa a lista de pedidos
   */
  clearOrderList(): void {
    this.facade.clear();
    this.patchState({ list: null });
  }

  /**
   * Limpa os detalhes do pedido
   */
  clearOrderDetail(): void {
    this.facade.clearDetail();
    this.patchState({ detail: null });
  }

  /**
   * Reseta todo o estado
   */
  resetState(): void {
    this.clearOrderList();
    this.clearOrderDetail();
    this.state.next(initialState);
  }

  // ==================== Helpers Privados ====================

  private patchState(partial: Partial<OrderState>): void {
    this.state.next({
      ...this.state.value,
      ...partial
    });
  }

  private setListLoading(loading: boolean): void {
    this.patchState({
      loading: { ...this.state.value.loading, listLoading: loading }
    });
  }

  private setDetailLoading(loading: boolean): void {
    this.patchState({
      loading: { ...this.state.value.loading, detailLoading: loading }
    });
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as Record<string, unknown>).message);
    }
    return 'Erro desconhecido';
  }

}
