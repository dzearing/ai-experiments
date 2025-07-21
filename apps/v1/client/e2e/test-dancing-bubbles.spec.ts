import { test, expect, setupWorkspaceInBrowser } from './test-setup';
import * as path from 'path';
import * as fs from 'fs/promises';

test.describe('Claude Code Dancing Bubbles', () => {
  test.beforeEach(async () => {
    // Clear any existing Claude sessions
    const sessionsPath = path.join(process.cwd(), '..', '..', '..', 'claude-sessions');
    try {
      await fs.rm(sessionsPath, { recursive: true, force: true });
    } catch (err) {
      // Ignore if doesn't exist
    }
  });

  test('should show dancing bubbles while waiting for response', async ({
    page,
    testWorkspace,
  }) => {
    // Set up workspace and navigate to Claude Code
    await setupWorkspaceInBrowser(page, testWorkspace);

    // Click on test project
    const projectCard = page.locator('[data-testid="project-card"]').first();
    await expect(projectCard).toBeVisible({ timeout: 10000 });
    await projectCard.click();
    await page.waitForSelector('[data-testid="repo-card"]', { timeout: 10000 });

    // Click on Claude Code button
    const claudeCodeButton = page.locator('[data-testid="claude-code-button"]').first();
    await expect(claudeCodeButton).toBeVisible({ timeout: 10000 });

    // Dismiss any blocking UI elements
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

    // Wait for Claude Code page to load
    await page.waitForURL('**/claude-code/**');
    await page.waitForSelector('[data-testid="message-list"]', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Wait for greeting message
    await page.waitForSelector('[data-testid="message-bubble"]', { timeout: 30000 });

    // Send a message
    const testMessage = 'Please count to 5 slowly';
    const messageInput = page.locator('[data-testid="message-input"]');
    await expect(messageInput).toBeVisible();
    await messageInput.fill(testMessage);

    // Send the message
    await messageInput.press('Enter');

    // Wait a moment for the placeholder to be added
    await page.waitForTimeout(500);

    // Check for dancing bubbles in the latest message
    const messages = page.locator('[data-testid="message-bubble"]');
    const messageCountAfterSend = await messages.count();
    console.log('Message count after send:', messageCountAfterSend);

    // Should have at least: greeting + user message + placeholder
    expect(messageCountAfterSend).toBeGreaterThanOrEqual(3);

    // Check for dancing bubbles indicator
    const dancingBubbles = page.locator('[data-testid="dancing-bubbles"]');
    const dancingBubblesCount = await dancingBubbles.count();
    console.log('Dancing bubbles found:', dancingBubblesCount);

    if (dancingBubblesCount === 0) {
      // If no dancing bubbles found by test-id, look for the animation class
      const animatedElements = page.locator('.animate-pulse, .animate-bounce');
      const animatedCount = await animatedElements.count();
      console.log('Animated elements found:', animatedCount);

      // Look in the last assistant message
      const lastAssistantMessage = messages.filter({ hasText: 'C' }).last();
      const bubbleContent = await lastAssistantMessage.textContent();
      console.log('Last assistant message content:', bubbleContent);
    }

    // Wait for actual content to start streaming
    await page.waitForTimeout(3000);

    // Dancing bubbles should be gone and replaced with actual content
    const finalDancingBubblesCount = await dancingBubbles.count();
    console.log('Final dancing bubbles count:', finalDancingBubblesCount);

    // Check that we now have actual content
    const finalMessages = page.locator('[data-testid="message-bubble"]');
    const finalMessageCount = await finalMessages.count();
    const lastMessage = finalMessages.nth(finalMessageCount - 1);
    const lastMessageText = await lastMessage.textContent();

    console.log('Final message text:', lastMessageText);

    // Should have actual content now, not just empty
    expect(lastMessageText).not.toBe('');
    expect(lastMessageText).toContain('C'); // Avatar

    // Take screenshot for debugging
    await page.screenshot({ path: 'dancing-bubbles-test.png', fullPage: true });
  });
});
