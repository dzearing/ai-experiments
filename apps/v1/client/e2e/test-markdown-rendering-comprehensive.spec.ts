import { test, expect, setupWorkspaceInBrowser } from './test-setup';
import * as path from 'path';
import * as fs from 'fs/promises';

test.describe('Claude Code Comprehensive Markdown Rendering', () => {
  test.beforeEach(async () => {
    // Clear any existing Claude sessions
    const sessionsPath = path.join(process.cwd(), '..', '..', '..', 'claude-sessions');
    try {
      await fs.rm(sessionsPath, { recursive: true, force: true });
    } catch (err) {
      // Ignore if doesn't exist
    }
  });

  test('should render all markdown elements correctly from server response', async ({
    page,
    testWorkspace,
  }) => {
    // Set up workspace and navigate to projects page
    await setupWorkspaceInBrowser(page, testWorkspace);

    // Navigate to Claude Code
    const projectCard = page.locator('[data-testid="project-card"]').first();
    await expect(projectCard).toBeVisible({ timeout: 10000 });
    await projectCard.click();
    await page.waitForSelector('[data-testid="repo-card"]', { timeout: 10000 });

    const claudeCodeButton = page.locator('[data-testid="claude-code-button"]').first();
    await expect(claudeCodeButton).toBeVisible({ timeout: 10000 });

    // Dismiss any blocking UI elements
    const toasts = page.locator('.fixed.bottom-4.right-4');
    if ((await toasts.count()) > 0) {
      // Click outside to dismiss any toasts
      await page.click('body', { position: { x: 10, y: 10 } });
      await page.waitForTimeout(1000);
    }

    // Force click the button if regular click doesn't work
    try {
      await claudeCodeButton.click({ timeout: 5000 });
    } catch (e) {
      console.log('Regular click failed, trying force click');
      await claudeCodeButton.click({ force: true });
    }
    await page.waitForURL('**/claude-code/**');
    await page.waitForSelector('[data-testid="message-list"]', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Wait for greeting message
    await page.waitForSelector('[data-testid="message-bubble"]', { timeout: 30000 });

    // Intercept the SSE response to capture what the server sends
    const serverResponse = '';
    const capturedMessages: any[] = [];

    // Listen to network events to capture SSE data
    page.on('response', async (response) => {
      if (response.url().includes('/api/claude/chat') && response.request().method() === 'POST') {
        // This is our SSE endpoint
        const responseBody = await response.text().catch(() => '');
        console.log('SSE Response captured:', responseBody.substring(0, 200) + '...');
      }
    });

    // Also monitor console for any markdown parsing errors
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('markdown')) {
        console.error('Markdown parsing error:', msg.text());
      }
    });

    // Send a message requesting various markdown elements
    const testMessage = `Please respond with EXACTLY this markdown (don't add any extra text):

# Header 1
## Header 2
### Header 3

This is a **bold** word and this is *italic* text.

Here's a list:
- Item 1
- Item 2
- Item 3

Numbered list:
1. First item
2. Second item
3. Third item

Task list:
- [ ] Unchecked task
- [x] Checked task

Here's some \`inline code\` and a code block:

\`\`\`javascript
function hello() {
  console.log("Hello World");
}
\`\`\`

> This is a blockquote

Here's a [link to example](https://example.com)

---

End of markdown test.`;

    const messageInput = page.locator('[data-testid="message-input"]');
    await expect(messageInput).toBeVisible();
    await messageInput.fill(testMessage);

    // Send the message
    await messageInput.press('Enter');

    // Wait for response to complete
    await page.waitForTimeout(2000);

    // Wait for assistant's response
    await page.waitForFunction(
      () => {
        const messages = document.querySelectorAll('[data-testid="message-bubble"]');
        return messages.length >= 3;
      },
      { timeout: 30000 }
    );

    // Wait a bit more to ensure streaming is complete
    await page.waitForTimeout(3000);

    // Get the assistant's response
    const messages = page.locator('[data-testid="message-bubble"]');
    const messageCount = await messages.count();
    const responseElement = messages.nth(messageCount - 1);

    // Take screenshot for debugging
    await page.screenshot({ path: 'markdown-comprehensive-test.png', fullPage: true });

    // Get the response content
    const responseText = await responseElement.textContent();
    const responseHTML = await responseElement.innerHTML();

    console.log('Response text:', responseText);
    console.log('Response HTML (first 500 chars):', responseHTML.substring(0, 500));

    // Verify content is not [object Object]
    expect(responseText).not.toContain('[object Object]');

    // Test 1: Headers are rendered (not showing # symbols)
    expect(responseText).not.toContain('# Header 1');
    expect(responseText).not.toContain('## Header 2');
    expect(responseText).not.toContain('### Header 3');

    // Headers should be rendered as actual headers
    const h1Elements = await responseElement.locator('h1').count();
    const h2Elements = await responseElement.locator('h2').count();
    const h3Elements = await responseElement.locator('h3').count();

    expect(h1Elements).toBeGreaterThan(0);
    expect(h2Elements).toBeGreaterThan(0);
    expect(h3Elements).toBeGreaterThan(0);

    // Test 2: Bold and italic text
    expect(responseText).not.toContain('**bold**');
    expect(responseText).not.toContain('*italic*');

    const strongElements = await responseElement.locator('strong').count();
    const emElements = await responseElement.locator('em').count();

    expect(strongElements).toBeGreaterThan(0);
    expect(emElements).toBeGreaterThan(0);

    // Test 3: Lists are rendered properly
    const ulElements = await responseElement.locator('ul').count();
    const olElements = await responseElement.locator('ol').count();
    const liElements = await responseElement.locator('li').count();

    expect(ulElements).toBeGreaterThan(0);
    expect(olElements).toBeGreaterThan(0);
    expect(liElements).toBeGreaterThan(0);

    // Test 4: Checkboxes are rendered
    const checkboxes = await responseElement.locator('input[type="checkbox"]').count();
    expect(checkboxes).toBe(2); // One checked, one unchecked

    // Verify one is checked and one is not
    const checkedBoxes = await responseElement.locator('input[type="checkbox"][checked]').count();
    expect(checkedBoxes).toBe(1);

    // Test 5: Code blocks and inline code
    expect(responseText).not.toContain('```javascript');
    expect(responseText).not.toContain('```');

    const preElements = await responseElement.locator('pre').count();
    const codeElements = await responseElement.locator('code').count();

    expect(preElements).toBeGreaterThan(0);
    expect(codeElements).toBeGreaterThan(0);

    // Verify inline code doesn't show backticks
    const inlineCodeElements = await responseElement.locator('code').all();
    for (const codeEl of inlineCodeElements) {
      const codeText = await codeEl.textContent();
      if (codeText?.includes('inline code')) {
        // This is our inline code element
        expect(codeText).toBe('inline code');
        expect(codeText).not.toContain('`');
      }
    }

    // Test 6: Blockquote
    const blockquoteElements = await responseElement.locator('blockquote').count();
    expect(blockquoteElements).toBeGreaterThan(0);

    // Test 7: Link
    const linkElements = await responseElement.locator('a[href="https://example.com"]').count();
    expect(linkElements).toBeGreaterThan(0);

    // Test 8: Horizontal rule
    const hrElements = await responseElement.locator('hr').count();
    expect(hrElements).toBeGreaterThan(0);

    // Verify CSS classes are applied
    const h1Element = responseElement.locator('h1').first();
    const h1Classes = await h1Element.getAttribute('class');
    expect(h1Classes).toContain('text-2xl');
    expect(h1Classes).toContain('font-bold');

    const ulElement = responseElement.locator('ul').first();
    const ulClasses = await ulElement.getAttribute('class');
    expect(ulClasses).toContain('list-disc');
    expect(ulClasses).toContain('list-inside');

    console.log('All markdown elements rendered correctly!');
  });

  test('should handle edge cases in markdown rendering', async ({ page, testWorkspace }) => {
    await setupWorkspaceInBrowser(page, testWorkspace);

    // Navigate to Claude Code
    const projectCard = page.locator('[data-testid="project-card"]').first();
    await expect(projectCard).toBeVisible({ timeout: 10000 });
    await projectCard.click();
    await page.waitForSelector('[data-testid="repo-card"]', { timeout: 10000 });

    const claudeCodeButton = page.locator('[data-testid="claude-code-button"]').first();
    await expect(claudeCodeButton).toBeVisible({ timeout: 10000 });

    // Dismiss any blocking UI elements
    const toasts = page.locator('.fixed.bottom-4.right-4');
    if ((await toasts.count()) > 0) {
      await page.click('body', { position: { x: 10, y: 10 } });
      await page.waitForTimeout(1000);
    }

    // Force click if needed
    try {
      await claudeCodeButton.click({ timeout: 5000 });
    } catch (e) {
      console.log('Regular click failed, trying force click');
      await claudeCodeButton.click({ force: true });
    }
    await page.waitForURL('**/claude-code/**');
    await page.waitForSelector('[data-testid="message-list"]', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Wait for greeting
    await page.waitForSelector('[data-testid="message-bubble"]', { timeout: 30000 });

    // Test edge cases
    const edgeCaseMessage = `Please respond with EXACTLY this markdown:

\`\`\`
Code block without language
\`\`\`

Nested **bold with *italic* inside** text

Multiple \`inline\` \`code\` \`snippets\`

Empty list items:
- 
- Item with content
- 

Mixed list:
1. Numbered item
- Bullet item
2. Another numbered`;

    const messageInput = page.locator('[data-testid="message-input"]');
    await messageInput.fill(edgeCaseMessage);
    await messageInput.press('Enter');

    // Wait for response
    await page.waitForTimeout(2000);
    await page.waitForFunction(
      () => {
        const messages = document.querySelectorAll('[data-testid="message-bubble"]');
        return messages.length >= 3;
      },
      { timeout: 30000 }
    );

    await page.waitForTimeout(3000);

    const messages = page.locator('[data-testid="message-bubble"]');
    const messageCount = await messages.count();
    const responseElement = messages.nth(messageCount - 1);

    const responseText = await responseElement.textContent();

    // Verify edge cases render without errors
    expect(responseText).not.toContain('[object Object]');
    expect(responseText).not.toContain('```');

    // Check nested formatting works
    const nestedStrong = await responseElement.locator('strong:has(em)').count();
    expect(nestedStrong).toBeGreaterThan(0);

    // Take screenshot
    await page.screenshot({ path: 'markdown-edge-cases-test.png', fullPage: true });
  });
});
