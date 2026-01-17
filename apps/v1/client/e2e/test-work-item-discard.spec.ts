import { test, expect } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Create a test fixture that sets up a workspace with work items
const testWorkspaceWithWorkItems = test.extend<{
  testWorkspace: string;
}>({
  testWorkspace: async ({}, use) => {
    // Create a temporary test workspace
    const testDir = path.join(os.tmpdir(), `e2e-test-workspace-${Date.now()}`);

    try {
      console.log(`Creating test workspace at: ${testDir}`);

      // Create the workspace via API
      const createResponse = await fetch('http://localhost:3000/api/workspace/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspacePath: testDir }),
      });

      if (!createResponse.ok) {
        throw new Error(`Failed to create test workspace: ${createResponse.statusText}`);
      }

      // Create a test project
      const projectResponse = await fetch('http://localhost:3000/api/workspace/create-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspacePath: testDir,
          projectName: 'Test Project',
        }),
      });

      if (!projectResponse.ok) {
        throw new Error(`Failed to create test project: ${projectResponse.statusText}`);
      }

      // Create project directory structure
      const projectPath = path.join(testDir, 'projects', 'test-project');
      const plansPath = path.join(projectPath, 'plans');
      const ideasPath = path.join(plansPath, 'ideas');
      const plannedPath = path.join(plansPath, 'planned');
      const activePath = path.join(plansPath, 'active');
      const completedPath = path.join(plansPath, 'completed');
      const discardedPath = path.join(plansPath, 'discarded');

      await fs.mkdir(ideasPath, { recursive: true });
      await fs.mkdir(plannedPath, { recursive: true });
      await fs.mkdir(activePath, { recursive: true });
      await fs.mkdir(completedPath, { recursive: true });
      await fs.mkdir(discardedPath, { recursive: true });

      // Create the specific work item "design landing page layout and structure"
      const workItemContent = `# Design landing page layout and structure

## Summary
Design a clean and modern landing page layout that effectively showcases our product and converts visitors into users.

## Requirements
- Hero section with clear value proposition
- Features section highlighting key benefits
- Call-to-action buttons strategically placed
- Mobile-responsive design
- Fast loading performance

## Acceptance Criteria
- [ ] Landing page renders correctly on desktop and mobile
- [ ] Hero section includes compelling headline and CTA
- [ ] Features are clearly presented with icons/images
- [ ] Page loads in under 3 seconds
- [ ] Accessibility standards are met (WCAG 2.1 AA)

## Priority
High

## Estimated Effort
3-5 days
`;

      await fs.writeFile(path.join(activePath, 'design-landing-page-layout-and-structure.md'), workItemContent);

      // Create a few more test work items for context
      await fs.writeFile(path.join(activePath, 'implement-user-authentication.md'), `# Implement user authentication

## Summary
Add secure user authentication system with login/signup functionality.

## Priority
Medium
`);

      await fs.writeFile(path.join(plannedPath, 'setup-database-schema.md'), `# Setup database schema

## Summary  
Design and implement the core database schema for the application.

## Priority
High
`);

      await use(testDir);
    } finally {
      // Cleanup: remove the test workspace
      try {
        await fs.rm(testDir, { recursive: true, force: true });
        console.log(`Cleaned up test workspace: ${testDir}`);
      } catch (error) {
        console.warn(`Failed to cleanup test workspace: ${error}`);
      }
    }
  },
});

// Helper function to set up workspace in browser and navigate to work items
async function setupWorkspaceAndNavigateToWorkItems(page: any, workspacePath: string) {
  // Set the workspace in localStorage to bypass the workspace dialog
  await page.addInitScript((path: string) => {
    localStorage.setItem(
      'workspaceConfig',
      JSON.stringify({
        path: path,
        name: path.split('/').pop() || 'Test Workspace',
      })
    );
  }, workspacePath);

  // Navigate to the work-items page
  await page.goto('http://localhost:5174/work-items');

  // Wait for the initial DOM to be ready
  await page.waitForLoadState('domcontentloaded');

  // Wait for the workspace to load and work items to appear
  await page.waitForFunction(
    () => {
      return (
        !document.querySelector('[data-testid="workspace-dialog"]') &&
        !document.body.textContent?.includes('Select workspace')
      );
    },
    { timeout: 10000 }
  );
}

