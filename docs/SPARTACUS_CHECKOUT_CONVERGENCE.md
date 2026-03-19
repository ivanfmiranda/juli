# Spartacus Checkout Convergence

Date: 2026-03-19

## Scope

This document maps the current checkout implementation in `juli` and the supporting contracts in `ubris/gateway-bff`.

It does not propose a big-bang migration. It identifies:

- what is custom today
- what is partially reusable from the current Spartacus stack
- what is missing in the backend
- what the lowest-risk next checkout package should be

Checkout implementation is intentionally out of scope for this package. This is a diagnostic and strategy document only.

## Executive Summary

Current state:

- checkout in `juli` is custom
- there is a single custom checkout page and a single submit action
- address, payment and review are collapsed into one form
- confirmation is not a real step; after submit, the app redirects to `/account/orders`
- the current workspace does not have a dedicated Spartacus checkout package installed
- the current backend only supports single-shot submit plus async saga status

Implication:

- a native Spartacus checkout migration is not viable yet without both frontend package expansion and backend contract expansion
- the right short-term move is not "install checkout and refactor everything"
- the right short-term move is to harden and decompose the current custom checkout in small steps

Recommended strategy:

1. Keep checkout custom temporarily
2. Introduce a small, explicit review / confirmation package first
3. Only after that decide whether address, payment and delivery should converge further toward Spartacus-native patterns

## Official Frontend Scope

The only official frontend runtime is `juli`.

This document assumes:

- no further investment in legacy or parallel storefronts
- no checkout evolution outside `juli` and the Ubris contracts that support it
- no cosmetic checkout work unless it directly supports convergence toward a more native Spartacus model

## Current Checkout In Juli

### Current route and guards

Route:

- `/checkout`

Protection:

- guarded by custom `AuthGuard`

Relevant files:

- `src/app/app-routing.module.ts`
- `src/app/core/auth/auth.guard.ts`

### Current page implementation

Relevant files:

- `src/app/pages/checkout-page/checkout-page.component.ts`
- `src/app/pages/checkout-page/checkout-page.component.html`
- `src/app/pages/checkout-page/checkout-page.component.scss`

Behavior today:

- reads cart state from `JuliCartFacade`
- uses a custom reactive form
- fields collected:
  - `addressLine`
  - `paymentMethod`
- submits directly through `JuliCheckoutFacade`
- on success:
  - clears cart
  - redirects to `/account/orders?checkoutId=...`

Important observation:

- `checkoutId` is added as query param on redirect, but the current orders page does not use it for a confirmation experience
- so the runtime has submit capability, but not a proper confirmation step

### Supporting checkout stack in juli

Relevant files:

- `src/app/core/commerce/facades/checkout.facade.ts`
- `src/app/core/commerce/connectors/checkout.connector.ts`
- `src/app/core/commerce/adapters/checkout.adapter.ts`
- `src/app/core/commerce/models/ubris-commerce.models.ts`

Current stack:

- `JuliCheckoutFacade` is a thin wrapper
- `UbrisCheckoutConnector` is custom
- `UbrisCheckoutAdapter` is custom
- no checkout normalizer exists, because the current flow is only submit + saga status mapping

### Stage-by-stage classification

| Checkout Stage | Current juli implementation | Classification | Notes |
| --- | --- | --- | --- |
| Address | single free-text `addressLine` field | Custom | no address book, no structured address model |
| Delivery / freight | none | Absent | no delivery mode selection, no shipping quote step |
| Payment | simple `paymentMethod` select | Custom | no payment details flow, no stored payment methods |
| Review / place order | cart summary + submit button on same page | Custom | review and submit are collapsed |
| Confirmation | redirect to `/account/orders?checkoutId=...` | Partially present but weak | no dedicated confirmation page or saga-driven confirmation shell |
| Approval handling | backend supports approval state | Absent in UI | no approval-specific checkout UX |

## Spartacus Support Available In The Current Workspace

### Installed packages

From `package.json`:

- `@spartacus/core`
- `@spartacus/storefront`

Currently imported in `AppModule`:

- `CartModule.forRoot()`
- `UserTransitional_4_2_Module.forRoot()`
- no checkout-specific module is imported

Relevant file:

- `src/app/app.module.ts`

### What exists today and can help

Available today in installed Spartacus core:

- cart primitives already in use
- user / order transitional services already in use
- `UserAddressService` exists in `@spartacus/core`

What that means:

- there is some reusable user/account infrastructure
- there is no installed checkout step stack ready to wire directly into this runtime

### What is not installed

In the current workspace there is no separate checkout package present under `node_modules/@spartacus`.

So today there is no evidence of installed native modules/facades for:

- delivery address step orchestration
- delivery mode step orchestration
- payment details step orchestration
- review / place-order orchestration
- checkout step routing

### Consequence

There is no honest path to "go native now" without:

