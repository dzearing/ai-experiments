import { test, expect, type Page, type APIRequestContext } from '@playwright/test';

/**
 * Idea Creation and Edit Mode Content Sync Tests
 *
 * Tests that:
 * 1. Ideas can be created by editing markdown and saving
 * 2. Save button is enabled when content is valid
 * 3. Idea card reflects the title, summary, and tags after save
 */

const API_BASE = 'http://localhost:3002/api';

const TEST_USER = {
  id: 'user-idea-test-12345',
  name: 'Idea Test User',
  avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=IdeaTest',
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
    data: { name, description: 'Test workspace for ideas' },
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

test.describe('Idea Creation - Editor Content Sync', () => {
  let testWorkspace: { id: string; name: string };

  // Unique test data for this run
  const timestamp = Date.now();
  const TEST_TITLE = `Test Idea ${timestamp}`;
  const TEST_SUMMARY = `This is a test summary for idea ${timestamp}`;
  const TEST_TAGS = ['test-tag', 'automation'];
  const TEST_DESCRIPTION = `This is the detailed description for our test idea created at ${timestamp}.`;

  test.beforeAll(async ({ request }) => {
    // Create a test workspace
    const workspaceName = `Idea Test Workspace ${timestamp}`;
    testWorkspace = await createWorkspaceViaAPI(request, workspaceName, TEST_USER.id);
  });

  test.afterAll(async ({ request }) => {
    // Cleanup workspace
    if (testWorkspace?.id) {
      try {
        await deleteWorkspaceViaAPI(request, testWorkspace.id, TEST_USER.id);
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  test('can create idea by editing markdown - save button enabled and card appears', async ({ page }) => {
    await signIn(page);

    // Step 1: Navigate to the Ideas page for our workspace
    await page.goto(`/workspace/${testWorkspace.id}/ideas`);

    // Wait for page to load
    await expect(page.locator('h1')).toContainText('Ideas', { timeout: 10000 });
    await page.waitForTimeout(500);

    // Step 2: Click "New Idea" button
    await page.click('button:has-text("New Idea")');

    // Wait for overlay to appear (specifically the Idea workspace dialog)
    const ideaDialog = page.getByRole('dialog', { name: 'Idea workspace' });
    await expect(ideaDialog).toBeVisible({ timeout: 5000 });

    // Step 3: Switch to Edit mode and enter markdown content
    const editButton = ideaDialog.locator('button:has-text("Edit")');
    await editButton.click();
    await page.waitForTimeout(300);

    // Build the markdown content
    const markdownContent = `# ${TEST_TITLE}

## Summary
${TEST_SUMMARY}

Tags: ${TEST_TAGS.join(', ')}

---

${TEST_DESCRIPTION}`;

    // Find the CodeMirror editor
    const editor = ideaDialog.locator('.cm-content');
    await expect(editor).toBeVisible({ timeout: 5000 });

    // Clear existing content and type new content line by line
    await editor.click();
    await page.keyboard.press('Meta+a'); // Select all
    await page.keyboard.press('Backspace'); // Delete selected content
    await page.waitForTimeout(100);

    // Type content line by line, pressing Enter for newlines
    const lines = markdownContent.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i]) {
        await page.keyboard.type(lines[i], { delay: 1 });
      }
      if (i < lines.length - 1) {
        await page.keyboard.press('Enter');
      }
    }

    // Wait for content to propagate to React state
    await page.waitForTimeout(2000);

    // Step 4: Verify the Save button is NOT disabled
    const saveButton = ideaDialog.locator('button:has-text("Create Idea")');
    await expect(saveButton).toBeEnabled({ timeout: 10000 });

    // Step 5: Click Save
    await saveButton.click();

    // Wait for overlay to close
    await page.waitForTimeout(1000);
    await expect(ideaDialog).not.toBeVisible({ timeout: 15000 });

    // Step 6: Verify the idea card shows correct title
    await page.waitForTimeout(1000); // Wait for real-time update

    // Find the card with our title
    const ideaCard = page.locator(`h3:has-text("${TEST_TITLE}")`).first();
    await expect(ideaCard).toBeVisible({ timeout: 10000 });

    // Verify summary is shown on the card
    await expect(page.locator(`text="${TEST_SUMMARY}"`).first()).toBeVisible({ timeout: 5000 });

    // Verify at least one tag is shown
    await expect(page.locator(`text="${TEST_TAGS[0]}"`).first()).toBeVisible({ timeout: 5000 });

    console.log('✅ All assertions passed! Idea created and saved successfully.');
  });
});
