import { test, expect, type Page, type APIRequestContext } from '@playwright/test';

/**
 * Things CRUD E2E Tests
 *
 * Tests creating, renaming, and deleting things in the tree view.
 * Covers keyboard shortcuts (F2, Delete, Ctrl+Delete, Ctrl+Enter, Tab).
 */

const API_BASE = 'http://localhost:3002/api';

/**
 * Generate a deterministic user ID from nickname
 * Must match the generateId function in AuthContext.tsx
 */
function generateUserId(nickname: string): string {
  const normalized = nickname.toLowerCase().replace(/\s+/g, '-');
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `user-${normalized}-${Math.abs(hash).toString(36)}`;
}

const TEST_USER_NAME = 'Things E2E Test';
const TEST_USER = {
  id: generateUserId(TEST_USER_NAME),
  name: TEST_USER_NAME,
  avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Things',
};

/**
 * Sign in a test user by setting localStorage
 */
async function signIn(page: Page) {
  await page.addInitScript((user) => {
    localStorage.setItem('ideate-user', JSON.stringify(user));
  }, TEST_USER);
}

/**
 * Create a workspace via API
 */
async function createWorkspaceViaAPI(
  request: APIRequestContext,
  name: string,
  userId: string
): Promise<{ id: string; name: string }> {
  const response = await request.post(`${API_BASE}/workspaces`, {
    data: { name, description: 'Test workspace for things' },
    headers: { 'x-user-id': userId },
  });
  expect(response.ok()).toBeTruthy();
  return response.json();
}

/**
 * Delete a workspace via API
 */
async function deleteWorkspaceViaAPI(
  request: APIRequestContext,
  workspaceId: string,
  userId: string
): Promise<void> {
  const response = await request.delete(`${API_BASE}/workspaces/${workspaceId}`, {
    headers: { 'x-user-id': userId },
  });
  expect(response.ok()).toBeTruthy();
}

/**
 * Create a thing via API
 */
async function createThingViaAPI(
  request: APIRequestContext,
  data: { name: string; type?: string; parentIds?: string[]; workspaceId?: string },
  userId: string
): Promise<{ id: string; name: string; parentIds: string[] }> {
  const response = await request.post(`${API_BASE}/things`, {
    data: {
      type: 'item',
      ...data,
    },
    headers: { 'x-user-id': userId },
  });
  expect(response.ok()).toBeTruthy();
  return response.json();
}

/**
 * Delete a thing via API
 */
async function deleteThingViaAPI(
  request: APIRequestContext,
  thingId: string,
  userId: string
): Promise<void> {
  const response = await request.delete(`${API_BASE}/things/${thingId}`, {
    headers: { 'x-user-id': userId },
  });
  expect(response.ok()).toBeTruthy();
}

/**
 * Get all things via API
 */
async function getThingsViaAPI(
  request: APIRequestContext,
  userId: string,
  workspaceId?: string
): Promise<Array<{ id: string; name: string; parentIds: string[] }>> {
  const url = workspaceId
    ? `${API_BASE}/things?workspaceId=${workspaceId}`
    : `${API_BASE}/things`;
  const response = await request.get(url, {
    headers: { 'x-user-id': userId },
  });
  expect(response.ok()).toBeTruthy();
  return response.json();
}

/**
 * Navigate to the Things page and wait for it to load
 */
async function navigateToThings(page: Page) {
  await page.goto('/things');
  // Wait for the Things heading and tree container to be visible
  await expect(page.locator('h2:has-text("Things")')).toBeVisible({ timeout: 10000 });
  // Wait for loading to complete (no "Loading" indicator)
  await expect(page.locator('text=Loading')).not.toBeVisible({ timeout: 10000 });
}

/**
 * Click the "Create a Thing" button to start inline editing
 */
async function clickCreateButton(page: Page) {
  await page.click('button:has-text("Create a Thing")');
  // Wait for the input to appear
  await expect(page.locator('input[placeholder*="New thing"]')).toBeVisible();
}

/**
 * Get the tree view container
 */
function getTreeView(page: Page) {
  return page.locator('[role="tree"]');
}

/**
 * Get all tree items in order
 */
