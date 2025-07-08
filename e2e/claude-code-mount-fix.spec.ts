import { test, expect } from '@playwright/test';

test.describe('Claude Code Mount Fix Validation', () => {
  test('should properly handle mount state when setting up SSE connection', async ({ page }) => {
    const consoleLogs: string[] = [];
    
    // Capture console logs
    page.on('console', (msg) => {
      consoleLogs.push(msg.text());
    });
    
    // Navigate to Claude Code
    await page.goto('http://localhost:5173');
    await page.click('text=Projects');
    await page.waitForLoadState('networkidle');
    
    const apISurfProject = page.locator('text=apisurf').first();
    await expect(apISurfProject).toBeVisible({ timeout: 10000 });
    await apISurfProject.click();
    await page.waitForLoadState('networkidle');
    
    const claudeCodeButton = page.locator('button:has-text("Claude Code")').first();
    await expect(claudeCodeButton).toBeVisible({ timeout: 10000 });
    
    // Clear logs before the critical action
    consoleLogs.length = 0;
    await claudeCodeButton.click();
    
    // Wait for component to initialize
    await expect(page.locator('text=Claude Code Session')).toBeVisible({ timeout: 30000 });
    
    // Wait a bit to collect all logs
    await page.waitForTimeout(2000);
    
    // Check for the specific error that was fixed
    const hasUnmountError = consoleLogs.some(log => 
      log.includes('Component unmounted, skipping SSE setup')
    );
    
    // Check for successful SSE setup
    const hasSuccessfulSetup = consoleLogs.some(log => 
      log.includes('Setting up delayed SSE connection')
    );
    
    // Check for mount/unmount sequence
    const mountLogs = consoleLogs.filter(log => 
      log.includes('MOUNTED') || log.includes('UNMOUNTING')
    );
    
    console.log('Mount/Unmount sequence:', mountLogs);
    
    // Assertions
    expect(hasUnmountError).toBe(false); // The bug should not occur
    expect(hasSuccessfulSetup).toBe(true); // SSE should be set up successfully
    
    // The component should not unmount within the 500ms delay
    const unmountDuringDelay = consoleLogs.some((log, index) => {
      if (log.includes('Scheduling SSE connection setup with delay')) {
        // Check if unmount happens within next few logs
        const nextLogs = consoleLogs.slice(index, index + 10);
        return nextLogs.some(l => l.includes('UNMOUNTING'));
      }
      return false;
    });
    
    expect(unmountDuringDelay).toBe(false); // Component should stay mounted during delay
    
    // Wait for greeting message to confirm full functionality
    let greetingFound = false;
    const maxWaitTime = 15000;
    const startTime = Date.now();
    
    while (!greetingFound && (Date.now() - startTime) < maxWaitTime) {
      const bodyText = await page.textContent('body');
      if (bodyText && (bodyText.includes('Hey dzearing') || bodyText.includes('Good afternoon'))) {
        greetingFound = true;
        break;
      }
      await page.waitForTimeout(500);
    }
    
    expect(greetingFound).toBe(true); // Greeting should appear
    
    console.log('✅ All assertions passed! The mount fix is working correctly.');
  });
});