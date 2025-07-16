import { test, expect, setupWorkspaceInBrowser } from './test-setup';
import * as path from 'path';
import * as fs from 'fs/promises';

test.describe('Feedback Dialog Autofocus', () => {
  test.beforeEach(async () => {
    // Clear any existing Claude sessions
    const sessionsPath = path.join(process.cwd(), '..', '..', '..', 'claude-sessions');
    try {
      await fs.rm(sessionsPath, { recursive: true, force: true });
    } catch (err) {
      // Ignore if doesn't exist
    }
  });

  test('should automatically focus the feedback textarea when dialog opens', async ({ page, testWorkspace }) => {
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
    await page.waitForTimeout(1000); // Wait for SSE setup
    
    // Wait for greeting message
    await page.waitForSelector('[data-testid="message-bubble"]', { timeout: 30000 });
    
    // Find and click a feedback link
    const feedbackLink = page.locator('button:has-text("Leave feedback")').first();
    await expect(feedbackLink).toBeVisible({ timeout: 10000 });
    await feedbackLink.click();
    
    // Wait for feedback dialog to appear
    await page.waitForSelector('h2:has-text("Leave feedback")', { timeout: 5000 });
    
    // Wait a bit for the autofocus to trigger
    await page.waitForTimeout(200);
    
    // Check if the textarea is focused
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBe('TEXTAREA');
    
    // Also verify we can immediately start typing
    await page.keyboard.type('This is a test of autofocus');
    
    // Check that the text was entered
    const textarea = page.locator('textarea').first();
    const value = await textarea.inputValue();
    expect(value).toBe('This is a test of autofocus');
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'feedback-autofocus.png', fullPage: true });
  });

  test('should maintain focus when dragging the dialog', async ({ page, testWorkspace }) => {
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
    
    // Wait for greeting message and click feedback
    await page.waitForSelector('[data-testid="message-bubble"]', { timeout: 30000 });
    const feedbackLink = page.locator('button:has-text("Leave feedback")').first();
    await feedbackLink.click();
    
    // Wait for dialog and autofocus
    await page.waitForSelector('h2:has-text("Leave feedback")', { timeout: 5000 });
    await page.waitForTimeout(200);
    
    // Type some text
    await page.keyboard.type('Test text');
    
    // Drag the dialog header
    const dialogHeader = page.locator('h2:has-text("Leave feedback")').locator('..');
    await dialogHeader.hover();
    await page.mouse.down();
    await page.mouse.move(100, 100);
    await page.mouse.up();
    
    // Continue typing to verify focus is maintained
    await page.keyboard.type(' after drag');
    
    // Verify the full text
    const textarea = page.locator('textarea').first();
    const value = await textarea.inputValue();
    expect(value).toBe('Test text after drag');
  });
});