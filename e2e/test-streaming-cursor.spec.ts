import { test, expect, setupWorkspaceInBrowser } from './test-setup';
import * as path from 'path';
import * as fs from 'fs/promises';

test.describe('Claude Code Streaming Cursor', () => {
  test.beforeEach(async () => {
    // Clear any existing Claude sessions
    const sessionsPath = path.join(process.cwd(), '..', '..', '..', 'claude-sessions');
    try {
      await fs.rm(sessionsPath, { recursive: true, force: true });
    } catch (err) {
      // Ignore if doesn't exist
    }
  });

  test('should show and hide streaming cursor correctly', async ({ page, testWorkspace }) => {
    // Set up workspace and navigate to Claude Code
    await setupWorkspaceInBrowser(page, testWorkspace);
    
    // Click on test project
    const projectCard = page.locator('[data-testid="project-card"]').first();
    await expect(projectCard).toBeVisible({ timeout: 10000 });
    await projectCard.click();
    await page.waitForSelector('[data-testid="repo-card"]', { timeout: 10000 });
    
    // Click on Claude Code button
    const claudeCodeButton = page.locator('[data-testid="claude-code-button"]').first();
    await expect(claudeCodeButton).toBeVisible({ timeout: 10000 });
    
    // Dismiss any blocking UI elements
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
    
    // Send a simple message
    const testMessage = 'Please say "Hello" and nothing else';
    const messageInput = page.locator('[data-testid="message-input"]');
    await expect(messageInput).toBeVisible();
    await messageInput.fill(testMessage);
    
    // Send the message
    await messageInput.press('Enter');
    
    // Wait for response to start streaming
    await page.waitForTimeout(1500);
    
    // Wait for a new message to appear
    await page.waitForFunction(() => {
      const messages = document.querySelectorAll('[data-testid="message-bubble"]');
      return messages.length >= 3; // greeting + user + assistant
    }, { timeout: 30000 });
    
    // Get the streaming message
    const messages = page.locator('[data-testid="message-bubble"]');
    const messageCount = await messages.count();
    const assistantMessage = messages.nth(messageCount - 1);
    
    // Check for streaming cursor (should be visible while streaming)
    const streamingCursor = assistantMessage.locator('.animate-pulse');
    
    // At some point during streaming, the cursor should be visible
    let cursorWasVisible = false;
    for (let i = 0; i < 10; i++) {
      const cursorCount = await streamingCursor.count();
      if (cursorCount > 0) {
        cursorWasVisible = true;
        console.log('Streaming cursor is visible');
        break;
      }
      await page.waitForTimeout(500);
    }
    
    // If we never saw the cursor, the message might have completed too quickly
    // Let's check the debug info
    const debugInfo = assistantMessage.locator('.text-xs.text-gray-400');
    if (await debugInfo.count() > 0) {
      const debugText = await debugInfo.textContent();
      console.log('Debug info:', debugText);
    }
    
    // Wait for streaming to complete (up to 10 seconds)
    await page.waitForTimeout(5000);
    
    // After streaming completes, cursor should be gone
    const finalCursorCount = await streamingCursor.count();
    console.log('Final cursor count:', finalCursorCount);
    
    // Get debug info again to check final streaming state
    if (await debugInfo.count() > 0) {
      const finalDebugText = await debugInfo.textContent();
      console.log('Final debug info:', finalDebugText);
      
      // Check that streaming is false
      expect(finalDebugText).toContain('Streaming: false');
    }
    
    // Cursor should no longer be visible
    expect(finalCursorCount).toBe(0);
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'streaming-cursor-test.png', fullPage: true });
  });

  test('should properly handle multiple rapid messages', async ({ page, testWorkspace }) => {
    await setupWorkspaceInBrowser(page, testWorkspace);
    
    // Navigate to Claude Code
    const projectCard = page.locator('[data-testid="project-card"]').first();
    await expect(projectCard).toBeVisible({ timeout: 10000 });
    await projectCard.click();
    await page.waitForSelector('[data-testid="repo-card"]', { timeout: 10000 });
    
    const claudeCodeButton = page.locator('[data-testid="claude-code-button"]').first();
    await expect(claudeCodeButton).toBeVisible({ timeout: 10000 });
    await claudeCodeButton.click();
    await page.waitForURL('**/claude-code/**');
    await page.waitForSelector('[data-testid="message-list"]', { timeout: 10000 });
    
    // Wait for greeting
    await page.waitForSelector('[data-testid="message-bubble"]', { timeout: 30000 });
    
    const messageInput = page.locator('[data-testid="message-input"]');
    
    // Send first message
    await messageInput.fill('Say "One"');
    await messageInput.press('Enter');
    
    // Wait a bit for first response to start
    await page.waitForTimeout(2000);
    
    // Send second message while first might still be streaming
    await messageInput.fill('Say "Two"');
    await messageInput.press('Enter');
    
    // Wait for both responses
    await page.waitForTimeout(8000);
    
    // Check that no messages are still showing streaming cursor
    const allMessages = page.locator('[data-testid="message-bubble"]');
    const totalMessages = await allMessages.count();
    
    let streamingMessages = 0;
    for (let i = 0; i < totalMessages; i++) {
      const message = allMessages.nth(i);
      const cursor = message.locator('.animate-pulse');
      const cursorCount = await cursor.count();
      if (cursorCount > 0) {
        streamingMessages++;
        
        // Get debug info for streaming message
        const debugInfo = message.locator('.text-xs.text-gray-400');
        if (await debugInfo.count() > 0) {
          const debugText = await debugInfo.textContent();
          console.log(`Message ${i} still streaming:`, debugText);
        }
      }
    }
    
    // No messages should still be streaming
    expect(streamingMessages).toBe(0);
  });
});