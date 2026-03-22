# Orders Feature - JULI Commerce

Documentação completa da feature de Pedidos do JULI.

## Visão Geral

A feature de Orders implementa um sistema completo de gerenciamento de pedidos **backend-agnostic**, permitindo que o JULI opere com diferentes backends (Ubris, Hybris) através de uma camada de abstração unificada.

### Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         UI Layer                                 │
│  ┌──────────────────┐  ┌──────────────────┐                     │
│  │ OrdersPage       │  │ OrderDetailPage  │                     │
│  └────────┬─────────┘  └────────┬─────────┘                     │
└───────────┼─────────────────────┼───────────────────────────────┘
            │                     │
            ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    JuliOrderService                              │
│         (Estado reativo + Orquestração)                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    JuliOrderFacade                               │
│         (Interface com Spartacus UserOrderService)               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     UserOrderAdapter                             │
│                    (Interface Spartacus)                         │
└────────────┬─────────────────────────────┬──────────────────────┘
             │                             │
             ▼                             ▼
┌──────────────────────┐      ┌──────────────────────┐
│  UbrisOrderAdapter   │      │ HybrisOrderAdapter   │  (futuro)
│  ├─ UbrisOrderNormalizer   │      │  ├─ HybrisOrderNormalizer  │
└──────────┬───────────┘      └──────────┬───────────┘
           │                             │
           ▼                             ▼
┌──────────────────────┐      ┌──────────────────────┐
│   Ubris Gateway API  │      │   Hybris OCC API     │
└──────────────────────┘      └──────────────────────┘
```

## Modelo Canônico

O modelo `JuliOrder` é a representação unificada de um pedido, independente do backend.

### Principais Entidades

```typescript
// juli/src/app/core/commerce/models/juli-order.model.ts

interface JuliOrder {
  code: string;
  status: JuliOrderStatus;
  createdAt: Date;
  updatedAt?: Date;
  userId?: string;
  
  // Totais
  subTotal: JuliPrice;
  deliveryCost?: JuliPrice;
  totalTax?: JuliPrice;
  totalWithTax: JuliPrice;
  
  // Itens
  entries: JuliOrderEntry[];
  totalItems: number;
  
  // Endereços
  deliveryAddress?: JuliAddress;
  billingAddress?: JuliAddress;
  
  // Metadados extensíveis
  metadata?: Record<string, unknown>;
}

type JuliOrderStatus = 
  | 'PENDING' | 'PROCESSING' | 'READY' 
  | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' 
  | 'RETURNED' | 'REFUNDED' | 'ON_HOLD' | 'COMPLETED';
```

### Benefícios

- **Backend Agnostic**: Mesma estrutura para Ubris, Hybris ou qualquer outro backend
- **Type Safety**: Tipagem forte em toda a aplicação
- **UI Consistente**: Componentes não precisam conhecer formatos de backend
- **Testabilidade**: Fácil mockar dados para testes

## Endpoints Ubris

### Lista de Pedidos

```http
GET /api/bff/query/orders
```

**Query Parameters:**
| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| tenantId | string | Sim | ID do tenant (default: 'default') |
| customerId | string | Sim | ID do cliente |
| currentPage | number | Não | Página atual (0-based) |
| pageSize | number | Não | Tamanho da página |
| sort | string | Não | Ordenação (byDateDesc, byDateAsc, byTotalDesc, byTotalAsc) |

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "ORD-123456",
        "status": "DELIVERED",
        "placedAt": "2024-01-15T10:30:00Z",
        "total": { "raw": 1299.90, "formatted": "R$ 1.299,90", "currency": "BRL" },
        "totalItems": 3
      }
    ],
    "currentPage": 0,
    "pageSize": 10,
    "totalResults": 25,
    "totalPages": 3
  }
}
```

### Detalhes do Pedido

