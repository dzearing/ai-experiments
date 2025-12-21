import { test, expect, type Page, type BrowserContext } from '@playwright/test';

/**
 * Tests for co-author avatar visibility in the toolbar.
 *
 * These tests verify that when multiple users (tabs) are editing the same document,
 * each user sees the other users' avatars displayed to the left of the
 * Edit/Split/Preview segmented control.
 */

// Helper to authenticate a page with a given nickname
async function authenticate(page: Page, nickname: string): Promise<void> {
  // If we're on the landing page, click "Get Started"
  const getStartedBtn = page.getByRole('button', { name: 'Get Started' });
  if (await getStartedBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await getStartedBtn.click();
  }

  // If we're on the auth page, enter nickname
  const nicknameInput = page.getByPlaceholder('Your nickname');
  if (await nicknameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await nicknameInput.fill(nickname);
    await page.getByRole('button', { name: 'Join Ideate' }).click();
    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  }
}

// Helper to create a new document and return its URL
async function createDocument(page: Page, title: string, makePublic = false): Promise<string> {
  // Click "New Document" button
  await page.getByRole('button', { name: 'New Document' }).click();

  // Wait for the dialog to appear and enter title
  const titleInput = page.getByPlaceholder('Enter a title for your document');
  await expect(titleInput).toBeVisible({ timeout: 5000 });
  await titleInput.fill(title);

  // Click Create button (exact match to avoid "Create Document" button)
  await page.getByRole('button', { name: 'Create', exact: true }).click();

  // Wait for document editor to load (look for the editor content area)
  await expect(page.locator('.cm-content').first()).toBeVisible({ timeout: 10000 });

  // Make the document public if requested (click the link icon)
  if (makePublic) {
    // Use .first() as there may be multiple toolbar instances in split mode
    const shareButton = page.getByRole('button', { name: 'Not shared' }).first();
    await shareButton.click();
    // Wait for the button state to update (now it should say "Shared on network")
    await expect(page.getByRole('button', { name: 'Shared on network' }).first()).toBeVisible({ timeout: 5000 });
  }

  // Get the document URL
  return page.url();
}

// Helper to get co-author avatar colors from a page
// Includes retry logic to wait for awareness to stabilize
async function getCoAuthorAvatarColors(page: Page, expectedCount = 0, retries = 10): Promise<string[]> {
  for (let attempt = 0; attempt < retries; attempt++) {
    const avatars = page.locator('[class*="coAuthorAvatars"] [class*="avatar"]');
    const count = await avatars.count();

    // If we got expected count or no expected count specified, return immediately
    if (expectedCount === 0 || count >= expectedCount) {
      const colors: string[] = [];
      for (let i = 0; i < count; i++) {
        const avatar = avatars.nth(i);
        const bgColor = await avatar.evaluate((el) => {
          return window.getComputedStyle(el).backgroundColor;
        });
        colors.push(bgColor);
      }
      return colors;
    }

    // Wait longer and retry - awareness sync can take time
    await page.waitForTimeout(500);
  }

  // Final attempt - return whatever we have
  const avatars = page.locator('[class*="coAuthorAvatars"] [class*="avatar"]');
  const count = await avatars.count();
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    const avatar = avatars.nth(i);
    const bgColor = await avatar.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    colors.push(bgColor);
  }
  return colors;
}

// Helper to get the user's own avatar color from the header
async function getOwnAvatarColor(page: Page): Promise<string> {
  const headerAvatar = page.locator('header [class*="avatar"]').first();
  const bgColor = await headerAvatar.evaluate((el) => {
    return window.getComputedStyle(el).backgroundColor;
  });
  return bgColor;
}

