/**
 * Ubris Order Normalizer
 * 
 * Implementação do OrderNormalizer para o backend Ubris.
 * Converte respostas do Gateway Ubris para o modelo canônico JuliOrder.
 * 
 * Responsabilidades:
 * - Extrair dados do GatewayEnvelope
 * - Mapear status Ubris -> JuliOrderStatus
 * - Normalizar estruturas de preço
 * - Converter formatos de data
 * 
 * Endpoints Ubris suportados:
 * - GET /api/bff/query/orders - Lista de pedidos
 * - GET /api/bff/query/orders/{id} - Detalhes do pedido
 */

import { Injectable } from '@angular/core';
import {
  JuliOrder,
  JuliOrderEntry,
  JuliOrderHistoryList,
  JuliOrderHistoryPagination,
  JuliOrderSort,
  JuliOrderStatus,
  JuliOrderSummary,
  JuliPrice,
  JuliOrderProduct,
} from '../models/juli-order.model';
import {
  OrderNormalizer,
  NormalizeHistoryOptions,
  OrderNormalizerUtils,
  COMMON_STATUS_MAPPINGS,
} from './order-normalizer.interface';

/**
 * Estrutura esperada de resposta do Ubris Orders API
 */
interface UbrisOrdersResponse {
  items?: unknown[];
  results?: unknown[];
  orders?: unknown[];
  pageSize?: number;
  currentPage?: number;
  totalResults?: number;
  totalPages?: number;
  total?: number;
  sorts?: unknown[];
  sort?: string;
}

/**
 * Estrutura esperada de um pedido Ubris
 */
interface UbrisOrderRaw {
  id?: string;
  orderId?: string;
  status?: string;
  placedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  currency?: string;
  total?: unknown;
  totalItems?: number;
  entries?: unknown[];
  items?: unknown[];
  deliveryAddress?: unknown;
  billingAddress?: unknown;
  deliveryMode?: unknown;
  [key: string]: unknown;
}

/**
 * Estrutura esperada de uma entrada/linha Ubris
 */
interface UbrisEntryRaw {
  entryNumber?: number;
  quantity?: number;
  sku?: string;
  productCode?: string;
  name?: string;
  product?: {
    code?: string;
    sku?: string;
    name?: string;
  };
  unitPrice?: unknown;
  basePrice?: unknown;
  price?: unknown;
  lineTotal?: unknown;
  totalPrice?: unknown;
  total?: unknown;
  currency?: string;
}

@Injectable({ providedIn: 'root' })
export class UbrisOrderNormalizer implements OrderNormalizer {
  
  /**
   * Normaliza lista de pedidos do Ubris
   */
  normalizeHistoryList(rawData: unknown, options: NormalizeHistoryOptions = {}): JuliOrderHistoryList {
    const source = this.extractData(rawData);
    
    // Se for array direto (legado), trata como lista simples
    if (Array.isArray(source)) {
      return this.normalizeLegacyList(source, options);
    }
    
    const response = source as UbrisOrdersResponse;
    const items = OrderNormalizerUtils.asRecordList(
      response.items ?? response.results ?? response.orders ?? []
    );
    
    const currentSort = this.extractSort(response, options.sort);
    const pageSize = Math.max(
      OrderNormalizerUtils.asNumber(response.pageSize, options.pageSize ?? 10),
      1
    );
    const currentPage = Math.max(
      OrderNormalizerUtils.asNumber(response.currentPage, options.currentPage ?? 0),
      0
    );
    const totalResults = Math.max(
      OrderNormalizerUtils.asNumber(response.totalResults, items.length),
      0
    );
    const totalPages = Math.max(
      OrderNormalizerUtils.asNumber(
        response.totalPages,
        totalResults === 0 ? 1 : Math.ceil(totalResults / pageSize)
      ),
      1
    );

    return {
      orders: items.map(order => this.normalizeOrderSummary(order)),
      pagination: { currentPage, pageSize, totalResults, totalPages },
      sorts: this.normalizeSorts(response.sorts, currentSort),
    };
  }