```http
GET /api/bff/query/orders/{orderId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "ORD-123456",
    "status": "DELIVERED",
    "placedAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-18T14:20:00Z",
    "currency": "BRL",
    "subtotal": { "raw": 1199.90, "formatted": "R$ 1.199,90" },
    "deliveryCost": { "raw": 50.00, "formatted": "R$ 50,00" },
    "tax": { "raw": 50.00, "formatted": "R$ 50,00" },
    "total": { "raw": 1299.90, "formatted": "R$ 1.299,90" },
    "entries": [
      {
        "entryNumber": 1,
        "quantity": 2,
        "product": { "code": "PROD-001", "name": "Produto Exemplo" },
        "unitPrice": { "raw": 599.95, "formatted": "R$ 599,95" },
        "lineTotal": { "raw": 1199.90, "formatted": "R$ 1.199,90" }
      }
    ],
    "deliveryAddress": {
      "fullName": "João Silva",
      "line1": "Rua Exemplo, 123",
      "city": "São Paulo",
      "region": "SP",
      "postalCode": "01001-000",
      "countryIso": "BR",
      "phone": "+55 11 98765-4321"
    }
  }
}
```

## Normalização

### Interface OrderNormalizer

```typescript
interface OrderNormalizer {
  normalizeHistoryList(rawData: unknown, options?: NormalizeHistoryOptions): JuliOrderHistoryList;
  normalizeOrderDetail(rawData: unknown, userId?: string): JuliOrder;
  mapStatus(backendStatus: string | undefined): JuliOrderStatus;
}
```

### Implementação Ubris

O `UbrisOrderNormalizer` converte respostas do Gateway Ubris para o modelo canônico:

```typescript
// src/app/core/commerce/normalizers/ubris-order.normalizer.ts

@Injectable({ providedIn: 'root' })
export class UbrisOrderNormalizer implements OrderNormalizer {
  
  normalizeHistoryList(rawData: unknown, options?: NormalizeHistoryOptions): JuliOrderHistoryList {
    // Extrai dados do GatewayEnvelope
    // Normaliza cada pedido para JuliOrderSummary
    // Retorna estrutura com paginação
  }
  
  normalizeOrderDetail(rawData: unknown, userId?: string): JuliOrder {
    // Converte resposta Ubris para JuliOrder completo
    // Mapeia status para JuliOrderStatus
    // Normaliza preços e endereços
  }
  
  mapStatus(backendStatus: string | undefined): JuliOrderStatus {
    // Mapeia status Ubris para status canônicos
    // Ex: 'Shipped' -> 'SHIPPED'
  }
}
```

## Componentes UI

### OrdersPage

Página de listagem de pedidos com:
- Lista paginada
- Ordenação (data, valor)
- Filtros de status
- Loading states
- Empty state
- Error handling

**Path:** `src/app/pages/orders-page/orders-page.component.ts`

**Features:**
- URL-driven pagination (`?page=0&sort=byDateDesc`)
- Status badges com cores
- Ícones de progresso
- Layout responsivo

### OrderDetailPage

Página de detalhes com:
- Informações do pedido
- Lista de itens
- Resumo de valores
- Endereço de entrega
- Progress bar do pedido
- Tracking info

**Path:** `src/app/pages/order-detail-page/order-detail-page.component.ts`

**Features:**
- Progress bar visual
- Status com ícones
- Formatação de endereço
- Links de rastreamento

## Extensão para Hybris

Para adicionar suporte ao Hybris:

### 1. Criar HybrisOrderNormalizer

```typescript
// src/app/core/commerce/normalizers/hybris-order.normalizer.ts

@Injectable({ providedIn: 'root' })
export class HybrisOrderNormalizer implements OrderNormalizer {
  
  normalizeHistoryList(rawData: unknown, options?: NormalizeHistoryOptions): JuliOrderHistoryList {
    // Implementar conversão OCC -> JuliOrderHistoryList
  }
  
  normalizeOrderDetail(rawData: unknown, userId?: string): JuliOrder {
    // Implementar conversão OCC Order -> JuliOrder
  }
  
  mapStatus(backendStatus: string | undefined): JuliOrderStatus {
    // Mapear status OCC para JuliOrderStatus
    // Ex: 'SHIPPED' -> 'SHIPPED', 'CANCELLED' -> 'CANCELLED'
  }
}
```

