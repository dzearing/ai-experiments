import { test, expect, setupWorkspaceInBrowser } from './test-setup';
import * as path from 'path';
import * as fs from 'fs/promises';

test.describe('Claude Code Markdown Rendering', () => {
  test.beforeEach(async () => {
    // Clear any existing Claude sessions
    const sessionsPath = path.join(process.cwd(), '..', '..', '..', 'claude-sessions');
    try {
      await fs.rm(sessionsPath, { recursive: true, force: true });
    } catch (err) {
      // Ignore if doesn't exist
    }
  });

  test('should render markdown with bold text correctly', async ({ page, testWorkspace }) => {
    // Set up workspace and navigate to projects page
    await setupWorkspaceInBrowser(page, testWorkspace);

    // Click on test project
    const projectCard = page.locator('[data-testid="project-card"]').first();
    await expect(projectCard).toBeVisible({ timeout: 10000 });
    await projectCard.click();
    await page.waitForSelector('[data-testid="repo-card"]', { timeout: 10000 });

    // Click on Claude Code button
    const claudeCodeButton = page.locator('[data-testid="claude-code-button"]').first();
    await expect(claudeCodeButton).toBeVisible({ timeout: 10000 });

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

    // Wait for Claude Code page to load and SSE connection to establish
    await page.waitForURL('**/claude-code/**');
    await page.waitForSelector('[data-testid="message-list"]', { timeout: 10000 });
    await page.waitForTimeout(1000); // Wait for SSE setup

    // Wait for greeting message
    await page.waitForSelector('[data-testid="message-bubble"]', { timeout: 30000 });

    // Type the test message
    const testMessage = 'Say "Hello **world**!" with the word world in bold markdown';
    const messageInput = page.locator('[data-testid="message-input"]');
    await expect(messageInput).toBeVisible();
    await messageInput.fill(testMessage);

    // Send the message
    await messageInput.press('Enter');

    // Wait for the response to complete
    await page.waitForTimeout(2000); // Give time for message to start

    // Wait for a new assistant message that contains "Hello" and check for completion
    // We should have at least 3 messages now: greeting, user message, response
    await page.waitForFunction(
      () => {
        const messages = document.querySelectorAll('[data-testid="message-bubble"]');
        return messages.length >= 3;
      },
      { timeout: 30000 }
    );

    // Get the last message (assistant's response)
    const messages = page.locator('[data-testid="message-bubble"]');
    const messageCount = await messages.count();
    const responseElement = messages.nth(messageCount - 1);
    const responseHTML = await responseElement.innerHTML();
    const responseText = await responseElement.textContent();

    console.log('Response HTML:', responseHTML);
    console.log('Response Text:', responseText);

    // Check that the response doesn't contain [object Object]
    expect(responseText).not.toContain('[object Object]');

    // Check that markdown is properly rendered
    // The word "world" should be in a <strong> tag if markdown is working
    const strongElements = await responseElement.locator('strong').all();
    const hasStrongTag = strongElements.length > 0;

    if (hasStrongTag) {
      console.log('Markdown rendering is working - found <strong> tags');
      // Check if "world" is bold
      const worldIsStrong = (await responseElement.locator('strong:has-text("world")').count()) > 0;
      expect(worldIsStrong).toBe(true);
    } else {
      // If no strong tags, check if the raw markdown is visible
      const hasRawMarkdown = responseText.includes('**world**');
      console.log('Has raw markdown:', hasRawMarkdown);

      // This indicates markdown isn't being rendered
      if (hasRawMarkdown) {
        throw new Error('Markdown is not being rendered - raw ** symbols are visible');
      }
    }

    // Take a screenshot for debugging
    await page.screenshot({ path: 'markdown-test-result.png', fullPage: true });
  });
});
