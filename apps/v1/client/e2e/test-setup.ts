import { test as base, expect } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Create a test fixture that sets up a temporary workspace
export const test = base.extend<{
  testWorkspace: string;
}>({
  testWorkspace: async ({}, use) => {
    // Create a temporary test workspace
    const testDir = path.join(os.tmpdir(), `e2e-test-workspace-${Date.now()}`);

    try {
      console.log(`Creating test workspace at: ${testDir}`);

      // Create the workspace via API
      const createResponse = await fetch('http://localhost:3000/api/workspace/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspacePath: testDir }),
      });

      if (!createResponse.ok) {
        throw new Error(`Failed to create test workspace: ${createResponse.statusText}`);
      }

      // Create a test project
      const projectResponse = await fetch('http://localhost:3000/api/workspace/create-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspacePath: testDir,
          projectName: 'Test Project',
        }),
      });

      if (!projectResponse.ok) {
        throw new Error(`Failed to create test project: ${projectResponse.statusText}`);
      }

      // Create a simple test repo directory manually
      const projectPath = path.join(testDir, 'projects', 'test-project');
      const reposPath = path.join(projectPath, 'repos');
      await fs.mkdir(reposPath, { recursive: true });

      // Create a fake repo directory for testing
      const testRepoPath = path.join(reposPath, 'hello-world-1');
      await fs.mkdir(testRepoPath, { recursive: true });

      // Create a simple README.md file
      await fs.writeFile(
        path.join(testRepoPath, 'README.md'),
        '# Hello World\nThis is a test repository.'
      );

      // Update the project's REPOS.md file
      const reposMdContent = `# Repository usage

## Repository information

- **URL**: https://github.com/octocat/Hello-World.git
- **Type**: GitHub
- **Access**: Public

## Available clones

- hello-world-1: Available

## Active work

(No active work)
`;
      await fs.writeFile(path.join(projectPath, 'REPOS.md'), reposMdContent);

      await use(testDir);
    } finally {
      // Cleanup: remove the test workspace
      try {
        await fs.rm(testDir, { recursive: true, force: true });
        console.log(`Cleaned up test workspace: ${testDir}`);
      } catch (error) {
        console.warn(`Failed to cleanup test workspace: ${error}`);
      }
    }
  },
});

export { expect };

// Helper function to set up workspace in browser
export async function setupWorkspaceInBrowser(page: any, workspacePath: string) {
  // Set the workspace in localStorage to bypass the workspace dialog
  await page.addInitScript((path: string) => {
    localStorage.setItem(
      'workspaceConfig',
      JSON.stringify({
        path: path,
        name: path.split('/').pop() || 'Test Workspace',
      })
    );
  }, workspacePath);

  // Navigate to the app
  await page.goto('http://localhost:5173');

  // Wait for the initial DOM to be ready
  await page.waitForLoadState('domcontentloaded');

  // Wait for the workspace to load by checking if we're past the workspace selection
  await page.waitForFunction(
    () => {
      // Check if we're past the workspace selection screen
      return (
        !document.querySelector('[data-testid="workspace-dialog"]') &&
        !document.body.textContent?.includes('Select workspace')
      );
    },
    { timeout: 10000 }
  );

  // Navigate to projects page if not already there
  const currentUrl = page.url();
  if (!currentUrl.includes('/projects')) {
    await page.goto('http://localhost:5173/projects');
    await page.waitForLoadState('domcontentloaded');
  }

  // Wait for projects page to be ready
  await page.waitForSelector('[data-testid="project-card"]', { timeout: 10000 });
}
