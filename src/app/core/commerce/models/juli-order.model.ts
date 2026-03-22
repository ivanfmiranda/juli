/**
 * Juli Order Model - Backend Agnostic
 * 
 * Modelo canônico de Order para o JULI commerce layer.
 * 
 * Design Principles:
 * - Backend agnostic: não depende de OCC (Hybris) nem GatewayEnvelope (Ubris)
 * - Minimal: apenas campos essenciais para UI
 * - Extensible: permite adicionar campos específicos de backend no campo 'metadata'
 * 
 * Esta camada de modelagem garante que:
 * 1. A UI nunca depende diretamente de formatos de backend
 * 2. Adapters de diferentes backends (Ubris, Hybris) convergem para este modelo
 * 3. Facades trabalham apenas com este modelo canônico
 * 
 * @see OrderNormalizer - Interface para converter backend -> JuliOrder
 * @see UbrisOrderNormalizer - Implementação para Ubris
 */

/**
 * Status canônicos de um pedido
 * Mapeados a partir de diferentes convenções de backend
 */
export type JuliOrderStatus =
  | 'PENDING'      // Aguardando processamento
  | 'PROCESSING'   // Em processamento
  | 'READY'        // Pronto para envio
  | 'SHIPPED'      // Enviado
  | 'DELIVERED'    // Entregue
  | 'CANCELLED'    // Cancelado
  | 'RETURNED'     // Devolvido
  | 'REFUNDED'     // Reembolsado
  | 'ON_HOLD'      // Em espera
  | 'COMPLETED'    // Concluído
  | 'UNKNOWN';     // Status não reconhecido

/**
 * Representação canônica de preço
 */
export interface JuliPrice {
  /** Valor numérico */
  value: number;
  /** Código ISO da moeda */
  currencyIso: string;
  /** Valor formatado para exibição */
  formattedValue: string;
}

/**
 * Endereço de entrega/faturamento canônico
 */
export interface JuliAddress {
  /** ID único do endereço */
  id?: string;
  /** Nome completo do destinatário */
  fullName: string;
  /** Linha 1 do endereço (rua, número) */
  line1: string;
  /** Linha 2 do endereço (complemento, apto) */
  line2?: string;
  /** Cidade */
  city: string;
  /** Estado/Província/Região */
  region?: string;
  /** Código postal/CEP */
  postalCode: string;
  /** Código ISO do país */
  countryIso: string;
  /** Nome do país (para exibição) */
  countryName?: string;
  /** Telefone de contato */
  phone?: string;
}

/**
 * Produto em uma linha de pedido
 */
export interface JuliOrderProduct {
  /** Código/SKU do produto */
  code: string;
  /** Nome do produto */
  name: string;
  /** URL da imagem (thumbnail) */
  imageUrl?: string;
  /** Categoria principal */
  category?: string;
}

/**
 * Linha de item em um pedido
 */
export interface JuliOrderEntry {
  /** Número sequencial da linha */
  entryNumber: number;
  /** Quantidade */
  quantity: number;
  /** Produto */
  product: JuliOrderProduct;
  /** Preço unitário base */
  basePrice: JuliPrice;
  /** Preço total da linha (quantidade * unitário) */
  totalPrice: JuliPrice;
  /** Custo de envio da linha (se aplicável) */
  deliveryCost?: JuliPrice;
}

/**
 * Informações de entrega
 */
export interface JuliDeliveryInfo {
  /** Código do modo de entrega */
  modeCode?: string;
  /** Nome do modo de entrega */
  modeName?: string;
  /** Custo de entrega */
  cost?: JuliPrice;
  /** Data estimada de entrega */
  estimatedDate?: Date;
  /** Código de rastreamento */
  trackingCode?: string;
  /** URL de rastreamento */
  trackingUrl?: string;
}

/**
 * Resumo de um pedido (para listas)
 */
export interface JuliOrderSummary {
  /** Código único do pedido */
  code: string;
  /** Status do pedido */
  status: JuliOrderStatus;
  /** Data de criação do pedido */
  createdAt: Date;
  /** Data da última atualização */
  updatedAt?: Date;
  /** Valor total do pedido */
  total: JuliPrice;
  /** Número total de itens */
  totalItems: number;
  /** Flag se o pedido pode ser cancelado */
  cancellable?: boolean;
  /** Flag se o pedido pode ser devolvido */
  returnable?: boolean;
}

/**
 * Detalhes completos de um pedido
 */
export interface JuliOrder {
  /** Código único do pedido */
  code: string;
  /** Status do pedido */
  status: JuliOrderStatus;
  /** Data de criação */
  createdAt: Date;
  /** Data da última atualização */
  updatedAt?: Date;
  /** ID do usuário/cliente */
  userId?: string;
  
  // Totais
  /** Subtotal (antes de taxas e frete) */
  subTotal: JuliPrice;
  /** Custo de entrega */
  deliveryCost?: JuliPrice;
  /** Total de taxas */
  totalTax?: JuliPrice;
  /** Total geral (com taxas) */
  totalWithTax: JuliPrice;
  /** Total geral (sem taxas) - legacy */
  total?: JuliPrice;
  
  // Itens
  /** Linhas do pedido */
  entries: JuliOrderEntry[];
  /** Número total de itens (soma das quantidades) */
  totalItems: number;
  
  // Endereços
  /** Endereço de entrega */
  deliveryAddress?: JuliAddress;
  /** Endereço de faturamento (se diferente) */
  billingAddress?: JuliAddress;
  
  // Entrega
  /** Informações de entrega */
  deliveryInfo?: JuliDeliveryInfo;
  
  // Metadados extensíveis
  /** Dados específicos do backend (não tipados) */
  metadata?: Record<string, unknown>;
}

/**
 * Paginação de lista de pedidos
 */
export interface JuliOrderHistoryPagination {
  /** Página atual (0-based) */
  currentPage: number;
  /** Tamanho da página */
  pageSize: number;
  /** Total de resultados */
  totalResults: number;
  /** Total de páginas */
  totalPages: number;
}

/**
 * Opção de ordenação
 */
export interface JuliOrderSort {
  /** Código da ordenação */
  code: string;
  /** Nome exibido */
  name: string;
  /** Se está selecionada */
  selected: boolean;
}

/**
 * Lista de pedidos (para histórico)
 */
export interface JuliOrderHistoryList {
  /** Pedidos na página atual */
  orders: JuliOrderSummary[];
  /** Informações de paginação */
  pagination: JuliOrderHistoryPagination;
  /** Opções de ordenação disponíveis */
  sorts: JuliOrderSort[];
}

/**
 * Estados de carregamento
 */
export interface JuliOrderLoadingState {
  /** Se está carregando lista */
  listLoading: boolean;
  /** Se está carregando detalhe */
  detailLoading: boolean;
  /** Erro na lista, se houver */
  listError?: string;
  /** Erro no detalhe, se houver */
  detailError?: string;
}