  /**
   * Normaliza detalhes de um pedido
   */
  normalizeOrderDetail(rawData: unknown, userId?: string): JuliOrder {
    const source = OrderNormalizerUtils.asRecord(this.extractData(rawData));
    const currency = OrderNormalizerUtils.firstNonBlank(source, 'currency') ?? 'USD';
    
    // Extrair datas
    const createdAt = OrderNormalizerUtils.asDate(
      OrderNormalizerUtils.firstNonBlank(source, 'placedAt', 'createdAt')
    ) ?? new Date();
    
    const updatedAt = OrderNormalizerUtils.asDate(
      OrderNormalizerUtils.firstNonBlank(source, 'updatedAt')
    ) ?? undefined;

    // Extrair entradas
    const entries = this.normalizeEntries(
      source.entries ?? source.items ?? [],
      currency
    );

    // Calcular total de itens
    const totalItems = OrderNormalizerUtils.asNumber(
      source.totalItems,
      OrderNormalizerUtils.sumQuantities(source.entries ?? source.items)
    );

    return {
      code: OrderNormalizerUtils.firstNonBlank(source, 'id', 'orderId') ?? 'UNKNOWN',
      status: this.mapStatus(OrderNormalizerUtils.firstNonBlank(source, 'status') ?? ''),
      createdAt,
      updatedAt,
      userId,
      
      // Totais
      subTotal: this.normalizePrice(this.pickPriceCandidate(source, 'subtotal', 'subTotal', 'netTotal'), currency) ?? 
                { value: 0, currencyIso: currency, formattedValue: `${currency} 0.00` },
      deliveryCost: this.normalizePrice(this.pickPriceCandidate(source, 'deliveryCost', 'shippingCost', 'freight'), currency),
      totalTax: this.normalizePrice(this.pickPriceCandidate(source, 'tax', 'totalTax', 'taxTotal'), currency),
      totalWithTax: this.normalizePrice(
        this.pickPriceCandidate(source, 'totalWithTax', 'totalPriceWithTax', 'grandTotal', 'total'),
        currency
      ) ?? { value: 0, currencyIso: currency, formattedValue: `${currency} 0.00` },
      total: this.normalizePrice(this.pickPriceCandidate(source, 'total', 'orderTotal'), currency),
      
      // Itens
      entries,
      totalItems,
      
      // Endereços (se disponíveis)
      deliveryAddress: this.normalizeAddress(source.deliveryAddress),
      billingAddress: this.normalizeAddress(source.billingAddress),
      
      // Metadados do backend
      metadata: {
        _raw: source,
        _source: 'ubris',
      },
    };
  }

  /**
   * Mapeia status Ubris para JuliOrderStatus
   */
  mapStatus(backendStatus: string | undefined): JuliOrderStatus {
    if (!backendStatus) return 'UNKNOWN';
    
    const normalized = COMMON_STATUS_MAPPINGS[backendStatus] ??
                      COMMON_STATUS_MAPPINGS[backendStatus.toUpperCase()] ??
                      COMMON_STATUS_MAPPINGS[backendStatus.toLowerCase()];
    
    if (normalized && this.isValidStatus(normalized)) {
      return normalized as JuliOrderStatus;
    }
    
    return 'UNKNOWN';
  }

  // ==================== Métodos Privados ====================

  private normalizeOrderSummary(raw: Record<string, unknown>): JuliOrderSummary {
    const placedAt = OrderNormalizerUtils.asDate(
      OrderNormalizerUtils.firstNonBlank(raw, 'placedAt', 'createdAt')
    ) ?? new Date();
    
    const currency = OrderNormalizerUtils.firstNonBlank(raw, 'currency') ?? 'USD';
    
    return {
      code: OrderNormalizerUtils.firstNonBlank(raw, 'id', 'orderId') ?? 'UNKNOWN',
      status: this.mapStatus(OrderNormalizerUtils.firstNonBlank(raw, 'status') ?? ''),
      createdAt: placedAt,
      updatedAt: OrderNormalizerUtils.asDate(
        OrderNormalizerUtils.firstNonBlank(raw, 'updatedAt')
      ) ?? undefined,
      total: this.normalizePrice(raw.total, currency) ?? { value: 0, currencyIso: currency, formattedValue: `${currency} 0.00` },
      totalItems: OrderNormalizerUtils.asNumber(
        raw.totalItems,
        OrderNormalizerUtils.sumQuantities(raw.entries ?? raw.items)
      ),
      cancellable: OrderNormalizerUtils.asBoolean(raw.cancellable),
      returnable: OrderNormalizerUtils.asBoolean(raw.returnable),
    };
  }

