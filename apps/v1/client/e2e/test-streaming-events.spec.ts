import { test, expect, setupWorkspaceInBrowser } from './test-setup';
import * as path from 'path';
import * as fs from 'fs/promises';

test.describe('Claude Code Streaming Events', () => {
  test.beforeEach(async () => {
    // Clear any existing Claude sessions
    const sessionsPath = path.join(process.cwd(), '..', '..', '..', 'claude-sessions');
    try {
      await fs.rm(sessionsPath, { recursive: true, force: true });
    } catch (err) {
      // Ignore if doesn't exist
    }
  });

  test('should log all SSE events', async ({ page, testWorkspace }) => {
    // Capture console logs
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      consoleLogs.push(text);
      if (text.includes('event') || text.includes('message-') || text.includes('SSE')) {
        console.log('Browser console:', text);
      }
    });

    // Set up workspace
    await setupWorkspaceInBrowser(page, testWorkspace);

    // Navigate to Claude Code
    const projectCard = page.locator('[data-testid="project-card"]').first();
    await expect(projectCard).toBeVisible({ timeout: 10000 });
    await projectCard.click();
    await page.waitForSelector('[data-testid="repo-card"]', { timeout: 10000 });

    const claudeCodeButton = page.locator('[data-testid="claude-code-button"]').first();
    await expect(claudeCodeButton).toBeVisible({ timeout: 10000 });

    // Dismiss toasts
    const toasts = page.locator('.fixed.bottom-4.right-4');
    if ((await toasts.count()) > 0) {
      await page.click('body', { position: { x: 10, y: 10 } });
      await page.waitForTimeout(1000);
    }

    await claudeCodeButton.click();
    await page.waitForURL('**/claude-code/**');
    await page.waitForSelector('[data-testid="message-list"]', { timeout: 10000 });

    // Wait for greeting
    await page.waitForSelector('[data-testid="message-bubble"]', { timeout: 30000 });

    // Send a simple message
    const messageInput = page.locator('[data-testid="message-input"]');
    await messageInput.fill('Say "test"');
    await messageInput.press('Enter');

    // Wait for response
    await page.waitForTimeout(8000);

    // Check console logs for events
    console.log('\n=== SSE Events Received ===');
    const eventLogs = consoleLogs.filter(
      (log) =>
        log.includes('event received') ||
        log.includes('SSE') ||
        log.includes('message-start') ||
        log.includes('message-chunk') ||
        log.includes('message-end') ||
        log.includes('message-complete')
    );

    eventLogs.forEach((log) => console.log(log));

    // Check if message-end was received
    const hasMessageEnd = eventLogs.some((log) => log.includes('message-end'));
    const hasMessageComplete = eventLogs.some((log) => log.includes('message-complete'));

    console.log('\nHas message-end event:', hasMessageEnd);
    console.log('Has message-complete event:', hasMessageComplete);

    // Check final message state
    const messages = page.locator('[data-testid="message-bubble"]');
    const messageCount = await messages.count();
    const lastMessage = messages.nth(messageCount - 1);

    const debugInfo = lastMessage.locator('.text-xs.text-gray-400');
    if ((await debugInfo.count()) > 0) {
      const debugText = await debugInfo.textContent();
      console.log('\nFinal message state:', debugText);
    }

    // Should have received either message-end or message-complete
    expect(hasMessageEnd || hasMessageComplete).toBe(true);
  });
});
