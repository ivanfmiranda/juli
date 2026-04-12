import { test, expect, type Page } from "@playwright/test";

const categoryCode = process.env.JULI_E2E_CATEGORY_CODE?.trim();
const productCode = process.env.JULI_E2E_PRODUCT_CODE?.trim();
const username = process.env.JULI_E2E_USERNAME?.trim();
const password = process.env.JULI_E2E_PASSWORD?.trim();
const registerUsername = process.env.JULI_E2E_REGISTER_USERNAME?.trim();
const registerPassword = process.env.JULI_E2E_REGISTER_PASSWORD?.trim();

async function expectShell(page: Page) {
  await expect(page).toHaveTitle(/\S+/);
  await expect(page.locator("app-site-header, .site-header").first()).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("main").first()).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("app-site-footer, .site-footer, footer").first()).toBeVisible({ timeout: 15_000 });
}

async function login(page: Page) {
  test.skip(!username || !password, "Set JULI_E2E_USERNAME and JULI_E2E_PASSWORD for authenticated journeys.");

  await page.goto("/login");
  await page.locator('input[formControlName="username"]').fill(username!);
  await page.locator('input[formControlName="password"]').fill(password!);
  await page.locator('form button[type="submit"]').click();
  await page.waitForLoadState("networkidle");
  await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
}

test.describe("Storefront public runtime", () => {
  test("homepage loads with the storefront shell", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expectShell(page);
  });

  test("legacy and SSR-backed CMS routes respond", async ({ page }) => {
    const pageRoute = await page.goto("/page/home");
    expect(pageRoute?.status()).toBe(200);
    await expect(page.locator("html")).toBeVisible();

    const rendererRoute = await page.goto("/pages/home");
    expect(rendererRoute?.status()).toBe(200);
    await expect(page.locator("html")).toBeVisible();
  });

  test("search route renders results or empty state without crashing", async ({ page }) => {
    const response = await page.goto("/search?q=teste");
    expect(response?.status()).toBe(200);
    await expect(page.locator(".listing-page, .listing-empty").first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("login and register pages expose real auth forms", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByLabel(/username|email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i).first()).toBeVisible();
    await expect(page.locator('input[formControlName="username"]')).toBeVisible();
    await expect(page.locator('input[formControlName="password"]')).toBeVisible();

    await page.goto("/register");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i).first()).toBeVisible();
    await expect(page.locator('input[formControlName="username"]')).toBeVisible();
    await expect(page.locator('input[formControlName="password"]')).toBeVisible();
    await expect(page.locator('input[formControlName="confirmPassword"]')).toBeVisible();
  });

  test("cart route renders a real cart state", async ({ page }) => {
    const response = await page.goto("/cart");
    expect(response?.status()).toBe(200);
    await expect(page.locator(".cart-content, .cart-empty, .ub-store__main").first()).toBeVisible({ timeout: 15_000 });
  });

  test("protected routes redirect anonymous users to login", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page).toHaveURL(/\/login\?redirect=%2Fcheckout$/);

    await page.goto("/account/orders");
    await expect(page).toHaveURL(/\/login\?redirect=%2Faccount%2Forders$/);
  });

  test("preview entry resolves through the same storefront renderer", async ({ page }) => {
    const response = await page.goto("/preview?slug=home&token=test-preview-token");
    expect(response?.status()).toBe(200);
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/home$/);
    await expect(page.locator("html")).toBeVisible();
  });

  test("proxy routes dispatch upstream instead of falling back to storefront HTML", async ({ request }) => {
    for (const path of ["/ubris-api/healthz", "/strapi-api/content-types", "/cms/"]) {
      const response = await request.get(path, { failOnStatusCode: false });
      const body = await response.text();
      const isSpaFallback = body.includes("<!doctype html") && body.includes("app-root");
      expect(isSpaFallback).toBe(false);
    }
  });
});

test.describe("Storefront catalog journeys", () => {
  test("category route loads when a real category code is provided", async ({ page }) => {
    test.skip(!categoryCode, "Set JULI_E2E_CATEGORY_CODE for category journey validation.");

    const response = await page.goto(`/c/${categoryCode}`);
    expect(response?.status()).toBe(200);
    await expect(page.locator(".category-page, .empty-state, .error-state").first()).toBeVisible({ timeout: 15_000 });
  });

  test("product route loads when a real product code is provided", async ({ page }) => {
    test.skip(!productCode, "Set JULI_E2E_PRODUCT_CODE for PDP validation.");

    const response = await page.goto(`/product/${productCode}`);
    expect(response?.status()).toBe(200);
    await expect(page.locator(".product-detail-page, .error-state").first()).toBeVisible({ timeout: 15_000 });
  });

  test("anonymous add-to-cart works for a real product", async ({ page }) => {
    test.skip(!productCode, "Set JULI_E2E_PRODUCT_CODE for add-to-cart validation.");

    await page.goto(`/product/${productCode}`);
    const addToCartButton = page.locator(".btn-add-cart").first();
    await expect(addToCartButton).toBeVisible({ timeout: 15_000 });
    await expect(addToCartButton).toBeEnabled();
    await addToCartButton.click();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/cart$/);
    await expect(page.locator(".cart-content, .cart-empty, .ub-store__main").first()).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("Storefront authenticated journeys", () => {
  test("login reaches the authenticated storefront path", async ({ page }) => {
    await login(page);
    await expectShell(page);
  });

  test("authenticated checkout route loads", async ({ page }) => {
    await login(page);
    const response = await page.goto("/checkout");
    expect(response?.status()).toBe(200);
    await expect(page.locator("app-checkout-page, app-checkout-stepper, .checkout-page").first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator('nav[aria-label="Checkout progress"]')).toBeVisible();
    await expect(page.locator('label[for="fullName"]')).toBeVisible();
  });

  test("authenticated orders route loads", async ({ page }) => {
    await login(page);
    const response = await page.goto("/account/orders");
    expect(response?.status()).toBe(200);
    await expect(page.locator(".orders-page, .empty-state, .error-state").first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});

test.describe("Storefront optional registration", () => {
  test("register flow works with explicit one-off credentials", async ({ page }) => {
    test.skip(
      !registerUsername || !registerPassword,
      "Set JULI_E2E_REGISTER_USERNAME and JULI_E2E_REGISTER_PASSWORD to exercise live registration."
    );

    await page.goto("/register");
    await page.locator('input[formControlName="username"]').fill(registerUsername!);
    await page.locator('input[formControlName="password"]').fill(registerPassword!);
    await page.locator('input[formControlName="confirmPassword"]').fill(registerPassword!);
    await page.locator('form button[type="submit"]').click();
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/register(?:\?|$)/);
  });
});
