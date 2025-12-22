import { test, expect, type Page, type BrowserContext } from '@playwright/test';

/**
 * Resource Presence Tests
 *
 * Tests that presence avatars are displayed and updated in real-time:
 * 1. When a user views a document, their avatar appears on the tile
 * 2. When a user leaves a document, their avatar disappears from the tile
 * 3. Avatar groups show +N for overflow when >3 users
 * 4. Presence updates in real-time
 */

// Test users with distinct colors
const USERS = [
  {
    id: 'user-presence-1',
    name: 'Alice',
    avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Alice',
  },
  {
    id: 'user-presence-2',
    name: 'Bob',
    avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Bob',
  },
  {
    id: 'user-presence-3',
    name: 'Charlie',
    avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Charlie',
  },
  {
    id: 'user-presence-4',
    name: 'Diana',
    avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Diana',
  },
];

async function signIn(page: Page, user: (typeof USERS)[0]) {
  await page.addInitScript((userData) => {
    localStorage.setItem('ideate-user', JSON.stringify(userData));
  }, user);
}

async function clearIndexedDB(page: Page) {
  await page.addInitScript(() => {
    indexedDB.databases().then((databases) => {
      databases.forEach((db) => {
        if (db.name) {
          indexedDB.deleteDatabase(db.name);
        }
      });
    });
  });
}

async function getAvatarGroupCount(page: Page, resourceTitle: string): Promise<number> {
  const card = page.locator(`[class*="Card"]`).filter({ hasText: resourceTitle });
  const avatarGroup = card.locator('[data-testid="avatar-group"]');

  if (!(await avatarGroup.isVisible({ timeout: 2000 }).catch(() => false))) {
    return 0;
  }

  // Count individual avatars plus check for overflow indicator
  const avatars = avatarGroup.locator('[class*="avatar"]');
  const count = await avatars.count();

  // Check for overflow (+N indicator)
  const overflow = avatarGroup.locator('[class*="overflow"]');
  if (await overflow.isVisible()) {
    const overflowText = await overflow.textContent();
    const match = overflowText?.match(/\+(\d+)/);
    if (match) {
      return count + parseInt(match[1], 10);
    }
  }

  return count;
}

async function hasAvatarGroup(page: Page, resourceTitle: string): Promise<boolean> {
  const card = page.locator(`[class*="Card"]`).filter({ hasText: resourceTitle });
  const avatarGroup = card.locator('[data-testid="avatar-group"]');
  return await avatarGroup.isVisible({ timeout: 2000 }).catch(() => false);
}

async function createWorkspaceAndDocument(page: Page, workspaceName: string, docTitle: string): Promise<string> {
  // Go to workspaces
  await page.goto('/workspaces');
  await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });

  // Create workspace
  await page.click('button:has-text("New Workspace")');
  // Fill the name input (first textbox in dialog)
  await page.getByRole('textbox', { name: 'Name' }).fill(workspaceName);
  await page.click('button:has-text("Create")');
  await expect(page.locator('text=Documents')).toBeVisible({ timeout: 10000 });

  // Create document
  await page.click('button:has-text("New Document")');
  // Fill the title input
  await page.getByRole('textbox').first().fill(docTitle);
  await page.click('button:has-text("Create")');

  // Wait for document to load
  await expect(page.locator('.cm-editor').first()).toBeVisible({ timeout: 10000 });

  // Go back to workspace
  await page.goBack();
  await expect(page.locator('text=Documents')).toBeVisible({ timeout: 5000 });

  // Get share link
  await page.click('button:has-text("Share")');
  await expect(page.locator('input[readonly]')).toBeVisible({ timeout: 5000 });
  const shareLink = await page.locator('input[readonly]').inputValue();
  await page.click('button:has-text("Close")');

  return shareLink;
}

