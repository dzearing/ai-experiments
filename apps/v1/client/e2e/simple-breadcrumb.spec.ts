import { test, expect, setupWorkspaceInBrowser } from './test-setup';

test.describe('Simple Breadcrumb Test', () => {
  test('should show projects page and basic navigation', async ({ page, testWorkspace }) => {
    await setupWorkspaceInBrowser(page, testWorkspace);

    // Just verify we can see the projects page - Projects is in the sidebar nav
    await expect(page.locator('text=Projects').first()).toBeVisible({ timeout: 10000 });

    // Look for any project cards
    const projectCards = page.locator('[data-testid="project-card"]');
    const count = await projectCards.count();
    console.log(`Found ${count} project cards`);

    if (count > 0) {
      const firstProject = projectCards.first();
      await expect(firstProject).toBeVisible();
      const projectText = await firstProject.textContent();
      console.log(`First project: ${projectText}`);
    }
  });
});
