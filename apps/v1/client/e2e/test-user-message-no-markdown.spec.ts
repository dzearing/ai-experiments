import { test, expect, setupWorkspaceInBrowser } from './test-setup';
import * as path from 'path';
import * as fs from 'fs/promises';

test.describe('User Message No Markdown Rendering', () => {
  test.beforeEach(async () => {
    // Clear any existing Claude sessions
    const sessionsPath = path.join(process.cwd(), '..', '..', '..', 'claude-sessions');
    try {
      await fs.rm(sessionsPath, { recursive: true, force: true });
    } catch (err) {
      // Ignore if doesn't exist
    }
  });

  test('should not render markdown in user messages', async ({ page, testWorkspace }) => {
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

    // Wait for Claude Code page to load
    await page.waitForURL('**/claude-code/**');
    await page.waitForSelector('[data-testid="message-list"]', { timeout: 10000 });
    await page.waitForTimeout(1000); // Wait for SSE setup

    // Wait for greeting message
    await page.waitForSelector('[data-testid="message-bubble"]', { timeout: 30000 });

    // Type a message with special characters that would break if rendered as markdown
    const testMessage = 'Let\'s plan on a new "inspect <packagename>@<version>" feature';
    const messageInput = page.locator('[data-testid="message-input"]');
    await expect(messageInput).toBeVisible();
    await messageInput.fill(testMessage);

    // Send the message
    await messageInput.press('Enter');

    // Wait for the user message to appear
    await page.waitForTimeout(1000);

    // Find the user message (should be the second message after greeting)
    const messages = page.locator('[data-testid="message-bubble"]');
    await page.waitForTimeout(2000); // Wait for message to appear
    const messageCount = await messages.count();
    expect(messageCount).toBeGreaterThanOrEqual(2);

    // Get the user message (second bubble)
    const userMessage = messages.nth(1);
    const userMessageText = await userMessage.textContent();

    // Verify the message text is displayed correctly with angle brackets
    expect(userMessageText).toContain(
      'Let\'s plan on a new "inspect <packagename>@<version>" feature'
    );

    // Verify there are no HTML elements that would indicate markdown rendering
    const userMessageHTML = await userMessage.innerHTML();

    // Check that angle brackets are preserved and not interpreted as HTML
    expect(userMessageHTML).toContain('&lt;packagename&gt;');
    expect(userMessageHTML).toContain('&lt;version&gt;');

    // Check that the message doesn't have markdown-specific classes
    const markdownContent = await userMessage.locator('.markdown-content').count();
    expect(markdownContent).toBe(0);

    // Check that the content is in a simple div with whitespace preservation
    const simpleContent = await userMessage.locator('.whitespace-pre-wrap').count();
    expect(simpleContent).toBe(1);

    // Take a screenshot for debugging
    await page.screenshot({ path: 'user-message-no-markdown.png', fullPage: true });
  });

  test('should render markdown in assistant messages', async ({ page, testWorkspace }) => {
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
    await claudeCodeButton.click();

    // Wait for Claude Code page to load
    await page.waitForURL('**/claude-code/**');
    await page.waitForSelector('[data-testid="message-list"]', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Wait for greeting message
    await page.waitForSelector('[data-testid="message-bubble"]', { timeout: 30000 });

    // The greeting message should have markdown rendering
    const greetingMessage = page.locator('[data-testid="message-bubble"]').first();

    // Check that assistant messages have markdown-content class
    const markdownContent = await greetingMessage.locator('.markdown-content').count();
    expect(markdownContent).toBe(1);

    // Check that it doesn't have the plain text class
    const plainContent = await greetingMessage.locator('.whitespace-pre-wrap').count();
    expect(plainContent).toBe(0);
  });
});
