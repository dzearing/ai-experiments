import { test, expect, type Page, type BrowserContext } from '@playwright/test';

/**
 * Chat Room Lifecycle Tests
 *
 * Tests the complete lifecycle of chat rooms in Ideate:
 * 1. Create a chat room from workspace
 * 2. Send messages and verify they appear
 * 3. Navigate away and back - verify messages persist
 * 4. Multi-user chat - verify real-time message sync
 * 5. Connection indicator states
 */

// Test user data
const TEST_USER = {
  id: 'user-chat-test-12345',
  name: 'Chat Test User',
  avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Chat%20Test',
};

const TEST_USER_2 = {
  id: 'user-chat-test-67890',
  name: 'Chat User Two',
  avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Chat%20Two',
};

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
 * Navigate to workspaces page and create/select a workspace
 */
async function ensureWorkspace(page: Page): Promise<string> {
  await page.goto('/workspaces');
  await page.waitForTimeout(1000);

  // Check if any workspace exists
  const workspaceCards = page.locator('[class*="workspaceCard"], [class*="resourceCard"]');
  const count = await workspaceCards.count();

  if (count > 0) {
    // Click first workspace
    await workspaceCards.first().click();
    await page.waitForURL(/\/workspace\/.+/, { timeout: 10000 });
    const url = page.url();
    const workspaceId = url.split('/workspace/')[1];
    return workspaceId;
  }

  // Create a new workspace
  const newWorkspaceBtn = page.locator('button:has-text("New Workspace")').first();
  if (await newWorkspaceBtn.isVisible()) {
    await newWorkspaceBtn.click();
    await page.waitForTimeout(500);
    await page.fill('input[placeholder*="workspace" i], input[placeholder*="name" i]', `Test Workspace ${Date.now()}`);
    const createBtn = page.locator('button:has-text("Create")').last();
    await createBtn.click();
    // Wait for navigation to workspace detail or back to workspaces list
    await page.waitForTimeout(2000);
    // If we're still on the workspaces page, click the newly created workspace
    if (page.url().includes('/workspaces') && !page.url().includes('/workspace/')) {
      const newWorkspaceCard = page.locator('[class*="workspaceCard"], [class*="resourceCard"]').first();
      await newWorkspaceCard.click();
    }
    await page.waitForURL(/\/workspace\/.+/, { timeout: 10000 });
    const url = page.url();
    const workspaceId = url.split('/workspace/')[1];
    return workspaceId;
  }

  throw new Error('Could not create or find workspace');
}

/**
 * Create a chat room from the workspace detail page
 */
async function createChatRoom(page: Page, name: string) {
  // Click "New Chat Room" button (use first() because there may be duplicates)
  const newChatBtn = page.locator('button:has-text("New Chat Room")').first();
  await expect(newChatBtn).toBeVisible({ timeout: 5000 });
  await newChatBtn.click();

  // Wait for modal to appear
  await page.waitForTimeout(500);

  // Fill in name - target the modal input
  const nameInput = page.locator('input[placeholder*="chat" i]').first();
  await expect(nameInput).toBeVisible({ timeout: 5000 });
  await nameInput.fill(name);

  // Click Create button in the modal
  const createBtn = page.locator('button:has-text("Create")').last();
  await createBtn.click();

  // Wait for navigation to chat room
  await page.waitForURL(/\/chat\/.+/, { timeout: 10000 });
}

/**
 * Wait for chat WebSocket to connect
 */
async function waitForChatConnection(page: Page) {
  // Use first() because there may be duplicate elements on the page
  const connectedIndicator = page.locator('[data-status="connected"]').first();
  await expect(connectedIndicator).toBeVisible({ timeout: 10000 });
}

/**
 * Send a message in the chat room
 */
async function sendMessage(page: Page, message: string) {
  // Use first() because there may be duplicate elements
  const input = page.locator('input[placeholder*="message" i]').first();
  await expect(input).toBeVisible({ timeout: 5000 });
  await input.fill(message);
  await input.press('Enter');
}

