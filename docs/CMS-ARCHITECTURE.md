# JULI CMS Architecture

Documentação completa da arquitetura de CMS do JULI, baseada em Strapi como headless CMS.

## Visão Geral

O JULI utiliza uma arquitetura de **CMS desacoplado (headless)** que permite:

- **Independência de backend**: O mesmo CMS pode ser usado com Ubris ou Hybris
- **Conteúdo dinâmico**: Páginas configuráveis via Strapi sem deploy
- **Componentização**: Sistema de blocos reutilizáveis
- **Multi-tenant**: Suporte a múltiplos tenants

### Arquitetura em Camadas

```
┌─────────────────────────────────────────────────────────────────┐
│                         UI Layer                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    CmsPageComponent                      │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │   │
│  │  │ Header  │ │  Main   │ │ Sidebar │ │ Footer  │       │   │
│  │  │ Region  │ │ Region  │ │ Region  │ │ Region  │       │   │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘       │   │
│  │       │           │           │           │            │   │
│  │  ┌────▼────┐ ┌────▼────┐ ┌────▼────┐ ┌────▼────┐       │   │
│  │  │Component│ │Component│ │Component│ │Component│       │   │
│  │  │  Host   │ │  Host   │ │  Host   │ │  Host   │       │   │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘       │   │
│  │       │           │           │           │            │   │
│  │  ┌────▼────┐ ┌────▼────┐ ┌────▼────┐ ┌────▼────┐       │   │
│  │  │  Hero   │ │ Banner  │ │ Product │ │  Info   │       │   │
│  │  │ Banner  │ │   CTA   │ │ Teaser  │ │  Card   │       │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘       │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CMS Service Layer                             │
│  ┌─────────────────────┐    ┌─────────────────────┐             │
│  │   CmsPageService    │◄───│ StrapiCmsAdapter    │             │
│  │   (Orquestração)    │    │ (Adapter Pattern)   │             │
│  └─────────────────────┘    └──────────┬──────────┘             │
└────────────────────────────────────────┼────────────────────────┘
                                         │
                              ┌──────────┴──────────┐
                              ▼                     ▼
                  ┌─────────────────────┐  ┌─────────────────────┐
                  │   Strapi API        │  │   Other CMS API     │
                  │   (Headless)        │  │   (Future/Hybris)   │
                  └─────────────────────┘  └─────────────────────┘
```

## Modelo Canônico

O JULI define um **contrato canônico** para CMS que independe do backend específico.

### Estrutura de Página

```typescript
interface CmsPage {
  uid: string;           // Identificador único
  label: string;         // Slug da página (ex: 'home', 'about')
  title?: string;        // Título da página
  template: string;      // Layout template
  type?: string;         // Tipo de página
  found?: boolean;       // Se a página foi encontrada
  regions: Record<string, CmsRegion>;  // Regiões da página
  seo?: SeoMetadataModel;  // Metadados SEO
}
```

### Regiões

Cada página é dividida em 5 regiões:

| Região | Descrição | Slot Name |
|--------|-----------|-----------|
| `header` | Cabeçalho da página | Header |
| `main` | Conteúdo principal | Section1 |
| `sidebar` | Barra lateral | Sidebar |
| `belowFold` | Conteúdo abaixo da dobra | Section2 |
| `footer` | Rodapé | Footer |

```typescript
interface CmsRegion {
  uid: string;
  name: CmsRegionName;
  components: CmsComponentData[];
}
```

### Componentes

Todos os componentes seguem a mesma interface base:

```typescript
interface CmsComponentData {
  uid: string;           // ID único do componente
  typeCode: string;      // Tipo mapeado no registry
  flexType: string;      // Tipo flexível (Spartacus)
  region?: string;       // Região pai
  originalType?: string; // Tipo original do Strapi
  status?: 'ready' | 'unknown' | 'invalid';
  name?: string;
  // ... dados específicos do componente
}
```

## Component Registry

O registro de componentes mapeia `typeCode` → Componente Angular:

```typescript
export const CMS_COMPONENT_REGISTRY = {
  JuliHeroBannerComponent: {
    component: HeroBannerComponent
  },
  JuliSimpleBannerComponent: {
    component: SimpleBannerComponent
  },
  JuliCategoryTeaserComponent: {
    component: CategoryTeaserComponent
  },
  JuliCtaBlockComponent: {
    component: CtaBlockComponent
  },
  CMSParagraphComponent: {
    component: ParagraphComponent
  },
  JuliProductTeaserComponent: {
    component: ProductTeaserComponent
  },
  JuliInfoCardComponent: {
    component: InfoCardComponent
  },
  // Fallbacks
  UnknownComponent: { component: UnknownComponent },
  ErrorComponent: { component: ErrorComponent }
};
```

