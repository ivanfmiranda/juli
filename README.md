# Juli

Official Angular + Spartacus storefront for Ubris headless commerce with Strapi as CMS.

## Runtime model

- Frontend runtime: Angular workspace using Spartacus packages
- CMS source of truth: Strapi REST API
- Commerce source of truth: Ubris headless through `gateway-bff`
- Product and category data: Ubris
- Editorial page structure: Strapi
- Hybrid CMS components: editorial payload from Strapi, live commerce enrichment from Ubris

## What is in use now

- `src/app/core/cms/adapters/strapi-cms.adapter.ts`
  - Strapi page adapter
  - canonical regions: `header`, `main`, `sidebar`, `belowFold`, `footer`
  - safe fallback for invalid or unsupported components
- `src/app/core/commerce/adapters/*`
  - low-level Ubris HTTP adapters against `gateway-bff`
- `src/app/core/commerce/connectors/*`
  - normalization into Spartacus-friendly product/search/cart/order models
- `src/app/core/commerce/facades/*`
  - page-level orchestration for cart, checkout, orders and category flows
- `src/app/spartacus/strapi-cms.module.ts`
  - Spartacus CMS registry aligned with the adapter output
- `src/app/shared/components/product-teaser/*`
  - editorial reference from Strapi
  - live product data from Ubris through Spartacus `ProductService`

## Current routes

- public:
  - `/`
    - redirects to `/page/home`
  - `/login`
  - `/page/:slug`
  - `/page/preview/:slug`
  - `/product/:code`
  - `/c/:code`
  - `/search?q=`
  - `/terms`
  - `/privacy`
- protected by login:
  - `/cart`
  - `/checkout`
  - `/account/orders`

## Prerequisites

- Node.js 16+ available locally
- Ubris backend stack running
  - `gateway-bff` expected at `http://localhost:8088`
- Strapi running at `http://localhost:1337`

## Install

```bash
npm install
```

## Run locally

```bash
npm start
```

The dev server runs on:

- `http://localhost:4200`

Proxy rules are configured in [proxy.conf.json](proxy.conf.json):

- `/ubris-api` -> `http://localhost:8088`
- `/strapi-api` -> `http://localhost:1337/api`
- `/img` -> `http://localhost:8088`

## Build

Development build:

```bash
npm run build
```

Production build:

```bash
npm run build:prod
```

## Authentication

Login is handled against `gateway-bff`:

- endpoint: `/ubris-api/api/bff/auth/login`
- the returned bearer token is stored in local storage
- Ubris API calls are authenticated by `AuthInterceptor`

Relevant files:

- `src/app/core/auth/auth.service.ts`
- `src/app/core/auth/auth.interceptor.ts`
- `src/app/core/auth/auth.guard.ts`

## CMS integration

Strapi pages are loaded through the unified `/api/pages` contract.

The Angular app uses a canonical internal CMS model before rendering anything. Raw Strapi payload does not go directly into Angular components.

Key files:

- `src/app/core/models/cms.model.ts`
- `src/app/core/cms/adapters/strapi-cms.adapter.ts`
- `src/app/pages/cms-page/cms-page.component.ts`
- `src/app/shared/cms-runtime/cms-component-host.component.ts`
- `src/app/spartacus/strapi-cms.module.ts`

## Commerce integration

Ubris data comes from `gateway-bff` storefront endpoints:

- `/api/storefront/product/{sku}`
- `/api/storefront/category/{categoryCode}`
- `/api/storefront/search?q=`

The Angular app normalizes those payloads before components consume them.

Key files:

- `src/app/core/commerce/adapters/product.adapter.ts`
- `src/app/core/commerce/adapters/category.adapter.ts`
- `src/app/core/commerce/adapters/search.adapter.ts`
- `src/app/core/commerce/adapters/cart.adapter.ts`
- `src/app/core/commerce/connectors/product.connector.ts`
- `src/app/core/commerce/connectors/search.connector.ts`
- `src/app/core/commerce/connectors/category.connector.ts`
- `src/app/core/commerce/facades/cart.facade.ts`
- `src/app/core/commerce/facades/checkout.facade.ts`
- `src/app/core/commerce/facades/order.facade.ts`
- `src/app/shared/components/product-teaser/product-teaser.component.ts`
- `src/app/pages/product-detail/product-detail.component.ts`
- `src/app/pages/category-page/category-page.component.ts`
- `src/app/pages/search-page/search-page.component.ts`
- `src/app/pages/cart-page/cart-page.component.ts`
- `src/app/pages/checkout-page/checkout-page.component.ts`
- `src/app/pages/orders-page/orders-page.component.ts`

## Official path only

This repository no longer treats mock CMS servers or experimental storefront slices as the main runtime path.

The maintained execution path is:

1. Strapi running
2. Ubris backend running
3. `npm start` in `juli`

## Validation used for this workspace

```bash
npm run build
npm run validate:types
```

Both commands currently use the Angular build pipeline and pass on the current codebase.
