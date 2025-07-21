import { test, expect, setupWorkspaceInBrowser } from './test-setup';

test.describe('Claude Code Mount Fix Validation', () => {
  test('should properly handle mount state when setting up SSE connection', async ({
    page,
    testWorkspace,
  }) => {
    const consoleLogs: string[] = [];

    // Capture console logs
    page.on('console', (msg) => {
      consoleLogs.push(msg.text());
    });

    // Set up workspace and navigate to Claude Code
    await setupWorkspaceInBrowser(page, testWorkspace);

    // Click on test project
    const testProject = page.locator('[data-testid="project-card"]').first();
    await expect(testProject).toBeVisible({ timeout: 10000 });
    await testProject.click();
    await page.waitForSelector('[data-testid="repo-card"]', { timeout: 10000 });

    const claudeCodeButton = page.locator('[data-testid="claude-code-button"]').first();
    await expect(claudeCodeButton).toBeVisible({ timeout: 10000 });

    // Dismiss any panels or toasts that might be blocking
    const themeSwitcher = page.locator('text="Theme Switcher"');
    if ((await themeSwitcher.count()) > 0) {
      // Click somewhere else to close it
      await page.click('body', { position: { x: 10, y: 10 } });
      await page.waitForTimeout(500);
    }

    const toasts = page.locator('[role="alert"], .fixed.bottom-4.right-4');
    const toastCount = await toasts.count();
    if (toastCount > 0) {
      const closeButton = toasts.locator('button').first();
      if ((await closeButton.count()) > 0) {
        await closeButton.click({ force: true });
      }
      await page.waitForTimeout(1000);
    }

    // Clear logs before the critical action
    consoleLogs.length = 0;
    await claudeCodeButton.click();

    // Wait for component to initialize
    await expect(page.locator('text=Claude Code Session')).toBeVisible({ timeout: 30000 });

    // Wait a bit to collect all logs
    await page.waitForTimeout(2000);

    // Check for the specific error that was fixed
    const hasUnmountError = consoleLogs.some((log) =>
      log.includes('Component unmounted, skipping SSE setup')
    );

    // Check for successful SSE setup
    const hasSuccessfulSetup = consoleLogs.some((log) =>
      log.includes('Setting up delayed SSE connection')
    );

    // Check for mount/unmount sequence
    const mountLogs = consoleLogs.filter(
      (log) => log.includes('MOUNTED') || log.includes('UNMOUNTING')
    );

    console.log('Mount/Unmount sequence:', mountLogs);

    // Assertions
    expect(hasUnmountError).toBe(false); // The bug should not occur
    expect(hasSuccessfulSetup).toBe(true); // SSE should be set up successfully

    // The component should not unmount within the 500ms delay
    const unmountDuringDelay = consoleLogs.some((log, index) => {
      if (log.includes('Scheduling SSE connection setup with delay')) {
        // Check if unmount happens within next few logs
        const nextLogs = consoleLogs.slice(index, index + 10);
        return nextLogs.some((l) => l.includes('UNMOUNTING'));
      }
      return false;
    });

    expect(unmountDuringDelay).toBe(false); // Component should stay mounted during delay

    // Wait for greeting message to confirm full functionality
    let greetingFound = false;
    const maxWaitTime = 15000;
    const startTime = Date.now();

    while (!greetingFound && Date.now() - startTime < maxWaitTime) {
      const bodyText = await page.textContent('body');
      if (
        bodyText &&
        (bodyText.includes('Hello') ||
          bodyText.includes('Hi') ||
          bodyText.includes('Hey') ||
          bodyText.includes('Welcome') ||
          bodyText.includes('help you') ||
          bodyText.includes('Great to see you'))
      ) {
        greetingFound = true;
        break;
      }
      await page.waitForTimeout(500);
    }

    // For test workspaces, we might not get a full greeting, so just check that we got some content
    expect(greetingFound).toBe(true); // Should have some content

    console.log('✅ All assertions passed! The mount fix is working correctly.');
  });
});
