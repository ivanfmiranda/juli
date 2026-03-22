# Products Feature - JULI Commerce

Documentação completa da feature de Produtos do JULI (PLP e PDP).

## Visão Geral

A feature de Produtos implementa um sistema completo de catálogo **backend-agnostic**, permitindo que o JULI exiba produtos de diferentes backends (Ubris, Hybris) através de uma camada de abstração unificada.

### Componentes

- **PLP (Product Listing Page)**: Listagem de produtos por categoria
- **PDP (Product Detail Page)**: Página de detalhes do produto

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         UI Layer                                 │
│  ┌──────────────────────┐  ┌──────────────────────┐            │
│  │ CategoryPage (PLP)   │  │ ProductDetail (PDP)  │            │
│  │ - Grid de produtos   │  │ - Galeria            │            │
│  │ - Paginação          │  │ - Preço/estoque      │            │
│  │ - Sorting            │  │ - Variações          │            │
│  └──────────┬───────────┘  └──────────┬───────────┘            │
└─────────────┼─────────────────────────┼────────────────────────┘
              │                         │
              ▼                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    JuliProductService                            │
│        (Estado reativo + Backend-agnostic)                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
            ┌────────────┴────────────┐
            ▼                         ▼
┌─────────────────────┐    ┌─────────────────────┐
│  UbrisProductAdapter│    │ HybrisProductAdapter│  (futuro)
│  ├─ Normalizer      │    │  ├─ Normalizer      │
└──────────┬──────────┘    └─────────────────────┘
           │
           ▼
┌──────────────────────┐
│   Ubris Gateway API  │
└──────────────────────┘
```

## Modelo Canônico

### JuliProductSummary (PLP)

```typescript
interface JuliProductSummary {
  code: string;           // SKU
  name: string;
  slug: string;
  url: string;
  price: JuliPrice;
  mainImage?: JuliMedia;
  stock: JuliStock;
  available: boolean;
  classification?: 'NEW' | 'BESTSELLER' | 'SALE' | 'LIMITED';
  rating?: number;
  reviewCount?: number;
}
```

### JuliProductDetail (PDP)

```typescript
interface JuliProductDetail extends JuliProductSummary {
  description?: string;
  gallery: JuliMedia[];
  attributes: JuliProductAttribute[];
  variants?: JuliProductVariant[];
  relatedProducts?: JuliProductSummary[];
  brand?: { code: string; name: string; logoUrl?: string };
  deliveryInfo?: JuliDeliveryInfo;
}
```

## Endpoints Ubris

### Listagem de Categoria

```http
GET /api/bff/storefront/category/{code}?page={page}&size={size}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "categoryCode": "eletronicos",
    "categoryName": "Eletrônicos",
    "products": [
      {
        "code": "PROD-001",
        "name": "Smartphone XYZ",
        "price": 1299.90,
        "currency": "BRL",
        "images": [{ "id": "img1", "url": "/img/pdp/img1" }],
        "stock": { "status": "IN_STOCK", "level": 10 }
      }
    ],
    "total": 25,
    "page": 0,
    "size": 12
  }
}
```

### Detalhes do Produto

```http
GET /api/storefront/product/{code}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "code": "PROD-001",
    "name": "Smartphone XYZ",
    "description": "Descrição completa...",
    "price": 1299.90,
    "currency": "BRL",
    "images": [...],
    "stock": { "status": "IN_STOCK", "level": 10 },
    "attributes": [...],
    "variants": [...]
  }
}
```

## Normalização

O `UbrisProductNormalizer` converte respostas do Ubris para o modelo canônico:

```typescript
@Injectable({ providedIn: 'root' })
export class UbrisProductNormalizer implements ProductNormalizer {
  normalizeSummary(rawData: unknown): JuliProductSummary | null;
  normalizeDetail(rawData: unknown): JuliProductDetail | null;
  normalizeListing(categoryCode: string, rawData: unknown, page: number, pageSize: number): JuliProductListing;
  mapStockStatus(backendStatus: string | undefined): JuliStockStatus;
}
```

## PLP (CategoryPage)

### Features

- Grid responsivo de produtos
- Paginação com números de página
- Ordenação (relevância, nome, preço)
- Breadcrumbs
- Badges (Novo, Promoção, Top)
- Quick add to cart
- Loading e empty states

### URL

```
/c/{categoryCode}?page=0&sort=price-asc
```

### Uso

```typescript
this.juliProductService.loadCategoryListing('eletronicos', 0, 12, 'price-asc');
```

## PDP (ProductDetail)

### Features

- Galeria de imagens com thumbnails
- Zoom de imagem
- Informações de preço (com desconto)
- Status de estoque
- Seleção de variações (cor, tamanho)
- Controle de quantidade
- CTA add to cart
- Descrição e especificações
- Produtos relacionados

### URL

```
/product/{productCode}
```

### Uso

```typescript
this.juliProductService.loadProductDetail('PROD-001');

// Selecionar variante
this.juliProductService.updateVariantAttribute('color', 'red');
```

## Variações de Produto

O sistema suporta produtos com variações (cor, tamanho, etc.):

```typescript
interface JuliProductVariant {
  code: string;
  name: string;
  attributes: Record<string, string>;  // { color: 'Red', size: 'M' }
  price?: JuliPrice;
  stock?: JuliStock;
  available: boolean;
}
```

### Fluxo de Seleção

1. Usuário seleciona atributos (ex: Cor = Vermelho)
2. Sistema busca variante correspondente
3. Atualiza preço e estoque da variante selecionada
4. Valida disponibilidade antes de adicionar ao carrinho

## Backend Agnostic

Para adicionar suporte ao Hybris:

1. **Criar HybrisProductNormalizer:**
```typescript
@Injectable({ providedIn: 'root' })
export class HybrisProductNormalizer implements ProductNormalizer {
  // Implementar interface
}
```

2. **Atualizar Connector:**
```typescript
// Em commerce.module.ts
{
  provide: ProductAdapter,
  useClass: environment.backend === 'hybris' 
    ? HybrisProductAdapter 
    : UbrisProductAdapter
}
```

## Integração com CMS

O CMS pode complementar as páginas de produto:

### PLP Editorial

```json
{
  "__component": "cms.product-listing",
  "category_code": "eletronicos",
  "title": "Nossos Eletrônicos",
  "description": "Os melhores gadgets"
}
```

### PDP Editorial

```json
{
  "__component": "cms.product-spotlight",
  "product_code": "PROD-001",
  "teaser_text": "Produto em destaque"
}
```

## Testes

### URLs de Teste

```
# PLP
http://localhost:4200/c/eletronicos
http://localhost:4200/c/eletronicos?page=1
http://localhost:4200/c/eletronicos?sort=price-desc

# PDP
http://localhost:4200/product/PROD-001
```

## Roadmap

- [ ] Filtros faceted (marca, preço, atributos)
- [ ] Quick view (modal PDP)
- [ ] Comparação de produtos
- [ ] Wishlist
- [ ] Reviews e ratings
- [ ] Produtos relacionados dinâmicos