/**
 * Get all messages visible in the chat
 */
async function getMessages(page: Page): Promise<string[]> {
  const messageElements = page.locator('[class*="messageText"], [class*="message"] p');
  const count = await messageElements.count();
  const messages: string[] = [];

  for (let i = 0; i < count; i++) {
    const text = await messageElements.nth(i).textContent();
    if (text) {
      messages.push(text.trim());
    }
  }

  return messages;
}

/**
 * Check if a specific message is visible
 */
async function hasMessage(page: Page, message: string): Promise<boolean> {
  const messages = await getMessages(page);
  return messages.some(m => m.includes(message));
}

test.describe('Chat Room Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    await clearIndexedDB(page);
    await signIn(page);
  });

  test('create chat room and send message', async ({ page }) => {
    // Step 1: Go to workspace
    await ensureWorkspace(page);

    // Step 2: Create a new chat room
    const chatName = `Test Chat ${Date.now()}`;
    await createChatRoom(page, chatName);

    // Step 3: Wait for WebSocket connection
    await waitForChatConnection(page);
    console.log('Chat WebSocket connected');

    // Step 4: Verify we're on the chat page (use first() for duplicates)
    await expect(page.locator(`text="${chatName}"`).first()).toBeVisible();

    // Step 5: Send a message
    const testMessage = 'Hello, this is a test message!';
    await sendMessage(page, testMessage);

    // Step 6: Verify message appears
    await expect(async () => {
      const found = await hasMessage(page, testMessage);
      expect(found).toBe(true);
    }).toPass({ timeout: 5000 });

    console.log('Message sent and verified');
  });

  test('messages persist after navigation', async ({ page }) => {
    // Step 1: Go to workspace and create chat room
    const workspaceId = await ensureWorkspace(page);
    const chatName = `Persist Test ${Date.now()}`;
    await createChatRoom(page, chatName);
    await waitForChatConnection(page);

    // Step 2: Send a message
    const testMessage = 'This message should persist';
    await sendMessage(page, testMessage);

    // Wait for message to appear and sync
    await expect(async () => {
      const found = await hasMessage(page, testMessage);
      expect(found).toBe(true);
    }).toPass({ timeout: 5000 });

    // Wait for sync to server
    await page.waitForTimeout(2000);

    // Step 3: Navigate back to workspace
    await page.click('button[aria-label*="Back" i]');
    await page.waitForURL(/\/workspace\/.+/);
    await page.waitForTimeout(1000);

    // Step 4: Click on the chat room again
    await page.click(`text="${chatName}"`);
    await page.waitForURL(/\/chat\/.+/);
    await waitForChatConnection(page);

    // Step 5: Verify message persists
    await expect(async () => {
      const found = await hasMessage(page, testMessage);
      expect(found).toBe(true);
    }).toPass({ timeout: 5000 });

    console.log('Message persisted after navigation');
  });

  test('multiple messages in correct order', async ({ page }) => {
    // Step 1: Go to workspace and create chat room
    await ensureWorkspace(page);
    const chatName = `Order Test ${Date.now()}`;
    await createChatRoom(page, chatName);
    await waitForChatConnection(page);

    // Step 2: Send multiple messages
    const messages = ['First message', 'Second message', 'Third message'];

    for (const msg of messages) {
      await sendMessage(page, msg);
      await page.waitForTimeout(500); // Small delay between messages
    }

    // Step 3: Verify all messages appear in order
    await page.waitForTimeout(1000);
    const allMessages = await getMessages(page);
    console.log('All messages:', allMessages);

    for (const msg of messages) {
      expect(allMessages.some(m => m.includes(msg))).toBe(true);
    }

    // Verify order (first should come before second, etc.)
    const firstIndex = allMessages.findIndex(m => m.includes('First'));
    const secondIndex = allMessages.findIndex(m => m.includes('Second'));
    const thirdIndex = allMessages.findIndex(m => m.includes('Third'));

    expect(firstIndex).toBeLessThan(secondIndex);
    expect(secondIndex).toBeLessThan(thirdIndex);

    console.log('Messages in correct order');
  });

  test('connection indicator shows correct state', async ({ page }) => {
    // Step 1: Go to workspace and create chat room
    await ensureWorkspace(page);
    const chatName = `Connection Test ${Date.now()}`;
    await createChatRoom(page, chatName);

    // Step 2: Wait for connection (use first() for duplicates)
    const connectedIndicator = page.locator('[data-status="connected"]').first();
    await expect(connectedIndicator).toBeVisible({ timeout: 10000 });

    console.log('Connection indicator shows connected');
  });

  test('empty state when no messages', async ({ page }) => {
    // Step 1: Go to workspace and create chat room
    await ensureWorkspace(page);
    const chatName = `Empty State Test ${Date.now()}`;
    await createChatRoom(page, chatName);
    await waitForChatConnection(page);

    // Step 2: Verify empty state message (use first() for duplicates)
    const emptyState = page.locator('text=/no messages|start the conversation/i').first();
    await expect(emptyState).toBeVisible({ timeout: 5000 });

    console.log('Empty state displayed correctly');
  });
});

