# Spartacus Commerce Convergence

Date: 2026-03-19

## Scope

This document maps the current `juli` implementation for:

- cart
- checkout
- account / orders

It classifies each flow as native Spartacus, hybrid, or custom, identifies backend and frontend gaps, and defines an incremental convergence path without breaking the validated runtime.

## Executive Summary

Current state:

- cart is hybrid/custom with custom state, custom facade, custom connectors, and custom page shell
- checkout is custom and does not use the native Spartacus checkout stack
- account / orders is now hybrid with Spartacus native order state underneath a custom page shell

Important constraints already visible in the codebase:

- `@spartacus/core` and `@spartacus/storefront` are installed
- native cart primitives exist locally (`CartModule`, `ActiveCartService`, `MultiCartService`, cart CMS modules)
- native order history components exist locally, but the currently available `OrderModule` / `OrderHistoryModule` path is deprecated in Spartacus 4.2+
- a dedicated Spartacus checkout package is not installed in this workspace today
- the current auth model is custom and bypasses Spartacus user context

Recommendation:

1. Start convergence with cart state, not with cart page UI
2. Keep account / orders hybrid temporarily
3. Keep checkout custom temporarily
4. Use cart convergence to establish the auth and state bridge needed by the more native Spartacus flows

## Current Inventory Matrix

| Flow | Component / Page | Native Spartacus? | Current Custom Dependency | State Outside Native Spartacus | Convergence Risk |
| --- | --- | --- | --- | --- | --- |
| Cart | `src/app/pages/cart-page/CartPageComponent` | No | `JuliCartFacade` | Yes | Medium |
| Cart | Cart page template | No | Custom HTML / SCSS | Yes | Low |
| Cart | Header cart count in `AppComponent` | Partial | `JuliCartFacade` | Yes | Medium |
| Cart | PDP add-to-cart | Partial | `JuliCartFacade` | Yes | Medium |
| Cart | PLP add-to-cart | Partial | `JuliCartFacade` | Yes | Medium |
| Cart | Search add-to-cart | Partial | `JuliCartFacade` | Yes | Medium |
| Cart | CMS ProductTeaser add-to-cart | Partial | `JuliCartFacade` | Yes | Medium |
| Cart | `JuliCartFacade` | No | custom facade + localStorage cart id | Yes | High |
| Cart | `UbrisCartConnector` / `UbrisCartAdapter` | No | custom contract to `gateway-bff` | Yes | High |
| Checkout | `src/app/pages/checkout-page/CheckoutPageComponent` | No | `JuliCheckoutFacade` + reactive form | Yes | High |
| Checkout | Checkout template | No | custom HTML / SCSS | Yes | Medium |
| Checkout | `JuliCheckoutFacade` / `UbrisCheckoutConnector` | No | single submit endpoint | Yes | High |
| Orders | `src/app/pages/orders-page/OrdersPageComponent` | Partial | `JuliOrderFacade` | No | Low |
| Orders | Orders template | No | custom HTML / SCSS | Yes | Low |
| Orders | `JuliOrderFacade` / `UserOrderService` bridge | Partial | custom `UserOrderAdapter` for `gateway-bff` | No | Low |
| Orders | Spartacus order data usage | Partial | custom adapter only | No | Low |

## Evidence From Current Runtime

Current routing is custom:

- `/cart` -> `CartPageComponent`
- `/checkout` -> `CheckoutPageComponent`
- `/account/orders` -> `OrdersPageComponent`

Relevant files:

- `src/app/app-routing.module.ts`
- `src/app/pages/cart-page/*`
- `src/app/pages/checkout-page/*`
- `src/app/pages/orders-page/*`

Current cart state is not native Spartacus state:

- `JuliCartFacade` owns a `BehaviorSubject<Cart | null>`
- cart id persistence is done via `localStorage`
- cart reload / creation / add-entry are orchestrated manually
- product enrichment inside cart entries is also manual

Relevant file:

- `src/app/core/commerce/facades/cart.facade.ts`

Current checkout flow is a custom submit:

- simple form with `addressLine` and `paymentMethod`
- custom submit body
- custom redirect to orders after saga id is returned

Relevant files:

- `src/app/pages/checkout-page/checkout-page.component.ts`
- `src/app/core/commerce/facades/checkout.facade.ts`
- `src/app/core/commerce/adapters/checkout.adapter.ts`

Current orders flow is read-only and custom:

- route is protected by custom `AuthGuard`
- page shell remains custom
- list loading now uses `UserOrderService` and Spartacus user store
- `gateway-bff` integration is provided via a custom `UserOrderAdapter`

Relevant files:

- `src/app/pages/orders-page/orders-page.component.ts`
- `src/app/core/commerce/adapters/order.adapter.ts`
- `src/app/core/commerce/facades/order.facade.ts`
- `src/app/core/commerce/normalizers/order.normalizer.ts`

## Spartacus Native Capability Present Today

Installed and available in this workspace:

- `@spartacus/core`
- `@spartacus/storefront`

Native cart capability already present in installed packages:

- `CartModule.forRoot()`
- `ActiveCartService`
- `MultiCartService`
- `AddToCartModule`
- `CartDetailsModule`
- `CartTotalsModule`
- `MiniCartModule`

Native order capability available in installed packages:

- `OrderHistoryModule`
- `OrderModule`
- `UserOrderService`

Important caveat:

- the installed order module path is deprecated in Spartacus 4.2+

Native checkout capability:

- not available as an installed package in this workspace today
- there is no `@spartacus/checkout` package present in `node_modules`

## Gap Analysis

### Cart

Frontend gaps:

- cart state is not using `ActiveCartService` / `MultiCartService`
- auth context is not bridged into Spartacus `UserIdService`
- cart page uses custom template instead of reusable Spartacus cart components
- add-to-cart actions across the app depend on `JuliCartFacade`

Backend / gateway-bff gaps:

- no `loadAll(userId)` equivalent
- no entry update endpoint
- no entry remove endpoint
- no delete cart endpoint
- no add-email-to-cart endpoint
- no contract aligned with native `userId + cartId` semantics

Business flow gaps:

- guest cart / merge semantics are not represented
- cart validation and voucher flows are absent

Assessment:

- best convergence target
- highest leverage
- requires backend work and auth bridge before UI swap

### Checkout

Frontend gaps:

- checkout package is not installed
- no Spartacus checkout state, delivery address flow, delivery mode flow, payment flow, or review / submit flow
- current checkout page is a custom reactive form

Backend / gateway-bff gaps:

- only a single submit endpoint exists today
- no step-based checkout APIs
- no delivery address contract
- no payment details contract compatible with multi-step flow
- no review step contract

Business flow gaps:

- checkout is intentionally simplified today
- native Spartacus checkout would require business alignment, not just UI migration

Assessment:

- should remain custom temporarily
- migrate last

### Account / Orders

Frontend gaps:

- orders page uses custom route and page shell
- no native Spartacus order store / facade integration
- current installed order module path is deprecated

Backend / gateway-bff gaps:

- list endpoint exists, but the contract is basic
- no native-looking pagination / sorting contract
- order detail route is not wired into the current Angular runtime
- no richer account domain beyond order list

Business flow gaps:

- current validated requirement is order history listing only
- there is no pressure yet for full account feature parity

Assessment:

- keep hybrid temporarily
- converge after cart foundation
- avoid migrating to deprecated module path just to appear more native

### Cross-Cutting Gap: Auth Context

Current auth is custom:

- `AuthService`
- `AuthGuard`
- `AuthInterceptor`

This is acceptable for the validated runtime, but it blocks direct reuse of more native Spartacus commerce services because:

- native cart services depend on Spartacus user context
- native order services also depend on Spartacus user context

Consequence:

- cart convergence must include an auth / user-id bridge

## Strategy By Flow

### Cart

Decision:

- migrate toward native Spartacus cart state

Reasoning:

- the native cart stack already exists in installed Spartacus packages
- current cart state is the biggest concentration of custom commerce state
- the same custom facade is used by PDP, PLP, search, teaser, header, cart, and checkout entry points
- convergence here reduces risk across multiple validated flows at once

Approach:

- Phase 1: keep current page shell, replace state foundation incrementally
- Phase 2: optionally replace custom cart page sections with native Spartacus cart components

### Checkout

Decision:

- keep hybrid temporarily

Reasoning:

- native checkout package is not installed
- backend does not expose a step-based checkout contract
- migrating now would couple frontend refactor with backend business-flow redesign