1. installing additional Spartacus checkout packages and dependencies
2. expanding the backend contract beyond single submit
3. reworking state and routing around checkout stages

That is a separate workstream, not a safe incidental refactor.

## Backend Contract Map

### Gateway-bff

Current checkout-related endpoints exposed by `gateway-bff`:

- `POST /api/bff/checkout/submit`
- `GET /api/bff/order-process/sagas/{checkoutId}`
- `GET /api/bff/approvals/{checkoutId}`
- `POST /api/bff/approvals/{checkoutId}/approve`
- `POST /api/bff/approvals/{checkoutId}/reject`

Relevant files:

- `ubris/services/gateway-bff/src/main/java/com/hybrislite/gatewaybff/controller/GatewayController.java`
- `ubris/services/gateway-bff/src/main/java/com/hybrislite/gatewaybff/service/GatewayService.java`

What is not exposed by `gateway-bff` today:

- checkout address step endpoints
- saved address lookup for checkout
- delivery mode endpoints
- shipping quote endpoints for checkout selection
- payment details CRUD/selection endpoints
- checkout review/reprice endpoint
- place-order idempotency contract

### Checkout service

Current request:

- `cartId`
- `customerId`
- `userType`
- `addressLine`
- `paymentMethod`

Current response:

- `checkoutId`
- `status`
- `approvalRequired`

Relevant files:

- `ubris/services/checkout-service/src/main/java/com/hybrislite/checkoutservice/service/dto/CheckoutSubmitRequest.java`
- `ubris/services/checkout-service/src/main/java/com/hybrislite/checkoutservice/service/dto/CheckoutSubmitResponse.java`
- `ubris/services/checkout-service/src/main/java/com/hybrislite/checkoutservice/service/CheckoutService.java`

### Validation and behavior in checkout-service

Current validations:

- address must be non-blank
- cart total must be positive

Current behavior:

- fetches cart snapshot
- stores checkout session
- stores checkout snapshot
- emits `CheckoutSubmitted`
- order creation happens asynchronously through the saga flow

What does not exist in the current contract:

- structured address model
- delivery mode selection
- payment details tokenization / authorization step
- reprice endpoint before submit
- dedicated review step contract
- idempotency key on submit

### Related services

Customer data:

- `customer-service` exposes address APIs, but only under internal endpoints today
- `gateway-bff` does not expose these address APIs to `juli`

Shipping:

- `shipping-service` exists, but there is no evidence of a checkout delivery-mode contract exposed through `gateway-bff`

Payment:

- payment authorization exists in the backend flow, but not as a client-facing checkout step contract

Order saga:

- saga status is available and rich enough for a confirmation page

Relevant files:

- `ubris/services/customer-service/.../CustomerController.java`
- `ubris/services/order-process-service/.../OrderSagaController.java`
- `ubris/services/order-process-service/.../OrderSagaResponse.java`

## Current vs Target Matrix

| Checkout Step | Current Implementation | Native Spartacus Support Available Now? | Backend Contract Exists? | Main Gap | Migration Risk | Migration Value |
| --- | --- | --- | --- | --- | --- | --- |
| Address capture | custom `addressLine` text field | Partial only (`UserAddressService` exists, checkout step orchestration does not) | Weak | no structured address model and no gateway address endpoints | Medium | Medium |
| Delivery / freight | absent | No practical support in installed stack | No | no delivery mode or shipping quote contract | High | Medium |
| Payment selection | custom string select | No practical support in installed stack | Weak | no payment details contract, no stored methods, no step orchestration | High | Medium |
| Review | custom summary in same page | No | Weak | no explicit review/reprice contract | Medium | High |
| Place order | custom submit call | No | Yes | no idempotency and no explicit confirmation step | Medium | High |
| Confirmation | not a real step | No | Yes (`sagaStatus`) | no dedicated UI flow using existing saga contract | Low | High |
| Approval UX | absent in juli | No | Partial | backend supports approval state, UI does not surface it in checkout flow | Medium | Medium |

## Target Checkout Architecture

Medium-term target for checkout:

1. Address step
2. Delivery step
3. Payment step
4. Review / place-order step
5. Confirmation step
6. Saga status tracking
7. Place-order idempotency
8. Payment integration boundary

What the backend already supports today:

- place-order style submit through `POST /api/bff/checkout/submit`
- asynchronous processing state through `GET /api/bff/order-process/sagas/{checkoutId}`
- approval state through approval endpoints

What the backend does not support yet and must be introduced before a deeper native checkout:

- structured checkout address resource
- saved address exposure through `gateway-bff`
- delivery mode resource and shipping quote selection
- payment details resource and tokenization/authorization boundary
- explicit review or reprice contract before submit
- idempotency key or equivalent place-order replay protection
- explicit checkout step resource model that a more native Spartacus flow can consume

What `juli` can realistically consume later once those contracts exist:

