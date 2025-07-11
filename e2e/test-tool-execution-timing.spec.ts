import { test, expect, setupWorkspaceInBrowser } from './test-setup';
import * as path from 'path';
import * as fs from 'fs/promises';

test.describe('Tool Execution Timing', () => {
  test.beforeEach(async () => {
    // Clear any existing Claude sessions
    const sessionsPath = path.join(process.cwd(), '..', '..', '..', 'claude-sessions');
    try {
      await fs.rm(sessionsPath, { recursive: true, force: true });
    } catch (err) {
      // Ignore if doesn't exist
    }
  });

  test('should show tools as running then complete', async ({ page, testWorkspace }) => {
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
    
    // Type a message that will trigger tool use
    const testMessage = 'List the files in the current directory';
    const messageInput = page.locator('[data-testid="message-input"]');
    await expect(messageInput).toBeVisible();
    await messageInput.fill(testMessage);
    
    // Send the message
    await messageInput.press('Enter');
    
    // Wait for tool execution to appear
    await page.waitForSelector('[data-testid="tool-execution"]', { timeout: 10000 });
    
    // Get the tool execution element
    const toolExecution = page.locator('[data-testid="tool-execution"]').first();
    
    // Check that the tool shows running status with spinner
    const runningSpinner = toolExecution.locator('.animate-spin');
    await expect(runningSpinner).toBeVisible({ timeout: 5000 });
    
    // Verify the tool name is displayed
    const toolName = toolExecution.locator('[data-testid="tool-name"]');
    await expect(toolName).toContainText('List directory');
    
    // Wait for the tool to complete (spinner should disappear and checkmark should appear)
    await expect(runningSpinner).not.toBeVisible({ timeout: 10000 });
    
    // Check for completion checkmark
    const completionIcon = toolExecution.locator('svg path[d="M5 13l4 4L19 7"]');
    await expect(completionIcon).toBeVisible();
    
    // Verify execution time is displayed
    const executionTime = toolExecution.locator('text=/\\d+(\\.\\d+)?[ms|s]/');
    await expect(executionTime).toBeVisible();
    
    // Take a screenshot showing completed tool
    await page.screenshot({ path: 'tool-execution-complete.png', fullPage: true });
  });

  test('should show multiple tools executing in sequence', async ({ page, testWorkspace }) => {
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
    
    // Send a message that will trigger multiple tools
    const testMessage = 'Find all TypeScript files and read the first one you find';
    const messageInput = page.locator('[data-testid="message-input"]');
    await expect(messageInput).toBeVisible();
    await messageInput.fill(testMessage);
    await messageInput.press('Enter');
    
    // Wait for first tool (Glob/Find files)
    await page.waitForSelector('[data-testid="tool-execution"]', { timeout: 10000 });
    
    // Count tools as they appear
    let toolCount = 0;
    const maxWaitTime = 30000;
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const tools = page.locator('[data-testid="tool-execution"]');
      const currentCount = await tools.count();
      
      if (currentCount > toolCount) {
        toolCount = currentCount;
        console.log(`Tool ${toolCount} appeared`);
        
        // Check that each new tool initially shows running status
        const latestTool = tools.nth(toolCount - 1);
        const spinner = latestTool.locator('.animate-spin');
        
        // New tools should show spinner initially
        if (await spinner.isVisible()) {
          console.log(`Tool ${toolCount} is running (has spinner)`);
        }
      }
      
      // Check if we have at least 2 tools (Find files + Read file)
      if (toolCount >= 2) {
        // Verify first tool is complete
        const firstTool = tools.first();
        const firstToolComplete = await firstTool.locator('svg path[d="M5 13l4 4L19 7"]').isVisible();
        
        if (firstToolComplete) {
          console.log('First tool completed successfully');
          break;
        }
      }
      
      await page.waitForTimeout(100);
    }
    
    // Verify we got multiple tools
    expect(toolCount).toBeGreaterThanOrEqual(2);
    
    // All tools should eventually complete
    const tools = page.locator('[data-testid="tool-execution"]');
    for (let i = 0; i < toolCount; i++) {
      const tool = tools.nth(i);
      const checkmark = tool.locator('svg path[d="M5 13l4 4L19 7"]');
      await expect(checkmark).toBeVisible({ timeout: 10000 });
    }
    
    // Take a screenshot showing multiple completed tools
    await page.screenshot({ path: 'multiple-tools-complete.png', fullPage: true });
  });
});