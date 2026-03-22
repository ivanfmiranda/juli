/**
 * Orders Page Component
 * 
 * Página de histórico de pedidos do JULI.
 * 
 * Features:
 * - Lista paginada de pedidos
 * - Ordenação por data e valor
 * - Loading states
 * - Empty state
 * - Error handling
 * - Responsivo
 * 
 * @see JuliOrderService - Serviço de pedidos
 * @see JuliOrderHistoryList - Modelo de dados
 */

import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { 
  JuliOrderService, 
  JuliOrderHistoryList, 
  JuliOrderLoadingState 
} from '../../core/commerce';

/**
 * ViewModel para a página
 */
interface OrdersPageViewModel {
  orders: JuliOrderHistoryList | null;
  loading: JuliOrderLoadingState;
  currentPage: number;
  currentSort: string;
}

@Component({
  selector: 'app-orders-page',
  templateUrl: './orders-page.component.html',
  styleUrls: ['./orders-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrdersPageComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  readonly pageSize = 10;
  
  readonly sortOptions = [
    { code: 'byDateDesc', label: 'Mais recentes primeiro' },
    { code: 'byDateAsc', label: 'Mais antigos primeiro' },
    { code: 'byTotalDesc', label: 'Maior valor' },
    { code: 'byTotalAsc', label: 'Menor valor' }
  ];

  readonly vm$: Observable<OrdersPageViewModel> = this.juliOrderService.list$.pipe(
    map(orders => ({
      orders,
      loading: { listLoading: false, detailLoading: false },
      currentPage: orders?.pagination?.currentPage || 0,
      currentSort: orders?.sorts?.find(s => s.selected)?.code || 'byDateDesc'
    }))
  );

  readonly loading$ = this.juliOrderService.listLoading$;
  readonly error$ = this.juliOrderService.loading$.pipe(
    map(l => l.listError)
  );

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly juliOrderService: JuliOrderService
  ) {}

  ngOnInit(): void {
    // Observa query params e carrega pedidos
    this.route.queryParamMap.pipe(
      takeUntil(this.destroy$),
      map(params => ({
        page: Math.max(Number(params.get('page') ?? '0') || 0, 0),
        sort: params.get('sort') || 'byDateDesc'
      }))
    ).subscribe(({ page, sort }) => {
      this.juliOrderService.loadOrderList(this.pageSize, page, sort);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.juliOrderService.clearOrderList();
  }

  /**
   * Muda para uma página específica
   */
  changePage(page: number, currentSort: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: Math.max(page, 0), sort: currentSort },
      queryParamsHandling: 'merge'
    });
  }

  /**
   * Muda a ordenação
   */
  changeSort(sort: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: 0, sort },
      queryParamsHandling: 'merge'
    });
  }

  /**
   * Formata o status para exibição
   */
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'PENDING': 'Aguardando',
      'PROCESSING': 'Em processamento',
      'READY': 'Pronto para envio',
      'SHIPPED': 'Enviado',
      'DELIVERED': 'Entregue',
      'CANCELLED': 'Cancelado',
      'RETURNED': 'Devolvido',
      'REFUNDED': 'Reembolsado',
      'ON_HOLD': 'Em espera',
      'COMPLETED': 'Concluído',
      'UNKNOWN': 'Status desconhecido'
    };
    return labels[status] || status;
  }

  /**
   * Retorna a classe CSS para o status
   */
  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'PENDING': 'status-pending',
      'PROCESSING': 'status-processing',
      'READY': 'status-ready',
      'SHIPPED': 'status-shipped',
      'DELIVERED': 'status-delivered',
      'CANCELLED': 'status-cancelled',
      'RETURNED': 'status-returned',
      'REFUNDED': 'status-refunded',
      'ON_HOLD': 'status-on-hold',
      'COMPLETED': 'status-completed',
      'UNKNOWN': 'status-unknown'
    };
    return classes[status] || 'status-unknown';
  }

  /**
   * Recarrega a lista
   */
  retryLoad(): void {
    const currentPage = Number(this.route.snapshot.queryParamMap.get('page') ?? '0') || 0;
    const currentSort = this.route.snapshot.queryParamMap.get('sort') || 'byDateDesc';
    this.juliOrderService.loadOrderList(this.pageSize, currentPage, currentSort);
  }
}