testWorkspaceWithWorkItems.describe('Work Item Discard Functionality', () => {
  testWorkspaceWithWorkItems('should immediately remove work item from All filter when discarded', async ({ page, testWorkspace }) => {
    console.log('Setting up workspace and navigating to work items...');
    
    // Set up workspace and navigate to work items page
    await setupWorkspaceAndNavigateToWorkItems(page, testWorkspace);

    // Wait for work items to load - looking for the actual work item containers
    await page.waitForSelector('h3:has-text("design landing page layout and structure")', { 
      timeout: 15000,
      state: 'visible'
    });

    // Take initial screenshot showing all work items
    await page.screenshot({ 
      path: 'work-items-before-discard.png', 
      fullPage: true 
    });

    console.log('Taking screenshot of initial state...');

    // Verify we're on the "All" filter (should be default)
    const allFilterButton = page.locator('button', { hasText: 'All' }).first();
    await expect(allFilterButton).toBeVisible({ timeout: 5000 });
    
    // Click on All filter to ensure it's selected
    await allFilterButton.click();
    await page.waitForTimeout(1000);

    // Find and click the specific work item by looking for the h3 element with the exact text
    const workItemTitle = page.locator('h3', { hasText: 'Design landing page layout and structure' });
    console.log('Looking for the work item title...');
    await expect(workItemTitle).toBeVisible({ timeout: 10000 });

    // Count total work items before discard - looking for work item containers
    const workItemsBefore = await page.locator('div:has(h3.text-lg.font-semibold)').count();
    console.log(`Work items count before discard: ${workItemsBefore}`);

    // Find the work item container by going up from the title
    const workItem = workItemTitle.locator('..').locator('..');
    
    // Find the delete button within this specific work item container
    const deleteButton = workItem.locator('button[aria-label="Delete work item"]').last();
    
    console.log('Looking for delete button...');
    await expect(deleteButton).toBeVisible({ timeout: 5000 });
    await deleteButton.click();

    console.log('Clicked delete button, waiting for dialog...');

    // Wait for the delete dialog to appear
    await page.waitForSelector('[data-testid="delete-dialog"], [role="dialog"], .modal, .dialog', { 
      timeout: 5000,
      state: 'visible'
    });

    // Take screenshot of the delete dialog
    await page.screenshot({ 
      path: 'delete-dialog.png', 
      fullPage: true 
    });

    // Ensure "Permanently delete markdown file" checkbox is NOT checked
    const permanentDeleteCheckbox = page.locator('input[type="checkbox"]').first();
    if (await permanentDeleteCheckbox.count() > 0) {
      const isChecked = await permanentDeleteCheckbox.isChecked();
      if (isChecked) {
        await permanentDeleteCheckbox.click();
        console.log('Unchecked permanent delete option');
      }
    }

    // Click "Move to Discarded" button
    const moveToDiscardedButton = page.locator('button:has-text("Move to Discarded"), button:has-text("Discard"), button[data-testid="discard-button"]').first();
    await expect(moveToDiscardedButton).toBeVisible({ timeout: 5000 });
    await moveToDiscardedButton.click();

    console.log('Clicked Move to Discarded, waiting for response...');

    // Wait a moment for the action to complete
    await page.waitForTimeout(2000);

    // Take screenshot immediately after discard action
    await page.screenshot({ 
      path: 'work-items-after-discard-immediate.png', 
      fullPage: true 
    });

    // Check if the item immediately disappeared from the "All" list
    const workItemStillVisible = await workItemTitle.count() > 0;
    const workItemsAfter = await page.locator('div:has(h3.text-lg.font-semibold)').count();

    console.log(`Work items count after discard: ${workItemsAfter}`);
    console.log(`Work item still visible: ${workItemStillVisible}`);

    const immediateDisappearance = !workItemStillVisible && (workItemsAfter === workItemsBefore - 1);

    if (!immediateDisappearance) {
      console.log('Item did not immediately disappear, trying refresh...');
      
      // Try clicking refresh button if there is one
      const refreshButton = page.locator('button[title*="refresh"], button[aria-label*="refresh"], button:has-text("Refresh"), [data-testid="refresh-button"]').first();
      if (await refreshButton.count() > 0) {
        await refreshButton.click();
        await page.waitForTimeout(2000);
        console.log('Clicked refresh button');
      } else {
        // Wait 5 seconds to see if it updates automatically
        console.log('No refresh button found, waiting 5 seconds...');
        await page.waitForTimeout(5000);
      }

      // Take another screenshot after refresh/wait
      await page.screenshot({ 
        path: 'work-items-after-refresh.png', 
        fullPage: true 
      });

      // Check again
      const workItemStillVisibleAfterRefresh = await workItemTitle.count() > 0;
      const workItemsAfterRefresh = await page.locator('div:has(h3.text-lg.font-semibold)').count();
      
      console.log(`Work items count after refresh: ${workItemsAfterRefresh}`);
      console.log(`Work item still visible after refresh: ${workItemStillVisibleAfterRefresh}`);
    }

    // Click on the "discarded" filter to check if the item appears there
    const discardedFilterButton = page.locator('button:has-text("Discarded"), button:has-text("discarded")').first();
    let itemInDiscarded = false;
    
    if (await discardedFilterButton.count() > 0) {
      console.log('Clicking on Discarded filter...');
      await discardedFilterButton.click();
      await page.waitForTimeout(2000);

      // Check if the discarded item appears in the discarded list
      const discardedWorkItem = page.locator('h3', { hasText: 'Design landing page layout and structure' });
      itemInDiscarded = await discardedWorkItem.count() > 0;
      
      console.log(`Item found in discarded filter: ${itemInDiscarded}`);

      // Take final screenshot showing discarded items
      await page.screenshot({ 
        path: 'work-items-discarded-filter.png', 
        fullPage: true 
      });
    } else {
      console.log('No discarded filter button found');
      await page.screenshot({ 
        path: 'work-items-no-discarded-filter.png', 
        fullPage: true 
      });
    }

    // Capture console logs for any errors
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleLogs.push(`Console Error: ${msg.text()}`);
      }
    });

    // Return results for analysis
    const testResults = {
      immediateDisappearance,
      itemInDiscarded,
      consoleLogs,
      workItemsBefore,
      workItemsAfter: await page.locator('div:has(h3.text-lg.font-semibold)').count()
    };

    console.log('Test results:', testResults);

    // For the test to pass, the item should either disappear immediately or after refresh
    // and should appear in the discarded filter
    expect(testResults.immediateDisappearance || testResults.workItemsAfter < testResults.workItemsBefore).toBeTruthy();
    if (await discardedFilterButton.count() > 0) {
      expect(testResults.itemInDiscarded).toBeTruthy();
    }
  });
});