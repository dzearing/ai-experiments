import { test, expect, type Page } from '@playwright/test';

/**
 * About Dialog Integration Tests
 *
 * Tests the About dialog accessibility, responsiveness, and user interactions
 * when opened from the user avatar menu.
 */

const TEST_USER = {
  id: 'user-about-dialog-test-12345',
  name: 'About Dialog Test User',
  avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=AboutTest',
};

/**
 * Sign in a test user by setting localStorage
 */
async function signIn(page: Page) {
  await page.addInitScript((user) => {
    localStorage.setItem('ideate-user', JSON.stringify(user));
  }, TEST_USER);
}

test.describe('About Dialog - Desktop', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('opens About dialog from user avatar menu', async ({ page }) => {
    // Click the user avatar menu
    await page.getByRole('button', { name: /user menu/i }).click();

    // Click the About menu item
    await page.getByRole('menuitem', { name: /about/i }).click();

    // Verify the dialog is open
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('About Ideate')).toBeVisible();
    await expect(page.getByText('Version')).toBeVisible();
  });

  test('closes dialog with Close button', async ({ page }) => {
    // Open About dialog
    await page.getByRole('button', { name: /user menu/i }).click();
    await page.getByRole('menuitem', { name: /about/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Click the Close button in footer
    await page.getByRole('button', { name: /^close$/i }).click();

    // Dialog should be closed
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('closes dialog with X button in header', async ({ page }) => {
    // Open About dialog
    await page.getByRole('button', { name: /user menu/i }).click();
    await page.getByRole('menuitem', { name: /about/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Click the X button
    await page.getByRole('button', { name: /close dialog/i }).click();

    // Dialog should be closed
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('closes dialog with ESC key', async ({ page }) => {
    // Open About dialog
    await page.getByRole('button', { name: /user menu/i }).click();
    await page.getByRole('menuitem', { name: /about/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Press Escape key
    await page.keyboard.press('Escape');

    // Dialog should be closed
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('closes dialog when clicking backdrop', async ({ page }) => {
    // Open About dialog
    await page.getByRole('button', { name: /user menu/i }).click();
    await page.getByRole('menuitem', { name: /about/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Click on the backdrop (outside the dialog)
    // The backdrop is the parent element with the overlay
    await page.locator('[class*="backdrop"]').click({ position: { x: 10, y: 10 } });

    // Dialog should be closed
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('keyboard Tab navigation stays within dialog', async ({ page }) => {
    // Open About dialog
    await page.getByRole('button', { name: /user menu/i }).click();
    await page.getByRole('menuitem', { name: /about/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Get initial focused element
    const dialog = page.getByRole('dialog');

    // Tab through focusable elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // After tabbing through all elements, focus should still be within the dialog
    // (focus trap should prevent it from leaving)
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // The focused element should be inside the dialog
    const isInsideDialog = await dialog.locator(':focus').count();
    expect(isInsideDialog).toBeGreaterThan(0);
  });

  test('external links have correct attributes', async ({ page }) => {
    // Open About dialog
    await page.getByRole('button', { name: /user menu/i }).click();
    await page.getByRole('menuitem', { name: /about/i }).click();

    // Check GitHub link
    const githubLink = page.getByRole('link', { name: /github/i });
    await expect(githubLink).toHaveAttribute('href', 'https://github.com/dzearing/ai-experiments');
    await expect(githubLink).toHaveAttribute('target', '_blank');
    await expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');

    // Check Documentation link
    const docsLink = page.getByRole('link', { name: /documentation/i });
    await expect(docsLink).toHaveAttribute('href', 'https://github.com/dzearing/ai-experiments#readme');
    await expect(docsLink).toHaveAttribute('target', '_blank');
    await expect(docsLink).toHaveAttribute('rel', 'noopener noreferrer');
  });
});

test.describe('About Dialog - Mobile Viewport', () => {
  test.use({
    viewport: { width: 375, height: 667 }, // iPhone SE size
  });

  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('dialog is fully visible on mobile viewport', async ({ page }) => {
    // Open About dialog
    await page.getByRole('button', { name: /user menu/i }).click();
    await page.getByRole('menuitem', { name: /about/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Verify dialog content is visible without scrolling
    await expect(page.getByText('About Ideate')).toBeVisible();
    await expect(page.getByText('Version')).toBeVisible();
    await expect(page.getByRole('link', { name: /github/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /documentation/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^close$/i })).toBeVisible();
  });

  test('dialog does not overflow viewport on mobile', async ({ page }) => {
    // Open About dialog
    await page.getByRole('button', { name: /user menu/i }).click();
    await page.getByRole('menuitem', { name: /about/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Get dialog bounding box
    const boundingBox = await dialog.boundingBox();
    expect(boundingBox).not.toBeNull();

    if (boundingBox) {
      // Dialog should fit within viewport
      expect(boundingBox.x).toBeGreaterThanOrEqual(0);
      expect(boundingBox.y).toBeGreaterThanOrEqual(0);
      expect(boundingBox.x + boundingBox.width).toBeLessThanOrEqual(375);
      expect(boundingBox.y + boundingBox.height).toBeLessThanOrEqual(667);
    }
  });

  test('link buttons wrap correctly on narrow viewport', async ({ page }) => {
    // Open About dialog
    await page.getByRole('button', { name: /user menu/i }).click();
    await page.getByRole('menuitem', { name: /about/i }).click();

    // Both links should be visible
    const githubLink = page.getByRole('link', { name: /github/i });
    const docsLink = page.getByRole('link', { name: /documentation/i });

    await expect(githubLink).toBeVisible();
    await expect(docsLink).toBeVisible();
  });

  test('touch interactions work on mobile', async ({ page }) => {
    // Open About dialog via touch/click
    await page.getByRole('button', { name: /user menu/i }).tap();
    await page.getByRole('menuitem', { name: /about/i }).tap();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Close via touch/click on Close button
    await page.getByRole('button', { name: /^close$/i }).tap();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});

test.describe('About Dialog - Small Mobile (320px)', () => {
  test.use({
    viewport: { width: 320, height: 568 }, // iPhone 5/SE size
  });

  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('dialog remains usable on very small screens', async ({ page }) => {
    // Open About dialog
    await page.getByRole('button', { name: /user menu/i }).click();
    await page.getByRole('menuitem', { name: /about/i }).click();

    // Core content should be visible
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('About Ideate')).toBeVisible();
    await expect(page.getByRole('button', { name: /^close$/i })).toBeVisible();
  });
});