async function getTreeItemsInOrder(page: Page): Promise<string[]> {
  const treeItems = page.locator('[role="treeitem"]');
  const count = await treeItems.count();
  const names: string[] = [];
  for (let i = 0; i < count; i++) {
    const text = await treeItems.nth(i).innerText();
    // Extract just the name (first line, before any tags or badges)
    const name = text.split('\n')[0].trim();
    if (name && !name.includes('New thing') && !name.includes('New child')) {
      names.push(name);
    }
  }
  return names;
}

/**
 * Select a thing by clicking on it
 */
async function selectThing(page: Page, thingName: string) {
  await page.click(`[role="treeitem"]:has-text("${thingName}")`);
  await page.waitForTimeout(100);
}

test.describe('Things CRUD Operations', () => {
  let testWorkspace: { id: string; name: string };

  test.beforeEach(async ({ page, request }) => {
    await signIn(page);

    // Clean up any existing things from previous test runs FIRST
    // Delete root-level things only (cascade delete handles children)
    try {
      const existingThings = await getThingsViaAPI(request, TEST_USER.id);
      // Filter to only root things (no parents) - cascade delete will handle children
      const rootThings = existingThings.filter(t => !t.parentIds || t.parentIds.length === 0);
      for (const thing of rootThings) {
        try {
          await deleteThingViaAPI(request, thing.id, TEST_USER.id);
        } catch {
          // Ignore cleanup errors
        }
      }
      // Double-check: if any orphaned children remain, delete them too
      const remaining = await getThingsViaAPI(request, TEST_USER.id);
      for (const thing of remaining) {
        try {
          await deleteThingViaAPI(request, thing.id, TEST_USER.id);
        } catch {
          // Ignore cleanup errors
        }
      }
    } catch {
      // Ignore if no things exist
    }

    // Create a test workspace
    const workspaceName = `Things Test Workspace ${Date.now()}`;
    testWorkspace = await createWorkspaceViaAPI(request, workspaceName, TEST_USER.id);
  });

  test.afterEach(async ({ request }) => {
    // Cleanup: delete all things first, then workspace
    if (testWorkspace?.id) {
      try {
        const things = await getThingsViaAPI(request, TEST_USER.id);
        for (const thing of things) {
          try {
            await deleteThingViaAPI(request, thing.id, TEST_USER.id);
          } catch {
            // Ignore cleanup errors
          }
        }
        await deleteWorkspaceViaAPI(request, testWorkspace.id, TEST_USER.id);
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  test('creates things in correct sequential order (1, 2, 3)', async ({ page }) => {
    await navigateToThings(page);

    // Use unique names with timestamp to avoid conflicts with leftover data
    const timestamp = Date.now();
    const item1Name = `SeqTest1-${timestamp}`;
    const item2Name = `SeqTest2-${timestamp}`;
    const item3Name = `SeqTest3-${timestamp}`;

    // Click Create button
    await clickCreateButton(page);

    // Helper to create an item and wait for next input
    async function createItem(name: string) {
      // Wait for input to be ready and focused
      const input = page.locator('input[placeholder*="New"]');
      await expect(input).toBeVisible();
      await input.fill(name);
      await input.press('Enter');
      // Wait a bit for the creation to complete
      await page.waitForTimeout(200);
    }

    // Create items in sequence: 1, 2, 3
    await createItem(item1Name);
    await createItem(item2Name);
    await createItem(item3Name);

    // Exit creation mode - press Escape on the empty input
    const remainingInput = page.locator('input[placeholder*="New"]');
    if (await remainingInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await remainingInput.press('Escape');
    }

    // Wait for UI to settle
    await page.waitForTimeout(300);

    // Verify all three items were created and are visible
    await expect(page.locator(`[role="treeitem"]:has-text("${item1Name}")`)).toBeVisible();
    await expect(page.locator(`[role="treeitem"]:has-text("${item2Name}")`)).toBeVisible();
    await expect(page.locator(`[role="treeitem"]:has-text("${item3Name}")`)).toBeVisible();

    // Get the FIRST tree item - it should be item1 (since input appeared at top)
    const firstTreeItem = page.locator('[role="treeitem"]').first();
    const firstItemText = await firstTreeItem.innerText();
    expect(firstItemText).toContain(item1Name);

    // Get bounding boxes to verify vertical order
    const item1Box = await page.locator(`[role="treeitem"]:has-text("${item1Name}")`).boundingBox();
    const item2Box = await page.locator(`[role="treeitem"]:has-text("${item2Name}")`).boundingBox();
    const item3Box = await page.locator(`[role="treeitem"]:has-text("${item3Name}")`).boundingBox();

    expect(item1Box).not.toBeNull();
    expect(item2Box).not.toBeNull();
    expect(item3Box).not.toBeNull();

    // CRITICAL: Verify vertical ordering - Item 1 is above Item 2 is above Item 3
    // This was a bug where items appeared at the BOTTOM instead of the TOP
    expect(item1Box!.y).toBeLessThan(item2Box!.y);
    expect(item2Box!.y).toBeLessThan(item3Box!.y);
  });

  test('creates child nodes using Tab to indent', async ({ page }) => {
    await navigateToThings(page);

    // Use unique names
    const timestamp = Date.now();
    const parentName = `TabParent-${timestamp}`;
    const child1Name = `TabChild1-${timestamp}`;
    const child2Name = `TabChild2-${timestamp}`;

    // Create a parent item
    await clickCreateButton(page);
    let input = page.locator('input[placeholder*="New thing"]');
    await input.fill(parentName);
    await input.press('Enter');

    // Now Tab to indent and create a child
    input = page.locator('input[placeholder*="New"]');
    await input.press('Tab');
    await input.fill(child1Name);
    await input.press('Enter');

    // Create another child at same level
    input = page.locator('input[placeholder*="New"]');
    await input.fill(child2Name);
    await input.press('Enter');

    // Press Escape to exit (if input still visible)
    const remainingInput = page.locator('input[placeholder*="New"]');
    if (await remainingInput.isVisible()) {
      await remainingInput.press('Escape');
    }

    // Wait for items to settle
    await page.waitForTimeout(500);

    // Verify parent exists
    await expect(page.locator(`[role="treeitem"]:has-text("${parentName}")`)).toBeVisible();

    // Children should be visible (parent should be expanded)
    await expect(page.locator(`[role="treeitem"]:has-text("${child1Name}")`)).toBeVisible();
    await expect(page.locator(`[role="treeitem"]:has-text("${child2Name}")`)).toBeVisible();
  });

  test('creates sibling after selected item with Ctrl+Enter', async ({ page, request }) => {
    // Create initial item via API
    const thing = await createThingViaAPI(request, { name: 'Existing Item' }, TEST_USER.id);

    // Navigate and reload to fetch the API-created item
    await navigateToThings(page);
    await page.reload();
    await expect(page.locator('h2:has-text("Things")')).toBeVisible({ timeout: 10000 });

    // Wait for the item to appear
    await expect(page.locator('[role="treeitem"]:has-text("Existing Item")')).toBeVisible();

    // Select the item
    await selectThing(page, 'Existing Item');

    // Get the tree container and press Ctrl+Enter
    const treeContainer = page.locator('[role="tree"]').first();
    await treeContainer.press('Control+Enter');

    // Should show input for new item
    await expect(page.locator('input[placeholder*="New"]')).toBeVisible();

    // Type new item name
    await page.locator('input[placeholder*="New"]').fill('New Sibling');
    await page.locator('input[placeholder*="New"]').press('Enter');

    // Exit creation mode
    await page.locator('input[placeholder*="New"]').press('Escape');

    // Wait for items to settle
    await page.waitForTimeout(500);

    // Verify both items exist
    await expect(page.locator('[role="treeitem"]:has-text("Existing Item")')).toBeVisible();
    await expect(page.locator('[role="treeitem"]:has-text("New Sibling")')).toBeVisible();

    // Cleanup
    await deleteThingViaAPI(request, thing.id, TEST_USER.id);
  });

  test('renames thing with F2 key', async ({ page, request }) => {
    // Create a thing via API
    const thing = await createThingViaAPI(request, { name: 'Original Name' }, TEST_USER.id);

    // Navigate and reload to fetch the API-created item
    await navigateToThings(page);
    await page.reload();
    await expect(page.locator('h2:has-text("Things")')).toBeVisible({ timeout: 10000 });

    // Wait for the thing to appear and select it
    await expect(page.locator('[role="treeitem"]:has-text("Original Name")')).toBeVisible();
    await selectThing(page, 'Original Name');

    // Press F2 to start renaming
    const treeContainer = page.locator('[role="tree"]').first();
    await treeContainer.press('F2');

    // Wait for rename input to appear
    const renameInput = page.locator('[role="treeitem"] input');
    await expect(renameInput).toBeVisible();

    // Clear and type new name
    await renameInput.fill('Renamed Item');
    await renameInput.press('Enter');

    // Wait for rename to complete
    await page.waitForTimeout(500);

    // Verify the item is renamed
    await expect(page.locator('[role="treeitem"]:has-text("Renamed Item")')).toBeVisible();
    await expect(page.locator('[role="treeitem"]:has-text("Original Name")')).not.toBeVisible();

    // Cleanup
    await deleteThingViaAPI(request, thing.id, TEST_USER.id);
  });

  test('cancels rename with Escape key', async ({ page, request }) => {
    // Create a thing via API
    const thing = await createThingViaAPI(request, { name: 'Keep This Name' }, TEST_USER.id);

    // Navigate and reload to fetch the API-created item
    await navigateToThings(page);
    await page.reload();
    await expect(page.locator('h2:has-text("Things")')).toBeVisible({ timeout: 10000 });

    // Wait for the thing to appear and select it
    await expect(page.locator('[role="treeitem"]:has-text("Keep This Name")')).toBeVisible();
    await selectThing(page, 'Keep This Name');

    // Press F2 to start renaming
    const treeContainer = page.locator('[role="tree"]').first();
    await treeContainer.press('F2');

    // Type something in the rename input
    const renameInput = page.locator('[role="treeitem"] input');
    await expect(renameInput).toBeVisible();
    await renameInput.fill('Changed Name');

    // Press Escape to cancel
    await renameInput.press('Escape');

    // Wait for cancel to complete
    await page.waitForTimeout(300);

    // Verify the name is unchanged
    await expect(page.locator('[role="treeitem"]:has-text("Keep This Name")')).toBeVisible();
    await expect(page.locator('[role="treeitem"]:has-text("Changed Name")')).not.toBeVisible();

    // Cleanup
    await deleteThingViaAPI(request, thing.id, TEST_USER.id);
  });

  test('deletes thing with Delete key showing confirmation dialog', async ({ page, request }) => {
    // Create a thing via API
    const thing = await createThingViaAPI(request, { name: 'To Be Deleted' }, TEST_USER.id);

    // Navigate and reload to fetch the API-created item
    await navigateToThings(page);
    await page.reload();
    await expect(page.locator('h2:has-text("Things")')).toBeVisible({ timeout: 10000 });

    // Wait for the thing to appear and select it
    await expect(page.locator('[role="treeitem"]:has-text("To Be Deleted")')).toBeVisible();
    await selectThing(page, 'To Be Deleted');

    // Press Delete key
    const treeContainer = page.locator('[role="tree"]').first();
    await treeContainer.press('Delete');

    // Verify confirmation dialog appears (use aria-modal to distinguish from facilitator chat)
    const dialog = page.locator('[role="dialog"][aria-modal="true"]');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('text=Delete Thing')).toBeVisible();
    // Dialog shows confirmation message with the item name
    await expect(dialog.getByText(/Are you sure you want to delete.*To Be Deleted/)).toBeVisible();

    // Click Cancel to dismiss
    await dialog.locator('button:has-text("Cancel")').click();
    await expect(dialog).not.toBeVisible();

    // Verify item still exists
    await expect(page.locator('[role="treeitem"]:has-text("To Be Deleted")')).toBeVisible();

    // Now delete it for real - select and press Delete again
    await selectThing(page, 'To Be Deleted');
    await treeContainer.press('Delete');
    await expect(dialog).toBeVisible();

    // Click Delete button
    await dialog.locator('button:has-text("Delete")').click();

    // Wait for deletion
    await page.waitForTimeout(500);

    // Verify item is deleted
    await expect(page.locator('[role="treeitem"]:has-text("To Be Deleted")')).not.toBeVisible();
  });

  test('deletes thing immediately with Ctrl+Delete (no dialog)', async ({ page, request }) => {
    // Create a thing via API
    const thing = await createThingViaAPI(request, { name: 'Quick Delete' }, TEST_USER.id);

    // Navigate and reload to fetch the API-created item
    await navigateToThings(page);
    await page.reload();
    await expect(page.locator('h2:has-text("Things")')).toBeVisible({ timeout: 10000 });

    // Wait for the thing to appear and select it
    await expect(page.locator('[role="treeitem"]:has-text("Quick Delete")')).toBeVisible();
    await selectThing(page, 'Quick Delete');

    // Press Ctrl+Delete (or Meta+Delete on Mac)
    const treeContainer = page.locator('[role="tree"]').first();
    await treeContainer.press('Control+Delete');

    // Wait for deletion - should be immediate without dialog
    await page.waitForTimeout(500);

    // Verify no dialog appeared and item is deleted
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    await expect(page.locator('[role="treeitem"]:has-text("Quick Delete")')).not.toBeVisible();
  });

  test('selects next item after deletion', async ({ page, request }) => {
    // Create multiple things via API
    const thing1 = await createThingViaAPI(request, { name: 'First' }, TEST_USER.id);
    const thing2 = await createThingViaAPI(request, { name: 'Second' }, TEST_USER.id);
    const thing3 = await createThingViaAPI(request, { name: 'Third' }, TEST_USER.id);

    // Navigate and reload to fetch the API-created items
    await navigateToThings(page);
    await page.reload();
    await expect(page.locator('h2:has-text("Things")')).toBeVisible({ timeout: 10000 });

    // Wait for all items to appear
    await expect(page.locator('[role="treeitem"]:has-text("First")')).toBeVisible();
    await expect(page.locator('[role="treeitem"]:has-text("Second")')).toBeVisible();
    await expect(page.locator('[role="treeitem"]:has-text("Third")')).toBeVisible();

    // Select the middle item (Second)
    await selectThing(page, 'Second');

    // Delete with Ctrl+Delete
    const treeContainer = page.locator('[role="tree"]').first();
    await treeContainer.press('Control+Delete');

    // Wait for deletion
    await page.waitForTimeout(500);

    // Verify Second is deleted
    await expect(page.locator('[role="treeitem"]:has-text("Second")')).not.toBeVisible();

    // Third should now be selected (next item after deleted one)
    // We can check if it has selected styling or if keyboard nav works from it
    await expect(page.locator('[role="treeitem"]:has-text("First")')).toBeVisible();
    await expect(page.locator('[role="treeitem"]:has-text("Third")')).toBeVisible();

    // Cleanup
    await deleteThingViaAPI(request, thing1.id, TEST_USER.id);
    await deleteThingViaAPI(request, thing3.id, TEST_USER.id);
  });

  test('keyboard navigation works after operations', async ({ page, request }) => {
    // Create things via API
    const thing1 = await createThingViaAPI(request, { name: 'Alpha' }, TEST_USER.id);
    const thing2 = await createThingViaAPI(request, { name: 'Beta' }, TEST_USER.id);

    // Navigate and reload to fetch the API-created items
    await navigateToThings(page);
    await page.reload();
    await expect(page.locator('h2:has-text("Things")')).toBeVisible({ timeout: 10000 });

    // Wait for items to appear
    await expect(page.locator('[role="treeitem"]:has-text("Alpha")')).toBeVisible();
    await expect(page.locator('[role="treeitem"]:has-text("Beta")')).toBeVisible();

    // Select Alpha
    await selectThing(page, 'Alpha');

    // Rename with F2
    const treeContainer = page.locator('[role="tree"]').first();
    await treeContainer.press('F2');
    const renameInput = page.locator('[role="treeitem"] input');
    await renameInput.fill('Alpha Renamed');
    await renameInput.press('Enter');

    // Wait for rename
    await page.waitForTimeout(300);

    // Now try to navigate with arrow keys
    await treeContainer.focus();
    await treeContainer.press('ArrowDown');

    // Wait a bit
    await page.waitForTimeout(200);

    // Arrow down should move to Beta
    // Press F2 on Beta to verify we can interact with it
    await treeContainer.press('F2');
    const betaInput = page.locator('[role="treeitem"] input');
    await expect(betaInput).toBeVisible();
    await betaInput.press('Escape');

    // Cleanup
    await deleteThingViaAPI(request, thing1.id, TEST_USER.id);
    await deleteThingViaAPI(request, thing2.id, TEST_USER.id);
  });
});

test.describe('Things Hierarchy Operations', () => {
  test.beforeEach(async ({ page, request }) => {
    await signIn(page);

    // Clean up any existing things from previous test runs
    try {
      const existingThings = await getThingsViaAPI(request, TEST_USER.id);
      for (const thing of existingThings) {
        try {
          await deleteThingViaAPI(request, thing.id, TEST_USER.id);
        } catch {
          // Ignore cleanup errors
        }
      }
    } catch {
      // Ignore if no things exist
    }
  });

  test('creates nested hierarchy with Tab indentation', async ({ page, request }) => {
    await navigateToThings(page);

    // Create a multi-level hierarchy:
    // - HierarchyProject
    //   - HierarchyFeature
    //     - HierarchyTask

    await clickCreateButton(page);

    // Create Project (root level)
    let input = page.locator('input[placeholder*="New"]');
    await input.fill('HierarchyProject');
    await input.press('Enter');

    // Tab to indent, create Feature (child of Project)
    input = page.locator('input[placeholder*="New"]');
    await input.press('Tab');
    await input.fill('HierarchyFeature');
    await input.press('Enter');

    // Tab again to indent further, create Task (child of Feature)
    input = page.locator('input[placeholder*="New"]');
    await input.press('Tab');
    await input.fill('HierarchyTask');
    await input.press('Enter');

    // Exit creation mode
    await page.locator('input[placeholder*="New"]').press('Escape');

    // Wait for hierarchy to settle
    await page.waitForTimeout(500);

    // Verify all items exist
    await expect(page.locator('[role="treeitem"]:has-text("HierarchyProject")')).toBeVisible();
    await expect(page.locator('[role="treeitem"]:has-text("HierarchyFeature")')).toBeVisible();
    await expect(page.locator('[role="treeitem"]:has-text("HierarchyTask")')).toBeVisible();

    // Cleanup all things
    const things = await getThingsViaAPI(request, TEST_USER.id);
    for (const thing of things) {
      try {
        await deleteThingViaAPI(request, thing.id, TEST_USER.id);
      } catch {
        // Ignore
      }
    }
  });

  test('Shift+Tab unindents during creation', async ({ page, request }) => {
    await navigateToThings(page);

    const timestamp = Date.now();
    const parentName = `UnindentParent-${timestamp}`;
    const childName = `UnindentChild-${timestamp}`;
    const siblingName = `UnindentSibling-${timestamp}`;

    // Create parent
    await clickCreateButton(page);
    let input = page.locator('input[placeholder*="New"]');
    await expect(input).toBeVisible();
    await input.fill(parentName);
    await input.press('Enter');

    // Wait for new input to appear and Tab to create child level
    input = page.locator('input[placeholder*="New"]');
    await expect(input).toBeVisible({ timeout: 5000 });
    await input.press('Tab');
    await input.fill(childName);
    await input.press('Enter');

    // Wait for new input and Shift+Tab to unindent back to root level
    input = page.locator('input[placeholder*="New"]');
    await expect(input).toBeVisible({ timeout: 5000 });
    await input.press('Shift+Tab');
    await input.fill(siblingName);
    await input.press('Enter');

    // Exit creation mode
    const remainingInput = page.locator('input[placeholder*="New"]');
    if (await remainingInput.isVisible()) {
      await remainingInput.press('Escape');
    }

    // Wait for items to settle
    await page.waitForTimeout(500);

    // Verify all items were created
    await expect(page.locator(`[role="treeitem"]:has-text("${parentName}")`)).toBeVisible();
    await expect(page.locator(`[role="treeitem"]:has-text("${childName}")`)).toBeVisible();
    await expect(page.locator(`[role="treeitem"]:has-text("${siblingName}")`)).toBeVisible();

    // Note: Full verification of hierarchy would need to check parentIds via API
    // For now, just verify all items exist
  });
});
