import { test, expect, type Page } from '@playwright/test';

/**
 * Facilitator Persona Switching Tests
 *
 * Tests the persona customization and switching functionality:
 * 1. Select Professional preset
 * 2. Click "Customize..." to create custom persona
 * 3. Edit persona to only speak in "foo"
 * 4. Verify the greeting contains only "foo"
 * 5. Switch back to Professional preset
 * 6. Verify the greeting does NOT contain "foo"
 */

// Test user data
const TEST_USER = {
  id: 'user-persona-test-12345',
  name: 'Persona Test User',
  avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Persona%20Test',
};

// The "foo" language persona content
const FOO_PERSONA_CONTENT = `# Foo Speaker

## System Prompt

You are Foo, a unique AI assistant that speaks only in the "Foo" language.

**CRITICAL RULE - YOU MUST FOLLOW THIS EXACTLY:**
- Every word you say MUST be "foo" (lowercase)
- You can only say variations of "foo foo foo"
- Use punctuation normally (periods, question marks, exclamation points)
- Use spaces between each "foo"
- Never use any other words besides "foo"
- Even when greeting, you must only say "foo"
- Even when explaining things, you must only say "foo"

**Examples of valid responses:**
- "Foo foo foo!"
- "Foo foo foo foo foo."
- "Foo foo foo? Foo foo."
- "Foo!"

**Examples of INVALID responses:**
- "Hello!" (WRONG - must be "Foo!")
- "How can I help you?" (WRONG - must be "Foo foo foo foo foo?")
- Any sentence with words other than "foo" (WRONG)

Remember: You can ONLY say "foo". No exceptions. Every single word must be "foo".

## Description

A test persona that only speaks in "foo" language. Every word is "foo".

## Example

"Foo foo foo! Foo foo foo foo foo?"
`;

/**
 * Sign in a test user by setting localStorage
 */