test.describe('Resource Presence', () => {
  test.setTimeout(120000);

  test('avatar appears on tile when user views document', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const ownerPage = await context1.newPage();
    const viewerPage = await context2.newPage();

    try {
      await clearIndexedDB(ownerPage);
      await clearIndexedDB(viewerPage);
      await signIn(ownerPage, USERS[0]);
      await signIn(viewerPage, USERS[1]);

      // Owner creates workspace and document
      const docTitle = `Presence Doc ${Date.now()}`;
      const shareLink = await createWorkspaceAndDocument(ownerPage, 'Presence Test', docTitle);

      // Viewer joins workspace
      await viewerPage.goto(shareLink);
      await viewerPage.click('button:has-text("Join Workspace")');
      await expect(viewerPage.locator('text=Documents')).toBeVisible({ timeout: 10000 });

      // Initially, no avatar on the document tile
      const initialHasAvatar = await hasAvatarGroup(ownerPage, docTitle);
      expect(initialHasAvatar).toBe(false);

      // Viewer opens the document
      await viewerPage.click(`text=${docTitle}`);
      await expect(viewerPage.locator('.cm-editor').first()).toBeVisible({ timeout: 10000 });

      // Wait for WebSocket connection and presence sync
      await ownerPage.waitForTimeout(3000);

      // Owner should now see an avatar on the document tile
      const docCard = ownerPage.locator(`[class*="Card"]`).filter({ hasText: docTitle });
      const avatarGroup = docCard.locator('[data-testid="avatar-group"]');
      await expect(avatarGroup).toBeVisible({ timeout: 10000 });

    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('avatar disappears from tile when user leaves document', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const ownerPage = await context1.newPage();
    const viewerPage = await context2.newPage();

    try {
      await clearIndexedDB(ownerPage);
      await clearIndexedDB(viewerPage);
      await signIn(ownerPage, USERS[0]);
      await signIn(viewerPage, USERS[1]);

      // Owner creates workspace and document
      const docTitle = `Leave Doc ${Date.now()}`;
      const shareLink = await createWorkspaceAndDocument(ownerPage, 'Leave Test', docTitle);

      // Viewer joins and opens document
      await viewerPage.goto(shareLink);
      await viewerPage.click('button:has-text("Join Workspace")');
      await expect(viewerPage.locator('text=Documents')).toBeVisible({ timeout: 10000 });

      await viewerPage.click(`text=${docTitle}`);
      await expect(viewerPage.locator('.cm-editor').first()).toBeVisible({ timeout: 10000 });

      // Wait for presence to sync
      await ownerPage.waitForTimeout(3000);

      // Verify avatar is visible
      const docCard = ownerPage.locator(`[class*="Card"]`).filter({ hasText: docTitle });
      const avatarGroup = docCard.locator('[data-testid="avatar-group"]');
      await expect(avatarGroup).toBeVisible({ timeout: 10000 });

      // Viewer navigates away (leaves document)
      await viewerPage.goBack();
      await expect(viewerPage.locator('text=Documents')).toBeVisible({ timeout: 5000 });

      // Wait for presence leave to sync
      await ownerPage.waitForTimeout(3000);

      // Avatar should no longer be visible
      await expect(avatarGroup).not.toBeVisible({ timeout: 10000 });

    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('avatar group shows overflow indicator with many users', async ({ browser }) => {
    // Create 4+ contexts to test overflow
    const contexts: BrowserContext[] = [];
    const pages: Page[] = [];

    try {
      for (let i = 0; i < 4; i++) {
        const context = await browser.newContext();
        contexts.push(context);
        const page = await context.newPage();
        pages.push(page);

        await clearIndexedDB(page);
        await signIn(page, USERS[i]);
      }

      // First user (owner) creates workspace and document
      const ownerPage = pages[0];
      const docTitle = `Overflow Doc ${Date.now()}`;
      const shareLink = await createWorkspaceAndDocument(ownerPage, 'Overflow Test', docTitle);

      // All other users join and open the document (3 viewers)
      for (let i = 1; i < pages.length; i++) {
        const page = pages[i];
        await page.goto(shareLink);
        await page.click('button:has-text("Join Workspace")');
        await expect(page.locator('text=Documents')).toBeVisible({ timeout: 10000 });

        // Open the document
        await page.click(`text=${docTitle}`);
        await expect(page.locator('.cm-editor').first()).toBeVisible({ timeout: 10000 });

        // Wait a bit between each join
        await ownerPage.waitForTimeout(1000);
      }

      // Wait for presence to sync
      await ownerPage.waitForTimeout(3000);

      // Owner should see avatar group with 3 viewers (maxVisible=3)
      const docCard = ownerPage.locator(`[class*="Card"]`).filter({ hasText: docTitle });
      const avatarGroup = docCard.locator('[data-testid="avatar-group"]');
      await expect(avatarGroup).toBeVisible({ timeout: 10000 });

      // Should see 3 avatars (no overflow since exactly 3 viewers)
      const avatars = avatarGroup.locator('[class*="avatar"]');
      expect(await avatars.count()).toBe(3);

    } finally {
      for (const context of contexts) {
        await context.close();
      }
    }
  });

  test('presence updates in real-time as users join and leave', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const context3 = await browser.newContext();
    const ownerPage = await context1.newPage();
    const viewer1Page = await context2.newPage();
    const viewer2Page = await context3.newPage();

    try {
      await clearIndexedDB(ownerPage);
      await clearIndexedDB(viewer1Page);
      await clearIndexedDB(viewer2Page);
      await signIn(ownerPage, USERS[0]);
      await signIn(viewer1Page, USERS[1]);
      await signIn(viewer2Page, USERS[2]);

      // Owner creates workspace and document
      const docTitle = `Realtime Doc ${Date.now()}`;
      const shareLink = await createWorkspaceAndDocument(ownerPage, 'Realtime Test', docTitle);

      const docCard = ownerPage.locator(`[class*="Card"]`).filter({ hasText: docTitle });
      const avatarGroup = docCard.locator('[data-testid="avatar-group"]');

      // Viewer 1 joins workspace and opens document
      await viewer1Page.goto(shareLink);
      await viewer1Page.click('button:has-text("Join Workspace")');
      await viewer1Page.click(`text=${docTitle}`);
      await expect(viewer1Page.locator('.cm-editor').first()).toBeVisible({ timeout: 10000 });

      // Wait and verify 1 avatar visible
      await ownerPage.waitForTimeout(3000);
      await expect(avatarGroup).toBeVisible({ timeout: 10000 });

      // Viewer 2 joins and opens document
      await viewer2Page.goto(shareLink);
      await viewer2Page.click('button:has-text("Join Workspace")');
      await viewer2Page.click(`text=${docTitle}`);
      await expect(viewer2Page.locator('.cm-editor').first()).toBeVisible({ timeout: 10000 });

      // Wait and verify 2 avatars visible
      await ownerPage.waitForTimeout(3000);
      const avatars = avatarGroup.locator('[class*="avatar"]');
      expect(await avatars.count()).toBe(2);

      // Viewer 1 leaves
      await viewer1Page.goBack();
      await ownerPage.waitForTimeout(3000);

      // Should now show 1 avatar
      expect(await avatars.count()).toBe(1);

      // Viewer 2 leaves
      await viewer2Page.goBack();
      await ownerPage.waitForTimeout(3000);

      // Avatar group should no longer be visible
      await expect(avatarGroup).not.toBeVisible({ timeout: 10000 });

    } finally {
      await context1.close();
      await context2.close();
      await context3.close();
    }
  });
});
