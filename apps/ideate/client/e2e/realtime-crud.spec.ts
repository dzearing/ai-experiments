import { test, expect, type Page, type APIRequestContext } from '@playwright/test';

/**
 * Real-time CRUD Notification Tests
 *
 * Tests that UI updates in real-time when resources are created, updated, or deleted
 * via API or facilitator (without requiring page refresh).
 */

const API_BASE = 'http://localhost:3002/api';

const TEST_USER = {
  id: 'user-realtime-test-12345',
  name: 'Realtime Test User',
  avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Realtime',
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
    data: { name, description: 'Test workspace' },
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
 * Create a document via API
 */
async function createDocumentViaAPI(
  request: APIRequestContext,
  title: string,
  workspaceId: string,
  userId: string
): Promise<{ id: string; title: string }> {
  const response = await request.post(`${API_BASE}/documents`, {
    data: { title, workspaceId },
    headers: { 'x-user-id': userId },
  });
  expect(response.ok()).toBeTruthy();
  return response.json();
}

/**
 * Delete a document via API
 */
async function deleteDocumentViaAPI(
  request: APIRequestContext,
  documentId: string,
  userId: string
): Promise<void> {
  const response = await request.delete(`${API_BASE}/documents/${documentId}`, {
    headers: { 'x-user-id': userId },
  });
  expect(response.ok()).toBeTruthy();
}

test.describe('Real-time Workspace CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test('workspace appears in list without refresh when created via API', async ({ page, request }) => {
    // Go to workspaces page
    await page.goto('/workspaces');
    await expect(page.locator('h1')).toContainText('Workspaces');

    // Wait for initial load
    await page.waitForTimeout(1000);

    // Create a workspace via API
    const workspaceName = `API Workspace ${Date.now()}`;
    const workspace = await createWorkspaceViaAPI(request, workspaceName, TEST_USER.id);

    // Wait for WebSocket notification
    await page.waitForTimeout(1000);

    // Verify workspace appears in list without refresh
    await expect(page.locator(`text="${workspaceName}"`)).toBeVisible({ timeout: 5000 });

    // Cleanup
    await deleteWorkspaceViaAPI(request, workspace.id, TEST_USER.id);
  });

  test('workspace disappears from list without refresh when deleted via API', async ({ page, request }) => {
    // Create a workspace first
    const workspaceName = `Delete Test Workspace ${Date.now()}`;
    const workspace = await createWorkspaceViaAPI(request, workspaceName, TEST_USER.id);

    // Go to workspaces page
    await page.goto('/workspaces');
    await expect(page.locator('h1')).toContainText('Workspaces');

    // Wait for workspace to appear in the list
    await expect(page.locator(`text="${workspaceName}"`)).toBeVisible({ timeout: 5000 });

    // Delete the workspace via API
    await deleteWorkspaceViaAPI(request, workspace.id, TEST_USER.id);

    // Wait for WebSocket notification
    await page.waitForTimeout(1000);

    // Verify workspace disappears without refresh
    await expect(page.locator(`text="${workspaceName}"`)).not.toBeVisible({ timeout: 5000 });
  });
});

