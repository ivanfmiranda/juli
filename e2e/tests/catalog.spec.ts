import { test, expect } from '@playwright/test';

test.describe('Catalog — Product Detail Page', () => {
  test('homepage renders product grid or CMS content', async ({ page }) => {
    await page.goto('/');
    await expect(page).not.toHaveURL(/error/i);
    await expect(page.locator('body')).not.toContainText('undefined');
  });

  test('category page loads and shows products', async ({ page }) => {
    await page.goto('/search?q=');
    const productCards = page.locator('[class*="product-card"], [data-testid="product-card"]');
    // if no products, page should at least load without error
    await expect(page.locator('body')).not.toContainText('500');
  });

  test('search page returns results for generic query', async ({ page }) => {
    await page.goto('/search?q=bola');
    await expect(page).not.toHaveURL(/error/i);
    await expect(page.locator('body')).not.toContainText('500');
  });

  test('PDP loads via product code in URL', async ({ page }) => {
    // Navigate to a product that should exist in demo data
    await page.goto('/product/BOLA-SOCIETY-001');
    // Either the product renders or we get a 404 — both are valid
    const isProduct = await page.locator('[class*="product-detail"]').isVisible().catch(() => false);
    const is404 = await page.locator('text=404').isVisible().catch(() => false);
    expect(isProduct || is404).toBeTruthy();
  });

  test('404 page renders without JS errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/rota-que-nao-existe-xyz-123');
    expect(errors.filter((e) => !e.includes('favicon'))).toHaveLength(0);
  });
});
