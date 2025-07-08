import { test, expect } from '@playwright/test';
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

  test('should render markdown with bold text correctly', async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:5173');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Go to projects
    await page.click('text=Projects');
    await page.waitForURL('**/projects');
    
    // Select apisurf project
    await page.click('text=apisurf');
    await page.waitForURL('**/projects/**');
    
    // Click on Claude Code button
    await page.click('button:has-text("Claude Code")');
    
    // Wait for Claude Code page to load and SSE connection to establish
    await page.waitForURL('**/claude-code');
    await page.waitForTimeout(1000); // Wait for SSE setup
    
    // Wait for greeting message
    await page.waitForSelector('[data-message-role="assistant"]', { timeout: 30000 });
    
    // Type the test message
    const testMessage = 'Say "Hello **world**!" with the word world in bold markdown';
    await page.fill('textarea[placeholder*="Type a message"]', testMessage);
    
    // Send the message
    await page.press('textarea[placeholder*="Type a message"]', 'Enter');
    
    // Wait for the response to complete
    await page.waitForTimeout(2000); // Give time for message to start
    
    // Wait for a new assistant message that contains "Hello" and check for completion
    const responseSelector = '[data-message-role="assistant"]:last-child';
    
    // Wait for the message to appear and contain our expected text
    await page.waitForFunction(
      (selector) => {
        const element = document.querySelector(selector);
        if (!element) return false;
        const text = element.textContent || '';
        return text.includes('Hello') && (text.includes('world') || text.includes('**world**'));
      },
      responseSelector,
      { timeout: 30000 }
    );
    
    // Check if the response is properly rendered
    const responseElement = await page.locator(responseSelector);
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
      const worldIsStrong = await responseElement.locator('strong:has-text("world")').count() > 0;
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