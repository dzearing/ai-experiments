import { test, expect, type Page } from '@playwright/test';

// Test users for the share flow
const OWNER_USER = {
  id: 'share-owner-test',
  name: 'Share Owner',
  nickname: 'ShareOwner',
  color: '#4285f4',
};

const JOINER_USER = {
  id: 'share-joiner-test',
  name: 'Share Joiner',
  nickname: 'ShareJoiner',
  color: '#34a853',
};

test.describe('Workspace Share Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear IndexedDB and localStorage before each test
    await page.addInitScript(() => {
      indexedDB.databases().then((databases) => {
        databases.forEach((db) => {
          if (db.name) indexedDB.deleteDatabase(db.name);
        });
      });
      localStorage.clear();
    });
  });

  test('owner can see share button in workspace', async ({ page }) => {
    // Login as owner
    await page.addInitScript((user) => {
      localStorage.setItem('ideate-user', JSON.stringify(user));
    }, OWNER_USER);

    await page.goto('/workspaces');
    await page.waitForTimeout(1000);

    // Create or use existing workspace
    const workspaceCards = page.locator('[class*="workspaceCard"], [class*="resourceCard"]');
    const count = await workspaceCards.count();

    if (count === 0) {
      // Create a workspace
      const newWorkspaceBtn = page.locator('button:has-text("New Workspace")').first();
      if (await newWorkspaceBtn.isVisible()) {
        await newWorkspaceBtn.click();
        await page.waitForTimeout(500);
        await page.fill(
          'input[placeholder*="workspace" i], input[placeholder*="name" i]',
          `Share Test ${Date.now()}`
        );
        await page.locator('button:has-text("Create")').last().click();
        // Wait for modal to close and navigation
        await page.waitForTimeout(1000);
        // Check if we need to click through to workspace
        const wsCards = page.locator('[class*="workspaceCard"], [class*="resourceCard"]');
        if (await wsCards.count() > 0) {
          await wsCards.first().click();
        }
        await page.waitForURL(/\/workspace\/.+/, { timeout: 10000 });
      }
    } else {
      await workspaceCards.first().click();
      await page.waitForURL(/\/workspace\/.+/, { timeout: 10000 });
    }

    // Owner should see the Share button
    const shareButton = page.locator('button:has-text("Share")').first();
    await expect(shareButton).toBeVisible({ timeout: 5000 });

    console.log('Share button visible for owner');
  });

  test('share modal shows link when opened', async ({ page }) => {
    // Login as owner
    await page.addInitScript((user) => {
      localStorage.setItem('ideate-user', JSON.stringify(user));
    }, OWNER_USER);

    await page.goto('/workspaces');
    await page.waitForTimeout(1000);

    // Navigate to workspace
    const workspaceCards = page.locator('[class*="workspaceCard"], [class*="resourceCard"]');
    const count = await workspaceCards.count();

    if (count === 0) {
      // Create a workspace
      const newWorkspaceBtn = page.locator('button:has-text("New Workspace")').first();
      await newWorkspaceBtn.click();
      await page.waitForTimeout(500);
      await page.fill(
        'input[placeholder*="workspace" i], input[placeholder*="name" i]',
        `Share Link Test ${Date.now()}`
      );
      await page.locator('button:has-text("Create")').last().click();
      await page.waitForTimeout(1000);
      const wsCards = page.locator('[class*="workspaceCard"], [class*="resourceCard"]');
      if (await wsCards.count() > 0) {
        await wsCards.first().click();
      }
      await page.waitForURL(/\/workspace\/.+/, { timeout: 10000 });
    } else {
      await workspaceCards.first().click();
      await page.waitForURL(/\/workspace\/.+/, { timeout: 10000 });
    }

    // Click share button
    const shareButton = page.locator('button:has-text("Share")').first();
    await shareButton.click();

    // Wait for share modal
    await expect(page.locator('h2:has-text("Share Workspace")')).toBeVisible({ timeout: 5000 });

    // Wait for link to be generated
    await expect(page.locator('input[readonly]')).toBeVisible({ timeout: 5000 });

    // Verify the link contains /join/
    const linkInput = page.locator('input[readonly]');
    const linkValue = await linkInput.inputValue();
    expect(linkValue).toContain('/join/');

    console.log('Share link generated:', linkValue);
  });

  test('copy button works', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Login as owner
    await page.addInitScript((user) => {
      localStorage.setItem('ideate-user', JSON.stringify(user));
    }, OWNER_USER);

    await page.goto('/workspaces');
    await page.waitForTimeout(1000);

    // Navigate to workspace
    const workspaceCards = page.locator('[class*="workspaceCard"], [class*="resourceCard"]');
    if (await workspaceCards.count() > 0) {
      await workspaceCards.first().click();
      await page.waitForURL(/\/workspace\/.+/, { timeout: 10000 });
    } else {
      // Create a workspace
      const newWorkspaceBtn = page.locator('button:has-text("New Workspace")').first();
      await newWorkspaceBtn.click();
      await page.waitForTimeout(500);
      await page.fill(
        'input[placeholder*="workspace" i], input[placeholder*="name" i]',
        `Copy Test ${Date.now()}`
      );
      await page.locator('button:has-text("Create")').last().click();
      await page.waitForTimeout(1000);
      const wsCards = page.locator('[class*="workspaceCard"], [class*="resourceCard"]');
      if (await wsCards.count() > 0) {
        await wsCards.first().click();
      }
      await page.waitForURL(/\/workspace\/.+/, { timeout: 10000 });
    }

    // Open share modal
    const shareButton = page.locator('button:has-text("Share")').first();
    await shareButton.click();

    // Wait for link
    await expect(page.locator('input[readonly]')).toBeVisible({ timeout: 5000 });

    // Click copy button
    const copyButton = page.locator('button:has-text("Copy Link")');
    await copyButton.click();

    // Button should show "Copied!"
    await expect(page.locator('button:has-text("Copied!")')).toBeVisible();

    console.log('Copy button works');
  });

  test('join link redirects unauthenticated user to auth page', async ({ page }) => {
    // Don't set any auth - simulate unauthenticated user
    // Use a fake token (won't work but will test redirect)
    await page.goto('/join/fake-token-12345');

    // Should redirect to auth with returnTo
    await expect(page).toHaveURL(/\/auth\?returnTo=/);

    console.log('Unauthenticated user redirected to auth');
  });

  test('full share and join flow', async ({ browser }) => {
    // Create two browser contexts
    const ownerContext = await browser.newContext();
    const joinerContext = await browser.newContext();

    const ownerPage = await ownerContext.newPage();
    const joinerPage = await joinerContext.newPage();

    // Setup owner
    await ownerContext.addInitScript((user) => {
      localStorage.setItem('ideate-user', JSON.stringify(user));
    }, OWNER_USER);

    // Clear IndexedDB for owner
    await ownerContext.addInitScript(() => {
      indexedDB.databases().then((databases) => {
        databases.forEach((db) => {
          if (db.name) indexedDB.deleteDatabase(db.name);
        });
      });
    });

    // Clear IndexedDB for joiner
    await joinerContext.addInitScript(() => {
      indexedDB.databases().then((databases) => {
        databases.forEach((db) => {
          if (db.name) indexedDB.deleteDatabase(db.name);
        });
      });
    });

    try {
      // Step 1: Owner creates workspace and gets share link
      await ownerPage.goto('/workspaces');
      await ownerPage.waitForTimeout(1000);

      // Create a new workspace for this test
      const workspaceName = `Full Share Test ${Date.now()}`;
      const newWorkspaceBtn = ownerPage.locator('button:has-text("New Workspace")').first();
      if (await newWorkspaceBtn.isVisible()) {
        await newWorkspaceBtn.click();
        await ownerPage.waitForTimeout(500);
        await ownerPage.fill(
          'input[placeholder*="workspace" i], input[placeholder*="name" i]',
          workspaceName
        );
        await ownerPage.locator('button:has-text("Create")').last().click();
        await ownerPage.waitForTimeout(1000);
        // Click on the workspace card to navigate
        const wsCard = ownerPage.locator(`text="${workspaceName}"`).first();
        if (await wsCard.isVisible()) {
          await wsCard.click();
        }
        await ownerPage.waitForURL(/\/workspace\/.+/, { timeout: 10000 });
      }

      // Get share link
      const shareButton = ownerPage.locator('button:has-text("Share")').first();
      await expect(shareButton).toBeVisible({ timeout: 5000 });
      await shareButton.click();

      // Wait for link
      await expect(ownerPage.locator('input[readonly]')).toBeVisible({ timeout: 10000 });
      const shareLink = await ownerPage.locator('input[readonly]').inputValue();
      console.log('Share link:', shareLink);

      // Extract token from share link
      const token = shareLink.split('/join/')[1];
      expect(token).toBeTruthy();

      // Step 2: Joiner visits the join link without being logged in
      await joinerPage.goto(`/join/${token}`);

      // Should redirect to auth with returnTo
      await expect(joinerPage).toHaveURL(/\/auth\?returnTo=/, { timeout: 5000 });
      console.log('Joiner redirected to auth');

      // Step 3: Joiner logs in
      await joinerPage.fill('input[placeholder*="nickname" i]', JOINER_USER.nickname);
      await joinerPage.locator('button:has-text("Join Ideate")').click();

      // Should redirect back to join page
      await expect(joinerPage).toHaveURL(/\/join\//, { timeout: 10000 });
      console.log('Joiner redirected back to join page');

      // Step 4: Joiner sees the join preview and clicks join
      await expect(joinerPage.locator('h1:has-text("Join Workspace")')).toBeVisible({
        timeout: 10000,
      });
      await expect(joinerPage.locator(`text="${workspaceName}"`).first()).toBeVisible({
        timeout: 5000,
      });

      // Click join button
      const joinButton = joinerPage.locator('button:has-text("Join Workspace")');
      await expect(joinButton).toBeVisible({ timeout: 5000 });
      await joinButton.click();

      // Should redirect to workspace
      await expect(joinerPage).toHaveURL(/\/workspace\//, { timeout: 10000 });
      console.log('Joiner successfully joined workspace');

      // Verify workspace name is visible
      await expect(joinerPage.locator(`text="${workspaceName}"`).first()).toBeVisible({
        timeout: 5000,
      });

      console.log('Full share and join flow completed successfully');
    } finally {
      await ownerContext.close();
      await joinerContext.close();
    }
  });

  test('member does not see share button', async ({ browser }) => {
    // Create two browser contexts
    const ownerContext = await browser.newContext();
    const memberContext = await browser.newContext();

    const ownerPage = await ownerContext.newPage();
    const memberPage = await memberContext.newPage();

    // Setup both users
    await ownerContext.addInitScript((user) => {
      localStorage.setItem('ideate-user', JSON.stringify(user));
    }, OWNER_USER);

    await memberContext.addInitScript((user) => {
      localStorage.setItem('ideate-user', JSON.stringify(user));
    }, JOINER_USER);

    try {
      // Owner creates workspace and gets share link
      await ownerPage.goto('/workspaces');
      await ownerPage.waitForTimeout(1000);

      const workspaceName = `Member No Share Test ${Date.now()}`;
      const newWorkspaceBtn = ownerPage.locator('button:has-text("New Workspace")').first();
      if (await newWorkspaceBtn.isVisible()) {
        await newWorkspaceBtn.click();
        await ownerPage.waitForTimeout(500);
        await ownerPage.fill(
          'input[placeholder*="workspace" i], input[placeholder*="name" i]',
          workspaceName
        );
        await ownerPage.locator('button:has-text("Create")').last().click();
        await ownerPage.waitForTimeout(1000);
        // Click on the workspace card to navigate
        const wsCard = ownerPage.locator(`text="${workspaceName}"`).first();
        if (await wsCard.isVisible()) {
          await wsCard.click();
        }
        await ownerPage.waitForURL(/\/workspace\/.+/, { timeout: 10000 });
      }

      // Get share link
      await ownerPage.locator('button:has-text("Share")').first().click();
      await expect(ownerPage.locator('input[readonly]')).toBeVisible({ timeout: 10000 });
      const shareLink = await ownerPage.locator('input[readonly]').inputValue();
      const token = shareLink.split('/join/')[1];

      // Member joins via share link
      await memberPage.goto(`/join/${token}`);

      // Member clicks join
      await expect(memberPage.locator('button:has-text("Join Workspace")')).toBeVisible({
        timeout: 10000,
      });
      await memberPage.locator('button:has-text("Join Workspace")').click();
      await expect(memberPage).toHaveURL(/\/workspace\//, { timeout: 10000 });

      // Member should NOT see Share button (only owner can share)
      // Allow time for page to render
      await memberPage.waitForTimeout(1000);
      const shareButton = memberPage.locator('button:has-text("Share")').first();
      await expect(shareButton).not.toBeVisible({ timeout: 3000 });

      console.log('Member correctly does not see Share button');
    } finally {
      await ownerContext.close();
      await memberContext.close();
    }
  });

  test('shared visitor can open and use chat room created by owner', async ({ browser }) => {
    const ownerContext = await browser.newContext();
    const visitorContext = await browser.newContext();

    const ownerPage = await ownerContext.newPage();
    const visitorPage = await visitorContext.newPage();

    // Setup owner
    await ownerContext.addInitScript((user) => {
      localStorage.setItem('ideate-user', JSON.stringify(user));
    }, OWNER_USER);

    // Setup visitor
    await visitorContext.addInitScript((user) => {
      localStorage.setItem('ideate-user', JSON.stringify(user));
    }, JOINER_USER);

    try {
      // Step 1: Owner creates workspace
      await ownerPage.goto('/workspaces');
      await ownerPage.waitForTimeout(1000);

      const workspaceName = `Chat Access Test ${Date.now()}`;
      const newWorkspaceBtn = ownerPage.locator('button:has-text("New Workspace")').first();
      await newWorkspaceBtn.click();
      await ownerPage.waitForTimeout(500);
      await ownerPage.fill(
        'input[placeholder*="workspace" i], input[placeholder*="name" i]',
        workspaceName
      );
      await ownerPage.locator('button:has-text("Create")').last().click();
      await ownerPage.waitForTimeout(1000);

      // Navigate to workspace
      const wsCard = ownerPage.locator(`text="${workspaceName}"`).first();
      if (await wsCard.isVisible()) {
        await wsCard.click();
      }
      await ownerPage.waitForURL(/\/workspace\/.+/, { timeout: 10000 });

      // Step 2: Owner creates a chat room
      const chatRoomName = `Test Chat ${Date.now()}`;
      await ownerPage.locator('button:has-text("New Chat Room")').first().click();
      await ownerPage.waitForTimeout(500);
      await ownerPage.fill('input[placeholder*="chat" i]', chatRoomName);
      await ownerPage.locator('button:has-text("Create")').last().click();
      await ownerPage.waitForURL(/\/chat\/.+/, { timeout: 10000 });

      // Wait for connection
      await expect(ownerPage.locator('[data-status="connected"]').first()).toBeVisible({ timeout: 10000 });
      console.log('Owner created chat room and connected');

      // Step 3: Owner gets share link
      await ownerPage.goto('/workspaces');
      await ownerPage.waitForTimeout(500);
      await ownerPage.locator(`text="${workspaceName}"`).first().click();
      await ownerPage.waitForURL(/\/workspace\/.+/, { timeout: 10000 });

      await ownerPage.locator('button:has-text("Share")').first().click();
      await expect(ownerPage.locator('input[readonly]')).toBeVisible({ timeout: 10000 });
      const shareLink = await ownerPage.locator('input[readonly]').inputValue();
      const token = shareLink.split('/join/')[1];
      console.log('Share token:', token);

      // Step 4: Visitor joins workspace via share link
      await visitorPage.goto(`/join/${token}`);
      await expect(visitorPage.locator('button:has-text("Join Workspace")')).toBeVisible({ timeout: 10000 });
      await visitorPage.locator('button:has-text("Join Workspace")').click();
      await expect(visitorPage).toHaveURL(/\/workspace\//, { timeout: 10000 });
      console.log('Visitor joined workspace');

      // Step 5: Visitor should see the chat room in the workspace
      await expect(visitorPage.locator(`text="${chatRoomName}"`).first()).toBeVisible({ timeout: 10000 });
      console.log('Visitor can see chat room in list');

      // Step 6: Visitor clicks on the chat room
      await visitorPage.locator(`text="${chatRoomName}"`).first().click();
      await expect(visitorPage).toHaveURL(/\/chat\//, { timeout: 10000 });
      console.log('Visitor navigated to chat room');

      // Step 7: Visitor should be able to connect and see the chat
      await expect(visitorPage.locator('[data-status="connected"]').first()).toBeVisible({ timeout: 10000 });
      console.log('Visitor connected to chat room');

      // Step 8: Owner goes back to chat room
      await ownerPage.locator('button:has-text("Close")').click();
      await ownerPage.locator(`text="${chatRoomName}"`).first().click();
      await ownerPage.waitForURL(/\/chat\/.+/, { timeout: 10000 });
      await expect(ownerPage.locator('[data-status="connected"]').first()).toBeVisible({ timeout: 10000 });

      // Step 9: Owner sends a message
      const ownerMessage = 'Hello from owner!';
      await ownerPage.locator('input[placeholder*="message" i]').first().fill(ownerMessage);
      await ownerPage.locator('input[placeholder*="message" i]').first().press('Enter');
      console.log('Owner sent message');

      // Step 10: Visitor should see the message
      await expect(visitorPage.locator(`text="${ownerMessage}"`).first()).toBeVisible({ timeout: 10000 });
      console.log('Visitor received owner message');

      // Step 11: Visitor sends a reply
      const visitorMessage = 'Hello from visitor!';
      await visitorPage.locator('input[placeholder*="message" i]').first().fill(visitorMessage);
      await visitorPage.locator('input[placeholder*="message" i]').first().press('Enter');
      console.log('Visitor sent message');

      // Step 12: Owner should see the reply
      await expect(ownerPage.locator(`text="${visitorMessage}"`).first()).toBeVisible({ timeout: 10000 });
      console.log('Owner received visitor message');

      console.log('Shared visitor can successfully chat with owner!');
    } finally {
      await ownerContext.close();
      await visitorContext.close();
    }
  });
});