test.describe('Co-author Avatars', () => {
  // Increase timeout for this test suite since it involves multiple browser contexts
  test.setTimeout(60000);
  let context1: BrowserContext;
  let context2: BrowserContext;
  let page1: Page;
  let page2: Page;
  let docUrl: string;

  test.beforeEach(async ({ browser }) => {
    // Create two separate browser contexts (simulates different users/sessions)
    context1 = await browser.newContext();
    context2 = await browser.newContext();
    page1 = await context1.newPage();
    page2 = await context2.newPage();
  });

  test.afterEach(async () => {
    await context1?.close();
    await context2?.close();
  });

  test('co-author avatars should show correct colors and persist through interactions', async () => {
    // Capture browser console for debugging
    page1.on('console', msg => {
      if (msg.text().includes('[yjs]')) {
        console.log(`[Page1] ${msg.text()}`);
      }
    });
    page2.on('console', msg => {
      if (msg.text().includes('[yjs]')) {
        console.log(`[Page2] ${msg.text()}`);
      }
    });

    // Step 1: Open dashboard and authenticate as User1
    await page1.goto('http://localhost:5190');
    await authenticate(page1, 'User1');

    // Step 2: Create a new document and make it public so User2 can access it
    docUrl = await createDocument(page1, 'Co-Author Test Doc', true);
    console.log('Created document:', docUrl);

    // Get User1's own avatar color
    const user1Color = await getOwnAvatarColor(page1);
    console.log('User1 color:', user1Color);

    // Step 3: Open same doc in tab2 as User2
    await page2.goto('http://localhost:5190');
    await authenticate(page2, 'User2');
    await page2.goto(docUrl);
    await expect(page2.locator('.cm-content').first()).toBeVisible({ timeout: 10000 });

    // Get User2's own avatar color
    const user2Color = await getOwnAvatarColor(page2);
    console.log('User2 color:', user2Color);

    // Wait for awareness to sync
    await page1.waitForTimeout(1000);

    // Step 4: Check avatar colors on each tab
    // Tab1 should see Tab2's avatar (User2's color)
    const tab1CoAuthorColors = await getCoAuthorAvatarColors(page1, 1);
    console.log('Tab1 sees co-author colors:', tab1CoAuthorColors);
    expect(tab1CoAuthorColors.length).toBe(1);
    expect(tab1CoAuthorColors[0]).toBe(user2Color);

    // Tab2 should see Tab1's avatar (User1's color)
    const tab2CoAuthorColors = await getCoAuthorAvatarColors(page2, 1);
    console.log('Tab2 sees co-author colors:', tab2CoAuthorColors);
    expect(tab2CoAuthorColors.length).toBe(1);
    expect(tab2CoAuthorColors[0]).toBe(user1Color);

    // Step 5: Refresh both pages and validate again
    await page1.reload();
    await expect(page1.locator('.cm-content').first()).toBeVisible({ timeout: 10000 });
    await page2.reload();
    await expect(page2.locator('.cm-content').first()).toBeVisible({ timeout: 10000 });

    // Wait for awareness sync after refresh
    await page1.waitForTimeout(1000);

    // Verify colors still match after refresh
    const tab1ColorsAfterRefresh = await getCoAuthorAvatarColors(page1, 1);
    console.log('Tab1 co-author colors after refresh:', tab1ColorsAfterRefresh);
    expect(tab1ColorsAfterRefresh.length).toBe(1);
    expect(tab1ColorsAfterRefresh[0]).toBe(user2Color);

    const tab2ColorsAfterRefresh = await getCoAuthorAvatarColors(page2, 1);
    console.log('Tab2 co-author colors after refresh:', tab2ColorsAfterRefresh);
    expect(tab2ColorsAfterRefresh.length).toBe(1);
    expect(tab2ColorsAfterRefresh[0]).toBe(user1Color);

    // Step 6: Add text and validate avatars are still visible
    const editor1 = page1.locator('.cm-content');
    await editor1.click();
    await page1.keyboard.type('Hello from User1!');
    await page1.waitForTimeout(500);

    // Verify avatars still visible after typing
    const tab1ColorsAfterTyping = await getCoAuthorAvatarColors(page1, 1);
    console.log('Tab1 co-author colors after typing:', tab1ColorsAfterTyping);
    expect(tab1ColorsAfterTyping.length).toBe(1);
    expect(tab1ColorsAfterTyping[0]).toBe(user2Color);

    const tab2ColorsAfterTyping = await getCoAuthorAvatarColors(page2, 1);
    console.log('Tab2 co-author colors after typing:', tab2ColorsAfterTyping);
    expect(tab2ColorsAfterTyping.length).toBe(1);
    expect(tab2ColorsAfterTyping[0]).toBe(user1Color);

    // Type in the other editor too
    const editor2 = page2.locator('.cm-content');
    await editor2.click();
    await page2.keyboard.type('Hello from User2!');
    await page2.waitForTimeout(500);

    // Final verification
    // Tab1 should see Tab2's avatar (User2's color)
    const tab1FinalColors = await getCoAuthorAvatarColors(page1, 1);
    console.log('Tab1 final co-author colors:', tab1FinalColors);
    expect(tab1FinalColors.length).toBe(1);
    expect(tab1FinalColors[0]).toBe(user2Color);

    // Tab2 should see Tab1's avatar (User1's color)
    const tab2FinalColors = await getCoAuthorAvatarColors(page2, 1);
    console.log('Tab2 final co-author colors:', tab2FinalColors);
    expect(tab2FinalColors.length).toBe(1);
    expect(tab2FinalColors[0]).toBe(user1Color);
  });
});
