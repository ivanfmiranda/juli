import { test, expect, Page } from '@playwright/test';

const CUSTOMER_EMAIL = process.env.CUSTOMER_EMAIL ?? 'cliente@default.ubris.com.br';
const CUSTOMER_PASS  = process.env.CUSTOMER_PASS  ?? 'Cliente@Demo2026!';

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel(/e-?mail|username/i).fill(email);
  await page.getByLabel(/senha|password/i).fill(password);
  await page.getByRole('button', { name: /entrar|login|sign in/i }).click();
  await page.waitForURL((url) => !url.pathname.includes('/login'));
}

test.describe('Cart & Checkout', () => {
  test('cart page accessible without login', async ({ page }) => {
    await page.goto('/cart');
    await expect(page).not.toHaveURL(/error/);
  });

  test('checkout redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/checkout');
    await expect(page).toHaveURL(/login/);
  });

  test('authenticated user sees checkout steps', async ({ page }) => {
    await loginAs(page, CUSTOMER_EMAIL, CUSTOMER_PASS);
    await page.goto('/checkout');
    // Should see address step or be redirected if cart is empty
    const hasCheckout = await page.locator('[class*="checkout"]').isVisible().catch(() => false);
    const hasCart = await page.locator('text=/carrinho|cart/i').isVisible().catch(() => false);
    expect(hasCheckout || hasCart).toBeTruthy();
  });

  test('checkout form requires address fields', async ({ page }) => {
    await loginAs(page, CUSTOMER_EMAIL, CUSTOMER_PASS);
    await page.goto('/checkout');

    const continueBtn = page.getByRole('button', { name: /continuar|continue|próximo/i });
    if (await continueBtn.isVisible()) {
      await continueBtn.click();
      // Should show validation errors
      const errors = page.locator('.ub-form-error, .field-error, [class*="error"]');
      const count = await errors.count();
      // Either shows errors or cart is empty and redirects
      const isOnCheckout = page.url().includes('/checkout');
      expect(!isOnCheckout || count > 0).toBeTruthy();
    }
  });
});

test.describe('Account — Orders', () => {
  test('orders page requires auth', async ({ page }) => {
    await page.goto('/account/orders');
    await expect(page).toHaveURL(/login/);
  });

  test('authenticated user sees orders page', async ({ page }) => {
    await loginAs(page, CUSTOMER_EMAIL, CUSTOMER_PASS);
    await page.goto('/account/orders');
    await expect(page).not.toHaveURL(/login/);
    await expect(page).toHaveURL(/orders/);
  });
});

test.describe('Account — Addresses', () => {
  test('address management page requires auth', async ({ page }) => {
    await page.goto('/account/addresses');
    await expect(page).toHaveURL(/login/);
  });

  test('authenticated user sees address management', async ({ page }) => {
    await loginAs(page, CUSTOMER_EMAIL, CUSTOMER_PASS);
    await page.goto('/account/addresses');
    await expect(page).not.toHaveURL(/login/);
  });
});
