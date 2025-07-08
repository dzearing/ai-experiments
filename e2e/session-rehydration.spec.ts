import { test, expect } from '@playwright/test';

test.describe('Session Rehydration', () => {
  test('should preserve chat messages when navigating away and back to a session', async ({ page }) => {
    // Navigate to the project detail page
    await page.goto('http://localhost:5173');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Find and click on the apisurf project
    const projectCard = page.locator('[data-testid="project-card"]').filter({ hasText: 'apisurf' });
    await expect(projectCard).toBeVisible();
    await projectCard.click();
    
    // Wait for project detail page to load
    await page.waitForLoadState('networkidle');
    
    // Click on apisurf-1 repo to start a Claude Code session
    const repoButton = page.locator('button').filter({ hasText: 'apisurf-1' });
    await expect(repoButton).toBeVisible();
    await repoButton.click();
    
    // Wait for Claude Code interface to load
    await page.waitForLoadState('networkidle');
    
    // Wait for the greeting message to appear and verify it has content
    const messageList = page.locator('[data-testid="message-list"]');
    await expect(messageList).toBeVisible();
    
    // Wait for greeting message to be received and displayed
    await page.waitForFunction(() => {
      const messages = document.querySelectorAll('[data-testid="message-bubble"]');
      return messages.length > 0 && messages[0].textContent && messages[0].textContent.trim().length > 0;
    }, { timeout: 10000 });
    
    // Get the greeting message content
    const firstMessage = page.locator('[data-testid="message-bubble"]').first();
    await expect(firstMessage).toBeVisible();
    const originalContent = await firstMessage.textContent();
    
    // Verify the greeting message has meaningful content (not just debug info)
    expect(originalContent).toContain('Hey dzearing');
    expect(originalContent).toContain('Good evening');
    expect(originalContent).not.toContain('Streaming: false'); // Ensure it's not showing debug info
    
    console.log('Original message content:', originalContent);
    
    // Send a test message to create more chat history
    const messageInput = page.locator('[data-testid="message-input"]');
    await expect(messageInput).toBeVisible();
    await messageInput.fill('Hello Claude!');
    await messageInput.press('Enter');
    
    // Wait for the response to the user message
    await page.waitForFunction(() => {
      const messages = document.querySelectorAll('[data-testid="message-bubble"]');
      return messages.length >= 3; // greeting + user message + response
    }, { timeout: 15000 });
    
    // Navigate away from the session (go back to project detail)
    await page.goBack();
    await page.waitForLoadState('networkidle');
    
    // Navigate back to the same session
    const repoButtonAgain = page.locator('button').filter({ hasText: 'apisurf-1' });
    await expect(repoButtonAgain).toBeVisible();
    await repoButtonAgain.click();
    
    // Wait for Claude Code interface to load again
    await page.waitForLoadState('networkidle');
    
    // Wait for messages to be restored
    await page.waitForFunction(() => {
      const messages = document.querySelectorAll('[data-testid="message-bubble"]');
      return messages.length >= 3; // Should have all previous messages
    }, { timeout: 10000 });
    
    // Verify that all messages are still present with correct content
    const messages = page.locator('[data-testid="message-bubble"]');
    const messageCount = await messages.count();
    expect(messageCount).toBeGreaterThanOrEqual(3);
    
    // Verify the greeting message content is preserved
    const restoredFirstMessage = messages.first();
    const restoredContent = await restoredFirstMessage.textContent();
    
    console.log('Restored message content:', restoredContent);
    
    // The restored content should match the original content
    expect(restoredContent).toContain('Hey dzearing');
    expect(restoredContent).toContain('Good evening');
    expect(restoredContent).not.toContain('Streaming: false'); // Should not show debug info
    expect(restoredContent).not.toBe(''); // Should not be empty
    
    // Verify user message is preserved
    const userMessage = messages.nth(1);
    const userContent = await userMessage.textContent();
    expect(userContent).toContain('Hello Claude!');
    
    // Verify assistant response is preserved
    const responseMessage = messages.nth(2);
    const responseContent = await responseMessage.textContent();
    expect(responseContent).not.toBe('');
    expect(responseContent).not.toContain('Streaming: false');
  });
  
  test('should handle multiple session switches correctly', async ({ page }) => {
    // Navigate to project detail
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    const projectCard = page.locator('[data-testid="project-card"]').filter({ hasText: 'apisurf' });
    await projectCard.click();
    await page.waitForLoadState('networkidle');
    
    // Start session with apisurf-1
    const repo1Button = page.locator('button').filter({ hasText: 'apisurf-1' });
    await repo1Button.click();
    await page.waitForLoadState('networkidle');
    
    // Wait for greeting and verify content
    await page.waitForFunction(() => {
      const messages = document.querySelectorAll('[data-testid="message-bubble"]');
      return messages.length > 0 && messages[0].textContent && messages[0].textContent.trim().length > 0;
    }, { timeout: 10000 });
    
    const session1Content = await page.locator('[data-testid="message-bubble"]').first().textContent();
    expect(session1Content).toContain('apisurf-1');
    
    // Go back and start session with apisurf-2
    await page.goBack();
    await page.waitForLoadState('networkidle');
    
    const repo2Button = page.locator('button').filter({ hasText: 'apisurf-2' });
    await repo2Button.click();
    await page.waitForLoadState('networkidle');
    
    // Wait for different greeting
    await page.waitForFunction(() => {
      const messages = document.querySelectorAll('[data-testid="message-bubble"]');
      return messages.length > 0 && messages[0].textContent && messages[0].textContent.includes('apisurf-2');
    }, { timeout: 10000 });
    
    const session2Content = await page.locator('[data-testid="message-bubble"]').first().textContent();
    expect(session2Content).toContain('apisurf-2');
    
    // Go back to apisurf-1 and verify original content is preserved
    await page.goBack();
    await page.waitForLoadState('networkidle');
    
    await repo1Button.click();
    await page.waitForLoadState('networkidle');
    
    await page.waitForFunction(() => {
      const messages = document.querySelectorAll('[data-testid="message-bubble"]');
      return messages.length > 0 && messages[0].textContent && messages[0].textContent.includes('apisurf-1');
    }, { timeout: 10000 });
    
    const restoredSession1Content = await page.locator('[data-testid="message-bubble"]').first().textContent();
    expect(restoredSession1Content).toContain('apisurf-1');
    expect(restoredSession1Content).toBe(session1Content); // Should be exactly the same
  });
});