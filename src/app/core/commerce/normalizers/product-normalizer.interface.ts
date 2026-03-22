/**
 * Product Normalizer Interface
 * 
 * Interface para normalização de dados de produtos de diferentes backends
 * para o modelo canônico JuliProduct.
 * 
 * Implementações:
 * - UbrisProductNormalizer: Converte GatewayEnvelope Ubris -> JuliProduct
 * - HybrisProductNormalizer: Converte OCC Product -> JuliProduct (preparado para futuro)
 */

import {
  JuliProductSummary,
  JuliProductDetail,
  JuliProductListing,
  JuliMedia,
  JuliPrice,
  JuliStock,
  JuliStockStatus,
} from '../models/juli-product.model';

/**
 * Interface que todo normalizador de produtos deve implementar
 */
export interface ProductNormalizer {
  /**
   * Normaliza um produto para resumo (PLP)
   * 
   * @param rawData Dados brutos do backend
   * @returns Produto resumido normalizado
   */
  normalizeSummary(rawData: unknown): JuliProductSummary | null;

  /**
   * Normaliza um produto completo (PDP)
   * 
   * @param rawData Dados brutos do backend
   * @returns Produto completo normalizado
   */
  normalizeDetail(rawData: unknown): JuliProductDetail | null;

  /**
   * Normaliza uma listagem de produtos
   * 
   * @param categoryCode Código da categoria
   * @param rawData Dados brutos do backend
   * @param page Página atual
   * @param pageSize Tamanho da página
   * @returns Listagem normalizada
   */
  normalizeListing(
    categoryCode: string,
    rawData: unknown,
    page: number,
    pageSize: number
  ): JuliProductListing;

  /**
   * Mapeia status de estoque do backend para JuliStockStatus
   * 
   * @param backendStatus Status vindo do backend
   * @returns Status canônico
   */
  mapStockStatus(backendStatus: string | undefined): JuliStockStatus;
}

/**
 * Utilitários para normalização de produtos
 */
export abstract class ProductNormalizerUtils {
  /**
   * Extrai o primeiro valor não vazio de múltiplas chaves
   */
  static firstNonBlank(source: Record<string, unknown>, ...keys: string[]): string | undefined {
    for (const key of keys) {
      const value = source[key];
      if (value === null || value === undefined) continue;
      const str = String(value).trim();
      if (str.length > 0) return str;
    }
    return undefined;
  }

  /**
   * Converte valor para número
   */
  static asNumber(value: unknown, fallback: number = 0): number {
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
   * Garante que o valor é um Record
   */
  static asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }

  /**
   * Garante que o valor é um array
   */
  static asArray<T>(value: unknown): T[] {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is T => item !== null && item !== undefined);
  }

  /**
   * Extrai dados de um GatewayEnvelope
   */
  static extractData<T>(rawData: unknown): T | null {
    if (!rawData || typeof rawData !== 'object') return null;
    const envelope = rawData as { data?: T };
    return envelope.data ?? null;
  }

  /**
   * Formata preço para exibição
   */
  static formatPrice(value: number, currencyIso: string): string {
    // Formatacao basica - pode ser customizada por locale
    const formatter = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currencyIso,
    });
    return formatter.format(value);
  }

  /**
   * Calcula percentual de desconto
   */
  static calculateDiscountPercentage(original: number, current: number): number {
    if (original <= 0 || current >= original) return 0;
    return Math.round(((original - current) / original) * 100);
  }
}

/**
 * Mapeamento de status de estoque comuns
 */
export const COMMON_STOCK_MAPPINGS: Record<string, JuliStockStatus> = {
  // Ubris / Genéricos
  'IN_STOCK': 'IN_STOCK',
  'INSTOCK': 'IN_STOCK',
  'AVAILABLE': 'IN_STOCK',
  'LOW_STOCK': 'LOW_STOCK',
  'LOWSTOCK': 'LOW_STOCK',
  'LIMITED': 'LOW_STOCK',
  'OUT_OF_STOCK': 'OUT_OF_STOCK',
  'OUTOFSTOCK': 'OUT_OF_STOCK',
  'UNAVAILABLE': 'OUT_OF_STOCK',
  'NOT_AVAILABLE': 'OUT_OF_STOCK',
  'UNKNOWN': 'UNKNOWN',
  
  // Hybris OCC
  'inStock': 'IN_STOCK',
  'lowStock': 'LOW_STOCK',
  'outOfStock': 'OUT_OF_STOCK',
  
  // Variant
  'in_stock': 'IN_STOCK',
  'low_stock': 'LOW_STOCK',
  'out_of_stock': 'OUT_OF_STOCK',
};
