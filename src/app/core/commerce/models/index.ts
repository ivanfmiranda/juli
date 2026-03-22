/**
 * Commerce Models
 * 
 * Modelos canônicos do JULI commerce layer.
 */

// ==================== ORDER MODELS ====================
export {
  JuliOrderStatus,
  JuliPrice,
  JuliAddress,
  JuliOrderProduct,
  JuliOrderEntry,
  JuliDeliveryInfo,
  JuliOrderSummary,
  JuliOrder,
  JuliOrderHistoryPagination,
  JuliOrderSort,
  JuliOrderHistoryList,
  JuliOrderLoadingState,
} from './juli-order.model';

// ==================== PRODUCT MODELS ====================
export {
  // Types
  JuliStockStatus,
  JuliMediaType,
  JuliProductClassification,
  // Core
  JuliPrice as JuliProductPrice,
  JuliMedia,
  JuliStock,
  JuliCategorySummary,
  JuliProductAttribute,
  // Product Models
  JuliProductSummary,
  JuliProductDetail,
  JuliProductVariant,
  JuliDeliveryInfo as JuliProductDeliveryInfo,
  // Listing
  JuliProductListingPagination,
  JuliProductListingSort,
  JuliProductListingFacet,
  JuliFacetValue,
  JuliProductListing,
  JuliBreadcrumbItem,
  // States
  JuliProductLoadingState,
  JuliProductVariantSelection,
} from './juli-product.model';

// ==================== UBRIS LEGACY MODELS ====================
export {
  GatewayEnvelope,
  UbrisStorefrontList,
  JuliCategoryPage,
  JuliCartState,
  JuliCheckoutSubmission,
  JuliCheckoutAddress,
  JuliCheckoutAddressUpsertRequest,
  JuliCheckoutAddressState,
  JuliDeliveryOption,
  JuliCheckoutDeliveryOptionsState,
  JuliCheckoutDeliveryModeSelection,
  JuliCheckoutPaymentCapability,
  JuliCheckoutPaymentMethod,
  JuliCheckoutPaymentMethodsState,
  JuliCheckoutPaymentInitializeState,
  JuliCheckoutPaymentStatus,
  JuliCheckoutReviewItem,
  JuliCheckoutReviewSnapshot,
  JuliCheckoutResult,
  JuliOrderSummary as JuliOrderSummaryLegacy,
  JuliCategoryQuery,
  JuliSearchQuery,
  PromoteResult,
} from './ubris-commerce.models';