### Componentes Disponíveis

| Componente | Tipo Strapi | Descrição |
|------------|-------------|-----------|
| **HeroBanner** | `hero-banner` | Banner principal com imagem de fundo, título, subtítulo e CTA |
| **SimpleBanner** | `simple-banner` | Banner simples com imagem e link |
| **CategoryTeaser** | `category-teaser` | Teaser de categoria com link para `/c/{code}` |
| **CtaBlock** | `cta-block` | Bloco de call-to-action |
| **Paragraph** | `rich-text` | Texto rico/formatado |
| **ProductTeaser** | `product-teaser` | Teaser de produto com código SKU |
| **InfoCard** | `info-card` | Card de informação com ícone |

## Strapi Adapter

O `StrapiCmsAdapter` converte a API do Strapi para o modelo canônico.

### Endpoint

```
GET /strapi-api/pages?filters[slug][$eq]={slug}&populate=deep,5
```

### Estrutura Esperada no Strapi

#### Content Type: Page

```json
{
  "data": [{
    "id": 1,
    "attributes": {
      "title": "Homepage",
      "slug": "home",
      "seo": {
        "metaTitle": "JULI Store",
        "metaDescription": "Bem-vindo à JULI",
        "keywords": "ecommerce, juli",
        "ogImage": { "data": { "attributes": { "url": "/uploads/og.jpg" } } }
      },
      "content_slots": [...],     // Componentes região main
      "header_slots": [...],      // Componentes região header
      "sidebar_slots": [...],     // Componentes região sidebar
      "below_fold_slots": [...],  // Componentes região belowFold
      "footer_slots": [...]       // Componentes região footer
    }
  }]
}
```

#### Dynamic Zones (Componentes)

Cada região aceita componentes dinâmicos:

**Hero Banner:**
```json
{
  "__component": "cms.hero-banner",
  "title": "Bem-vindo",
  "subtitle": "Descubra nossas ofertas",
  "cta_label": "Ver produtos",
  "cta_link": "/c/all",
  "background_image": { "data": { "attributes": { "url": "/uploads/hero.jpg" } } }
}
```

**Product Teaser:**
```json
{
  "__component": "cms.product-teaser",
  "product_code": "PROD-001",
  "teaser_text": "Novidade!"
}
```

**Info Card:**
```json
{
  "__component": "cms.info-card",
  "icon": "truck",
  "title": "Frete Grátis",
  "description": "Para compras acima de R$ 199",
  "link": "/shipping"
}
```

## Rotas

O sistema de rotas mapeia URLs para páginas CMS:

```typescript
const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'page/home' },
  { path: 'page/preview/:slug', component: CmsPageComponent, data: { preview: true } },
  { path: 'page/:slug', component: CmsPageComponent },
  { path: 'terms', redirectTo: 'page/terms', pathMatch: 'full' },
  { path: 'privacy', redirectTo: 'page/privacy', pathMatch: 'full' },
  // ... outras rotas
];
```

### URLs Válidas

| URL | Descrição |
|-----|-----------|
| `/` | Redireciona para `/page/home` |
| `/page/home` | Homepage dinâmica |
| `/page/about` | Página "Sobre" |
| `/page/preview/home` | Preview da homepage (draft) |
| `/terms` | Redireciona para `/page/terms` |

## Configuração

### Environment

```typescript
export const environment = {
  strapiApiBaseUrl: '/strapi-api',  // Proxy para Strapi
  defaultCmsSlug: 'home',           // Página padrão
  // ...
};
```

### Proxy (proxy.conf.json)

```json
{
  "/strapi-api": {
    "target": "http://localhost:1337/api",
    "pathRewrite": { "^/strapi-api": "" },
    "changeOrigin": true
  }
}
```

## Extensão para Outros CMS

Para adicionar suporte a outro CMS (ex: Contentful, Sanity):

1. **Criar Adapter:**
```typescript
@Injectable({ providedIn: 'root' })
export class ContentfulCmsAdapter {
  loadCanonical(pageContext: PageContext): Observable<CmsPage> {
    // Implementar conversão Contentful → CmsPage
  }
}
```

