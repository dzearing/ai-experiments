import { test, expect, setupWorkspaceInBrowser } from './test-setup';
import * as path from 'path';
import * as fs from 'fs/promises';

test.describe('LS Tool Display', () => {
  test.beforeEach(async () => {
    // Clear any existing Claude sessions
    const sessionsPath = path.join(process.cwd(), '..', '..', '..', 'claude-sessions');
    try {
      await fs.rm(sessionsPath, { recursive: true, force: true });
    } catch (err) {
      // Ignore if doesn't exist
    }
  });

  test('should display folder name for LS tool, not JSON', async ({ page, testWorkspace }) => {
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

    // Send a message that will trigger LS tool
    const testMessage = 'List the files in the src directory';
    const messageInput = page.locator('[data-testid="message-input"]');
    await expect(messageInput).toBeVisible();
    await messageInput.fill(testMessage);

    // Send the message
    await messageInput.press('Enter');

    // Wait for tool execution to appear
    await page.waitForSelector('[data-testid="tool-execution"]', { timeout: 10000 });

    // Get the tool execution element
    const toolExecution = page.locator('[data-testid="tool-execution"]').first();

    // Check that the tool name is correct
    const toolName = toolExecution.locator('[data-testid="tool-name"]');
    await expect(toolName).toContainText('List directory');

    // Check that the folder name is displayed (not "json")
    const toolArgs = toolExecution.locator('.font-mono').first();
    const argsText = await toolArgs.textContent();

    // Verify it shows "src" and not "json"
    expect(argsText?.toLowerCase()).toContain('src');
    expect(argsText?.toLowerCase()).not.toBe('json');

    // Take a screenshot for debugging
    await page.screenshot({ path: 'ls-tool-display.png', fullPage: true });
  });

  test('should display "current directory" for LS tool when path is "."', async ({
    page,
    testWorkspace,
  }) => {
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

    // Send a message that will trigger LS tool on current directory
    const testMessage = 'List files in the current directory';
    const messageInput = page.locator('[data-testid="message-input"]');
    await expect(messageInput).toBeVisible();
    await messageInput.fill(testMessage);
    await messageInput.press('Enter');

    // Wait for tool execution
    await page.waitForSelector('[data-testid="tool-execution"]', { timeout: 10000 });

    // Get the tool execution element
    const toolExecution = page.locator('[data-testid="tool-execution"]').first();

    // Check that it shows "current directory"
    const toolArgs = toolExecution.locator('.font-mono').first();
    const argsText = await toolArgs.textContent();

    expect(argsText).toBe('current directory');
  });
});
