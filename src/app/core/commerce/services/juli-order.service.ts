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
import { BehaviorSubject, Observable, of, Subject, throwError } from 'rxjs';
import { catchError, distinctUntilChanged, filter, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { JuliOrder, JuliOrderHistoryList, JuliOrderLoadingState, JuliOrderSummary } from '../models/juli-order.model';
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
      filter(spartacusList => spartacusList != null),
      map(spartacusList => this.convertSpartacusHistoryList(spartacusList)),
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
      map(spartacusOrder => this.convertSpartacusOrder(spartacusOrder)),
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

  /**
   * Converte OrderHistoryList do Spartacus para JuliOrderHistoryList
   * 
   * Nota: Esta é uma conversão temporária. No futuro, o adapter retornará
   * diretamente JuliOrderHistoryList, eliminando esta conversão.
   */
  private convertSpartacusHistoryList(spartacusList: any): JuliOrderHistoryList {
    const orders: JuliOrderSummary[] = (spartacusList.orders || []).map((order: any) => ({
      code: order.code || 'UNKNOWN',
      status: this.mapSpartacusStatus(order.status),
      createdAt: order.placed ? new Date(order.placed) : new Date(),
      updatedAt: order.created ? new Date(order.created) : undefined,
      total: {
        value: order.total?.value || 0,
        currencyIso: order.total?.currencyIso || 'BRL',
        formattedValue: order.total?.formattedValue || '-'
      },
      totalItems: order.totalItems || 0,
      cancellable: false, // Spartacus não expõe isso diretamente
      returnable: false
    }));

    return {
      orders,
      pagination: {
        currentPage: spartacusList.pagination?.currentPage || 0,
        pageSize: spartacusList.pagination?.pageSize || 10,
        totalResults: spartacusList.pagination?.totalResults || orders.length,
        totalPages: spartacusList.pagination?.totalPages || 1
      },
      sorts: (spartacusList.sorts || []).map((sort: any) => ({
        code: sort.code || '',
        name: sort.name || sort.code || '',
        selected: sort.selected || false
      }))
    };
  }

  /**
   * Converte Order do Spartacus para JuliOrder
   * 
   * Nota: Esta é uma conversão temporária. No futuro, o adapter retornará
   * diretamente JuliOrder, eliminando esta conversão.
   */
  private convertSpartacusOrder(spartacusOrder: any): JuliOrder {
    const currency = spartacusOrder.totalPrice?.currencyIso || 'BRL';
    
    return {
      code: spartacusOrder.code || 'UNKNOWN',
      status: this.mapSpartacusStatus(spartacusOrder.status),
      createdAt: spartacusOrder.created ? new Date(spartacusOrder.created) : new Date(),
      updatedAt: spartacusOrder.updatedAt ? new Date(spartacusOrder.updatedAt) : undefined,
      userId: spartacusOrder.user?.uid,
      
      subTotal: {
        value: spartacusOrder.subTotal?.value || 0,
        currencyIso: spartacusOrder.subTotal?.currencyIso || currency,
        formattedValue: spartacusOrder.subTotal?.formattedValue || '-'
      },
      totalTax: spartacusOrder.totalTax ? {
        value: spartacusOrder.totalTax.value || 0,
        currencyIso: spartacusOrder.totalTax.currencyIso || currency,
        formattedValue: spartacusOrder.totalTax.formattedValue || '-'
      } : undefined,
      totalWithTax: {
        value: spartacusOrder.totalPriceWithTax?.value || 
                spartacusOrder.totalPrice?.value || 0,
        currencyIso: spartacusOrder.totalPriceWithTax?.currencyIso || 
                      spartacusOrder.totalPrice?.currencyIso || currency,
        formattedValue: spartacusOrder.totalPriceWithTax?.formattedValue || 
                        spartacusOrder.totalPrice?.formattedValue || '-'
      },
      total: spartacusOrder.totalPrice ? {
        value: spartacusOrder.totalPrice.value || 0,
        currencyIso: spartacusOrder.totalPrice.currencyIso || currency,
        formattedValue: spartacusOrder.totalPrice.formattedValue || '-'
      } : undefined,
      
      entries: (spartacusOrder.entries || []).map((entry: any, index: number) => ({
        entryNumber: entry.entryNumber ?? index,
        quantity: entry.quantity || 1,
        product: {
          code: entry.product?.code || 'UNKNOWN',
          name: entry.product?.name || entry.product?.code || 'Produto'
        },
        basePrice: {
          value: entry.basePrice?.value || 0,
          currencyIso: entry.basePrice?.currencyIso || currency,
          formattedValue: entry.basePrice?.formattedValue || '-'
        },
        totalPrice: {
          value: entry.totalPrice?.value || 0,
          currencyIso: entry.totalPrice?.currencyIso || currency,
          formattedValue: entry.totalPrice?.formattedValue || '-'
        }
      })),
      totalItems: spartacusOrder.totalItems || spartacusOrder.entries?.length || 0,
      
      deliveryAddress: spartacusOrder.deliveryAddress ? {
        id: spartacusOrder.deliveryAddress.id,
        fullName: spartacusOrder.deliveryAddress.formattedAddress?.split(',')[0] || '',
        line1: spartacusOrder.deliveryAddress.line1 || '',
        line2: spartacusOrder.deliveryAddress.line2,
        city: spartacusOrder.deliveryAddress.town || '',
        region: spartacusOrder.deliveryAddress.region?.name,
        postalCode: spartacusOrder.deliveryAddress.postalCode || '',
        countryIso: spartacusOrder.deliveryAddress.country?.isocode || 'BR',
        countryName: spartacusOrder.deliveryAddress.country?.name
      } : undefined
    };
  }

  /**
   * Mapeia status do Spartacus para JuliOrderStatus
   */
  private mapSpartacusStatus(status: string | undefined): any {
    if (!status) return 'UNKNOWN';
    
    const upperStatus = status.toUpperCase();
    const validStatuses = [
      'PENDING', 'PROCESSING', 'READY', 'SHIPPED', 'DELIVERED',
      'CANCELLED', 'RETURNED', 'REFUNDED', 'ON_HOLD', 'COMPLETED', 'UNKNOWN'
    ];
    
    if (validStatuses.includes(upperStatus)) {
      return upperStatus;
    }
    
    // Mapeamentos comuns
    const mappings: Record<string, string> = {
      'CREATED': 'PENDING',
      'ON_CHECK': 'PROCESSING',
      'PICKING': 'PROCESSING',
      'SHIPPED': 'SHIPPED',
      'DELIVERED': 'DELIVERED',
      'CANCELLED': 'CANCELLED',
      'CANCELED': 'CANCELLED',
      'COMPLETED': 'COMPLETED',
      'CLOSED': 'COMPLETED'
    };
    
    return mappings[upperStatus] || 'UNKNOWN';
  }
}