- structured address selection and validation
- delivery mode selection
- payment step orchestration
- review/confirmation split with clearer state transitions
- a more native checkout state flow without relying on a single custom submit form

## Classification By Area

### Good candidates for incremental convergence now

- confirmation step driven by existing saga status
- explicit review / place-order separation while keeping the current shell
- optional reuse of `UserAddressService` later, but only after address APIs are exposed properly

### Bad candidates to migrate now

- full native Spartacus checkout adoption
- delivery mode step
- payment details step
- full step router migration

Reason:

- the required backend contracts do not exist yet
- the needed Spartacus checkout packages are not installed
- the current custom auth/runtime would need deeper alignment first

### Should remain custom for now

- checkout page shell
- submit flow orchestration
- address + payment form state

Reason:

- replacing these now would be a cosmetic migration without the backend model to support it correctly

## Recommended Strategy

### Decision

Maintain checkout as custom temporarily, but decompose and harden it incrementally instead of attempting native Spartacus checkout now.

### Why this is the correct strategy

Cost:

- full Spartacus-native checkout now would require new frontend packages plus multiple backend contracts

Risk:

- checkout is the highest-risk commerce flow
- a rushed migration would combine:
  - UI refactor
  - state refactor
  - contract redesign
  - business-flow redesign

Upgrade impact:

- the current custom checkout is debt, but controlled debt
- forced native adoption without backend parity would create a worse upgrade story, not a better one

UX impact:

- there is immediate value in adding clearer review/confirmation behavior even without full native adoption

Backend impact:

- the backend is structurally closer to "single submit + async saga" than to "multi-step checkout API"

### What should not be done now

- do not install and wire full native Spartacus checkout just to claim convergence
- do not create delivery/payment/address steps before the backend supports them
- do not change checkout, cart and account together
- do not touch checkout shell visually unless it directly supports the incremental plan

## First Future Work Package

### Recommended package

Review / confirmation hardening for checkout

### Why this first

It delivers real value with the lowest risk because:

- it uses contracts that already exist
- it does not require installing new Spartacus checkout packages
- it makes the current checkout less opaque
- it creates a clearer boundary between "review" and "place order"
- it gives the runtime a real confirmation experience driven by saga status

### Scope of the future package

Frontend:

- keep `/checkout`
- keep the current visual shell mostly intact
- make review explicit before final submit
- introduce a dedicated confirmation route, for example:
  - `/checkout/confirmation/:checkoutId`
- show:
  - current checkout state
  - `approvalRequired`
  - `orderId` when available
  - `lastError` when present

Backend:

- no big checkout redesign required
- reuse:
  - `POST /api/bff/checkout/submit`
  - `GET /api/bff/order-process/sagas/{checkoutId}`
- optional hardening:
  - add an explicit checkout review/reprice endpoint later, but not required in the first package

### What stays out of scope for that package

- delivery mode step
- payment details step
- saved address selection
- native Spartacus checkout modules
- guest checkout merge
- checkout refactor into full step router

### Risk level

- low to medium

### Rollback

- the current submit page can remain the fallback
- confirmation can be introduced as an additive route

## Native Preparation Backlog

Priority `Now`:

- add dedicated checkout confirmation route driven by saga status
- separate review/place-order behavior from the current single-step submit shell
- expose explicit confirmation data contract in `juli` from existing saga payloads

Priority `Next`:

- expose structured checkout address APIs through `gateway-bff`
- model saved address selection for authenticated users
- define explicit review/reprice contract before submit
- add place-order idempotency contract

Priority `Later`:

- expose delivery mode and shipping quote contracts
- expose payment details/tokenization contract
- evaluate whether installing Spartacus checkout packages is justified after backend parity exists
- converge the checkout state machine further toward a more native Spartacus step flow

Backend gap classification:

- frontend gaps:
  - no confirmation route
  - no explicit review boundary
  - custom checkout form state
- backend contract gaps:
  - no structured address/delivery/payment resources
  - no reprice contract
  - no idempotent place-order contract
- payment orchestration gaps:
  - no client-facing payment details lifecycle
  - no explicit authorization step contract
- confirmation/idempotency gaps:
  - saga exists, but confirmation is not surfaced as a proper route
  - submit has no explicit replay-protection contract

## Backend Gaps To Track After The First Package

These are real gaps, but they should remain after the first incremental package:

- structured checkout address contract
- address book exposure in `gateway-bff`
- delivery mode selection contract
- shipping quote contract
- payment details/tokenization contract
- reprice / review contract
- idempotent place-order contract
- explicit checkout step resource model

## Final Recommendation

Do not start checkout convergence with native Spartacus checkout modules.

Start with the smallest package that improves the current custom flow and uses the contracts already available:

1. explicit review / place-order boundary
2. dedicated confirmation route driven by saga status

After that:

- expose addresses properly
- decide whether delivery and payment are worth modeling as real steps
- only then reassess installing and adopting a more native Spartacus checkout stack
