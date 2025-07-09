import { test, expect, setupWorkspaceInBrowser } from './test-setup';
import * as path from 'path';
import * as fs from 'fs/promises';

test.describe('Claude Code Markdown Elements', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing Claude sessions
    const sessionsPath = path.join(process.cwd(), '..', '..', '..', 'claude-sessions');
    try {
      await fs.rm(sessionsPath, { recursive: true, force: true });
    } catch (err) {
      // Ignore if doesn't exist
    }
  });

  const navigateToClaudeCode = async (page: any, testWorkspace: string) => {
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
      if (await closeButton.count() > 0) {
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
  };

  const sendMessageAndWaitForResponse = async (page: any, message: string) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    await expect(messageInput).toBeVisible();
    await messageInput.fill(message);
    await messageInput.press('Enter');
    
    // Wait for response to start
    await page.waitForTimeout(2000);
    
    // Wait for new message
    await page.waitForFunction(() => {
      const messages = document.querySelectorAll('[data-testid="message-bubble"]');
      return messages.length >= 3; // greeting + user + response
    }, { timeout: 30000 });
    
    // Wait for streaming to complete
    await page.waitForTimeout(3000);
    
    // Get the last message
    const messages = page.locator('[data-testid="message-bubble"]');
    const messageCount = await messages.count();
    return messages.nth(messageCount - 1);
  };

  test('should render headers without hash symbols', async ({ page, testWorkspace }) => {
    await navigateToClaudeCode(page, testWorkspace);
    
    const message = 'Please respond with exactly: "# Header 1\\n## Header 2\\n### Header 3"';
    const response = await sendMessageAndWaitForResponse(page, message);
    
    const responseText = await response.textContent();
    console.log('Headers test - Response text:', responseText);
    
    // Should not show raw markdown
    expect(responseText).not.toContain('# Header');
    
    // Should have actual header elements
    const h1Count = await response.locator('h1').count();
    const h2Count = await response.locator('h2').count();
    const h3Count = await response.locator('h3').count();
    
    expect(h1Count).toBeGreaterThan(0);
    expect(h2Count).toBeGreaterThan(0);
    expect(h3Count).toBeGreaterThan(0);
  });

  test('should render lists and checkboxes properly', async ({ page, testWorkspace }) => {
    await navigateToClaudeCode(page, testWorkspace);
    
    const message = 'Please respond with exactly: "- Item 1\\n- Item 2\\n\\n- [ ] Unchecked\\n- [x] Checked"';
    const response = await sendMessageAndWaitForResponse(page, message);
    
    const responseText = await response.textContent();
    console.log('Lists test - Response text:', responseText);
    
    // Should have list elements
    const ulCount = await response.locator('ul').count();
    const liCount = await response.locator('li').count();
    
    expect(ulCount).toBeGreaterThan(0);
    expect(liCount).toBeGreaterThanOrEqual(4);
    
    // Should have checkboxes
    const checkboxCount = await response.locator('input[type="checkbox"]').count();
    expect(checkboxCount).toBe(2);
    
    // One should be checked
    const checkedCount = await response.locator('input[type="checkbox"][checked]').count();
    expect(checkedCount).toBe(1);
  });

  test('should render inline code without backticks', async ({ page, testWorkspace }) => {
    await navigateToClaudeCode(page, testWorkspace);
    
    const message = 'Please respond with exactly: "Here is `inline code` example"';
    const response = await sendMessageAndWaitForResponse(page, message);
    
    const responseText = await response.textContent();
    console.log('Inline code test - Response text:', responseText);
    
    // Should not contain backticks
    expect(responseText).not.toContain('`');
    
    // Should have code element
    const codeCount = await response.locator('code').count();
    expect(codeCount).toBeGreaterThan(0);
    
    // Code element should contain the text without backticks
    const codeElement = response.locator('code').first();
    const codeText = await codeElement.textContent();
    expect(codeText).toBe('inline code');
  });

  test('should render code blocks without triple backticks', async ({ page, testWorkspace }) => {
    await navigateToClaudeCode(page, testWorkspace);
    
    const message = 'Please respond with exactly: "```\\nfunction test() {\\n  return true;\\n}\\n```"';
    const response = await sendMessageAndWaitForResponse(page, message);
    
    const responseText = await response.textContent();
    console.log('Code block test - Response text:', responseText);
    
    // Should not contain triple backticks
    expect(responseText).not.toContain('```');
    
    // Should have pre element
    const preCount = await response.locator('pre').count();
    expect(preCount).toBeGreaterThan(0);
    
    // Should contain the function
    expect(responseText).toContain('function test()');
  });

  test('should not display [object Object]', async ({ page, testWorkspace }) => {
    await navigateToClaudeCode(page, testWorkspace);
    
    const message = 'Say hello with **bold** and *italic* text';
    const response = await sendMessageAndWaitForResponse(page, message);
    
    const responseText = await response.textContent();
    console.log('Object test - Response text:', responseText);
    
    // Should never show [object Object]
    expect(responseText).not.toContain('[object Object]');
    
    // Should have formatted text
    const strongCount = await response.locator('strong').count();
    const emCount = await response.locator('em').count();
    
    expect(strongCount).toBeGreaterThan(0);
    expect(emCount).toBeGreaterThan(0);
  });

  test('should apply CSS classes correctly', async ({ page, testWorkspace }) => {
    await navigateToClaudeCode(page, testWorkspace);
    
    const message = 'Please respond with exactly: "# Big Header\\n\\n> A quote"';
    const response = await sendMessageAndWaitForResponse(page, message);
    
    // Check header has correct classes
    const h1 = response.locator('h1').first();
    const h1Classes = await h1.getAttribute('class');
    expect(h1Classes).toContain('text-2xl');
    expect(h1Classes).toContain('font-bold');
    
    // Check blockquote has correct classes
    const blockquote = response.locator('blockquote').first();
    const blockquoteClasses = await blockquote.getAttribute('class');
    expect(blockquoteClasses).toContain('border-l-4');
    expect(blockquoteClasses).toContain('pl-4');
    expect(blockquoteClasses).toContain('italic');
  });
});