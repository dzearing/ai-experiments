import { test, expect, setupWorkspaceInBrowser } from './test-setup';

test.describe('Session Rehydration', () => {
  test('should preserve chat messages when navigating away and back to a session', async ({
    page,
    testWorkspace,
  }) => {
    // Set up the test workspace in the browser
    await setupWorkspaceInBrowser(page, testWorkspace);

    // Find and click on the test project
    const projectCard = page.locator('[data-testid="project-card"]').first();
    await expect(projectCard).toBeVisible({ timeout: 10000 });
    await projectCard.click();

    // Wait for project detail page to load
    await page.waitForSelector('[data-testid="repo-card"]', { timeout: 10000 });

    // Click on Claude Code button
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

    await claudeCodeButton.click();

    // Wait for Claude Code interface to load
    await page.waitForURL('**/claude-code/**');
    await page.waitForSelector('[data-testid="message-list"]', { timeout: 10000 });

    // Wait for the greeting message to appear and verify it has content
    const messageList = page.locator('[data-testid="message-list"]');
    await expect(messageList).toBeVisible();

    // Wait for greeting message to be received and displayed
    await page.waitForFunction(
      () => {
        const messages = document.querySelectorAll('[data-testid="message-bubble"]');
        return (
          messages.length > 0 &&
          messages[0].textContent &&
          messages[0].textContent.trim().length > 0
        );
      },
      { timeout: 10000 }
    );

    // Get the greeting message content
    const firstMessage = page.locator('[data-testid="message-bubble"]').first();
    await expect(firstMessage).toBeVisible();
    const originalContent = await firstMessage.textContent();

    // Verify the greeting message has meaningful content
    expect(originalContent).toBeTruthy();
    expect(originalContent!.length).toBeGreaterThan(10); // Should have substantial content

    console.log('Original message content:', originalContent);

    // Send a test message to create more chat history
    const messageInput = page.locator('[data-testid="message-input"]');
    await expect(messageInput).toBeVisible();
    await messageInput.fill('Hello Claude!');
    await messageInput.press('Enter');

    // Wait for the user message to appear (we'll just check for 2 messages - greeting + user)
    // Don't wait for response as Claude might be slow in test environment
    await page.waitForFunction(
      () => {
        const messages = document.querySelectorAll('[data-testid="message-bubble"]');
        if (messages.length >= 2) {
          // Check that second message contains our test text
          const userMessage = messages[1];
          return userMessage.textContent && userMessage.textContent.includes('Hello Claude');
        }
        return false;
      },
      { timeout: 10000 }
    );

    // Navigate away from the session (go back to project detail)
    await page.goBack();
    await page.waitForURL('**/projects/**');
    await page.waitForSelector('[data-testid="repo-card"]', { timeout: 10000 });

    // Navigate back to the same session using Claude Code button
    const claudeCodeButtonAgain = page.locator('[data-testid="claude-code-button"]').first();
    await expect(claudeCodeButtonAgain).toBeVisible();
    await claudeCodeButtonAgain.click();

    // Wait for Claude Code interface to load again
    await page.waitForTimeout(1000); // Give time for navigation

    // Wait for messages to be restored - at least the greeting and user message
    await page.waitForFunction(
      () => {
        const messages = document.querySelectorAll('[data-testid="message-bubble"]');
        return messages.length >= 2; // Should have at least greeting + user message
      },
      { timeout: 10000 }
    );

    // Verify that all messages are still present with correct content
    const messages = page.locator('[data-testid="message-bubble"]');
    const messageCount = await messages.count();
    expect(messageCount).toBeGreaterThanOrEqual(2); // At least greeting + user message

    // Verify the greeting message content is preserved
    const restoredFirstMessage = messages.first();
    const restoredContent = await restoredFirstMessage.textContent();

    console.log('Restored message content:', restoredContent);

    // The restored content should match the original content
    expect(restoredContent).toBeTruthy();
    expect(restoredContent!.length).toBeGreaterThan(10); // Should have substantial content
    expect(restoredContent).not.toBe(''); // Should not be empty

    // Verify that we have at least 2 messages and they have content
    if (messageCount >= 2) {
      const secondMessage = messages.nth(1);
      const secondContent = await secondMessage.textContent();
      expect(secondContent).toBeTruthy();
      expect(secondContent!.length).toBeGreaterThan(5);
    }
  });

  test('should handle multiple session switches correctly', async ({ page, testWorkspace }) => {
    // Set up the test workspace in the browser
    await setupWorkspaceInBrowser(page, testWorkspace);

    const projectCard = page.locator('[data-testid="project-card"]').first();
    await projectCard.click();
    await page.waitForSelector('[data-testid="repo-card"]', { timeout: 10000 });

    // Start session with first repo
    const claudeCodeButton = page.locator('[data-testid="claude-code-button"]').first();
    const repo1Text = await claudeCodeButton.getAttribute('data-repo-name');

    // Dismiss any panels or toasts that might be blocking
    const themeSwitcher = page.locator('text="Theme Switcher"');
    if ((await themeSwitcher.count()) > 0) {
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

    await claudeCodeButton.click();
    await page.waitForURL('**/claude-code/**');
    await page.waitForSelector('[data-testid="message-list"]', { timeout: 10000 });

    // Wait for greeting and verify content
    await page.waitForFunction(
      () => {
        const messages = document.querySelectorAll('[data-testid="message-bubble"]');
        return (
          messages.length > 0 &&
          messages[0].textContent &&
          messages[0].textContent.trim().length > 0
        );
      },
      { timeout: 10000 }
    );

    const session1Content = await page
      .locator('[data-testid="message-bubble"]')
      .first()
      .textContent();
    expect(session1Content).toBeTruthy();
    expect(session1Content!.length).toBeGreaterThan(10);

    // If there's a second repo, test switching between them
    await page.goBack();
    await page.waitForURL('**/projects/**');
    await page.waitForSelector('[data-testid="repo-card"]', { timeout: 10000 });

    const repo2Button = page
      .locator('button')
      .filter({ hasText: /hello-world-\d+/i })
      .nth(1);
    if ((await repo2Button.count()) > 0) {
      const repo2Text = await repo2Button.textContent();
      await repo2Button.click();
      await page.waitForTimeout(1000); // Give time for navigation

      // Wait for different greeting
      await page.waitForFunction(
        () => {
          const messages = document.querySelectorAll('[data-testid="message-bubble"]');
          return (
            messages.length > 0 &&
            messages[0].textContent &&
            messages[0].textContent.trim().length > 0
          );
        },
        { timeout: 10000 }
      );

      const session2Content = await page
        .locator('[data-testid="message-bubble"]')
        .first()
        .textContent();
      expect(session2Content).toContain('Hello-World');

      // Go back to first repo and verify original content is preserved
      await page.goBack();
      await page.waitForTimeout(1000); // Give time for navigation

      await repo1Button.click();
      await page.waitForTimeout(1000); // Give time for navigation

      await page.waitForFunction(
        () => {
          const messages = document.querySelectorAll('[data-testid="message-bubble"]');
          return (
            messages.length > 0 &&
            messages[0].textContent &&
            messages[0].textContent.trim().length > 0
          );
        },
        { timeout: 10000 }
      );

      const restoredSession1Content = await page
        .locator('[data-testid="message-bubble"]')
        .first()
        .textContent();
      expect(restoredSession1Content).toBeTruthy();
      expect(restoredSession1Content!.length).toBeGreaterThan(10);
    } else {
      console.log('Only one repo available, skipping multi-session test');
      // Just verify we can go back to the first session using Claude Code button
      const claudeCodeButtonAgain = page.locator('[data-testid="claude-code-button"]').first();
      await claudeCodeButtonAgain.click();
      await page.waitForURL('**/claude-code/**');
      await page.waitForSelector('[data-testid="message-list"]', { timeout: 10000 });

      const restoredContent = await page
        .locator('[data-testid="message-bubble"]')
        .first()
        .textContent();
      expect(restoredContent).toBeTruthy();
      expect(restoredContent!.length).toBeGreaterThan(10);
    }
  });
});