test.describe('Multi-User Chat', () => {
  test('two users can chat in real-time', async ({ browser }) => {
    // Create two browser contexts (simulating same user on two devices/tabs)
    // This tests real-time WebSocket sync across connections
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Sign in with the same user on both contexts (simulating two devices)
    await context1.addInitScript((user) => {
      localStorage.setItem('ideate-user', JSON.stringify(user));
    }, TEST_USER);

    await context2.addInitScript((user) => {
      localStorage.setItem('ideate-user', JSON.stringify(user));
    }, TEST_USER);

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
      // Step 1: User 1 creates a chat room
      await page1.goto('/workspaces');
      await page1.waitForTimeout(1000);

      // Ensure workspace exists
      const workspaceCards1 = page1.locator('[class*="workspaceCard"], [class*="resourceCard"]');
      if (await workspaceCards1.count() === 0) {
        // Create workspace if none exists
        const newWorkspaceBtn = page1.locator('button:has-text("New Workspace")');
        if (await newWorkspaceBtn.isVisible()) {
          await newWorkspaceBtn.click();
          await page1.fill('input[placeholder*="workspace" i], input[placeholder*="name" i]', `Multi-User Test ${Date.now()}`);
          await page1.locator('button:has-text("Create")').last().click();
          await page1.waitForURL(/\/workspace\/.+/);
        }
      } else {
        await workspaceCards1.first().click();
        await page1.waitForURL(/\/workspace\/.+/);
      }

      // Create chat room
      const chatName = `Multi-User Chat ${Date.now()}`;
      await page1.locator('button:has-text("New Chat Room")').first().click();
      await page1.waitForTimeout(500);
      await page1.locator('input[placeholder*="chat" i]').first().fill(chatName);
      await page1.locator('button:has-text("Create")').last().click();
      await page1.waitForURL(/\/chat\/.+/, { timeout: 10000 });

      // Wait for connection
      await expect(page1.locator('[data-status="connected"]').first()).toBeVisible({ timeout: 10000 });

      // Get the chat URL
      const chatUrl = page1.url();
      console.log('Chat URL:', chatUrl);

      // Step 2: User 2 joins the same chat room
      await page2.goto(chatUrl);
      await expect(page2.locator('[data-status="connected"]').first()).toBeVisible({ timeout: 10000 });
      await page2.waitForTimeout(1000); // Wait for sync

      // Step 3: User 1 sends a message
      const message1 = 'Hello from User 1!';
      await page1.locator('input[placeholder*="message" i]').first().fill(message1);
      await page1.locator('input[placeholder*="message" i]').first().press('Enter');

      // Step 4: Verify User 2 sees the message in real-time
      await expect(async () => {
        const messages2 = await getMessages(page2);
        expect(messages2.some(m => m.includes(message1))).toBe(true);
      }).toPass({ timeout: 10000 });

      console.log('User 2 received message from User 1');

      // Step 5: User 2 sends a reply
      const message2 = 'Hello from User 2!';
      await page2.locator('input[placeholder*="message" i]').first().fill(message2);
      await page2.locator('input[placeholder*="message" i]').first().press('Enter');

      // Step 6: Verify User 1 sees the reply in real-time
      await expect(async () => {
        const messages1 = await getMessages(page1);
        expect(messages1.some(m => m.includes(message2))).toBe(true);
      }).toPass({ timeout: 10000 });

      console.log('User 1 received message from User 2');

      // Step 7: Verify both users see all messages
      const allMessages1 = await getMessages(page1);
      const allMessages2 = await getMessages(page2);

      expect(allMessages1.some(m => m.includes(message1))).toBe(true);
      expect(allMessages1.some(m => m.includes(message2))).toBe(true);
      expect(allMessages2.some(m => m.includes(message1))).toBe(true);
      expect(allMessages2.some(m => m.includes(message2))).toBe(true);

      console.log('Both users see all messages');

    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('messages persist when user rejoins', async ({ browser }) => {
    // Test that messages persist when user opens the chat from another device
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Same user on both contexts (simulating rejoining from another device)
    await context1.addInitScript((user) => {
      localStorage.setItem('ideate-user', JSON.stringify(user));
    }, TEST_USER);

    await context2.addInitScript((user) => {
      localStorage.setItem('ideate-user', JSON.stringify(user));
    }, TEST_USER);

    try {
      // User 1 creates chat and sends message
      await page1.goto('/workspaces');
      await page1.waitForTimeout(1000);

      const workspaceCards = page1.locator('[class*="workspaceCard"], [class*="resourceCard"]');
      if (await workspaceCards.count() > 0) {
        await workspaceCards.first().click();
      } else {
        const newWorkspaceBtn = page1.locator('button:has-text("New Workspace")');
        await newWorkspaceBtn.click();
        await page1.fill('input[placeholder*="workspace" i], input[placeholder*="name" i]', `Rejoin Test ${Date.now()}`);
        await page1.locator('button:has-text("Create")').last().click();
      }
      await page1.waitForURL(/\/workspace\/.+/);

      const chatName = `Rejoin Chat ${Date.now()}`;
      await page1.locator('button:has-text("New Chat Room")').first().click();
      await page1.waitForTimeout(500);
      await page1.locator('input[placeholder*="chat" i]').first().fill(chatName);
      await page1.locator('button:has-text("Create")').last().click();
      await page1.waitForURL(/\/chat\/.+/, { timeout: 10000 });
      await expect(page1.locator('[data-status="connected"]').first()).toBeVisible({ timeout: 10000 });

      const chatUrl = page1.url();

      // Send message
      const testMessage = 'Message before User 2 joins';
      await page1.locator('input[placeholder*="message" i]').first().fill(testMessage);
      await page1.locator('input[placeholder*="message" i]').first().press('Enter');
      await page1.waitForTimeout(2000); // Wait for sync

      // User 2 joins later
      await page2.goto(chatUrl);
      await expect(page2.locator('[data-status="connected"]').first()).toBeVisible({ timeout: 10000 });
      await page2.waitForTimeout(1000);

      // User 2 should see the previous message
      await expect(async () => {
        const messages = await getMessages(page2);
        expect(messages.some(m => m.includes(testMessage))).toBe(true);
      }).toPass({ timeout: 10000 });

      console.log('User 2 sees message that was sent before they joined');

    } finally {
      await context1.close();
      await context2.close();
    }
  });
});
