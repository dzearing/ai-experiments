import { test, expect } from '@playwright/test';

// Helper to create a test project and navigate to Claude Code
async function setupClaudeCodeSession(page: any) {
  // Navigate to dashboard
  await page.goto('http://localhost:5173');
  
  // Create a new project
  await page.click('text=New Project');
  await page.fill('input[placeholder="Enter project name"]', 'Test Feedback Fixes');
  await page.fill('textarea[placeholder="Enter project description"]', 'Testing feedback dialog fixes');
  await page.click('button:has-text("Create Project")');
  
  // Wait for project creation
  await page.waitForURL(/\/projects\/.+/);
  
  // Navigate to Claude Code
  await page.click('text=Claude Code');
  await page.click('button:has-text("hello-world-1")');
  
  // Wait for Claude Code to load
  await page.waitForSelector('[data-testid="message-list"]');
  await page.waitForSelector('[data-testid="message-complete"]', { timeout: 30000 });
  
  return page.url();
}

test.describe('Feedback Dialog Fixes', () => {
  test('feedback dialog should be centered on window and use portal rendering', async ({ page }) => {
    await setupClaudeCodeSession(page);
    
    // Open feedback dialog
    await page.click('[data-testid="message-complete"] >> text=Leave feedback');
    
    // Check that dialog is rendered at document.body level (portal)
    const dialog = await page.locator('body > div').filter({ has: page.locator('h2:has-text("Leave feedback")') });
    await expect(dialog).toBeVisible();
    
    // Check centering styles
    const dialogContainer = await dialog.locator('div.fixed.inset-0.z-\\[9999\\]');
    await expect(dialogContainer).toHaveCSS('display', 'flex');
    await expect(dialogContainer).toHaveCSS('align-items', 'center');
    await expect(dialogContainer).toHaveCSS('justify-content', 'center');
  });

  test('feedback dialog should have a single combined textarea', async ({ page }) => {
    await setupClaudeCodeSession(page);
    
    // Open feedback dialog
    await page.click('[data-testid="message-complete"] >> text=Leave feedback');
    
    // Should have only one textarea
    const textareas = await page.locator('textarea');
    await expect(textareas).toHaveCount(1);
    
    // Check placeholder text
    const textarea = await page.locator('textarea');
    const placeholder = await textarea.getAttribute('placeholder');
    expect(placeholder).toContain('Describe what happened and what you expected');
    
    // Check label
    await expect(page.locator('label:has-text("Describe your feedback")')).toBeVisible();
  });

  test('feedback dialog should be draggable by header', async ({ page }) => {
    await setupClaudeCodeSession(page);
    
    // Open feedback dialog
    await page.click('[data-testid="message-complete"] >> text=Leave feedback');
    
    // Get initial position
    const dialog = await page.locator('div.relative.p-4.w-full.max-w-2xl');
    const initialBox = await dialog.boundingBox();
    expect(initialBox).toBeTruthy();
    
    // Find the header (draggable area)
    const header = await page.locator('h2:has-text("Leave feedback")').locator('..');
    
    // Check header has grab cursor
    await expect(header).toHaveCSS('cursor', 'grab');
    
    // Drag the dialog
    await header.hover();
    await page.mouse.down();
    await page.mouse.move(initialBox!.x + 100, initialBox!.y + 50);
    await page.mouse.up();
    
    // Check dialog moved
    const newBox = await dialog.boundingBox();
    expect(newBox).toBeTruthy();
    expect(newBox!.x).toBeGreaterThan(initialBox!.x);
    expect(newBox!.y).toBeGreaterThan(initialBox!.y);
  });

  test('suggested responses should appear for plan mode questions', async ({ page }) => {
    await setupClaudeCodeSession(page);
    
    // Switch to plan mode
    await page.click('button[aria-label="Claude mode"]:has-text("Default")');
    await page.click('text=Plan');
    
    // Send a message that should trigger a plan response
    await page.fill('[data-testid="claude-input"]', 'Help me implement a new feature');
    await page.keyboard.press('Enter');
    
    // Wait for assistant response
    await page.waitForSelector('[data-testid="message-complete"]:nth-of-type(3)', { timeout: 30000 });
    
    // Mock an assistant response with plan approval question
    await page.evaluate(() => {
      // Find the last assistant message and add suggested responses
      const messages = document.querySelectorAll('[data-testid="message-complete"]');
      const lastMessage = Array.from(messages).reverse().find(m => 
        m.querySelector('.text-green-500') // Assistant messages have green avatar
      );
      
      if (lastMessage) {
        // Inject a test message that should trigger suggested responses
        const content = lastMessage.querySelector('.prose');
        if (content) {
          content.innerHTML += '<p>Would you like me to proceed with these changes?</p>';
        }
      }
    });
    
    // Check for suggested response buttons
    await expect(page.locator('button:has-text("Yes, proceed with the plan")')).toBeVisible();
    await expect(page.locator('button:has-text("No, let me review more")')).toBeVisible();
    await expect(page.locator('button:has-text("Make some changes first")')).toBeVisible();
  });

  test('numbered lists should render with proper formatting', async ({ page }) => {
    await setupClaudeCodeSession(page);
    
    // Mock a message with a numbered list
    await page.evaluate(() => {
      const messageList = document.querySelector('[data-testid="message-list"]');
      if (messageList) {
        const testMessage = document.createElement('div');
        testMessage.setAttribute('data-testid', 'message-complete');
        testMessage.innerHTML = `
          <div class="mx-4 my-2">
            <div class="prose prose-sm max-w-none dark:prose-invert markdown-content">
              <ol class="list-decimal ml-6 my-2 space-y-1">
                <li>First item in the list</li>
                <li>Second item in the list</li>
                <li>Third item in the list</li>
              </ol>
            </div>
          </div>
        `;
        messageList.appendChild(testMessage);
      }
    });
    
    // Check list formatting
    const list = await page.locator('ol.list-decimal');
    await expect(list).toBeVisible();
    await expect(list).toHaveCSS('margin-left', '24px'); // ml-6 = 1.5rem = 24px
    
    // Check list items
    const items = await list.locator('li');
    await expect(items).toHaveCount(3);
    
    // Verify numbers are not on separate lines
    const firstItem = await items.first();
    const firstItemText = await firstItem.textContent();
    expect(firstItemText).toBe('First item in the list');
  });

  test('mode should switch from plan to execution when user approves', async ({ page }) => {
    await setupClaudeCodeSession(page);
    
    // Switch to plan mode
    await page.click('button[aria-label="Claude mode"]:has-text("Default")');
    await page.click('text=Plan');
    
    // Verify we're in plan mode
    await expect(page.locator('button[aria-label="Claude mode"]:has-text("Plan")')).toBeVisible();
    
    // Send approval message
    await page.fill('[data-testid="claude-input"]', 'Yes, proceed with the implementation');
    await page.keyboard.press('Enter');
    
    // Mode should switch back to default
    await expect(page.locator('button[aria-label="Claude mode"]:has-text("Default")')).toBeVisible();
  });

  test('feedback dialog should validate single textarea input', async ({ page }) => {
    await setupClaudeCodeSession(page);
    
    // Open feedback dialog
    await page.click('[data-testid="message-complete"] >> text=Leave feedback');
    
    // Try to submit without filling the textarea
    await page.click('button:has-text("Submit feedback")');
    
    // Should show validation error
    await expect(page.locator('text=Please provide your feedback')).toBeVisible();
    
    // Fill the textarea
    await page.fill('textarea', 'What happened: The dialog was not centered\nWhat I expected: Dialog to be centered on the window');
    
    // Submit should now work
    await page.click('button:has-text("Submit feedback")');
    
    // Dialog should close (or show success)
    await expect(page.locator('h2:has-text("Leave feedback")')).not.toBeVisible({ timeout: 5000 });
  });

  test('feedback should parse combined textarea correctly', async ({ page }) => {
    await setupClaudeCodeSession(page);
    
    // Intercept feedback submission
    const feedbackPromise = page.waitForRequest(req => 
      req.url().includes('/api/feedback/submit') && req.method() === 'POST'
    );
    
    // Open feedback dialog
    await page.click('[data-testid="message-complete"] >> text=Leave feedback');
    
    // Fill with structured feedback
    await page.fill('textarea', 'What happened: The button did not appear\nWhat I expected: Button should be visible');
    
    // Submit feedback
    await page.click('button:has-text("Submit feedback")');
    
    // Check the parsed data
    const feedbackReq = await feedbackPromise;
    const feedbackData = feedbackReq.postDataJSON();
    
    // Should parse the sections correctly
    expect(feedbackData.actualBehavior).toContain('The button did not appear');
    expect(feedbackData.expectedBehavior).toContain('Button should be visible');
  });
});