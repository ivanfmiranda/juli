import { test, expect, type Page } from "@playwright/test";

/**
 * Smoke coverage for the B2B storefront surfaces. Each test guards on
 * env vars so the suite stays green for B2C-only tenants — JULI_E2E_B2B_*
 * is set when an operator pre-provisioned a B2B membership for the e2e
 * user. Without it the assertions are skipped instead of failing.
 *
 * Required env:
 *   JULI_E2E_USERNAME        — buyer login (must have B2B assignment)
 *   JULI_E2E_PASSWORD        — login password
 *   JULI_E2E_B2B_COMPANY     — companyId or companyName the badge surfaces
 *   JULI_E2E_PRODUCT_CODE    — SKU to add to the cart for the quote flow
 *
 * Optional:
 *   JULI_E2E_B2B_APPROVER    — set to "1" if the user has an approver role,
 *                              enabling the inbox test.
 */
const username = process.env.JULI_E2E_USERNAME?.trim();
const password = process.env.JULI_E2E_PASSWORD?.trim();
const expectedCompany = process.env.JULI_E2E_B2B_COMPANY?.trim();
const productCode = process.env.JULI_E2E_PRODUCT_CODE?.trim();
const isApprover = process.env.JULI_E2E_B2B_APPROVER?.trim() === "1";

async function login(page: Page) {
  test.skip(!username || !password, "Set JULI_E2E_USERNAME and JULI_E2E_PASSWORD for B2B journeys.");
  await page.goto("/login");
  await page.locator('input[formControlName="username"]').fill(username!);
  await page.locator('input[formControlName="password"]').fill(password!);
  await page.locator('form button[type="submit"]').click();
  await page.waitForLoadState("networkidle");
  await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
}

test.describe("B2B storefront", () => {
  test("logged-in buyer sees the company badge in the header", async ({ page }) => {
    test.skip(!expectedCompany, "Set JULI_E2E_B2B_COMPANY to expose the badge assertion.");
    await login(page);
    await page.goto("/");
    const badge = page.locator(".b2b-context-badge");
    await expect(badge).toBeVisible({ timeout: 15_000 });
    await expect(badge).toContainText(new RegExp(expectedCompany!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  });

  test('cart shows "Solicitar Cotação" button', async ({ page }) => {
    test.skip(!productCode, "Set JULI_E2E_PRODUCT_CODE to drive the cart-add step.");
    await login(page);
    await page.goto(`/product/${encodeURIComponent(productCode!)}`);
    await page.locator('button:has-text("Adicionar"),button:has-text("Comprar")').first().click();
    await page.goto("/cart");
    const quoteBtn = page.locator('button:has-text("Solicitar Cotação")');
    await expect(quoteBtn).toBeVisible({ timeout: 15_000 });
  });

  test("/account/quotes renders the quotes list (or empty state)", async ({ page }) => {
    await login(page);
    await page.goto("/account/quotes");
    // Either the table or the empty state must be present — both are
    // valid: a fresh tenant has zero quotes, an established one has rows.
    await expect(
      page.locator(".quotes-page__table, .quotes-page__empty").first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test("approver sees inbox link in account dropdown", async ({ page }) => {
    test.skip(!isApprover, "Set JULI_E2E_B2B_APPROVER=1 when the user has an approver role.");
    await login(page);
    await page.goto("/");
    await page.locator(".account-menu-btn").click();
    const inbox = page.locator('a:has-text("Aprovações pendentes")');
    await expect(inbox).toBeVisible({ timeout: 15_000 });
  });

  test("approver inbox loads (rows or empty state)", async ({ page }) => {
    test.skip(!isApprover, "Set JULI_E2E_B2B_APPROVER=1 when the user has an approver role.");
    await login(page);
    await page.goto("/account/inbox-aprovacoes");
    await expect(
      page.locator(".approvals-inbox__table, .approvals-inbox__empty").first()
    ).toBeVisible({ timeout: 15_000 });
  });
});