### 2. Criar HybrisOrderAdapter

```typescript
// src/app/core/commerce/adapters/hybris/hybris-order.adapter.ts

@Injectable({ providedIn: 'root' })
export class HybrisOrderAdapter implements UserOrderAdapter {
  constructor(
    private http: HttpClient,
    private normalizer: HybrisOrderNormalizer
  ) {}
  
  load(userId: string, orderCode: string): Observable<Order> {
    return this.http.get(`${environment.hybrisApiBaseUrl}/users/${userId}/orders/${orderCode}`)
      .pipe(map(data => this.normalizer.normalizeOrderDetail(data, userId)));
  }
  
  loadHistory(userId: string, pageSize?: number, currentPage?: number, sort?: string): Observable<OrderHistoryList> {
    // Implementar chamada OCC
  }
}
```

### 3. Configurar Provider

```typescript
// No CommerceModule
{
  provide: UserOrderAdapter,
  useClass: environment.backend === 'hybris' 
    ? HybrisOrderAdapter 
    : UbrisOrderAdapter
}
```

## Status Mapping

### Status Canônicos vs Ubris vs Hybris

| Canônico | Ubris | Hybris OCC |
|----------|-------|------------|
| PENDING | PENDING | CREATED |
| PROCESSING | PROCESSING | ON_CHECK, PICKING |
| READY | READY | READY |
| SHIPPED | SHIPPED | SHIPPED |
| DELIVERED | DELIVERED | DELIVERED |
| CANCELLED | CANCELLED | CANCELLED |
| RETURNED | RETURNED | - |
| REFUNDED | REFUNDED | - |
| COMPLETED | COMPLETED | COMPLETED |

## Testes

### Testar Orders Manualmente

1. **Acessar página de pedidos:**
   ```
   http://localhost:4200/account/orders
   ```

2. **Ver detalhes de um pedido:**
   ```
   http://localhost:4200/account/orders/{orderCode}
   ```

3. **Testar paginação:**
   ```
   http://localhost:4200/account/orders?page=1
   ```

4. **Testar ordenação:**
   ```
   http://localhost:4200/account/orders?sort=byTotalDesc
   ```

### Dados de Teste

Para criar pedidos de teste, use o checkout do JULI:
1. Adicione produtos ao carrinho
2. Complete o fluxo de checkout
3. Os pedidos aparecerão na lista

## Considerações

### Performance

- **Lazy Loading**: OrderDetailPage carrega apenas quando acessada
- **Pagination**: Lista paginada no servidor
- **Caching**: JuliOrderService mantém estado reativo
- **Cancelamento**: Unsubscribe automático on destroy

### Segurança

- Pedidos são filtrados por customerId no backend
- Autenticação obrigatória (AuthGuard)
- Não expõe dados sensíveis na URL

### Acessibilidade

- Roles e ARIA labels
- Keyboard navigation
- Focus management
- Screen reader friendly

## Roadmap

### Curto Prazo
- [ ] Filtros avançados (por status, data)
- [ ] Busca de pedidos
- [ ] Exportar histórico (PDF, CSV)

### Médio Prazo
- [ ] Cancelamento de pedidos
- [ ] Solicitação de devolução
- [ ] Notificações de status

### Longo Prazo
- [ ] Suporte Hybris
- [ ] Multi-tenancy completo
- [ ] Analytics de pedidos

## Referências

- [Spartacus Order Service](https://sap.github.io/spartacus-docs/order/)
- [Hybris OCC Order API](https://help.sap.com/docs/SAP_COMMERCE/)
- [JULI Design System](./DESIGN-SYSTEM.md)
