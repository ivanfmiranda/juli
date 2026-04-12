# Storefront Release Checklist

Retirement target for temporary OpenSSL crypto compatibility workaround: `2026-06-19`.

## Supported Validation Modes

- `proxy` mode: validate the storefront through the nginx-backed environment entrypoint.
  - Default Playwright base URL: `http://localhost`
  - Preferred for this host because it exercises `/ubris-api` and `/strapi-api` through the same reverse-proxy path used by the supported environment.
- `external` mode: validate against a real tenant host such as `https://tenant.ubris.com.br`.
  - Set `JULI_E2E_BASE_URL` explicitly.
- `standalone` mode: start `server.js` directly for isolated storefront debugging.
  - Set `JULI_E2E_SERVER_MODE=standalone`
  - CI defaults to this mode because GitHub runners do not provide the environment reverse proxy.

## Required Checks Before Release

- `npm run build:prod`
- `npm run e2e`
  - For local storefront-only proof, prefer `npm run e2e:standalone`.
  - For the supported environment path on this host, prefer `npm run e2e:proxy`.
- `npm run build:strict-crypto`
  - Expected result today: fail on Node 20 until Angular/webpack modernization removes the workaround.
  - Do not treat this as release green. It is the retirement signal for the temporary crypto debt.
- Validate core routes on the supported runtime path:
  - home
  - CMS route
  - search
  - cart
  - checkout
  - login/register
  - orders
  - preview

## Real E2E Environment Variables

- `JULI_E2E_BASE_URL`
  - Example: `https://tenant.ubris.com.br`
- `JULI_E2E_SERVER_MODE`
  - Values: `proxy`, `external`, `standalone`
- `JULI_E2E_CATEGORY_CODE`
- `JULI_E2E_PRODUCT_CODE`
- `JULI_E2E_USERNAME`
- `JULI_E2E_PASSWORD`
- `JULI_E2E_REGISTER_USERNAME`
- `JULI_E2E_REGISTER_PASSWORD`

## Accessibility And Performance Gate

- Verify keyboard navigation on home, PDP, cart, checkout, and orders.
- Verify headings and form labels remain present on login/register/checkout.
- Keep Angular production budgets green.
- Record any budget override as a release exception, never silently.
- Treat the proxy smoke as a routing proof only; it does not prove healthy downstream integration by itself.
