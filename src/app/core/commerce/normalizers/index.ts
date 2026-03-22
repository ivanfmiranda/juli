/**
 * Commerce Normalizers
 * 
 * Normalizadores para converter dados de diferentes backends
 * para o modelo canônico do JULI.
 */

// ==================== INTERFACES E UTILITÁRIOS ====================
export {
  OrderNormalizer,
  NormalizeHistoryOptions,
  OrderNormalizerUtils,
  COMMON_STATUS_MAPPINGS,
} from './order-normalizer.interface';

export {
  ProductNormalizer,
  ProductNormalizerUtils,
  COMMON_STOCK_MAPPINGS,
} from './product-normalizer.interface';

// ==================== IMPLEMENTAÇÕES ====================
export { UbrisOrderNormalizer } from './ubris-order.normalizer';
export { UbrisProductNormalizer } from './ubris-product.normalizer';
