/**
 * Juli Product Models - Backend Agnostic
 * 
 * Modelos canônicos de produto para o JULI commerce layer.
 * 
 * Design Principles:
 * - Backend agnostic: não depende de Ubris nem OCC
 * - Minimal: apenas campos essenciais para UI
 * - Extensible: permite adicionar campos específicos no campo 'metadata'
 * 
 * Esta camada garante que:
 * 1. A UI nunca depende diretamente de formatos de backend
 * 2. Adapters de diferentes backends convergem para este modelo
 * 3. Facades trabalham apenas com modelos canônicos
 */

// ==================== TYPES ====================

/**
 * Status de estoque canônico
 */
export type JuliStockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN';

/**
 * Tipos de mídia
 */
export type JuliMediaType = 'IMAGE' | 'VIDEO' | 'DOCUMENT';

/**
 * Tipos de classificação de produto
 */
export type JuliProductClassification = 'NEW' | 'BESTSELLER' | 'SALE' | 'LIMITED' | 'NONE';

// ==================== CORE MODELS ====================

/**
 * Preço canônico
 */
export interface JuliPrice {
  /** Valor numérico */
  value: number;
  /** Código ISO da moeda (BRL, USD, EUR) */
  currencyIso: string;
  /** Valor formatado para exibição (ex: "R$ 1.299,90") */
  formattedValue: string;
  /** Preço original (para promoções) */
  originalValue?: number;
  /** Preço original formatado */
  originalFormattedValue?: string;
  /** Flag se está em promoção */
  discounted?: boolean;
  /** Percentual de desconto */
  discountPercentage?: number;
}

/**
 * Mídia do produto (imagem, vídeo)
 */
export interface JuliMedia {
  /** ID único da mídia */
  id: string;
  /** URL da mídia */
  url: string;
  /** Tipo de mídia */
  type: JuliMediaType;
  /** Texto alternativo (acessibilidade) */
  altText?: string;
  /** Título da mídia */
  title?: string;
  /** URL para thumbnail (se aplicável) */
  thumbnailUrl?: string;
  /** URL para zoom/ampliada */
  zoomUrl?: string;
  /** Dimensões */
  width?: number;
  height?: number;
  /** Flag se é a imagem principal */
  primary?: boolean;
  /** Ordem de exibição */
  order?: number;
}

/**
 * Informações de estoque
 */
export interface JuliStock {
  /** Status do estoque */
  status: JuliStockStatus;
  /** Quantidade disponível (se exposto) */
  quantity?: number;
  /** Mensagem de disponibilidade */
  availabilityMessage?: string;
  /** Data estimada de reposição */
  restockDate?: Date;
  /** Flag se permite backorder */
  backorderAllowed?: boolean;
}

/**
 * Categoria resumida
 */
export interface JuliCategorySummary {
  /** Código da categoria */
  code: string;
  /** Nome da categoria */
  name: string;
  /** Descrição curta */
  description?: string;
  /** URL da imagem da categoria */
  imageUrl?: string;
  /** URL amigável */
  url?: string;
  /** Nível hierárquico */
  level?: number;
  /** Código da categoria pai */
  parentCode?: string;
}

/**
 * Atributo de produto
 */
export interface JuliProductAttribute {
  /** Código do atributo */
  code: string;
  /** Nome do atributo */
  name: string;
  /** Valor do atributo */
  value: string | number | boolean;
  /** Valor formatado para exibição */
  formattedValue?: string;
  /** Unidade de medida */
  unit?: string;
  /** Flag se é destaque */
  featured?: boolean;
}

// ==================== PRODUCT SUMMARY (PLP) ====================

/**
 * Resumo de produto para listagens (PLP)
 */
export interface JuliProductSummary {
  /** Código/SKU único */
  code: string;
  /** Nome do produto */
  name: string;
  /** Slug/URL amigável */
  slug?: string;
  /** URL do produto */
  url: string;
  /** Preço atual */
  price: JuliPrice;
  /** Mídia principal (thumbnail) */
  mainImage?: JuliMedia;
  /** Imagens adicionais (para hover) */
  additionalImages?: JuliMedia[];
  /** Status de estoque */
  stock: JuliStock;
  /** Categorias do produto */
  categories?: JuliCategorySummary[];
  /** Classificação/flags */
  classification?: JuliProductClassification;
  /** Rating médio (0-5) */
  rating?: number;
  /** Número de reviews */
  reviewCount?: number;
  /** Flag se está disponível */
  available: boolean;
  /** Metadados extensíveis */
  metadata?: Record<string, unknown>;
}

// ==================== PRODUCT DETAIL (PDP) ====================

/**
 * Produto completo para PDP
 */
