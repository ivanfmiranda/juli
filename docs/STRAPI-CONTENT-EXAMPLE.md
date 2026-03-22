# Exemplo de Conteúdo Strapi para JULI

Este documento fornece exemplos práticos de como estruturar conteúdo no Strapi para o JULI.

## Estrutura de Content Types

### 1. Content Type: `Page`

**Campos:**
- `title` (Text) - Título da página
- `slug` (UID) - Identificador único (ex: home, about, contact)
- `seo` (Component: SeoMetadata) - Metadados SEO
- `header_slots` (Dynamic Zone) - Componentes do header
- `content_slots` (Dynamic Zone) - Componentes principais
- `sidebar_slots` (Dynamic Zone) - Componentes da sidebar
- `below_fold_slots` (Dynamic Zone) - Componentes abaixo da dobra
- `footer_slots` (Dynamic Zone) - Componentes do footer

### 2. Component: `SeoMetadata`

**Campos:**
- `metaTitle` (Text)
- `metaDescription` (Text)
- `keywords` (Text)
- `ogImage` (Media)

### 3. Componentes Dinâmicos (CMS)

#### `cms.hero-banner`
- `title` (Text)
- `subtitle` (Text)
- `cta_label` (Text)
- `cta_link` (Text)
- `background_image` (Media)

#### `cms.simple-banner`
- `title` (Text)
- `description` (Text)
- `image` (Media)
- `link` (Text)
- `button_label` (Text)
- `button_link` (Text)

#### `cms.category-teaser`
- `title` (Text)
- `description` (Text)
- `category_code` (Text) - Código da categoria
- `teaser_image` (Media)

#### `cms.product-teaser`
- `product_code` (Text) - SKU do produto
- `teaser_text` (Text)

#### `cms.info-card`
- `icon` (Text) - Nome do ícone
- `title` (Text)
- `description` (Text)
- `link` (Text)

#### `cms.rich-text`
- `content` (Rich Text)

#### `cms.cta-block`
- `title` (Text)
- `description` (Text)
- `button_label` (Text)
- `button_link` (Text)
- `background_image` (Media)

---

## Exemplos de Páginas

### 1. Homepage Completa

**Título:** Homepage  
**Slug:** home

#### SEO:
- **Meta Title:** JULI Store | Compre Online com Frete Grátis
- **Meta Description:** Os melhores produtos com frete grátis para todo Brasil. Até 50% de desconto em seleção de produtos.
- **Keywords:** ecommerce, loja online, frete grátis, promoções

#### Content Slots (Main Region):

**Component 1: Hero Banner**
```
__component: cms.hero-banner
title: "Coleção Verão 2024"
subtitle: "Até 50% de desconto em produtos selecionados"
cta_label: "Comprar Agora"
cta_link: "/c/verao"
background_image: [upload hero-verao.jpg]
```

**Component 2: Info Card**
```
__component: cms.info-card
icon: "truck"
title: "Frete Grátis"
description: "Em compras acima de R$ 199"
link: "/shipping"
```

**Component 3: Info Card**
```
__component: cms.info-card
icon: "shield"
title: "Compra Segura"
description: "Site 100% seguro com SSL"
```

**Component 4: Info Card**
```
__component: cms.info-card
icon: "refresh"
title: "Troca Fácil"
description: "7 dias para trocar ou devolver"
```

**Component 5: Category Teaser**
```
__component: cms.category-teaser
title: "Eletrônicos"
description: "Os melhores gadgets"
category_code: "eletronicos"
teaser_image: [upload cat-eletronicos.jpg]
```

**Component 6: Category Teaser**
```
__component: cms.category-teaser
title: "Moda"
description: "Tendências 2024"
category_code: "moda"
teaser_image: [upload cat-moda.jpg]
```

**Component 7: CTA Block**
```
__component: cms.cta-block
title: "Baixe nosso App"
description: "Ganhe 10% de desconto na primeira compra pelo app"
button_label: "Baixar Agora"
button_link: "/app"
background_image: [upload app-bg.jpg]
```

#### Below Fold Slots:

**Component 1: Rich Text**
```
__component: cms.rich-text
content: |
  <h2>Por que comprar na JULI?</h2>
  <p>A JULI é a sua loja online de confiança. Oferecemos:</p>
  <ul>
    <li>Produtos de qualidade</li>
    <li>Entrega rápida</li>
    <li>Atendimento premium</li>
  </ul>
```

---

### 2. Página "Sobre Nós"

**Título:** Sobre Nós  
**Slug:** about

#### SEO:
- **Meta Title:** Sobre a JULI | Nossa História
- **Meta Description:** Conheça a história da JULI e nossa missão de proporcionar a melhor experiência de compra.

#### Content Slots:

**Component 1: Hero Banner**
```
__component: cms.hero-banner
title: "Quem Somos"
subtitle: "A maior loja online do Brasil"
cta_label: "Conheça Nossos Produtos"
cta_link: "/c/all"
background_image: [upload sobre-bg.jpg]
```