  private normalizeEntries(rawEntries: unknown, currency: string): JuliOrderEntry[] {
    const entries = OrderNormalizerUtils.asRecordList(rawEntries);
    
    return entries.map((entry, index): JuliOrderEntry => {
      const rawEntry = entry as UbrisEntryRaw;
      const quantity = OrderNormalizerUtils.asNumber(rawEntry.quantity, 1);
      
      // Extrair info do produto
      const productRecord = OrderNormalizerUtils.asRecord(rawEntry.product);
      const productCode = rawEntry.sku ?? 
                         rawEntry.productCode ?? 
                         OrderNormalizerUtils.firstNonBlank(productRecord, 'code', 'sku') ?? 
                         'UNKNOWN';
      const productName = rawEntry.name ?? 
                         OrderNormalizerUtils.firstNonBlank(productRecord, 'name') ?? 
                         productCode;

      const product: JuliOrderProduct = {
        code: productCode,
        name: productName,
      };

      // Extrair preços
      const entryCurrency = OrderNormalizerUtils.firstNonBlank(entry, 'currency') ?? currency;
      const basePrice = this.normalizePrice(
        this.pickPriceCandidate(entry, 'unitPrice', 'basePrice', 'price'),
        entryCurrency
      );
      const totalPrice = this.normalizePrice(
        this.pickPriceCandidate(entry, 'lineTotal', 'totalPrice', 'total'),
        entryCurrency
      );

      return {
        entryNumber: OrderNormalizerUtils.asNumber(rawEntry.entryNumber, index),
        quantity: quantity > 0 ? quantity : 1,
        product,
        basePrice: basePrice ?? { value: 0, currencyIso: entryCurrency, formattedValue: `${entryCurrency} 0.00` },
        totalPrice: totalPrice ?? basePrice ?? { value: 0, currencyIso: entryCurrency, formattedValue: `${entryCurrency} 0.00` },
      };
    });
  }

  private normalizePrice(raw: unknown, fallbackCurrency: string): JuliPrice | undefined {
    if (!raw) return undefined;

    // Já é um objeto de preço estruturado
    if (typeof raw === 'object' && raw !== null) {
      const price = raw as Record<string, unknown>;
      const currency = OrderNormalizerUtils.firstNonBlank(price, 'currency', 'currencyIso') ?? fallbackCurrency;
      const value = OrderNormalizerUtils.asNumber(
        price.raw ?? price.value ?? price.amount,
        0
      );
      return {
        currencyIso: currency,
        value,
        formattedValue: OrderNormalizerUtils.firstNonBlank(price, 'formatted', 'formattedValue') ?? 
                       `${currency} ${value.toFixed(2)}`,
      };
    }

    // É um número direto
    if (typeof raw === 'number') {
      return {
        currencyIso: fallbackCurrency,
        value: raw,
        formattedValue: `${fallbackCurrency} ${raw.toFixed(2)}`,
      };
    }

    // É uma string numérica
    if (typeof raw === 'string') {
      const value = OrderNormalizerUtils.asNumber(raw, 0);
      return {
        currencyIso: fallbackCurrency,
        value,
        formattedValue: `${fallbackCurrency} ${value.toFixed(2)}`,
      };
    }

    return undefined;
  }

  private normalizeAddress(raw: unknown): { fullName: string; line1: string; city: string; postalCode: string; countryIso: string; line2?: string; region?: string; phone?: string; } | undefined {
    if (!raw || typeof raw !== 'object') return undefined;
    
    const addr = raw as Record<string, unknown>;
    const fullName = OrderNormalizerUtils.firstNonBlank(addr, 'fullName', 'name', 'recipientName');
    const line1 = OrderNormalizerUtils.firstNonBlank(addr, 'line1', 'street', 'addressLine1', 'streetAddress');
    const city = OrderNormalizerUtils.firstNonBlank(addr, 'city', 'town');
    const postalCode = OrderNormalizerUtils.firstNonBlank(addr, 'postalCode', 'zipCode', 'zip', 'postal');
    const countryIso = OrderNormalizerUtils.firstNonBlank(addr, 'countryIso', 'countryCode', 'country') ?? 'BR';

    if (!fullName || !line1 || !city || !postalCode) {
      return undefined;
    }

    return {
      fullName,
      line1,
      city,
      postalCode,
      countryIso,
      line2: OrderNormalizerUtils.firstNonBlank(addr, 'line2', 'complement', 'addressLine2') ?? undefined,
      region: OrderNormalizerUtils.firstNonBlank(addr, 'region', 'state', 'province') ?? undefined,
      phone: OrderNormalizerUtils.firstNonBlank(addr, 'phone', 'phoneNumber', 'telephone') ?? undefined,
    };
  }

  private normalizeSorts(rawSorts: unknown, currentSort: string): JuliOrderSort[] {
    const sorts = OrderNormalizerUtils.asRecordList(rawSorts)
      .map(sort => ({
        code: OrderNormalizerUtils.firstNonBlank(sort, 'code') ?? '',
        name: OrderNormalizerUtils.firstNonBlank(sort, 'name') ?? 
              OrderNormalizerUtils.firstNonBlank(sort, 'code') ?? 
              '',
        selected: OrderNormalizerUtils.asBoolean(sort.selected),
      }))
      .filter(sort => sort.code.length > 0);

    if (sorts.length > 0) {
      return sorts;
    }

    return this.getDefaultSorts(currentSort);
  }