export interface JuliProductDetail extends JuliProductSummary {
  /** Descrição curta */
  summary?: string;
  /** Descrição completa (HTML) */
  description?: string;
  /** Galeria completa de mídias */
  gallery: JuliMedia[];
  /** Atributos/características */
  attributes: JuliProductAttribute[];
  /** Atributos em destaque */
  featuredAttributes?: JuliProductAttribute[];
  /** Produtos relacionados */
  relatedProducts?: JuliProductSummary[];
  /** Produtos similares */
  similarProducts?: JuliProductSummary[];
  /** Variações (cor, tamanho) */
  variants?: JuliProductVariant[];
  /** Código da variante selecionada */
  selectedVariantCode?: string;
  /** Informações de entrega */
  deliveryInfo?: JuliDeliveryInfo;
  /** Informações de garantia */
  warrantyInfo?: string;
  /** Tags */
  tags?: string[];
  /** Marca */
  brand?: {
    code: string;
    name: string;
    logoUrl?: string;
  };
  /** SKU do fabricante */
  manufacturerSku?: string;
  /** EAN/UPC */
  ean?: string;
  /** Peso (em gramas) */
  weight?: number;
  /** Dimensões */
  dimensions?: {
    width: number;
    height: number;
    depth: number;
    unit: string;
  };
}

/**
 * Variação de produto (tamanho, cor)
 */
export interface JuliProductVariant {
  /** Código da variante */
  code: string;
  /** Nome da variante */
  name: string;
  /** Atributos da variante (ex: { color: 'Red', size: 'M' }) */
  attributes: Record<string, string>;
  /** Preço específico da variante (se diferente) */
  price?: JuliPrice;
  /** Estoque da variante */
  stock?: JuliStock;
  /** URL da imagem da variante */
  imageUrl?: string;
  /** Flag se está disponível */
  available: boolean;
  /** Flag se é a variante padrão */
  default?: boolean;
}

/**
 * Informações de entrega para produto
 */
export interface JuliDeliveryInfo {
  /** Mensagem de entrega */
  message?: string;
  /** Custo de entrega estimado */
  cost?: JuliPrice;
  /** Prazo em dias */
  estimatedDays?: number;
  /** Data estimada */
  estimatedDate?: Date;
  /** Flag se tem frete grátis */
  freeShipping?: boolean;
  /** Valor mínimo para frete grátis */
  freeShippingThreshold?: JuliPrice;
}

// ==================== LISTING MODELS ====================

/**
 * Paginação de listagem
 */
export interface JuliProductListingPagination {
  /** Página atual (0-based) */
  currentPage: number;
  /** Tamanho da página */
  pageSize: number;
  /** Total de resultados */
  totalResults: number;
  /** Total de páginas */
  totalPages: number;
  /** Flag se tem próxima página */
  hasNext: boolean;
  /** Flag se tem página anterior */
  hasPrevious: boolean;
}

/**
 * Sorting/Ordenação
 */
export interface JuliProductListingSort {
  /** Código da ordenação */
  code: string;
  /** Nome exibido */
  name: string;
  /** Se está selecionada */
  selected: boolean;
}

/**
 * Faceta/Filtro
 */
export interface JuliProductListingFacet {
  /** Código da faceta */
  code: string;
  /** Nome da faceta */
  name: string;
  /** Valores disponíveis */
  values: JuliFacetValue[];
  /** Tipo de faceta */
  type: 'SINGLE' | 'MULTI' | 'RANGE';
}

/**
 * Valor de faceta
 */
export interface JuliFacetValue {
  /** Código do valor */
  code: string;
  /** Nome do valor */
  name: string;
  /** Contagem de produtos */
  count: number;
  /** Se está selecionado */
  selected: boolean;
}

/**
 * Resultado de listagem de produtos (PLP)
 */
export interface JuliProductListing {
  /** Código da categoria/busca */
  code: string;
  /** Nome da categoria/busca */
  name: string;
  /** Descrição */
  description?: string;
  /** Produtos */
  products: JuliProductSummary[];
  /** Informações de paginação */
  pagination: JuliProductListingPagination;
  /** Opções de ordenação */
  sorts: JuliProductListingSort[];
  /** Facetas/filtros disponíveis */
  facets?: JuliProductListingFacet[];
  /** Breadcrumbs */
  breadcrumbs?: JuliBreadcrumbItem[];
  /** Metadados SEO */
  seo?: {
    title?: string;
    description?: string;
    keywords?: string;
  };
}

/**
 * Item de breadcrumb
 */
export interface JuliBreadcrumbItem {
  /** Nome do item */
  name: string;
  /** URL */
  url: string;
  /** Se é a página atual */
  current?: boolean;
}

// ==================== STATES ====================

/**
 * Estados de carregamento de produto
 */
export interface JuliProductLoadingState {
  /** Se está carregando listagem */
  listingLoading: boolean;
  /** Se está carregando detalhe */
  detailLoading: boolean;
  /** Erro na listagem */
  listingError?: string;
  /** Erro no detalhe */
  detailError?: string;
}

/**
 * Estado de variações selecionadas
 */
export interface JuliProductVariantSelection {
  /** Código da variante selecionada */
  variantCode?: string;
  /** Atributos selecionados */
  attributes: Record<string, string>;
  /** Se a seleção é válida */
  valid: boolean;
  /** Mensagem de erro (se inválida) */
  errorMessage?: string;
}
