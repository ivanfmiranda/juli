/**
 * Commerce Module
 * 
 * Camada de e-commerce do JULI - backend agnostic.
 * 
 * Arquitetura:
 * - Models: Modelos canônicos (JuliOrder, etc.)
 * - Adapters: Interface com backends (Ubris, Hybris)
 * - Normalizers: Conversão backend -> modelo canônico
 * - Facades: Abstração de alto nível
 * - Services: Orquestração e estado
 */

// ==================== MODELS ====================
export * from './models';

// ==================== ADAPTERS ====================
export * from './adapters/product.adapter';
export * from './adapters/search.adapter';
export * from './adapters/category.adapter';
export * from './adapters/cart.adapter';
export * from './adapters/checkout.adapter';

// ==================== NORMALIZERS ====================
export * from './normalizers';
export * from './normalizers/search.normalizer';
export * from './normalizers/category.normalizer';
export * from './normalizers/cart.normalizer';

// ==================== CONNECTORS ====================
export * from './connectors/product.connector';
export * from './connectors/search.connector';
export * from './connectors/category.connector';
export * from './connectors/cart.connector';
export * from './connectors/checkout.connector';

// ==================== FACADES ====================
export * from './facades/category.facade';
export * from './facades/cart.facade';
export * from './facades/checkout.facade';
export * from './facades/order.facade';

// ==================== SERVICES ====================
export * from './services/cart-id.storage.service';
export * from './services/anonymous-cart-storage.service';
export { JuliOrderService } from './services/juli-order.service';
export { JuliProductService } from './services/juli-product.service';

// ==================== MODULE ====================
export * from './commerce.module';
