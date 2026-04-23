import { test, expect } from '@playwright/test';

const CUSTOMER_EMAIL = process.env.CUSTOMER_EMAIL ?? 'cliente@default.ubris.com.br';
const CUSTOMER_PASS  = process.env.CUSTOMER_PASS  ?? 'Cliente@Demo2026!';

test.describe('Authentication', () => {
  test('login with valid credentials redirects to home', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/e-?mail|username/i).fill(CUSTOMER_EMAIL);
    await page.getByLabel(/senha|password/i).fill(CUSTOMER_PASS);
    await page.getByRole('button', { name: /entrar|login|sign in/i }).click();
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('header')).toBeVisible();
  });

  test('login with wrong password shows error', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/e-?mail|username/i).fill(CUSTOMER_EMAIL);
    await page.getByLabel(/senha|password/i).fill('wrong-password');
    await page.getByRole('button', { name: /entrar|login|sign in/i }).click();
    await expect(page.locator('.error, [role="alert"]')).toBeVisible();
    await expect(page).toHaveURL(/login/);
  });

  test('register form validates email and password', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('button', { name: /criar conta|register/i }).click();
    await expect(page.locator('.field-error')).toHaveCount({ min: 1 });
  });

  test('logout clears session and redirects to login', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/e-?mail|username/i).fill(CUSTOMER_EMAIL);
    await page.getByLabel(/senha|password/i).fill(CUSTOMER_PASS);
    await page.getByRole('button', { name: /entrar|login|sign in/i }).click();
    await page.waitForURL((url) => !url.pathname.includes('/login'));

    // Logout via header button or menu
    const logoutBtn = page.getByRole('button', { name: /sair|logout|sign out/i });
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
    }
    await expect(page).toHaveURL(/login|\/$/);
  });
});
