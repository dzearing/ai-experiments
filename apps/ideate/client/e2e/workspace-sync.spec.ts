import { test, expect, type Page, type BrowserContext } from '@playwright/test';

/**
 * Workspace Real-Time Sync Tests
 *
 * Tests that documents and chat rooms are synced in real-time:
 * 1. When owner creates a document/chat, visitor sees it without refresh
 * 2. When owner deletes a document/chat, visitor sees removal without refresh
 * 3. When owner renames a document/chat, visitor sees update without refresh
 */

// Test users
const OWNER = {
  id: 'user-owner-sync-test',
  name: 'Owner',
  avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Owner',
};

const VISITOR = {
  id: 'user-visitor-sync-test',
  name: 'Visitor',
  avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Visitor',
};

const TEST_WORKSPACE = {
  id: 'workspace-sync-test',
  name: 'Sync Test Workspace',
  description: 'Workspace for testing real-time sync',
  ownerId: OWNER.id,
  memberIds: [VISITOR.id],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

async function signIn(page: Page, user: typeof OWNER) {
  await page.addInitScript((userData) => {
    localStorage.setItem('ideate-user', JSON.stringify(userData));
  }, user);
}

async function setupTestWorkspace(page: Page) {
  // Inject the test workspace into localStorage as if we have access to it
  await page.addInitScript((ws) => {
    // Store workspace reference so both users can see it
    const workspaces = JSON.parse(localStorage.getItem('ideate-workspaces') || '[]');
    if (!workspaces.find((w: { id: string }) => w.id === ws.id)) {
      workspaces.push(ws);
      localStorage.setItem('ideate-workspaces', JSON.stringify(workspaces));
    }
  }, TEST_WORKSPACE);
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

async function navigateToWorkspace(page: Page, workspaceId: string) {
  await page.goto(`/workspace/${workspaceId}`);
  // Wait for workspace to load
  await expect(page.locator('nav').or(page.locator('[class*="breadcrumb"]').first())).toBeVisible({ timeout: 10000 });
}

async function createDocument(page: Page, title: string) {
  // Click New Document button
  await page.click('button:has-text("New Document")');

  // Wait for modal
  await expect(page.locator('input[placeholder*="title"]')).toBeVisible({ timeout: 5000 });
  await page.fill('input[placeholder*="title"]', title);

  // Click Create
  await page.click('button:has-text("Create"):not(:has-text("Create Document"))');

  // Wait for navigation to document
  await expect(page.locator('.cm-editor').first()).toBeVisible({ timeout: 10000 });

  // Navigate back to workspace
  await page.goBack();
  await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 5000 });
}

async function createChatRoom(page: Page, name: string) {
  // Click New Chat Room button
  await page.click('button:has-text("New Chat Room")');

  // Wait for modal
  await expect(page.locator('input[placeholder*="name"]')).toBeVisible({ timeout: 5000 });
  await page.fill('input[placeholder*="name"]', name);

  // Click Create
  await page.click('button:has-text("Create"):not(:has-text("Create Chat"))');

  // Wait for navigation to chat
  await page.waitForTimeout(1000);

  // Navigate back to workspace
  await page.goBack();
  await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 5000 });
}

async function deleteResource(page: Page, title: string) {
  // Find the card with the title and click its menu
  const card = page.locator(`[class*="Card"]`).filter({ hasText: title });
  const menuButton = card.locator('button[aria-label="More options"]');

  await menuButton.click();

  // Click Delete in menu
  await page.click('text=Delete');

  // Confirm deletion
  await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible();
  await page.click('button:has-text("Delete"):visible');

  // Wait for modal to close
  await page.waitForTimeout(500);
}

async function renameResource(page: Page, oldTitle: string, newTitle: string) {
  // Find the card and click its menu
  const card = page.locator(`[class*="Card"]`).filter({ hasText: oldTitle });
  const menuButton = card.locator('button[aria-label="More options"]');

  await menuButton.click();

  // Click Edit in menu
  await page.click('text=Edit');

  // Fill new title
  await expect(page.locator('input')).toBeVisible();
  await page.fill('input', newTitle);

  // Click Rename
  await page.click('button:has-text("Rename")');

  // Wait for modal to close
  await page.waitForTimeout(500);
}