2. **Trocar Provider:**
```typescript
providers: [
  {
    provide: CmsPageAdapter,
    useClass: environment.cmsProvider === 'contentful' 
      ? ContentfulCmsAdapter 
      : StrapiCmsAdapter
  }
]
```

## Exemplo: Homepage Completa

### Estrutura no Strapi

**Page: "home"**

```json
{
  "data": [{
    "attributes": {
      "title": "JULI - Sua Loja Online",
      "slug": "home",
      "seo": {
        "metaTitle": "JULI Store | Compre Online",
        "metaDescription": "Os melhores produtos com frete grátis"
      },
      "header_slots": [],
      "content_slots": [
        {
          "__component": "cms.hero-banner",
          "title": "Coleção Verão 2024",
          "subtitle": "Até 50% de desconto",
          "cta_label": "Comprar Agora",
          "cta_link": "/c/verao",
          "background_image": { "data": { "attributes": { "url": "/uploads/hero-verao.jpg" } } }
        },
        {
          "__component": "cms.info-card",
          "icon": "truck",
          "title": "Frete Grátis",
          "description": "Em compras acima de R$ 199"
        },
        {
          "__component": "cms.info-card",
          "icon": "shield",
          "title": "Compra Segura",
          "description": "Site 100% seguro"
        },
        {
          "__component": "cms.info-card",
          "icon": "refresh",
          "title": "Troca Fácil",
          "description": "7 dias para trocar"
        },
        {
          "__component": "cms.category-teaser",
          "title": "Eletrônicos",
          "category_code": "eletronicos",
          "teaser_image": { "data": { "attributes": { "url": "/uploads/cat-eletronicos.jpg" } } }
        },
        {
          "__component": "cms.category-teaser",
          "title": "Moda",
          "category_code": "moda",
          "teaser_image": { "data": { "attributes": { "url": "/uploads/cat-moda.jpg" } } }
        }
      ],
      "sidebar_slots": [],
      "below_fold_slots": [
        {
          "__component": "cms.rich-text",
          "content": "<h2>Por que comprar na JULI?</h2><p>Qualidade garantida...</p>"
        }
      ],
      "footer_slots": []
    }
  }]
}
```

### Resultado na UI

```
┌─────────────────────────────────────────────────────┐
│                    [ HEADER ]                        │  (vazio neste exemplo)
├─────────────────────────────────────────────────────┤
│                                                      │
│    ┌─────────────────────────────────────────────┐  │
│    │     Coleção Verão 2024                      │  │  Hero Banner
│    │     Até 50% de desconto                     │  │
│    │     [ Comprar Agora ]                       │  │
│    └─────────────────────────────────────────────┘  │
│                                                      │
│    ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│    │ 🚚       │ │ 🛡️       │ │ 🔄       │          │  Info Cards
│    │ Frete    │ │ Compra   │ │ Troca    │          │
│    │ Grátis   │ │ Segura   │ │ Fácil    │          │
│    └──────────┘ └──────────┘ └──────────┘          │
│                                                      │
│    ┌─────────────────┐ ┌─────────────────┐          │
│    │  Eletrônicos    │ │      Moda       │          │  Category Teasers
│    │  [Ver produtos] │ │  [Ver produtos] │          │
│    └─────────────────┘ └─────────────────┘          │
│                                                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│    Por que comprar na JULI?                          │  Below Fold
│    Qualidade garantida...                            │  (Rich Text)
│                                                      │
└─────────────────────────────────────────────────────┘
│                    [ FOOTER ]                        │  (vazio neste exemplo)
└─────────────────────────────────────────────────────┘
```

## Testes

### Verificar CMS Funcionando

1. **Acessar homepage:**
   ```
   http://localhost:4200/
   ```

2. **Acessar página específica:**
   ```
   http://localhost:4200/page/about
   ```

3. **Preview de rascunho:**
   ```
   http://localhost:4200/page/preview/nova-pagina
   ```

### Debug

Habilitar logs no console:
```typescript
// No adapter
console.log('[StrapiCmsAdapter] Loading page:', slug);
console.log('[StrapiCmsAdapter] Response:', response);
```

## Referências

- [Strapi Documentation](https://docs.strapi.io/)
- [Spartacus CMS](https://sap.github.io/spartacus-docs/creating-pages-and-components/)
- [Headless CMS Architecture](https://strapi.io/blog/headless-cms-vs-traditional-cms)