Approach:

- postpone until cart and auth convergence are stable
- treat checkout as a dedicated workstream, not an opportunistic refactor

### Account / Orders

Decision:

- converge the loading/state foundation now, keep the custom route and page shell

Reasoning:

- current page is simple and validated
- installed native order path is deprecated, but the `UserOrderService` + `UserOrderAdapter` seam still gives useful convergence with low risk
- the main debt was the custom loading/state path, not the page shell

Approach:

- keep `/account/orders` and the current template
- move loading/state to `UserOrderService`
- register a custom `UserOrderAdapter` for the current `gateway-bff` contract
- keep richer account features and eventual move to a modern order library for a later package

## Recommended Order Of Implementation

1. Cart foundation
2. Account / orders foundation
3. Checkout

Why this order:

- cart unlocks the auth and state bridge needed by the others
- orders is read-only and easier than checkout, and can now converge at the state layer without a risky UI swap
- checkout depends on cart, auth, and richer backend contracts

## First Work Package

Name:

- Cart convergence foundation

Goal:

- move cart state closer to native Spartacus without changing routes or validated page flows

Scope in `juli`:

- `src/app/core/commerce/facades/cart.facade.ts`
- `src/app/core/commerce/adapters/cart.adapter.ts`
- `src/app/core/commerce/connectors/cart.connector.ts`
- `src/app/core/auth/*`
- `src/app/app.module.ts` or `src/app/core/commerce/commerce.module.ts`
- all add-to-cart entry points remain on their existing pages initially

Scope in `gateway-bff` / Ubris:

- add cart entry update endpoint
- add cart entry remove endpoint
- add delete cart endpoint
- add list / current-cart semantics needed by native cart services
- define user/cart contract semantics explicitly

Target technical shape:

1. Introduce Spartacus cart core into the runtime (`CartModule.forRoot()`)
2. Bridge current auth into Spartacus user-id expectations
3. Implement adapter providers that can satisfy native cart service expectations using `gateway-bff`
4. Keep current page components alive while swapping the state source behind them

What does not change in package 1:

- routes
- PDP / PLP / search page structure
- checkout page structure
- orders page structure

Expected impact:

- cart count, add-to-cart, cart reload, and cart state stop depending on a custom `BehaviorSubject` implementation
- groundwork is created for future reuse of `CartDetailsModule`, `CartTotalsModule`, and `MiniCartModule`

Risk:

- medium to high, because cart convergence touches auth, state, and backend contract together

Rollback:

- keep `JuliCartFacade` as the stable public dependency during the migration
- if native cart bridge fails, revert facade internals to current implementation without changing routes or page templates

## Concrete Backend Gaps To Close Before Native Cart

- `GET carts by user` or equivalent current-cart contract
- `PUT /cart/{cartId}/entries/{entryNumber}`
- `DELETE /cart/{cartId}/entries/{entryNumber}`
- `DELETE /cart/{cartId}`
- optional `POST /cart/{cartId}/email` if guest checkout is desired
- stable cart identifiers and user/cart ownership semantics

## Orders / Account Package Status

Implemented in the current package:

- `OrdersPageComponent` keeps the existing route and template shell
- `JuliOrderFacade` now delegates to `UserOrderService`
- Spartacus user/order state is enabled through `UserTransitional_4_2_Module`
- `UbrisOrderAdapter` now implements Spartacus `UserOrderAdapter`
- backend contract remains `GET /api/bff/query/orders` and `GET /api/bff/query/orders/{orderId}`
- client-side pagination metadata is synthesized in the normalizer because the backend contract is still summary-only

Backend gaps still open but not required for this package:

- server-side pagination
- server-side sorting
- richer order detail entries / totals contract
- return / cancel / consignment tracking endpoints in the Spartacus shape

Explicit decision:

- orders stays hybrid by page shell
- orders is converged enough at the state/loading layer for now
- checkout remains out of scope

## What Is Safe Today

- validated runtime remains intact
- current custom pages already work
- the migration can be layered behind existing pages

## What Should Not Be Done

- do not big-bang cart + checkout + orders at once
- do not move orders into deprecated Spartacus modules just for optics
- do not start native checkout before the backend exposes step-based contracts