test.describe('Real-time Document CRUD', () => {
  let testWorkspace: { id: string; name: string };

  test.beforeEach(async ({ page, request }) => {
    await signIn(page);

    // Create a test workspace for documents
    const workspaceName = `Doc Test Workspace ${Date.now()}`;
    testWorkspace = await createWorkspaceViaAPI(request, workspaceName, TEST_USER.id);
  });

  test.afterEach(async ({ request }) => {
    // Cleanup workspace
    if (testWorkspace?.id) {
      try {
        await deleteWorkspaceViaAPI(request, testWorkspace.id, TEST_USER.id);
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  test('document appears in workspace without refresh when created via API', async ({ page, request }) => {
    // Navigate to the test workspace detail page
    await page.goto(`/workspace/${testWorkspace.id}`);

    // Wait for page to load - look for the section header with Documents text
    await expect(page.getByRole('heading', { name: 'Documents' })).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(500);

    // Create a document via API
    const docTitle = `API Document ${Date.now()}`;
    const doc = await createDocumentViaAPI(request, docTitle, testWorkspace.id, TEST_USER.id);

    // Wait for WebSocket notification
    await page.waitForTimeout(1000);

    // Verify document appears in the list without refresh
    await expect(page.locator(`text="${docTitle}"`)).toBeVisible({ timeout: 5000 });

    // Cleanup
    await deleteDocumentViaAPI(request, doc.id, TEST_USER.id);
  });

  test('document disappears from workspace without refresh when deleted via API', async ({ page, request }) => {
    // Create a document first
    const docTitle = `Delete Test Document ${Date.now()}`;
    const doc = await createDocumentViaAPI(request, docTitle, testWorkspace.id, TEST_USER.id);

    // Navigate to the test workspace detail page
    await page.goto(`/workspace/${testWorkspace.id}`);

    // Wait for page to load and document to appear
    await expect(page.getByRole('heading', { name: 'Documents' })).toBeVisible({ timeout: 10000 });
    await expect(page.locator(`text="${docTitle}"`)).toBeVisible({ timeout: 5000 });

    // Delete the document via API
    await deleteDocumentViaAPI(request, doc.id, TEST_USER.id);

    // Wait for WebSocket notification
    await page.waitForTimeout(1000);

    // Verify document disappears without refresh
    await expect(page.locator(`text="${docTitle}"`)).not.toBeVisible({ timeout: 5000 });
  });
});

test.describe('Real-time Chatroom CRUD', () => {
  let testWorkspace: { id: string; name: string };

  test.beforeEach(async ({ page, request }) => {
    await signIn(page);

    // Create a test workspace
    const workspaceName = `Chat Test Workspace ${Date.now()}`;
    testWorkspace = await createWorkspaceViaAPI(request, workspaceName, TEST_USER.id);
  });

  test.afterEach(async ({ request }) => {
    if (testWorkspace?.id) {
      try {
        await deleteWorkspaceViaAPI(request, testWorkspace.id, TEST_USER.id);
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  test('chatroom appears in workspace without refresh when created via API', async ({ page, request }) => {
    // Navigate to the workspace detail page
    await page.goto(`/workspace/${testWorkspace.id}`);

    // Wait for page to load
    await expect(page.getByRole('heading', { name: 'Chats' })).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(500);

    // Create a chatroom via API
    const chatroomName = `API Chatroom ${Date.now()}`;
    const response = await request.post(`${API_BASE}/chatrooms`, {
      data: { name: chatroomName, workspaceId: testWorkspace.id },
      headers: { 'x-user-id': TEST_USER.id },
    });
    expect(response.ok()).toBeTruthy();
    const chatroom = await response.json();

    // Wait for WebSocket notification
    await page.waitForTimeout(1000);

    // Verify chatroom appears without refresh
    await expect(page.locator(`text="${chatroomName}"`)).toBeVisible({ timeout: 5000 });

    // Cleanup
    await request.delete(`${API_BASE}/chatrooms/${chatroom.id}`, {
      headers: { 'x-user-id': TEST_USER.id },
    });
  });

  test('chatroom disappears from workspace without refresh when deleted via API', async ({ page, request }) => {
    // Create a chatroom first
    const chatroomName = `Delete Test Chatroom ${Date.now()}`;
    const createResponse = await request.post(`${API_BASE}/chatrooms`, {
      data: { name: chatroomName, workspaceId: testWorkspace.id },
      headers: { 'x-user-id': TEST_USER.id },
    });
    expect(createResponse.ok()).toBeTruthy();
    const chatroom = await createResponse.json();

    // Navigate to the workspace detail page
    await page.goto(`/workspace/${testWorkspace.id}`);

    // Wait for page to load and chatroom to appear
    await expect(page.getByRole('heading', { name: 'Chats' })).toBeVisible({ timeout: 10000 });
    await expect(page.locator(`text="${chatroomName}"`)).toBeVisible({ timeout: 5000 });

    // Delete the chatroom via API
    const deleteResponse = await request.delete(`${API_BASE}/chatrooms/${chatroom.id}`, {
      headers: { 'x-user-id': TEST_USER.id },
    });
    expect(deleteResponse.ok()).toBeTruthy();

    // Wait for WebSocket notification
    await page.waitForTimeout(1000);

    // Verify chatroom disappears without refresh
    await expect(page.locator(`text="${chatroomName}"`)).not.toBeVisible({ timeout: 5000 });
  });
});