async function getDocumentTitles(page: Page): Promise<string[]> {
  // Wait a bit for any sync
  await page.waitForTimeout(500);

  // Get all document card titles
  const titles = await page.locator('[class*="resourceTitle"]').allTextContents();
  return titles;
}

test.describe('Workspace Real-Time Sync', () => {
  test.setTimeout(90000);

  let context1: BrowserContext;
  let context2: BrowserContext;
  let ownerPage: Page;
  let visitorPage: Page;

  test.beforeEach(async ({ browser }) => {
    // Create two browser contexts for owner and visitor
    context1 = await browser.newContext();
    context2 = await browser.newContext();
    ownerPage = await context1.newPage();
    visitorPage = await context2.newPage();

    // Set up test environment for both
    await clearIndexedDB(ownerPage);
    await clearIndexedDB(visitorPage);
    await signIn(ownerPage, OWNER);
    await signIn(visitorPage, VISITOR);
  });

  test.afterEach(async () => {
    await context1?.close();
    await context2?.close();
  });

  test('document created by owner appears on visitor screen without refresh', async () => {
    // First, we need a shared workspace. Navigate owner to create one
    await ownerPage.goto('/workspaces');
    await expect(ownerPage.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });

    // Create a workspace
    await ownerPage.click('button:has-text("New Workspace")');
    await ownerPage.fill('input[placeholder*="name"]', 'Sync Test Workspace');
    await ownerPage.click('button:has-text("Create")');

    // Wait for workspace detail page
    await expect(ownerPage.locator('text=Documents')).toBeVisible({ timeout: 10000 });

    // Get the workspace URL
    const workspaceUrl = ownerPage.url();
    const workspaceId = workspaceUrl.split('/').pop();

    // Owner generates share link
    await ownerPage.click('button:has-text("Share")');
    await expect(ownerPage.locator('input[readonly]')).toBeVisible({ timeout: 5000 });
    const shareLink = await ownerPage.locator('input[readonly]').inputValue();
    await ownerPage.click('button:has-text("Close")');

    // Visitor joins the workspace
    await visitorPage.goto(shareLink);
    await expect(visitorPage.getByRole('button', { name: 'Join Workspace' })).toBeVisible({ timeout: 10000 });
    await visitorPage.click('button:has-text("Join Workspace")');

    // Wait for visitor to be on workspace detail page
    await expect(visitorPage.locator('text=Documents')).toBeVisible({ timeout: 10000 });

    // Get initial document count on visitor page
    const initialTitles = await getDocumentTitles(visitorPage);
    const initialCount = initialTitles.length;

    // Owner creates a document
    const docTitle = `Real-Time Doc ${Date.now()}`;
    await createDocument(ownerPage, docTitle);

    // Wait for owner page to show the document
    await expect(ownerPage.locator(`text=${docTitle}`)).toBeVisible({ timeout: 10000 });

    // Visitor should see the document appear WITHOUT refreshing
    await expect(visitorPage.locator(`text=${docTitle}`)).toBeVisible({ timeout: 10000 });

    // Verify document count increased
    const newTitles = await getDocumentTitles(visitorPage);
    expect(newTitles.length).toBe(initialCount + 1);
    expect(newTitles).toContain(docTitle);
  });

  test('document deleted by owner disappears from visitor screen without refresh', async () => {
    // Set up shared workspace
    await ownerPage.goto('/workspaces');
    await expect(ownerPage.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });

    // Create workspace and share with visitor
    await ownerPage.click('button:has-text("New Workspace")');
    await ownerPage.fill('input[placeholder*="name"]', 'Delete Test Workspace');
    await ownerPage.click('button:has-text("Create")');
    await expect(ownerPage.locator('text=Documents')).toBeVisible({ timeout: 10000 });

    // Create a document first
    const docTitle = `Delete Me ${Date.now()}`;
    await createDocument(ownerPage, docTitle);
    await expect(ownerPage.locator(`text=${docTitle}`)).toBeVisible({ timeout: 5000 });

    // Share with visitor
    await ownerPage.click('button:has-text("Share")');
    await expect(ownerPage.locator('input[readonly]')).toBeVisible({ timeout: 5000 });
    const shareLink = await ownerPage.locator('input[readonly]').inputValue();
    await ownerPage.click('button:has-text("Close")');

    // Visitor joins
    await visitorPage.goto(shareLink);
    await visitorPage.click('button:has-text("Join Workspace")');
    await expect(visitorPage.locator('text=Documents')).toBeVisible({ timeout: 10000 });

    // Visitor should see the document
    await expect(visitorPage.locator(`text=${docTitle}`)).toBeVisible({ timeout: 5000 });

    // Owner deletes the document
    await deleteResource(ownerPage, docTitle);

    // Document should disappear from owner's page
    await expect(ownerPage.locator(`text=${docTitle}`)).not.toBeVisible({ timeout: 5000 });

    // Document should ALSO disappear from visitor's page WITHOUT refresh
    await expect(visitorPage.locator(`text=${docTitle}`)).not.toBeVisible({ timeout: 10000 });
  });

  test('chat room created by owner appears on visitor screen without refresh', async () => {
    // Set up shared workspace
    await ownerPage.goto('/workspaces');
    await ownerPage.click('button:has-text("New Workspace")');
    await ownerPage.fill('input[placeholder*="name"]', 'Chat Sync Test');
    await ownerPage.click('button:has-text("Create")');
    await expect(ownerPage.locator('text=Chats')).toBeVisible({ timeout: 10000 });

    // Share with visitor
    await ownerPage.click('button:has-text("Share")');
    const shareLink = await ownerPage.locator('input[readonly]').inputValue();
    await ownerPage.click('button:has-text("Close")');

    // Visitor joins
    await visitorPage.goto(shareLink);
    await visitorPage.click('button:has-text("Join Workspace")');
    await expect(visitorPage.locator('text=Chats')).toBeVisible({ timeout: 10000 });

    // Owner creates a chat room
    const chatName = `Real-Time Chat ${Date.now()}`;
    await createChatRoom(ownerPage, chatName);

    // Owner page should show the chat
    await expect(ownerPage.locator(`text=${chatName}`)).toBeVisible({ timeout: 5000 });

    // Visitor should see the chat room appear WITHOUT refreshing
    await expect(visitorPage.locator(`text=${chatName}`)).toBeVisible({ timeout: 10000 });
  });

  test('chat room deleted by owner disappears from visitor screen without refresh', async () => {
    // Set up shared workspace
    await ownerPage.goto('/workspaces');
    await ownerPage.click('button:has-text("New Workspace")');
    await ownerPage.fill('input[placeholder*="name"]', 'Chat Delete Test');
    await ownerPage.click('button:has-text("Create")');
    await expect(ownerPage.locator('text=Chats')).toBeVisible({ timeout: 10000 });

    // Create a chat room
    const chatName = `Delete Chat ${Date.now()}`;
    await createChatRoom(ownerPage, chatName);
    await expect(ownerPage.locator(`text=${chatName}`)).toBeVisible({ timeout: 5000 });

    // Share with visitor
    await ownerPage.click('button:has-text("Share")');
    const shareLink = await ownerPage.locator('input[readonly]').inputValue();
    await ownerPage.click('button:has-text("Close")');

    // Visitor joins
    await visitorPage.goto(shareLink);
    await visitorPage.click('button:has-text("Join Workspace")');
    await expect(visitorPage.locator(`text=${chatName}`)).toBeVisible({ timeout: 10000 });

    // Owner deletes the chat room
    await deleteResource(ownerPage, chatName);

    // Chat should disappear from owner's page
    await expect(ownerPage.locator(`text=${chatName}`)).not.toBeVisible({ timeout: 5000 });

    // Chat should ALSO disappear from visitor's page WITHOUT refresh
    await expect(visitorPage.locator(`text=${chatName}`)).not.toBeVisible({ timeout: 10000 });
  });
});
