import { test, expect } from '@playwright/test';

test.describe('App', () => {
  test('should display welcome message', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.getByRole('heading', { name: 'Welcome to {{name}}' })).toBeVisible();
  });

  test('should display getting started instructions', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.getByText('Get started by editing')).toBeVisible();
    await expect(page.locator('code').filter({ hasText: 'src/App.tsx' })).toBeVisible();
  });

  test('should have correct page title', async ({ page }) => {
    await page.goto('/');
    
    await expect(page).toHaveTitle('{{name}}');
  });
});