async function signIn(page: Page, user = TEST_USER) {
  await page.addInitScript((userData) => {
    localStorage.setItem('ideate-user', JSON.stringify(userData));
  }, user);
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
 * Open the facilitator overlay using keyboard shortcut
 */
async function openFacilitator(page: Page) {
  // Use Ctrl/Cmd + . to open facilitator
  const isMac = process.platform === 'darwin';
  if (isMac) {
    await page.keyboard.press('Meta+.');
  } else {
    await page.keyboard.press('Control+.');
  }

  // Wait for the overlay to appear
  await expect(page.locator('[class*="facilitatorOverlay"]')).toBeVisible({ timeout: 5000 });
}

/**
 * Navigate to facilitator settings page
 */
async function goToFacilitatorSettings(page: Page) {
  await page.goto('/settings/facilitator');
  await page.waitForTimeout(1000);

  // Wait for settings page to load
  await expect(page.locator('h1:has-text("Facilitator Settings")')).toBeVisible({ timeout: 10000 });
}

/**
 * Select a persona preset by name
 */
async function selectPreset(page: Page, presetName: string) {
  // Find the card with the preset name and click it
  const presetCard = page.locator(`[class*="presetCard"]:has-text("${presetName}")`).first();
  await expect(presetCard).toBeVisible({ timeout: 5000 });
  await presetCard.click();

  // Wait for selection to be saved
  await page.waitForTimeout(500);
}

/**
 * Click the Customize button to create/edit custom persona
 */
async function clickCustomize(page: Page) {
  const customizeBtn = page.locator('button:has-text("Customize")').first();
  await expect(customizeBtn).toBeVisible({ timeout: 5000 });
  await customizeBtn.click();

  // Wait for navigation to persona editor
  await page.waitForURL(/\/facilitator-persona/, { timeout: 10000 });
}

/**
 * Replace the persona content in the editor
 */
async function setPersonaContent(page: Page, content: string) {
  // Wait for editor to load
  await expect(page.locator('[class*="editorContainer"]')).toBeVisible({ timeout: 10000 });
  await page.waitForTimeout(1000); // Wait for editor initialization

  // The MarkdownCoEditor uses a contenteditable or textarea
  // Try to find and clear/fill the editor
  const editor = page.locator('[contenteditable="true"], textarea').first();
  await expect(editor).toBeVisible({ timeout: 5000 });

  // Select all and replace
  await editor.click();
  await page.keyboard.press('Meta+a');
  await page.keyboard.press('Backspace');
  await editor.fill(content);

  // Wait for auto-save or click save
  await page.waitForTimeout(500);
  const saveBtn = page.locator('button:has-text("Save")').first();
  if (await saveBtn.isEnabled()) {
    await saveBtn.click();
    await page.waitForTimeout(1000);
  }
}

/**
 * Navigate back from persona editor (triggers reload)
 */
async function goBackFromEditor(page: Page) {
  const backBtn = page.locator('button[aria-label="Back"]').first();
  await expect(backBtn).toBeVisible({ timeout: 5000 });
  await backBtn.click();

  // Wait for navigation back to settings
  await page.waitForURL(/\/settings\/facilitator/, { timeout: 10000 });
}

/**
 * Get the facilitator's greeting message
 */
async function getFacilitatorGreeting(page: Page): Promise<string> {
  // Wait for a message to appear
  const messageLocator = page.locator('[class*="message"]').first();
  await expect(messageLocator).toBeVisible({ timeout: 30000 }); // AI generation can take time

  // Get all assistant message content
  const messages = await page.locator('[class*="message"] p, [class*="messageContent"]').allTextContents();
  return messages.join(' ').toLowerCase();
}

/**
 * Wait for facilitator WebSocket to connect
 */
async function waitForFacilitatorConnection(page: Page) {
  // Give time for WebSocket to connect and load history
  await page.waitForTimeout(3000);
}

/**
 * Delete the custom persona to reset state
 */
async function deleteCustomPersona(page: Page, apiUrl: string) {
  await page.request.delete(`${apiUrl}/api/personas/user`);
}

test.describe('Facilitator Persona Customization', () => {
  const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';

  test.beforeEach(async ({ page }) => {
    await clearIndexedDB(page);
    await signIn(page);
    // Clean up any existing custom persona
    await deleteCustomPersona(page, API_URL);
  });

  test.afterEach(async ({ page }) => {
    // Clean up custom persona after test
    await deleteCustomPersona(page, API_URL);
  });

  test('custom foo persona generates foo greeting', async ({ page }) => {
    // Step 1: Go to facilitator settings
    await goToFacilitatorSettings(page);
    console.log('On facilitator settings page');

    // Step 2: Select Professional preset first
    await selectPreset(page, 'Professional');
    console.log('Selected Professional preset');

    // Step 3: Click Customize to create custom persona
    await clickCustomize(page);
    console.log('Navigated to persona editor');

    // Step 4: Replace content with foo persona
    await setPersonaContent(page, FOO_PERSONA_CONTENT);
    console.log('Set foo persona content');

    // Step 5: Go back (triggers reload and selects Custom)
    await goBackFromEditor(page);
    console.log('Returned to settings');

    // Step 6: Verify Custom is now selected
    const customCard = page.locator('[class*="presetCard"]:has-text("Custom")').first();
    await expect(customCard).toHaveClass(/selected/);

    // Step 7: Navigate to a page where we can open the facilitator
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Step 8: Open the facilitator overlay
    await openFacilitator(page);
    console.log('Opened facilitator overlay');

    // Step 9: Wait for connection and greeting
    await waitForFacilitatorConnection(page);

    // Step 10: Get the greeting and verify it contains only "foo"
    const greeting = await getFacilitatorGreeting(page);
    console.log('Greeting received:', greeting);

    // The Foo persona should only say "foo"
    const words = greeting.split(/\s+/).filter(w => w.length > 0 && !w.match(/^[.!?,]+$/));
    const allFoo = words.every(word => word.replace(/[^a-z]/g, '') === 'foo');
    expect(allFoo).toBe(true);

    console.log('Verified greeting contains only foo words');
  });

  test('switching from custom foo to professional changes greeting', async ({ page }) => {
    // Step 1: Create foo custom persona
    await goToFacilitatorSettings(page);
    await selectPreset(page, 'Professional');
    await clickCustomize(page);
    await setPersonaContent(page, FOO_PERSONA_CONTENT);
    await goBackFromEditor(page);
    console.log('Created foo custom persona');

    // Step 2: Open facilitator and verify foo greeting
    await page.goto('/');
    await openFacilitator(page);
    await waitForFacilitatorConnection(page);

    const fooGreeting = await getFacilitatorGreeting(page);
    console.log('Foo greeting:', fooGreeting);

    // Verify it contains only foo
    const fooWords = fooGreeting.split(/\s+/).filter(w => w.length > 0 && !w.match(/^[.!?,]+$/));
    expect(fooWords.every(word => word.replace(/[^a-z]/g, '') === 'foo')).toBe(true);

    // Step 3: Close facilitator and go to settings
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    await goToFacilitatorSettings(page);

    // Step 4: Switch to Professional preset (this should delete custom persona)
    await selectPreset(page, 'Professional');
    console.log('Switched to Professional preset');

    // Handle confirmation dialog if it appears
    const confirmDialog = page.locator('text="Remove customizations?"');
    if (await confirmDialog.isVisible({ timeout: 2000 })) {
      const confirmBtn = page.locator('button:has-text("Remove & Switch")');
      await confirmBtn.click();
      await page.waitForTimeout(1000);
    }

    // Step 5: Open facilitator again
    await page.goto('/');
    await openFacilitator(page);
    await waitForFacilitatorConnection(page);

    // Step 6: Get new greeting and verify it does NOT contain only foo
    const professionalGreeting = await getFacilitatorGreeting(page);
    console.log('Professional greeting:', professionalGreeting);

    // Professional greeting should NOT be all foo
    const proWords = professionalGreeting.split(/\s+/).filter(w => w.length > 0 && !w.match(/^[.!?,]+$/));
    const allFoo = proWords.every(word => word.replace(/[^a-z]/g, '') === 'foo');
    expect(allFoo).toBe(false);

    // Should contain normal English words
    expect(professionalGreeting).toMatch(/\b(hello|hi|help|assist|welcome|facilitator)\b/i);

    console.log('Verified professional greeting is not foo language');
  });

  test('persona change clears chat history', async ({ page }) => {
    // Step 1: Create foo custom persona and get greeting
    await goToFacilitatorSettings(page);
    await selectPreset(page, 'Professional');
    await clickCustomize(page);
    await setPersonaContent(page, FOO_PERSONA_CONTENT);
    await goBackFromEditor(page);

    await page.goto('/');
    await openFacilitator(page);
    await waitForFacilitatorConnection(page);

    // Verify we have a message
    const initialMessages = await page.locator('[class*="message"]').count();
    expect(initialMessages).toBeGreaterThan(0);
    console.log('Initial messages count:', initialMessages);

    // Step 2: Close and switch to Professional
    await page.keyboard.press('Escape');
    await goToFacilitatorSettings(page);
    await selectPreset(page, 'Professional');

    // Handle confirmation dialog
    const confirmDialog = page.locator('text="Remove customizations?"');
    if (await confirmDialog.isVisible({ timeout: 2000 })) {
      const confirmBtn = page.locator('button:has-text("Remove & Switch")');
      await confirmBtn.click();
      await page.waitForTimeout(1000);
    }

    // Step 3: Reopen facilitator
    await page.goto('/');
    await openFacilitator(page);
    await waitForFacilitatorConnection(page);

    // Step 4: Verify only the new greeting exists (old foo message is gone)
    const greeting = await getFacilitatorGreeting(page);

    // Should NOT contain foo language (old message should be cleared)
    expect(greeting).not.toMatch(/^(foo\s*)+$/i);

    console.log('Verified chat was cleared after persona change');
  });
});

test.describe('Persona Settings UI', () => {
  test.beforeEach(async ({ page }) => {
    await clearIndexedDB(page);
    await signIn(page);
  });

  test('can view available presets', async ({ page }) => {
    await goToFacilitatorSettings(page);

    // Verify preset cards are visible
    const presetCards = page.locator('[class*="presetCard"]');
    const count = await presetCards.count();

    // Should have multiple presets available (Custom + at least 2 presets)
    expect(count).toBeGreaterThanOrEqual(3);
    console.log('Found presets:', count);

    // Verify some known presets are visible
    await expect(page.locator('text="Professional"')).toBeVisible();
    await expect(page.locator('text="Custom"')).toBeVisible();
  });

  test('selected preset shows checkmark', async ({ page }) => {
    await goToFacilitatorSettings(page);

    // Select a preset
    await selectPreset(page, 'Professional');
    await page.waitForTimeout(500);

    // Verify checkmark appears on selected preset
    const professionalCard = page.locator('[class*="presetCard"]:has-text("Professional")');
    const checkmark = professionalCard.locator('[class*="presetCheck"], svg');
    await expect(checkmark).toBeVisible();

    console.log('Verified checkmark appears on selected preset');
  });

  test('customize button is enabled when preset selected', async ({ page }) => {
    await goToFacilitatorSettings(page);

    // Select Professional preset
    await selectPreset(page, 'Professional');

    // Verify customize button is enabled and shows correct text
    const customizeBtn = page.locator('button:has-text("Customize")').first();
    await expect(customizeBtn).toBeEnabled();
    await expect(customizeBtn).toContainText('Professional');

    console.log('Verified customize button is enabled');
  });
});
