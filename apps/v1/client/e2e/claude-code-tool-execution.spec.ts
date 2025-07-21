import { test, expect } from './test-setup';

test.describe('Claude Code Tool Execution Display', () => {
  test('should display tool executions correctly without false failures', async ({
    page,
    testWorkspace,
  }) => {
    console.log('Test workspace:', testWorkspace);

    // Navigate to the test project
    await page.click('[data-testid="project-card"]');
    await page.waitForURL('**/projects/*');

    // Enter Claude Code for a repo
    await page.click('[data-testid="claude-code-button"]');
    await page.waitForURL('**/claude-code/*');

    // Wait for Claude Code interface to load
    await page.waitForSelector('[data-testid="claude-code-input"]', { timeout: 10000 });

    // Wait for greeting message to complete
    await page.waitForSelector('[data-testid="message-complete"]', { timeout: 30000 });

    // Type a message that will trigger tool use
    const input = page.locator('[data-testid="claude-code-input"]');
    await input.fill('Read the README.md file and summarize it');

    // Press Enter to send the message
    await input.press('Enter');

    // Wait for the response to start
    await page.waitForSelector('[data-testid="message-start"]', { timeout: 10000 });

    // Check for tool execution display
    const toolExecution = page.locator('[data-testid="tool-execution"]').first();
    await expect(toolExecution).toBeVisible({ timeout: 5000 });

    // Verify the tool execution shows correct information
    const toolName = toolExecution.locator('[data-testid="tool-name"]');
    await expect(toolName).toContainText('Read');

    // Check that the tool status is not showing as error initially
    const toolStatus = toolExecution.locator('[data-testid="tool-status"]');

    // Tool should show as pending or completed, not failed
    const statusText = await toolStatus.textContent();
    expect(statusText).not.toContain('Failed');
    expect(statusText).not.toContain('Error');

    // The status should be either "Pending..." or show success
    expect(statusText).toMatch(/Pending\.\.\.|Success|Completed/i);

    // Wait for the message to complete
    await page.waitForSelector('[data-testid="message-complete"]', { timeout: 30000 });

    // Verify the summary content was returned
    const messageContent = page.locator('[data-testid="message-content"]').last();
    await expect(messageContent).toContainText('Hello World Project');

    // Final check: tool execution should not show as failed
    const finalToolStatus = await toolStatus.textContent();
    expect(finalToolStatus).not.toContain('Failed');
    expect(finalToolStatus).not.toContain('Tool execution failed');

    // Take a screenshot for debugging
    await page.screenshot({
      path: 'claude-code-tool-execution.png',
      fullPage: true,
    });
  });
});
