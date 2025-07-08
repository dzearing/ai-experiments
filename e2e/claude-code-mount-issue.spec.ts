import { test, expect } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

test.describe('Claude Code Mount/Unmount Issue', () => {
  test('should capture console logs when navigating to Claude Code', async ({ page }) => {
    // Clear any existing logs
    const logPath = path.join(process.cwd(), 'e2e-console-logs.txt');
    await fs.writeFile(logPath, '');
    
    // Array to capture console logs
    const consoleLogs: string[] = [];
    
    // Listen to console events
    page.on('console', (msg) => {
      const text = `[${msg.type()}] ${msg.text()}`;
      consoleLogs.push(text);
    });
    
    // Clear session folder (if it exists)
    const sessionPath = path.join(process.cwd(), 'server/sessions');
    try {
      await fs.rm(sessionPath, { recursive: true, force: true });
      await fs.mkdir(sessionPath, { recursive: true });
    } catch (error) {
      // Ignore if folder doesn't exist
    }
    
    console.log('Starting test: navigating to home page...');
    
    // Navigate to home URL
    await page.goto('http://localhost:5173');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    console.log('Home page loaded, looking for Projects link...');
    
    // Click on Projects
    await page.click('text=Projects');
    await page.waitForLoadState('networkidle');
    
    console.log('Projects page loaded, looking for apisurf project...');
    
    // Look for apisurf project
    const projectCard = page.locator('text=apisurf').first();
    await expect(projectCard).toBeVisible({ timeout: 10000 });
    
    // Click on the project
    await projectCard.click();
    await page.waitForLoadState('networkidle');
    
    console.log('Project detail page loaded, looking for Claude Code button...');
    
    // Look for Claude Code button and click it
    const claudeCodeButton = page.locator('button:has-text("Claude Code")').first();
    await expect(claudeCodeButton).toBeVisible({ timeout: 10000 });
    
    // Clear logs right before clicking to focus on the mount/unmount issue
    consoleLogs.length = 0;
    consoleLogs.push('=== CLAUDE CODE BUTTON CLICKED ===');
    
    await claudeCodeButton.click();
    
    console.log('Claude Code button clicked, waiting for UI...');
    
    // Wait for Claude Code UI to appear
    await expect(page.locator('text=Claude Code Session')).toBeVisible({ timeout: 30000 });
    
    console.log('Claude Code UI visible, waiting for greeting...');
    
    // Wait a bit more to capture all mount/unmount cycles and greeting
    await page.waitForTimeout(10000);
    
    // Check if chat bubble shows progress or message
    const chatContent = page.locator('.flex-1.overflow-auto');
    const hasContent = await chatContent.locator('div').count() > 0;
    
    console.log('Chat has content:', hasContent);
    
    // Write all console logs to file
    const logContent = consoleLogs.join('\n');
    await fs.writeFile(logPath, logContent);
    
    console.log(`Console logs written to: ${logPath}`);
    
    // Also capture server logs
    const serverLogsPath = path.join(process.cwd(), 'server/logs');
    const claudeLogPath = path.join(serverLogsPath, 'claude-messages.log');
    const eventsLogPath = path.join(serverLogsPath, 'events.log');
    
    try {
      const claudeLog = await fs.readFile(claudeLogPath, 'utf-8');
      const eventsLog = await fs.readFile(eventsLogPath, 'utf-8');
      
      // Get last 50 lines of each log
      const claudeLines = claudeLog.split('\n').slice(-50).join('\n');
      const eventsLines = eventsLog.split('\n').slice(-50).join('\n');
      
      await fs.writeFile(
        path.join(process.cwd(), 'e2e-server-logs.txt'),
        `=== CLAUDE MESSAGES LOG (last 50 lines) ===\n${claudeLines}\n\n=== EVENTS LOG (last 50 lines) ===\n${eventsLines}`
      );
      
      console.log('Server logs captured to: e2e-server-logs.txt');
    } catch (error) {
      console.error('Failed to capture server logs:', error);
    }
    
    // Analyze the logs for mount/unmount patterns
    const mountPatterns = consoleLogs.filter(log => 
      log.includes('[ClaudeCodeProvider] MOUNTED') || 
      log.includes('[ClaudeCodeProvider] UNMOUNTING') ||
      log.includes('[ClaudeCode] Component rendering') ||
      log.includes('SSE connection') ||
      log.includes('message-start event') ||
      log.includes('message-chunk event') ||
      log.includes('Message not found for chunk')
    );
    
    console.log('\n=== ANALYSIS ===');
    console.log('Mount/Unmount patterns found:');
    mountPatterns.forEach(log => console.log(log));
    
    // Check for the specific issue pattern
    const hasMultipleMounts = mountPatterns.filter(log => log.includes('MOUNTED')).length > 1;
    const hasMessageNotFound = consoleLogs.some(log => log.includes('Message not found for chunk'));
    
    if (hasMultipleMounts) {
      console.log('\n⚠️  ISSUE DETECTED: Multiple mount cycles detected!');
    }
    
    if (hasMessageNotFound) {
      console.log('\n⚠️  ISSUE DETECTED: Message not found for chunk error!');
    }
    
    // The test should complete even if issues are found
    // This allows us to analyze the logs
    expect(true).toBe(true);
  });
});