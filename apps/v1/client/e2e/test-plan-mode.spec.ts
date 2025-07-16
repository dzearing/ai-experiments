import { test, expect, setupWorkspaceInBrowser } from './test-setup';
import * as path from 'path';
import * as fs from 'fs/promises';

test.describe('Plan Mode Restrictions', () => {
  test.beforeEach(async () => {
    // Clear any existing Claude sessions
    const sessionsPath = path.join(process.cwd(), '..', '..', '..', 'claude-sessions');
    try {
      await fs.rm(sessionsPath, { recursive: true, force: true });
    } catch (err) {
      // Ignore if doesn't exist
    }
  });

  test('should not allow write operations in plan mode', async ({ page, testWorkspace }) => {
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
    
    // Verify we're in plan mode - check the mode toggle
    const planModeButton = page.locator('button:has-text("Planning")');
    await expect(planModeButton).toHaveClass(/bg-green-600/);
    
    // Send a message requesting a write operation
    const messageInput = page.locator('[data-testid="message-input"]');
    await messageInput.fill('Update the README.md file to add a section about testing');
    await page.keyboard.press('Enter');
    
    // Wait for the response
    await page.waitForTimeout(5000); // Give Claude time to respond
    
    // Check that no Write tools were executed
    const writeTools = await page.locator('[data-testid="tool-execution"]:has-text("Write file")').count();
    const editTools = await page.locator('[data-testid="tool-execution"]:has-text("Edit file")').count();
    const bashTools = await page.locator('[data-testid="tool-execution"]:has-text("Run command")').count();
    
    expect(writeTools).toBe(0);
    expect(editTools).toBe(0);
    expect(bashTools).toBe(0);
    
    // Check that only read tools were used
    const readTools = await page.locator('[data-testid="tool-execution"]:has-text("Read file")').count();
    const searchTools = await page.locator('[data-testid="tool-execution"]:has-text("Search files")').count();
    const findTools = await page.locator('[data-testid="tool-execution"]:has-text("Find files")').count();
    const listTools = await page.locator('[data-testid="tool-execution"]:has-text("List directory")').count();
    
    // At least some read operations should have been performed
    const totalReadOperations = readTools + searchTools + findTools + listTools;
    expect(totalReadOperations).toBeGreaterThan(0);
    
    // Check that the response mentions planning or suggests changes without implementing
    const assistantMessages = page.locator('[data-testid="message-bubble"][data-role="assistant"]');
    const lastAssistantMessage = assistantMessages.last();
    const messageText = await lastAssistantMessage.textContent();
    
    // The message should indicate planning mode behavior
    expect(messageText?.toLowerCase()).toMatch(/plan|suggest|would|could|should|propose/);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'plan-mode-test.png', fullPage: true });
  });

  test('should show exit plan mode tool when appropriate', async ({ page, testWorkspace }) => {
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
    
    // Send a message that should trigger exit plan mode
    const messageInput = page.locator('[data-testid="message-input"]');
    await messageInput.fill('Create a plan to refactor the authentication module');
    await page.keyboard.press('Enter');
    
    // Wait for response with exit_plan_mode tool
    await page.waitForSelector('[data-testid="tool-execution"]:has-text("Exit plan mode")', { timeout: 30000 });
    
    // Verify the exit plan mode tool was executed
    const exitPlanTools = await page.locator('[data-testid="tool-execution"]:has-text("Exit plan mode")').count();
    expect(exitPlanTools).toBeGreaterThan(0);
  });
});