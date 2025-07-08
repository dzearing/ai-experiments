import { test, expect } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';

test.describe('Claude Code Chat Validation', () => {
  test('should successfully navigate to Claude Code and display greeting message', async ({ page }) => {
    const testStartTime = Date.now();
    const consoleLogs: string[] = [];
    const networkRequests: string[] = [];
    
    // Capture console logs
    page.on('console', (msg) => {
      const timestamp = Date.now() - testStartTime;
      consoleLogs.push(`[${timestamp}ms] [${msg.type()}] ${msg.text()}`);
    });
    
    // Capture network requests
    page.on('request', (request) => {
      const timestamp = Date.now() - testStartTime;
      if (request.url().includes('claude')) {
        networkRequests.push(`[${timestamp}ms] ${request.method()} ${request.url()}`);
      }
    });
    
    // Capture network responses
    page.on('response', (response) => {
      const timestamp = Date.now() - testStartTime;
      if (response.url().includes('claude')) {
        networkRequests.push(`[${timestamp}ms] RESPONSE ${response.status()} ${response.url()}`);
      }
    });
    
    console.log('🚀 Starting Claude Code validation test...');
    
    // Step 1: Navigate to home page
    console.log('📍 Step 1: Navigating to home page');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    
    // Step 2: Navigate to Projects
    console.log('📍 Step 2: Clicking Projects link');
    await page.click('text=Projects');
    await page.waitForLoadState('networkidle');
    
    // Step 3: Find and click apisurf project
    console.log('📍 Step 3: Looking for apisurf project');
    const apISurfProject = page.locator('text=apisurf').first();
    await expect(apISurfProject).toBeVisible({ timeout: 10000 });
    await apISurfProject.click();
    await page.waitForLoadState('networkidle');
    
    // Step 4: Click Claude Code button
    console.log('📍 Step 4: Clicking Claude Code button');
    const claudeCodeButton = page.locator('button:has-text("Claude Code")').first();
    await expect(claudeCodeButton).toBeVisible({ timeout: 10000 });
    
    // Clear logs to focus on the critical part
    consoleLogs.length = 0;
    networkRequests.length = 0;
    consoleLogs.push(`[0ms] === CLAUDE CODE BUTTON CLICKED ===`);
    
    await claudeCodeButton.click();
    
    // Step 5: Wait for Claude Code UI to appear
    console.log('📍 Step 5: Waiting for Claude Code UI');
    await expect(page.locator('text=Claude Code Session')).toBeVisible({ timeout: 30000 });
    
    // Step 6: Wait for greeting message or timeout
    console.log('📍 Step 6: Waiting for greeting message');
    let greetingFound = false;
    let timeoutReached = false;
    
    // Wait up to 15 seconds for greeting message
    const greetingWaitStart = Date.now();
    while (!greetingFound && !timeoutReached) {
      try {
        // Look for greeting message content
        const messageElements = await page.locator('.claude-message, [role="message"], .message-content, .chat-message').all();
        
        for (const element of messageElements) {
          const text = await element.textContent();
          if (text && (text.includes('Hey dzearing') || text.includes('Good afternoon') || text.includes('ready to'))) {
            greetingFound = true;
            console.log('✅ Greeting message found:', text.substring(0, 100));
            break;
          }
        }
        
        // Also check for any text content that looks like a greeting
        const bodyText = await page.textContent('body');
        if (bodyText && (bodyText.includes('Hey dzearing') || bodyText.includes('Good afternoon'))) {
          greetingFound = true;
          console.log('✅ Greeting text found in page body');
        }
        
        if (Date.now() - greetingWaitStart > 15000) {
          timeoutReached = true;
        }
        
        if (!greetingFound && !timeoutReached) {
          await page.waitForTimeout(500);
        }
      } catch (error) {
        console.log('⚠️ Error checking for greeting:', error);
        break;
      }
    }
    
    // Step 7: Analyze the results
    console.log('📍 Step 7: Analyzing results');
    
    // Save console logs
    const logContent = consoleLogs.join('\n');
    const networkContent = networkRequests.join('\n');
    const combinedLogs = `=== CONSOLE LOGS ===\n${logContent}\n\n=== NETWORK REQUESTS ===\n${networkContent}`;
    
    await fs.writeFile('e2e-test-logs.txt', combinedLogs);
    console.log('📄 Logs saved to e2e-test-logs.txt');
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'claude-code-state.png', fullPage: true });
    console.log('📸 Screenshot saved to claude-code-state.png');
    
    // Analyze console logs for mount/unmount patterns
    const mountLogs = consoleLogs.filter(log => 
      log.includes('ClaudeCodeProvider') || 
      log.includes('SSE connection') ||
      log.includes('message-start') ||
      log.includes('message-chunk')
    );
    
    console.log('\n🔍 Mount/Unmount Analysis:');
    mountLogs.forEach(log => console.log(log));
    
    // Check for the specific bug we fixed
    const hasUnmountError = consoleLogs.some(log => 
      log.includes('Component unmounted, skipping SSE setup')
    );
    
    if (hasUnmountError) {
      console.log('\n❌ BUG DETECTED: Component unmounted before SSE setup!');
      console.log('This is the exact issue that was causing chat messages not to appear.');
    }
    
    // Check server logs
    try {
      const serverLogsPath = path.join(__dirname, '..', 'server', 'logs');
      const claudeLog = await fs.readFile(path.join(serverLogsPath, 'claude-messages.log'), 'utf-8');
      const eventsLog = await fs.readFile(path.join(serverLogsPath, 'events.log'), 'utf-8');
      
      const recentClaudeLines = claudeLog.split('\n').slice(-30);
      const recentEventLines = eventsLog.split('\n').slice(-30);
      
      await fs.writeFile('server-logs-analysis.txt', 
        `=== RECENT CLAUDE MESSAGES ===\n${recentClaudeLines.join('\n')}\n\n=== RECENT EVENTS ===\n${recentEventLines.join('\n')}`
      );
      
      console.log('📄 Server logs saved to server-logs-analysis.txt');
      
      // Look for the problematic pattern
      const hasNoActiveConnections = recentClaudeLines.some(line => line.includes('No active connections to send greeting to'));
      const hasDisconnects = recentEventLines.some(line => line.includes('CLAUDE_SSE_DISCONNECTED'));
      
      if (hasNoActiveConnections && hasDisconnects) {
        console.log('\n❌ ISSUE CONFIRMED: Server logs show SSE disconnections and no active connections!');
      }
      
    } catch (error) {
      console.log('⚠️ Could not read server logs:', error);
    }
    
    // Report results
    if (greetingFound) {
      console.log('\n🎉 SUCCESS: Greeting message was displayed!');
      console.log('✅ Test PASSED: Chat is working correctly');
    } else {
      console.log('\n❌ FAILURE: Greeting message was NOT displayed');
      console.log('💡 Check the logs for debugging information');
      
      // Additional debugging
      const pageContent = await page.content();
      await fs.writeFile('page-content-debug.html', pageContent);
      console.log('🔍 Full page content saved to page-content-debug.html');
    }
    
    // The test assertions
    expect(hasUnmountError).toBe(false); // Should not have unmount error
    expect(greetingFound).toBe(true);    // Should have greeting message
  });
});