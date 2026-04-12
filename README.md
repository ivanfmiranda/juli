# Juli

Official Angular + Spartacus storefront for Ubris headless commerce with Strapi as CMS.

## Overview

`juli` is the official storefront runtime for this initiative.

- Frontend runtime: Angular workspace with Spartacus packages
- CMS source of truth: Strapi
- Commerce source of truth: Ubris headless through `gateway-bff`
- Rendering model: Angular client runtime with CMS-driven pages and live commerce enrichment

## Official Frontend Policy

There is a single supported frontend path for this initiative:

- `juli`

Explicitly out of scope:

- parallel storefront experiments
- legacy storefront stabilization work
- cosmetic improvements to non-official frontend shells
- any checkout evolution outside the `juli` runtime and the supporting Ubris contracts

Legacy or historical frontend artifacts may still exist elsewhere for reference, but they are not an active delivery path and must not receive new feature work.

This repository does not maintain a parallel storefront path. The supported runtime is:

1. `juli` behind the environment reverse proxy
2. `/ubris-api` and `/strapi-api` resolved through the same host entrypoint used by the supported environment
3. standalone `localhost` services only for isolated debugging

## Architecture Summary

CMS flow:

- Strapi REST API
- `src/app/core/cms/adapters/strapi-cms.adapter.ts`
- canonical CMS model in `src/app/core/models/cms.model.ts`
- Spartacus CMS registry in `src/app/spartacus/strapi-cms.module.ts`
- dynamic rendering through `src/app/pages/cms-page` and `src/app/shared/cms-runtime`

Commerce flow:

- `gateway-bff`
- low-level adapters in `src/app/core/commerce/adapters`
- normalization in `src/app/core/commerce/normalizers`
- connectors and facades in `src/app/core/commerce/connectors` and `src/app/core/commerce/facades`
- page components consuming normalized models only

Separation rules:

- raw Strapi payload does not go directly into Angular components
- UI does not couple to raw backend shapes from Ubris
- CMS defines editorial structure and intent
- Ubris provides live commerce data and behavior

## Status

Validated live in the browser:

- login
- CMS home page from Strapi
- commerce enrichment on CMS components
- PDP
- category / PLP
- search
- add to cart
- cart
- checkout
- account orders

Also validated:

- real stock status on PDP via `gateway-bff`
- safe CMS fallbacks for unknown and invalid component payloads

Current implementation note:

- cart, checkout and account are functional and integrated with Ubris
- they are not yet a fully native reuse of every Spartacus commerce flow module
- the runtime path is still official and production-oriented, but that detail matters for future convergence work
- current convergence priority is backend and integration preparation for more native Spartacus commerce flows, not parallel frontend work

## Prerequisites

- Node.js 16 LTS recommended
- npm available locally
- nginx-backed environment entrypoint available on this host for supported validation
- Strapi at `http://localhost:1337` and `gateway-bff` at `http://localhost:8088` only when using isolated standalone mode

## Local Configuration

This workspace does not use a `.env` file as the primary local configuration mechanism.

Local runtime configuration lives in:

- [src/environments/environment.ts](src/environments/environment.ts)
- [src/environments/environment.prod.ts](src/environments/environment.prod.ts)
- [proxy.conf.json](proxy.conf.json)

Current development endpoints inside the Angular app:

- `strapiApiBaseUrl = /strapi-api`
- `ubrisApiBaseUrl = /ubris-api`
- `defaultCmsSlug = home`

Dev-server proxy rules:

- `/ubris-api` -> `http://localhost:8088`
- `/strapi-api` -> `http://localhost:1337/api`
- `/img` -> `http://localhost:8088`

## Install

```bash
npm install
```

## Run Locally

```bash
npm start
```

Dev server:

- `http://localhost:4200`

## Useful Scripts

Start the local dev server:

```bash
npm start
```

Development build:

```bash
npm run build
```

Production build:

```bash
npm run build:prod
```

Standalone type validation:

```bash
npm run validate:types
```

`validate:types` currently uses the Angular build pipeline as the type-safety gate for this workspace. That is intentional; a standalone `tsc` pass is not yet the authoritative signal for the current Spartacus integration layer.

Standalone Playwright smoke:

```bash
npm run e2e:standalone
```

Reverse-proxy Playwright smoke on this host:

```bash
npm run e2e:proxy
```

Temporary crypto compatibility debt:

- Angular 12/Webpack in this workspace still requires the OpenSSL legacy provider on Node 20 for the supported build scripts.
- The workaround is quarantined in `scripts/run-angular-cli.js`.
- Retirement target: `2026-06-19`.
- `npm run build:strict-crypto` is the explicit signal to verify whether the workaround can be removed.

## E2E Runtime Modes

- Default: validate through `http://localhost`, which matches the nginx-backed supported path on this host.
- External environment: set `JULI_E2E_BASE_URL=https://tenant.ubris.com.br` and run `npm run e2e`.
- Standalone storefront-only debug: set `JULI_E2E_SERVER_MODE=standalone` and run `npm run e2e`.
- CI falls back to standalone mode automatically when no explicit base URL is provided.
- The proxy smoke only proves request dispatching through `/ubris-api`, `/strapi-api`, and `/cms`; it is not a substitute for healthy downstream integration proof.

Live commercial journeys do not use mocks. For authenticated or catalog-specific flows, provide real environment data through:

- `JULI_E2E_CATEGORY_CODE`
- `JULI_E2E_PRODUCT_CODE`
- `JULI_E2E_USERNAME`
- `JULI_E2E_PASSWORD`
- `JULI_E2E_REGISTER_USERNAME`
- `JULI_E2E_REGISTER_PASSWORD`

## Main Routes

Public routes:

- `/`
- `/login`
- `/page/home`
- `/page/:slug`
- `/page/preview/:slug`
- `/product/:code`
- `/c/:code`
- `/search?q=`
- `/terms`
- `/privacy`

Protected routes:

- `/cart`
- `/checkout`
- `/account/orders`

## Authentication

Login is handled through `gateway-bff`.

- login endpoint: `/ubris-api/api/bff/auth/login`
- bearer token is stored client-side after successful login
- authenticated API calls are decorated by `AuthInterceptor`

Relevant files:

- [auth.service.ts](src/app/core/auth/auth.service.ts)
- [auth.interceptor.ts](src/app/core/auth/auth.interceptor.ts)
- [auth.guard.ts](src/app/core/auth/auth.guard.ts)

## CMS Integration

Strapi pages are loaded through the unified `/api/pages` contract.

The adapter normalizes Strapi payload into a canonical UI model before rendering. Supported canonical regions are:

- `header`
- `main`
- `sidebar`
- `belowFold`
- `footer`

Minimum registered CMS components include:

- `JuliHeroBannerComponent`
- `CMSParagraphComponent`
- `JuliSimpleBannerComponent`
- `JuliProductTeaserComponent`
- `JuliCategoryTeaserComponent`
- `JuliCtaBlockComponent`
- `JuliInfoCardComponent`
- `UnknownComponent`
- `ErrorComponent`

## Commerce Integration

Commerce data comes from `gateway-bff` storefront endpoints, including:

- `/api/storefront/product/{sku}`
- `/api/storefront/category/{categoryCode}`
- `/api/storefront/search?q=`
- `/api/cart`
- `/api/orders`

The Angular app normalizes backend payloads before page components consume them. PDP stock status is sourced from the live storefront product contract and rendered from normalized stock data.

## Collaboration Notes

- do not commit `node_modules`, `dist`, `.angular`, `.cache` or local log files
- keep Strapi content models and Angular runtime aligned through the canonical CMS adapter
- prefer changing adapters and normalizers before changing page components when a backend contract shifts