  private getDefaultSorts(currentSort: string): JuliOrderSort[] {
    return [
      { code: 'byDateDesc', name: 'Mais recentes', selected: currentSort === 'byDateDesc' },
      { code: 'byDateAsc', name: 'Mais antigos', selected: currentSort === 'byDateAsc' },
      { code: 'byTotalDesc', name: 'Maior valor', selected: currentSort === 'byTotalDesc' },
      { code: 'byTotalAsc', name: 'Menor valor', selected: currentSort === 'byTotalAsc' },
    ];
  }

  private normalizeLegacyList(rawOrders: Record<string, unknown>[], options: NormalizeHistoryOptions): JuliOrderHistoryList {
    const sorted = this.sortOrders(rawOrders, options.sort);
    const pageSize = Math.max(options.pageSize ?? sorted.length, 1);
    const currentPage = Math.max(options.currentPage ?? 0, 0);
    const totalResults = sorted.length;
    const totalPages = totalResults === 0 ? 1 : Math.ceil(totalResults / pageSize);
    
    const fromIndex = Math.min(currentPage * pageSize, totalResults);
    const toIndex = Math.min(fromIndex + pageSize, totalResults);
    
    return {
      orders: sorted.slice(fromIndex, toIndex).map(o => this.normalizeOrderSummary(o)),
      pagination: { currentPage, pageSize, totalResults, totalPages },
      sorts: this.getDefaultSorts(options.sort ?? 'byDateDesc'),
    };
  }

  private sortOrders(orders: Record<string, unknown>[], sort?: string): Record<string, unknown>[] {
    const normalizedSort = (sort ?? 'byDateDesc').toLowerCase();
    const result = [...orders];
    
    if (normalizedSort === 'bydatedesc') {
      return result.sort((a, b) => this.getDateValue(b) - this.getDateValue(a));
    }
    if (normalizedSort === 'bydateasc') {
      return result.sort((a, b) => this.getDateValue(a) - this.getDateValue(b));
    }
    if (normalizedSort === 'bytotaldesc') {
      return result.sort((a, b) => this.getTotalValue(b) - this.getTotalValue(a));
    }
    if (normalizedSort === 'bytotalasc') {
      return result.sort((a, b) => this.getTotalValue(a) - this.getTotalValue(b));
    }
    
    return result;
  }

  private getDateValue(raw: Record<string, unknown>): number {
    const value = OrderNormalizerUtils.asDate(
      OrderNormalizerUtils.firstNonBlank(raw, 'placedAt', 'createdAt', 'updatedAt')
    );
    return value?.getTime() ?? 0;
  }

  private getTotalValue(raw: Record<string, unknown>): number {
    return OrderNormalizerUtils.asNumber(raw.total, 0);
  }

  private extractData(rawData: unknown): unknown {
    // Se for GatewayEnvelope, extrai data
    if (rawData && typeof rawData === 'object') {
      const envelope = rawData as { data?: unknown; success?: boolean };
      if ('data' in envelope) {
        return envelope.data;
      }
    }
    return rawData;
  }

  private extractSort(response: UbrisOrdersResponse, fallbackSort?: string): string {
    if (response.sort) return response.sort;
    
    // Tenta encontrar sort selecionado na lista
    const sorts = OrderNormalizerUtils.asRecordList(response.sorts);
    const selected = sorts.find(s => OrderNormalizerUtils.asBoolean(s.selected));
    if (selected) {
      return OrderNormalizerUtils.firstNonBlank(selected, 'code') ?? fallbackSort ?? 'byDateDesc';
    }
    
    return fallbackSort ?? 'byDateDesc';
  }

  private pickPriceCandidate(source: Record<string, unknown>, ...keys: string[]): unknown {
    for (const key of keys) {
      if (key in source && source[key] !== null && source[key] !== undefined) {
        return source[key];
      }
    }
    return undefined;
  }

  private isValidStatus(status: string): status is JuliOrderStatus {
    const validStatuses: JuliOrderStatus[] = [
      'PENDING', 'PROCESSING', 'READY', 'SHIPPED', 'DELIVERED',
      'CANCELLED', 'RETURNED', 'REFUNDED', 'ON_HOLD', 'COMPLETED', 'UNKNOWN'
    ];
    return validStatuses.includes(status as JuliOrderStatus);
  }
}
