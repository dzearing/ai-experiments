import { test, expect, setupWorkspaceInBrowser } from './test-setup';

test.describe('Breadcrumb Navigation', () => {
  test('should navigate through breadcrumbs correctly', async ({ page, testWorkspace }) => {
    await setupWorkspaceInBrowser(page, testWorkspace);

    // Step 1: Start at Projects page - should have no breadcrumb
    // The setup already waits for project-card, so just take screenshot
    await page.screenshot({ path: 'test-results/breadcrumb-1-projects-page.png' });

    // Check that no breadcrumb is visible on Projects page
    const breadcrumbLocator = page.locator('nav[aria-label="Breadcrumb"]');
    const breadcrumbCount = await breadcrumbLocator.count();
    if (breadcrumbCount > 0) {
      const breadcrumbText = await breadcrumbLocator.first().textContent();
      expect(breadcrumbText?.trim()).toBeFalsy(); // Should be empty or not visible
    }

    // Step 2: Navigate to project detail page
    // Look for the test project card - it should have "Test Project" text
    const projectCards = page.locator('[data-testid="project-card"]');
    const projectCard = projectCards.first(); // In test setup, we only have one project
    await expect(projectCard).toBeVisible({ timeout: 10000 });
    await projectCard.click();

    // Wait for navigation to complete - look for repo cards
    await page.waitForURL('**/projects/**');
    await page.waitForSelector('[data-testid="repo-card"]', { timeout: 10000 });

    // Wait a bit for animations to complete
    await page.waitForTimeout(100);

    // Check breadcrumb shows: Projects > test-project
    await expect(breadcrumbLocator.first()).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: 'test-results/breadcrumb-2-project-detail.png' });

    const projectBreadcrumbText = await breadcrumbLocator.first().textContent();
    expect(projectBreadcrumbText).toContain('Projects');
    expect(projectBreadcrumbText).toContain('test-project');

    // Step 3: Navigate to Claude Code
    // First dismiss any toasts that might be blocking
    const toasts = page.locator('[role="alert"], .fixed.bottom-4.right-4');
    const toastCount = await toasts.count();
    if (toastCount > 0) {
      // Try to click the close button if available, or wait for toast to disappear
      const closeButton = toasts.locator('button').first();
      if ((await closeButton.count()) > 0) {
        await closeButton.click({ force: true });
      }
      // Wait a bit for toast to disappear
      await page.waitForTimeout(1000);
    }

    const claudeCodeButton = page.locator('[data-testid="claude-code-button"]').first();
    await expect(claudeCodeButton).toBeVisible({ timeout: 5000 });
    const repoName = await claudeCodeButton.getAttribute('data-repo-name');
    await claudeCodeButton.click();

    // Wait for Claude Code page to load
    await page.waitForURL('**/claude-code/**');
    await page.waitForSelector('[data-testid="message-list"]', { timeout: 10000 });

    // Wait a bit for animations to complete
    await page.waitForTimeout(100);

    // Wait for breadcrumb to update with Claude Code
    await expect(breadcrumbLocator.first()).toContainText('Claude Code', { timeout: 5000 });
    await page.screenshot({ path: 'test-results/breadcrumb-3-claude-code.png' });

    // Check breadcrumb shows: test-project > [repo-name] > Claude Code
    const claudeBreadcrumbText = await breadcrumbLocator.first().textContent();
    expect(claudeBreadcrumbText).toContain('test-project');
    expect(claudeBreadcrumbText).toContain('Claude Code');
    if (repoName) {
      expect(claudeBreadcrumbText).toContain(repoName);
    }

    // Step 4: Navigate back to project detail
    await page.goBack();
    await page.waitForURL('**/projects/**');
    await page.waitForSelector('[data-testid="repo-card"]', { timeout: 10000 });

    // Wait a bit for animations to complete
    await page.waitForTimeout(100);

    // Verify breadcrumb reverts correctly
    await expect(breadcrumbLocator.first()).not.toContainText('Claude Code', { timeout: 5000 });
    await page.screenshot({ path: 'test-results/breadcrumb-4-back-to-project.png' });

    const backBreadcrumbText = await breadcrumbLocator.first().textContent();
    expect(backBreadcrumbText).toContain('Projects');
    expect(backBreadcrumbText).toContain('test-project');
    expect(backBreadcrumbText).not.toContain('Claude Code');

    // Step 5: Navigate back to Projects page
    await page.goBack();
    await page.waitForURL('**/projects');
    await page.waitForSelector('[data-testid="project-card"]', { timeout: 5000 });

    // Wait a bit for animations to complete
    await page.waitForTimeout(100);

    // Check that breadcrumb is cleared on Projects page
    await page.screenshot({ path: 'test-results/breadcrumb-5-back-to-projects.png' });

    const finalBreadcrumbCount = await breadcrumbLocator.count();
    if (finalBreadcrumbCount > 0) {
      const finalBreadcrumbText = await breadcrumbLocator.first().textContent();
      expect(finalBreadcrumbText?.trim()).toBeFalsy(); // Should be empty
    }
  });
});
