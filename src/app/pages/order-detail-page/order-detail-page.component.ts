/**
 * Order Detail Page Component
 * 
 * Página de detalhes de um pedido específico.
 * 
 * Features:
 * - Exibe informações completas do pedido
 * - Lista de itens com preços
 * - Endereço de entrega
 * - Status do pedido
 * - Loading e error states
 * - Layout responsivo
 * 
 * @see JuliOrderService - Serviço de pedidos
 * @see JuliOrder - Modelo de dados
 */

import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { distinctUntilChanged, filter, map, takeUntil, tap } from 'rxjs/operators';
import {
  JuliOrderService,
  JuliOrder,
  JuliOrderLoadingState,
  JuliOrderEntry,
  JuliOrderStatus
} from '../../core/commerce';
import { JuliI18nService } from '../../core/i18n/i18n.service';

/**
 * ViewModel para a página
 */
interface OrderDetailViewModel {
  order: JuliOrder | null;
  loading: boolean;
  error?: string;
}

@Component({
  selector: 'app-order-detail-page',
  templateUrl: './order-detail-page.component.html',
  styleUrls: ['./order-detail-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderDetailPageComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private orderCode: string | null = null;

  readonly order$: Observable<JuliOrder | null> = this.juliOrderService.detail$;
  readonly loading$ = this.juliOrderService.detailLoading$;
  readonly error$ = this.juliOrderService.loading$.pipe(
    map(l => l.detailError)
  );

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly juliOrderService: JuliOrderService,
    private readonly i18n: JuliI18nService
  ) {}

  ngOnInit(): void {
    // Observa mudanças no código do pedido na URL
    this.route.paramMap.pipe(
      takeUntil(this.destroy$),
      map(params => params.get('code')),
      filter((code): code is string => !!code),
      distinctUntilChanged(),
      tap(code => {
        this.orderCode = code;
        this.juliOrderService.loadOrderDetail(code);
      })
    ).subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.juliOrderService.clearOrderDetail();
  }

  /**
   * Volta para a lista de pedidos
   */
  goBack(): void {
    this.router.navigate(['/account/orders']);
  }

  /**
   * Tenta carregar o pedido novamente
   */
  retryLoad(): void {
    if (this.orderCode) {
      this.juliOrderService.loadOrderDetail(this.orderCode);
    }
  }

  /**
   * Formata o status para exibição
   */
  getStatusLabel(status: JuliOrderStatus | undefined): string {
    if (!status) return this.i18n.translate('orderDetail.statusUnknown');

    const keyMap: Record<string, string> = {
      'PENDING': 'orderDetail.statusPending',
      'PROCESSING': 'orderDetail.statusProcessing',
      'READY': 'orderDetail.statusReady',
      'SHIPPED': 'orderDetail.statusShipped',
      'DELIVERED': 'orderDetail.statusDelivered',
      'CANCELLED': 'orderDetail.statusCancelled',
      'RETURNED': 'orderDetail.statusReturned',
      'REFUNDED': 'orderDetail.statusRefunded',
      'ON_HOLD': 'orderDetail.statusOnHold',
      'COMPLETED': 'orderDetail.statusCompleted',
      'UNKNOWN': 'orderDetail.statusUnknown'
    };
    return this.i18n.translate(keyMap[status] || 'orderDetail.statusUnknown');
  }

  /**
   * Retorna a classe CSS para o status
   */
  getStatusClass(status: JuliOrderStatus | undefined): string {
    if (!status) return 'status-unknown';
    
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
   * Retorna o ícone para o status
   */
  getStatusIcon(status: JuliOrderStatus | undefined): string {
    if (!status) return '❓';
    
    const icons: Record<string, string> = {
      'PENDING': '⏳',
      'PROCESSING': '⚙️',
      'READY': '📦',
      'SHIPPED': '🚚',
      'DELIVERED': '✅',
      'CANCELLED': '❌',
      'RETURNED': '↩️',
      'REFUNDED': '💰',
      'ON_HOLD': '⏸️',
      'COMPLETED': '🎉',
      'UNKNOWN': '❓'
    };
    return icons[status] || '❓';
  }

  /**
   * Calcula o progresso do pedido baseado no status
   */
  getOrderProgress(status: JuliOrderStatus | undefined): number {
    const progressMap: Record<string, number> = {
      'PENDING': 10,
      'PROCESSING': 30,
      'READY': 50,
      'SHIPPED': 75,
      'DELIVERED': 100,
      'COMPLETED': 100,
      'CANCELLED': 0,
      'RETURNED': 0,
      'REFUNDED': 0,
      'ON_HOLD': 10,
      'UNKNOWN': 0
    };
    return progressMap[status || 'UNKNOWN'] || 0;
  }

  /**
   * Calcula o total economizado (se houver descontos)
   */
  calculateSavings(order: JuliOrder): number {
    // Implementação básica - pode ser expandida
    const subtotal = order.subTotal?.value || 0;
    const total = order.totalWithTax?.value || order.total?.value || 0;
    const delivery = order.deliveryCost?.value || 0;
    const tax = order.totalTax?.value || 0;
    
    // Se o total for menor que (subtotal + delivery + tax), houve desconto
    const expectedTotal = subtotal + delivery + tax;
    const savings = expectedTotal - total;
    
    return savings > 0 ? savings : 0;
  }
}