**Component 2: Rich Text**
```
__component: cms.rich-text
content: |
  <h2>Nossa História</h2>
  <p>Fundada em 2020, a JULI nasceu com a missão de revolucionar o e-commerce brasileiro...</p>
  
  <h3>Nossos Valores</h3>
  <ul>
    <li><strong>Qualidade:</strong> Selecionamos apenas os melhores produtos</li>
    <li><strong>Transparência:</strong> Preço justo, sempre</li>
    <li><strong>Inovação:</strong> Sempre buscando o melhor para você</li>
  </ul>
```

**Component 3: Info Card**
```
__component: cms.info-card
icon: "users"
title: "+1 Milhão"
description: "Clientes satisfeitos"
```

**Component 4: Info Card**
```
__component: cms.info-card
icon: "package"
title: "+500 Mil"
description: "Produtos entregues"
```

---

### 3. Página "Contato"

**Título:** Fale Conosco  
**Slug:** contact

#### SEO:
- **Meta Title:** Contato | Fale com a JULI
- **Meta Description:** Entre em contato conosco. Estamos aqui para ajudar você.

#### Content Slots:

**Component 1: Simple Banner**
```
__component: cms.simple-banner
title: "Como podemos ajudar?"
description: "Nossa equipe está pronta para atender você"
button_label: "Ver FAQ"
button_link: "/faq"
```

**Component 2: Info Card**
```
__component: cms.info-card
icon: "mail"
title: "Email"
description: "contato@juli.com.br"
link: "mailto:contato@juli.com.br"
```

**Component 3: Info Card**
```
__component: cms.info-card
icon: "phone"
title: "Telefone"
description: "0800 123 4567"
link: "tel:08001234567"
```

**Component 4: Info Card**
```
__component: cms.info-card
icon: "message-circle"
title: "Chat"
description: "Atendimento 24h"
link: "#chat"
```

---

### 4. Landing Page de Produto

**Título:** Promoção de Verão  
**Slug:** promocao-verao

#### SEO:
- **Meta Title:** Promoção de Verão 2024 | Até 50% OFF
- **Meta Description:** Aproveite nossa promoção de verão com até 50% de desconto. Oferta por tempo limitado!
- **OG Image:** [upload promocao-og.jpg]

#### Content Slots:

**Component 1: Hero Banner**
```
__component: cms.hero-banner
title: "Promoção de Verão ☀️"
subtitle: "Até 50% OFF em toda a coleção"
cta_label: "Aproveitar Agora"
cta_link: "/c/verao"
background_image: [upload promo-hero.jpg]
```

**Component 2: Product Teaser**
```
__component: cms.product-teaser
product_code: "SUN-001"
teaser_text: "Mais vendido!"
```

**Component 3: Product Teaser**
```
__component: cms.product-teaser
product_code: "SUN-002"
teaser_text: "Edição limitada"
```

**Component 4: Product Teaser**
```
__component: cms.product-teaser
product_code: "SUN-003"
teaser_text: "Novo!"
```

**Component 5: CTA Block**
```
__component: cms.cta-block
title: "Não perca tempo!"
description: "Oferta válida por tempo limitado. Garanta já o seu!"
button_label: "Ver Todos os Produtos"
button_link: "/c/verao"
```

---

## Dicas de Configuração

### 1. Configurar CORS no Strapi

`config/middlewares.js`:
```javascript
module.exports = [
  // ... outros middlewares
  {
    name: 'strapi::cors',
    config: {
      enabled: true,
      headers: '*',
      origin: ['http://localhost:4200', 'https://seu-dominio.com']
    }
  }
];
```

### 2. Permissões Públicas

Em **Settings > Users & Permissions Plugin > Roles > Public**, habilitar:
- `Page` → find, findOne
- `Upload` → find, findOne

### 3. Populate Deep

Para que o Strapi retorne dados aninhados (imagens, componentes), use sempre o parâmetro:
```
?populate=deep,5
```

### 4. Nomenclatura de Imagens

Mantenha uma convenção para facilitar organização:
- Hero banners: `hero-{tema}.jpg`
- Categorias: `cat-{categoria}.jpg`
- Produtos: `prod-{sku}.jpg`
- OG Images: `{pagina}-og.jpg`

---

## Testando via API

### Listar todas as páginas:
```bash
curl http://localhost:1337/api/pages
```

### Buscar página específica:
```bash
curl "http://localhost:1337/api/pages?filters[slug][$eq]=home&populate=deep,5"
```

### Preview (rascunho):
```bash
curl "http://localhost:1337/api/pages?filters[slug][$eq]=home&populate=deep,5&publicationState=preview"
```

---

## Troubleshooting

### Página não aparece
- Verificar se o slug está correto
- Verificar permissões públicas no Strapi
- Verificar logs do console

### Imagens não carregam
- Verificar se as imagens foram publicadas
- Verificar CORS no Strapi
- Verificar URL da imagem no JSON

### Componente não renderiza
- Verificar se o `__component` está correto
- Verificar se o componente está registrado no `CMS_COMPONENT_REGISTRY`
- Verificar console por erros
