import { test, expect, type Page } from '@playwright/test';

/**
 * Cursor Behavior Tests
 *
 * Tests that the cursor position is maintained correctly during editing,
 * particularly when typing causes state updates (like title sync from H1).
 */

// Test user data
const TEST_USER = {
  id: 'user-cursor-test-12345',
  name: 'Cursor Test User',
  avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Cursor%20Test',
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
  await expect(page.locator('.cm-editor').first()).toBeVisible({ timeout: 10000 });
  // Wait for initial sync
  await page.waitForTimeout(1000);
}

/**
 * Get the current content from CodeMirror editor
 */
async function getEditorContent(page: Page): Promise<string> {
  return await page.evaluate(() => {
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
}

/**
 * Get just the first line of the editor content
 */
async function getFirstLine(page: Page): Promise<string> {
  return await page.evaluate(() => {
    const editor = document.querySelector('.cm-editor');
    if (!editor) return '';
    const firstLine = editor.querySelector('.cm-line');
    return firstLine?.textContent || '';
  });
}

/**
 * Helper to create a document and wait for it to open
 */
async function createDocument(page: Page, title: string) {
  await page.click('button:has-text("New Document")');
  await expect(page.locator('input[placeholder*="title"]')).toBeVisible();
  await page.fill('input[placeholder*="title"]', title);

  const createButton = page.locator('button:has-text("Create")').filter({ hasText: 'Create' }).last();
  await createButton.click({ force: true });

  await waitForEditor(page);
}

test.describe('Cursor Behavior', () => {
  test.beforeEach(async ({ page }) => {
    await clearIndexedDB(page);
    await signIn(page);
  });

  test('typing at end of H1 title should not reset cursor position', async ({ page }) => {
    const docTitle = `CursorTest`;

    // Step 1: Go to dashboard and create a document
    await page.goto('/dashboard');
    await expect(page.locator('h1').first()).toContainText('Welcome back');
    await createDocument(page, docTitle);

    // Step 2: Verify initial content
    const initialFirstLine = await getFirstLine(page);
    console.log('Initial first line:', JSON.stringify(initialFirstLine));
    expect(initialFirstLine).toBe(`# ${docTitle}`);

    // Step 3: Click in the editor to focus it
    await page.locator('.cm-content').first().click();

    // Step 4: Move cursor to end of line 1 (the H1 title line)
    // Use Cmd+Home on Mac, Ctrl+Home on Windows/Linux to go to start
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+Home`);
    // Move to end of line 1
    await page.keyboard.press('End');

    // Step 5: Type a character at the end of the title
    await page.keyboard.type('X');

    // Step 6: Wait a moment for any state updates to process
    await page.waitForTimeout(300);

    // Step 7: Verify the first line has the character at the end (not at beginning)
    const firstLineAfter = await getFirstLine(page);
    console.log('First line after typing X:', JSON.stringify(firstLineAfter));

    // The X should be at the end, not at the beginning
    expect(firstLineAfter).toBe(`# ${docTitle}X`);
    // Make sure X is NOT at the beginning (which would indicate cursor reset)
    expect(firstLineAfter).not.toBe(`X# ${docTitle}`);
    expect(firstLineAfter).not.toMatch(/^#\s*X/); // Not "# X..." at beginning

    // Step 8: Type another character to verify cursor didn't reset
    await page.keyboard.type('Y');
    await page.waitForTimeout(300);

    const firstLineAfter2 = await getFirstLine(page);
    console.log('First line after typing Y:', JSON.stringify(firstLineAfter2));

    // Y should appear right after X at the end
    expect(firstLineAfter2).toBe(`# ${docTitle}XY`);
  });

  test('typing multiple characters in H1 maintains sequential position', async ({ page }) => {
    const docTitle = `SeqTest`;

    // Create document
    await page.goto('/dashboard');
    await createDocument(page, docTitle);

    // Focus and go to end of title
    await page.locator('.cm-content').first().click();
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+Home`);
    await page.keyboard.press('End');

    // Type multiple characters with delays between each
    const chars = ['A', 'B', 'C', 'D', 'E'];
    for (const char of chars) {
      await page.keyboard.type(char);
      await page.waitForTimeout(200); // Give time for state updates
    }

    // Verify all characters are in sequence at the end
    const firstLine = await getFirstLine(page);
    console.log('First line after typing ABCDE:', JSON.stringify(firstLine));

    expect(firstLine).toBe(`# ${docTitle}ABCDE`);
  });

  test('cursor should not jump when title triggers header title update', async ({ page }) => {
    const docTitle = `HeaderSync`;

    // Create document
    await page.goto('/dashboard');
    await createDocument(page, docTitle);

    // Get the title input value initially
    const titleInput = page.locator('input[class*="titleInput"]');
    const titleInputBefore = await titleInput.inputValue();
    console.log('Title input before:', titleInputBefore);
    expect(titleInputBefore).toBe(docTitle);

    // Focus editor and go to end of H1
    await page.locator('.cm-content').first().click();
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+Home`);
    await page.keyboard.press('End');

    // Type a word that will update the title
    await page.keyboard.type('123');
    await page.waitForTimeout(500); // Wait for title sync

    // Verify the first line has the text at the end
    const firstLine = await getFirstLine(page);
    console.log('First line after typing:', JSON.stringify(firstLine));
    expect(firstLine).toBe(`# ${docTitle}123`);

    // Verify the title input was updated (this triggers the re-render)
    const titleInputAfter = await titleInput.inputValue();
    console.log('Title input after:', titleInputAfter);
    expect(titleInputAfter).toBe(`${docTitle}123`);

    // Type more characters to verify cursor is still in the right place
    await page.keyboard.type('456');
    await page.waitForTimeout(300);

    const firstLineFinal = await getFirstLine(page);
    console.log('First line final:', JSON.stringify(firstLineFinal));
    expect(firstLineFinal).toBe(`# ${docTitle}123456`);
  });

  test('typing in middle of H1 should insert at cursor, not at line start', async ({ page }) => {
    const docTitle = `MiddleTest`;

    // Create document
    await page.goto('/dashboard');
    await createDocument(page, docTitle);

    // Focus and go to start of title, then move right into the word
    await page.locator('.cm-content').first().click();
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+Home`);
    // Move to end of line then back 4 characters to be in "Test"
    await page.keyboard.press('End');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');

    // Type a character - should insert at cursor position, not line start
    await page.keyboard.type('X');
    await page.waitForTimeout(300);

    const firstLine = await getFirstLine(page);
    console.log('First line after middle insert:', JSON.stringify(firstLine));

    // X should be inserted 4 characters before the end: "MiddleXTest"
    expect(firstLine).toBe(`# MiddleXTest`);
    // NOT at the beginning
    expect(firstLine).not.toMatch(/^X/);
    expect(firstLine).not.toMatch(/^#\s*X/);
  });
});
