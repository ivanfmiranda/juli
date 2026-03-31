/**
 * Order Normalizer Interface
 * 
 * Interface para normalização de dados de pedidos de diferentes backends
 * para o modelo canônico JuliOrder.
 * 
 * Implementações:
 * - UbrisOrderNormalizer: Converte GatewayEnvelope Ubris -> JuliOrder
 * - HybrisOrderNormalizer: Converte OCC Order -> JuliOrder (preparado para futuro)
 * 
 * Esta abstração garante que:
 * 1. Cada backend tem sua própria lógica de normalização
 * 2. A UI nunca vê formatos de backend diretamente
 * 3. É fácil adicionar novos backends (basta implementar esta interface)
 */

import { Observable } from 'rxjs';
import { JuliOrder, JuliOrderHistoryList, JuliOrderStatus } from '../models/juli-order.model';

/**
 * Opções para normalização de histórico
 */
export interface NormalizeHistoryOptions {
  /** Página atual */
  currentPage?: number;
  /** Tamanho da página */
  pageSize?: number;
  /** Código de ordenação */
  sort?: string;
  /** ID do usuário */
  userId?: string;
}

/**
 * Interface que todo normalizador de pedidos deve implementar
 */
export interface OrderNormalizer {
  /**
   * Normaliza uma lista de pedidos do backend para JuliOrderHistoryList
   * 
   * @param rawData Dados brutos do backend
   * @param options Opções de normalização (paginação, ordenação)
   * @returns Lista normalizada de pedidos
   */
  normalizeHistoryList(rawData: unknown, options?: NormalizeHistoryOptions): JuliOrderHistoryList;

  /**
   * Normaliza os detalhes de um pedido
   * 
   * @param rawData Dados brutos do backend
   * @param userId ID do usuário (opcional)
   * @returns Pedido normalizado
   */
  normalizeOrderDetail(rawData: unknown, userId?: string): JuliOrder;

  /**
   * Mapeia um status de backend para JuliOrderStatus canônico
   * 
   * @param backendStatus Status vindo do backend
   * @returns Status canônico
   */
  mapStatus(backendStatus: string | undefined): JuliOrderStatus;
}

/**
 * Utilitários para normalização
 */
export abstract class OrderNormalizerUtils {
  /**
   * Extrai valor de moeda fallback
   */
  protected static readonly DEFAULT_CURRENCY = 'BRL';

  /**
   * Tenta extrair um valor string de múltiplas chaves possíveis
   */
  static firstNonBlank(source: Record<string, unknown>, ...keys: string[]): string | null {
    for (const key of keys) {
      const value = source[key];
      if (value === null || value === undefined) continue;
      const str = String(value).trim();
      if (str.length > 0) return str;
    }
    return null;
  }

  /**
   * Converte valor para número com fallback
   */
  static asNumber(value: unknown, fallback: number): number {
    if (typeof value === 'number' && !Number.isNaN(value)) return value;
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? fallback : parsed;
    }
    return fallback;
  }

  /**
   * Converte valor para boolean
   */
  static asBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.trim().toLowerCase() === 'true';
    return false;
  }

  /**
   * Converte string para Date
   */
  static asDate(value: string | null | undefined): Date | null {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  /**
   * Garante que o valor é um Record
   */
  static asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  }

  /**
   * Garante que o valor é um array de Records
   */
  static asRecordList(value: unknown): Record<string, unknown>[] {
    if (!Array.isArray(value)) return [];
    return value.filter((entry): entry is Record<string, unknown> => 
      !!entry && typeof entry === 'object'
    );
  }

  /**
   * Calcula total de itens a partir de entradas
   */
  static sumQuantities(entries: unknown): number {
    if (!Array.isArray(entries)) return 0;
    return entries
      .filter((entry): entry is Record<string, unknown> => 
        !!entry && typeof entry === 'object'
      )
      .reduce((sum, entry) => sum + this.asNumber(entry.quantity, 0), 0);
  }
}

/**
 * Mapeamento de status comuns de diferentes backends
 */
export const COMMON_STATUS_MAPPINGS: Record<string, string> = {
  // Ubris / Genéricos
  'PENDING': 'PENDING',
  'PROCESSING': 'PROCESSING',
  'READY': 'READY',
  'SHIPPED': 'SHIPPED',
  'DELIVERED': 'DELIVERED',
  'CANCELLED': 'CANCELLED',
  'RETURNED': 'RETURNED',
  'REFUNDED': 'REFUNDED',
  'ON_HOLD': 'ON_HOLD',
  'COMPLETED': 'COMPLETED',
  
  // Hybris OCC comuns
  'CREATED': 'PENDING',
  'ON_CHECK': 'PROCESSING',
  'WAITING_FOR_ERP': 'PROCESSING',
  'Picking': 'PROCESSING',
  'ERP_STATUS_FORCED': 'PROCESSING',
  'ERP_STATUS_RECIEVED': 'PROCESSING',
  'ERP_STATUS_REVIEW': 'PROCESSING',
  'ERP_STATUS_RELEASED': 'READY',
  'Shipped': 'SHIPPED',
  'IN_TRANSIT': 'SHIPPED',
  'Delivered': 'DELIVERED',
  'Payment captured': 'COMPLETED',
  'Completed': 'COMPLETED',
  'Canceled': 'CANCELLED',
  
  // Outros variantes
  'pending': 'PENDING',
  'processing': 'PROCESSING',
  'shipped': 'SHIPPED',
  'delivered': 'DELIVERED',
  'cancelled': 'CANCELLED',
  'canceled': 'CANCELLED',
  'completed': 'COMPLETED',
};
