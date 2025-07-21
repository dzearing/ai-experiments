import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// Helper to create a test project and navigate to Claude Code
async function setupClaudeCodeSession(page: any) {
  // Navigate to dashboard
  await page.goto('http://localhost:5173');

  // Create a new project
  await page.click('text=New Project');
  await page.fill('input[placeholder="Enter project name"]', 'Test Feedback Project');
  await page.fill(
    'textarea[placeholder="Enter project description"]',
    'Project for testing feedback feature'
  );
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

test.describe('Feedback Feature', () => {
  test('should show feedback link on chat messages', async ({ page }) => {
    await setupClaudeCodeSession(page);

    // Find the first complete message
    const message = await page.locator('[data-testid="message-complete"]').first();

    // Check for feedback link
    const feedbackLink = await message.locator('text=Leave feedback');
    await expect(feedbackLink).toBeVisible();
  });

  test('should open feedback dialog when clicking feedback link', async ({ page }) => {
    await setupClaudeCodeSession(page);

    // Click feedback link on first message
    await page.click('[data-testid="message-complete"] >> text=Leave feedback');

    // Check dialog appears
    await expect(page.locator('h2:has-text("Leave feedback")')).toBeVisible();
    await expect(page.locator('text=Describe your feedback')).toBeVisible();
    await expect(page.locator('text=A screenshot will be included automatically')).toBeVisible();
  });

  test('should validate required fields in feedback dialog', async ({ page }) => {
    await setupClaudeCodeSession(page);

    // Open feedback dialog
    await page.click('[data-testid="message-complete"] >> text=Leave feedback');

    // Try to submit without filling the textarea
    await page.click('button:has-text("Submit feedback")');

    // Should show validation error
    await expect(page.locator('text=Please provide your feedback')).toBeVisible();

    // Fill the textarea
    await page.fill('textarea', 'Test feedback content');

    // Should be able to submit now
    const submitButton = page.locator('button:has-text("Submit feedback")');
    await expect(submitButton).toBeEnabled();
  });

  test('should capture screenshot when feedback is initiated', async ({ page }) => {
    await setupClaudeCodeSession(page);

    // Intercept screenshot upload
    const screenshotPromise = page.waitForRequest(
      (req) => req.url().includes('/api/feedback/screenshot') && req.method() === 'POST'
    );

    // Open feedback dialog (triggers screenshot)
    await page.click('[data-testid="message-complete"] >> text=Leave feedback');

    // Wait for screenshot request
    const screenshotReq = await screenshotPromise;
    const postData = screenshotReq.postDataJSON();

    // Verify screenshot data
    expect(postData).toHaveProperty('imageData');
    expect(postData.imageData).toMatch(/^data:image\/png;base64,/);
    expect(postData).toHaveProperty('sessionId');
    expect(postData).toHaveProperty('repoName', 'hello-world-1');
  });

  test('should submit feedback with all required data', async ({ page }) => {
    await setupClaudeCodeSession(page);

    // Intercept feedback submission
    const feedbackPromise = page.waitForRequest(
      (req) => req.url().includes('/api/feedback/submit') && req.method() === 'POST'
    );

    // Open feedback dialog
    await page.click('[data-testid="message-complete"] >> text=Leave feedback');

    // Fill feedback form
    await page.fill(
      'textarea',
      'What happened: Claude gave an unrelated response\nWhat I expected: Claude should understand the context'
    );

    // Submit feedback
    await page.click('button:has-text("Submit feedback")');

    // Wait for submission
    const feedbackReq = await feedbackPromise;
    const feedbackData = feedbackReq.postDataJSON();

    // Verify feedback data structure - the component should parse the input
    expect(feedbackData).toHaveProperty('expectedBehavior');
    expect(feedbackData).toHaveProperty('actualBehavior');
    expect(feedbackData.expectedBehavior).toContain('Claude should understand the context');
    expect(feedbackData.actualBehavior).toContain('Claude gave an unrelated response');
    expect(feedbackData).toHaveProperty('sessionId');
    expect(feedbackData).toHaveProperty('repoName', 'hello-world-1');
    expect(feedbackData).toHaveProperty('projectId');
    expect(feedbackData).toHaveProperty('messageId');
    expect(feedbackData).toHaveProperty('messages');
    expect(feedbackData).toHaveProperty('mode');
    expect(feedbackData).toHaveProperty('isConnected');
    expect(feedbackData).toHaveProperty('screenshotPath');

    // Messages should include at least the greeting
    expect(feedbackData.messages).toBeInstanceOf(Array);
    expect(feedbackData.messages.length).toBeGreaterThan(0);
  });

  test('should show success dialog after feedback submission', async ({ page }) => {
    await setupClaudeCodeSession(page);

    // Mock successful API responses
    await page.route('**/api/feedback/screenshot', async (route) => {
      await route.fulfill({
        status: 200,
        json: { success: true, path: 'feedback/screenshots/test.png' },
      });
    });

    await page.route('**/api/feedback/submit', async (route) => {
      await route.fulfill({
        status: 200,
        json: { success: true, feedbackId: 'fb-2024-01-15-abc123' },
      });
    });

    // Submit feedback
    await page.click('[data-testid="message-complete"] >> text=Leave feedback');
    await page.fill('textarea', 'What happened: Test actual\nWhat I expected: Test expectation');
    await page.click('button:has-text("Submit feedback")');

    // Check success dialog
    await expect(page.locator('h2:has-text("Feedback Submitted")')).toBeVisible();
    await expect(page.locator('text=Thank you for your feedback!')).toBeVisible();
    await expect(page.locator('text=Feedback ID: fb-2024-01-15-abc123')).toBeVisible();
  });

  test('should handle session-level feedback', async ({ page }) => {
    await setupClaudeCodeSession(page);

    // Intercept feedback submission
    const feedbackPromise = page.waitForRequest(
      (req) => req.url().includes('/api/feedback/submit') && req.method() === 'POST'
    );

    // Click session feedback button
    await page.click('button:has-text("Leave feedback"):near(button:has-text("Close Session"))');

    // Fill feedback form
    await page.fill(
      'textarea',
      'What happened: Session had issues\nWhat I expected: Session should work properly'
    );

    // Submit feedback
    await page.click('button:has-text("Submit feedback")');

    // Wait for submission
    const feedbackReq = await feedbackPromise;
    const feedbackData = feedbackReq.postDataJSON();

    // Verify no specific messageId for session feedback
    expect(feedbackData).toHaveProperty('messageId', undefined);
    expect(feedbackData).toHaveProperty('sessionId');
    expect(feedbackData.messages).toBeInstanceOf(Array);
  });

  test('should show feedback link on tool executions', async ({ page }) => {
    await setupClaudeCodeSession(page);

    // Send a message to trigger tool execution
    await page.fill('[data-testid="claude-input"]', 'Please read the README file');
    await page.keyboard.press('Enter');

    // Wait for tool execution to appear
    await page.waitForSelector('[data-testid="tool-execution"]', { timeout: 30000 });
    await page.waitForSelector('[data-testid="tool-status"]:has-text("Complete")', {
      timeout: 30000,
    });

    // Check for feedback link on tool execution
    const toolExecution = await page.locator('[data-testid="tool-execution"]').first();
    const feedbackLink = await toolExecution.locator('text=Leave feedback');
    await expect(feedbackLink).toBeVisible();
  });

  test('should handle screenshot capture failure gracefully', async ({ page }) => {
    await setupClaudeCodeSession(page);

    // Mock screenshot failure
    await page.addInitScript(() => {
      // Override dom-to-image to fail
      (window as any).domtoimage = {
        toPng: () => Promise.reject(new Error('Screenshot capture failed')),
      };
    });

    // Mock successful submit (even without screenshot)
    await page.route('**/api/feedback/submit', async (route) => {
      await route.fulfill({
        status: 200,
        json: { success: true, feedbackId: 'fb-2024-01-15-no-screenshot' },
      });
    });

    // Submit feedback
    await page.click('[data-testid="message-complete"] >> text=Leave feedback');
    await page.fill(
      'textarea',
      'What happened: Screenshot failed but feedback works\nWhat I expected: Test without screenshot'
    );
    await page.click('button:has-text("Submit feedback")');

    // Should still succeed
    await expect(page.locator('h2:has-text("Feedback Submitted")')).toBeVisible();
  });

  test('should include correct message context in feedback', async ({ page }) => {
    await setupClaudeCodeSession(page);

    // Send a user message
    await page.fill('[data-testid="claude-input"]', 'Test message for feedback');
    await page.keyboard.press('Enter');

    // Wait for response
    await page.waitForSelector('[data-testid="message-complete"]:nth-of-type(3)', {
      timeout: 30000,
    });

    // Intercept feedback submission
    const feedbackPromise = page.waitForRequest(
      (req) => req.url().includes('/api/feedback/submit') && req.method() === 'POST'
    );

    // Click feedback on the user's message
    const userMessage = await page.locator('[data-testid="message-complete"]').nth(1);
    await userMessage.locator('text=Leave feedback').click();

    // Submit feedback
    await page.fill('textarea', 'Test feedback for message context');
    await page.click('button:has-text("Submit feedback")');

    // Check feedback data
    const feedbackReq = await feedbackPromise;
    const feedbackData = feedbackReq.postDataJSON();

    // Should have at least 3 messages (greeting, user message, response)
    expect(feedbackData.messages.length).toBeGreaterThanOrEqual(3);

    // Find the user message in the feedback
    const userMsgInFeedback = feedbackData.messages.find(
      (m: any) => m.content === 'Test message for feedback'
    );
    expect(userMsgInFeedback).toBeDefined();
    expect(feedbackData.messageId).toBe(userMsgInFeedback.id);
  });
});

test.describe('Feedback Server Storage', () => {
  test('should save screenshot to correct location', async ({ page, request }) => {
    // Submit screenshot directly to API
    const response = await request.post('http://localhost:3000/api/feedback/screenshot', {
      data: {
        imageData:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        sessionId: 'test-session-123',
        repoName: 'test-repo',
      },
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.path).toMatch(/^feedback\/screenshots\/test-repo-test-session-123-\d+\.png$/);

    // Verify file exists
    const screenshotPath = path.join(__dirname, '..', result.path);
    expect(fs.existsSync(screenshotPath)).toBe(true);
  });

  test('should save feedback report with server logs', async ({ page, request }) => {
    // Submit feedback directly to API
    const response = await request.post('http://localhost:3000/api/feedback/submit', {
      data: {
        expectedBehavior: 'Test expected',
        actualBehavior: 'Test actual',
        sessionId: 'test-session-456',
        repoName: 'test-repo',
        projectId: 'test-project',
        messageId: 'msg-123',
        timestamp: new Date().toISOString(),
        messages: [{ id: 'msg-123', role: 'user', content: 'Test message' }],
        mode: 'default',
        isConnected: true,
        screenshotPath: 'feedback/screenshots/test.png',
      },
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.feedbackId).toMatch(/^fb-\d{4}-\d{2}-\d{2}-[a-z0-9]{6}$/);

    // Verify feedback file exists
    const reportsDir = path.join(__dirname, '..', 'feedback', 'reports');
    const files = fs.readdirSync(reportsDir);
    const feedbackFile = files.find((f) => f.includes('test-session-456'));
    expect(feedbackFile).toBeDefined();

    // Read and verify content
    const content = JSON.parse(fs.readFileSync(path.join(reportsDir, feedbackFile!), 'utf8'));
    expect(content.feedbackId).toBe(result.feedbackId);
    expect(content.user.expectedBehavior).toBe('Test expected');
    expect(content.user.actualBehavior).toBe('Test actual');
    expect(content.serverLogs).toBeDefined();
  });
});
