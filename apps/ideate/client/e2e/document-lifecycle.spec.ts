import { test, expect, type Page } from '@playwright/test';

/**
 * Document Lifecycle Tests
 *
 * Tests the complete lifecycle of documents in Ideate:
 * 1. Create a document - verify content correct
 * 2. Navigate away, re-open - verify content persists
 * 3. Make changes, navigate away, re-open - verify changes persist
 * 4. Refresh page - verify content persists
 * 5. Verify no stale visitors/cursors
 */

// Test user data
const TEST_USER = {
  id: 'user-test-user-12345',
  name: 'Test User',
  avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Test%20User',
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
 * Clear IndexedDB to ensure clean state
 */
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

/**
 * Wait for CodeMirror editor to be ready
 */
async function waitForEditor(page: Page) {
  // Use .first() since there may be 2 editors (edit + preview) in split mode
  await expect(page.locator('.cm-editor').first()).toBeVisible({ timeout: 10000 });
  // Wait a bit for initial sync
  await page.waitForTimeout(1000);
}

/**
 * Get the current content from CodeMirror editor
 */
async function getEditorContent(page: Page): Promise<string> {
  return await page.evaluate(() => {
    // Get the first editor (the main edit view)
    const editors = document.querySelectorAll('.cm-editor');
    const editor = editors[0];
    if (!editor) return '';
    const content = editor.querySelector('.cm-content');
    if (!content) return '';
    // Get text content, handling CodeMirror's line structure
    const lines: string[] = [];
    content.querySelectorAll('.cm-line').forEach((line) => {
      lines.push(line.textContent || '');
    });
    return lines.join('\n');
  });
}

/**
 * Type text into the editor at the current cursor position
 */
async function typeInEditor(page: Page, text: string) {
  await page.locator('.cm-content').first().click();
  await page.keyboard.type(text);
}

/**
 * Get the number of co-author avatars visible in the toolbar
 */
async function getVisitorCount(page: Page): Promise<number> {
  // Look for avatar container in the toolbar
  const avatars = page.locator('[class*="coAuthorAvatar"]');
  return await avatars.count();
}

/**
 * Check if "1 visitor" or similar text appears anywhere
 */
async function hasVisitorIndicator(page: Page): Promise<boolean> {
  const text = await page.textContent('body');
  return text?.toLowerCase().includes('visitor') || false;
}

/**
 * Helper to create a document and wait for it to open
 */
async function createDocument(page: Page, title: string) {
  await page.click('button:has-text("New Document")');
  await expect(page.locator('input[placeholder*="title"]')).toBeVisible();
  await page.fill('input[placeholder*="title"]', title);

  // Click the Create button in the modal (using variant="primary" to be specific)
  const createButton = page.locator('button:has-text("Create")').filter({ hasText: 'Create' }).last();
  await createButton.click({ force: true });

  // Wait for navigation to document editor
  await waitForEditor(page);
}

test.describe('Document Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    // Clear IndexedDB and sign in before each test
    await clearIndexedDB(page);
    await signIn(page);
  });

  test('basic document editing - create, edit, navigate away, verify persistence', async ({ page }) => {
    // Step 1: Go to dashboard
    await page.goto('/dashboard');
    await expect(page.locator('h1').first()).toContainText('Welcome back');

    // Step 2: Create a new document
    const docTitle = `Basic Test ${Date.now()}`;
    await createDocument(page, docTitle);

    // Step 2b: Wait for WebSocket to connect (green indicator)
    const connectedIndicator = page.locator('[data-status="connected"]');
    await expect(connectedIndicator).toBeVisible({ timeout: 10000 });
    console.log('WebSocket connected');

    // Step 3: Add a line of text - click in editor first to ensure focus
    const testLine = 'This is my test line of text.';
    await page.locator('.cm-content').first().click();

    // Navigate to end of document using keyboard
    await page.keyboard.press('Meta+End'); // Use Meta on Mac (Control+End for Windows)
    await page.keyboard.press('End'); // Fallback to just End
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.keyboard.type(testLine, { delay: 30 }); // Type with small delay for reliability

    // Verify text appears in editor before navigating
    await expect(async () => {
      const content = await getEditorContent(page);
      expect(content).toContain(testLine);
    }).toPass({ timeout: 5000 });

    console.log('Text typed successfully, waiting for sync...');

    // Wait for sync to server (persist debounce is 2s + buffer)
    await page.waitForTimeout(4000);

    // Step 4: Hit back to go to dashboard
    await page.click('button[aria-label="Back to dashboard"]');
    await expect(page.locator('h1').first()).toContainText('Welcome back');

    // Wait for WebSocket disconnect and server persist
    await page.waitForTimeout(1000);

    // Step 5: Open the document again
    await page.click(`text="${docTitle}"`);
    await waitForEditor(page);

    // Step 6: Verify the line of text is there
    const content = await getEditorContent(page);
    console.log('Content after reopening:', JSON.stringify(content));
    expect(content).toContain(docTitle);
    expect(content).toContain(testLine);
  });

  test('create document, navigate away, reopen - content should persist', async ({ page }) => {
    const docTitle = `Test Doc ${Date.now()}`;

    // Step 1: Go to dashboard
    await page.goto('/dashboard');
    await expect(page.locator('h1').first()).toContainText('Welcome back');

    // Step 2: Create a new document
    await createDocument(page, docTitle);

    // Step 3: Verify initial content (should be "# {title}\n\n")
    const initialContent = await getEditorContent(page);
    console.log('Initial content:', JSON.stringify(initialContent));
    expect(initialContent).toContain(`# ${docTitle}`);

    // Step 5: Verify no stale visitors
    const visitorCount = await getVisitorCount(page);
    expect(visitorCount).toBe(0);

    // Step 6: Navigate back to dashboard
    await page.click('button[aria-label="Back to dashboard"]');
    await expect(page.locator('h1').first()).toContainText('Welcome back');

    // Step 7: Wait for WebSocket to disconnect
    await page.waitForTimeout(500);

    // Step 8: Reopen the document
    await page.click(`text="${docTitle}"`);
    await waitForEditor(page);

    // Step 9: Verify content persists
    const reopenedContent = await getEditorContent(page);
    console.log('Reopened content:', JSON.stringify(reopenedContent));
    expect(reopenedContent).toContain(`# ${docTitle}`);

    // Step 10: Verify no stale visitors on reopen
    const visitorCountAfterReopen = await getVisitorCount(page);
    expect(visitorCountAfterReopen).toBe(0);

    // Step 11: Check no "visitor" text appears
    const hasVisitors = await hasVisitorIndicator(page);
    expect(hasVisitors).toBe(false);
  });

  test('make changes, navigate away, reopen - changes should persist', async ({ page }) => {
    const docTitle = `Edit Test ${Date.now()}`;
    const additionalText = '\n\nThis is additional content.';

    // Create document
    await page.goto('/dashboard');
    await createDocument(page, docTitle);

    // Verify initial content
    const initialContent = await getEditorContent(page);
    expect(initialContent).toContain(`# ${docTitle}`);

    // Type additional content
    await page.keyboard.press('End');
    await page.keyboard.press('End');
    await typeInEditor(page, additionalText);

    // Wait for save to process
    await page.waitForTimeout(3000);

    // Navigate back
    await page.click('button[aria-label="Back to dashboard"]');
    await expect(page.locator('h1').first()).toContainText('Welcome back');

    // Reopen document
    await page.click(`text="${docTitle}"`);
    await waitForEditor(page);

    // Verify changes persist
    const editedContent = await getEditorContent(page);
    console.log('Edited content:', JSON.stringify(editedContent));
    expect(editedContent).toContain(`# ${docTitle}`);
    expect(editedContent).toContain('additional content');
  });

  test('refresh page - content should persist', async ({ page }) => {
    const docTitle = `Refresh Test ${Date.now()}`;

    // Create document
    await page.goto('/dashboard');
    await createDocument(page, docTitle);

    // Get the URL
    const docUrl = page.url();
    expect(docUrl).toContain('/doc/');

    // Verify initial content
    const initialContent = await getEditorContent(page);
    expect(initialContent).toContain(`# ${docTitle}`);

    // Add content
    await page.keyboard.press('End');
    await page.keyboard.press('End');
    await typeInEditor(page, '\n\nContent before refresh.');
    await page.waitForTimeout(3000);

    // Refresh the page
    await page.reload();
    await signIn(page); // Re-apply auth after reload
    await page.reload();
    await waitForEditor(page);

    // Verify content persists after refresh
    const refreshedContent = await getEditorContent(page);
    console.log('Refreshed content:', JSON.stringify(refreshedContent));
    expect(refreshedContent).toContain(`# ${docTitle}`);
    expect(refreshedContent).toContain('Content before refresh');

    // Verify no stale visitors
    const visitorCount = await getVisitorCount(page);
    expect(visitorCount).toBe(0);
  });

  test('document title shows on first line immediately on reopen', async ({ page }) => {
    const docTitle = `First Line Test ${Date.now()}`;

    // Create document
    await page.goto('/dashboard');
    await createDocument(page, docTitle);

    // Wait for sync
    await page.waitForTimeout(2000);

    // Navigate back
    await page.click('button[aria-label="Back to dashboard"]');
    await expect(page.locator('h1').first()).toContainText('Welcome back');
    await page.waitForTimeout(500);

    // Reopen document
    await page.click(`text="${docTitle}"`);
    await waitForEditor(page);

    // Immediately check first line (not after waiting)
    const contentImmediately = await getEditorContent(page);
    console.log('Content immediately on reopen:', JSON.stringify(contentImmediately));

    // First line should NOT be blank
    const firstLine = contentImmediately.split('\n')[0];
    expect(firstLine).not.toBe('');
    expect(firstLine).toContain(`# ${docTitle}`);
  });

  test('connection indicator shows correct state', async ({ page }) => {
    const docTitle = `Connection Test ${Date.now()}`;

    // Create document
    await page.goto('/dashboard');
    await createDocument(page, docTitle);

    // Wait for connection
    await page.waitForTimeout(2000);

    // Check for connection indicator (green dot when connected)
    const connectedIndicator = page.locator('[data-status="connected"]');
    await expect(connectedIndicator).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Multi-tab Collaboration', () => {
  test('two tabs see each other as visitors, persist after refresh', async ({ browser }) => {
    // Create two browser contexts (simulating two tabs for the SAME user)
    // Using same user so both tabs can access the same document
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Sign in both contexts with the SAME user (two tabs, one user)
    // But different display names so we can see them as separate collaborators
    const sharedUser = {
      id: 'user-shared-12345',
      name: 'Shared User',
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Shared',
    };

    await context1.addInitScript((user) => {
      localStorage.setItem('ideate-user', JSON.stringify(user));
    }, sharedUser);
    await context2.addInitScript((user) => {
      localStorage.setItem('ideate-user', JSON.stringify(user));
    }, sharedUser);

    // Clear IndexedDB on both contexts
    await context1.addInitScript(() => {
      indexedDB.databases().then((databases) => {
        databases.forEach((db) => {
          if (db.name) indexedDB.deleteDatabase(db.name);
        });
      });
    });
    await context2.addInitScript(() => {
      indexedDB.databases().then((databases) => {
        databases.forEach((db) => {
          if (db.name) indexedDB.deleteDatabase(db.name);
        });
      });
    });

    try {
      const docTitle = `Multi-Tab Test ${Date.now()}`;

      // Step 1: Tab 1 creates a document
      await page1.goto('/dashboard');
      await expect(page1.locator('h1').first()).toContainText('Welcome back');

      await page1.click('button:has-text("New Document")');
      await expect(page1.locator('input[placeholder*="title"]')).toBeVisible();
      await page1.fill('input[placeholder*="title"]', docTitle);
      const createButton1 = page1.locator('button:has-text("Create")').last();
      await createButton1.click({ force: true });

      // Wait for editor to load
      await expect(page1.locator('.cm-editor').first()).toBeVisible({ timeout: 10000 });
      await page1.waitForTimeout(2000); // Wait for sync

      // Get the document URL
      const docUrl = page1.url();
      expect(docUrl).toContain('/doc/');
      console.log('Document URL:', docUrl);

      // Step 2: Tab 2 opens the same document
      await page2.goto(docUrl);
      await expect(page2.locator('.cm-editor').first()).toBeVisible({ timeout: 10000 });
      await page2.waitForTimeout(2000); // Wait for WebSocket connection and sync

      // Step 3: Verify Tab 1 sees 1 visitor (Tab 2)
      const tab1Avatars = page1.locator('[class*="coAuthorAvatar"]');
      await expect(tab1Avatars).toHaveCount(1, { timeout: 10000 });
      console.log('Tab 1 sees', await tab1Avatars.count(), 'visitor(s)');

      // Step 4: Verify Tab 2 sees 1 visitor (Tab 1)
      const tab2Avatars = page2.locator('[class*="coAuthorAvatar"]');
      await expect(tab2Avatars).toHaveCount(1, { timeout: 10000 });
      console.log('Tab 2 sees', await tab2Avatars.count(), 'visitor(s)');

      // Step 5: Get content from Tab 2 before refresh
      const contentBeforeRefresh = await page2.evaluate(() => {
        const editors = document.querySelectorAll('.cm-editor');
        const editor = editors[0];
        if (!editor) return '';
        const content = editor.querySelector('.cm-content');
        if (!content) return '';
        const lines: string[] = [];
        content.querySelectorAll('.cm-line').forEach((line) => {
          lines.push(line.textContent || '');
        });
        return lines.join('\n');
      });
      console.log('Tab 2 content before refresh:', JSON.stringify(contentBeforeRefresh));
      expect(contentBeforeRefresh).toContain(`# ${docTitle}`);

      // Step 6: Refresh Tab 2
      await page2.reload();
      await expect(page2.locator('.cm-editor').first()).toBeVisible({ timeout: 10000 });
      await page2.waitForTimeout(2000); // Wait for WebSocket reconnection and sync

      // Step 7: Verify content is still correct after refresh
      const contentAfterRefresh = await page2.evaluate(() => {
        const editors = document.querySelectorAll('.cm-editor');
        const editor = editors[0];
        if (!editor) return '';
        const content = editor.querySelector('.cm-content');
        if (!content) return '';
        const lines: string[] = [];
        content.querySelectorAll('.cm-line').forEach((line) => {
          lines.push(line.textContent || '');
        });
        return lines.join('\n');
      });
      console.log('Tab 2 content after refresh:', JSON.stringify(contentAfterRefresh));
      expect(contentAfterRefresh).toContain(`# ${docTitle}`);

      // Step 8: Verify Tab 2 still sees 1 visitor (Tab 1) after refresh
      const tab2AvatarsAfterRefresh = page2.locator('[class*="coAuthorAvatar"]');
      await expect(tab2AvatarsAfterRefresh).toHaveCount(1, { timeout: 10000 });
      console.log('Tab 2 sees', await tab2AvatarsAfterRefresh.count(), 'visitor(s) after refresh');

      // Step 9: Verify Tab 1 still sees 1 visitor (Tab 2) after Tab 2 refreshed
      const tab1AvatarsAfterRefresh = page1.locator('[class*="coAuthorAvatar"]');
      await expect(tab1AvatarsAfterRefresh).toHaveCount(1, { timeout: 10000 });
      console.log('Tab 1 sees', await tab1AvatarsAfterRefresh.count(), 'visitor(s) after Tab 2 refresh');

    } finally {
      // Clean up
      await context1.close();
      await context2.close();
    }
  });
});
