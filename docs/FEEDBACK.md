# Feedback System

This document describes the feedback gathering system implemented in Claude Code for capturing user-reported issues with comprehensive context.

## Overview

The feedback system allows users to report bugs and issues they encounter while using Claude Code. It automatically captures screenshots, message history, and relevant server logs to help developers diagnose and fix problems quickly.

### Key Features

- **Contextual feedback**: Report issues on specific messages or entire sessions
- **Automatic screenshot capture**: Visual evidence of the issue
- **Complete message history**: Full conversation context
- **Server log correlation**: Relevant backend logs automatically included
- **Structured data collection**: Consistent format for easy analysis

### Use Cases

- Bug reporting (incorrect responses, UI glitches)
- UX issues (confusing behavior, missing features)
- Feature requests with context
- Performance problems

## Architecture

### System Flow

```
User clicks "Leave feedback"
    ↓
Screenshot captured (client)
    ↓
Feedback dialog shown
    ↓
User describes issue
    ↓
Data compiled (client)
    ↓
Screenshot uploaded (server)
    ↓
Feedback submitted (server)
    ↓
Server logs extracted
    ↓
Complete report saved
    ↓
Confirmation shown
```

### Storage Structure

```
feedback/
├── screenshots/
│   └── {reponame}-{sessionid}-{timestamp}.png
└── reports/
    └── {timestamp}-{sessionid}.json
```

## User Guide

### How to Leave Feedback

#### On Individual Messages

Each chat message displays a "Leave feedback" link at the bottom:

```
┌─────────────────────────────────────────────┐
│ Claude:                                     │
│ I'll help you implement that feature...     │
│                                             │
│ [Leave feedback]          12:34 PM         │
└─────────────────────────────────────────────┘
```

Click this link to report an issue with that specific message.

#### On Tool Executions

Tool executions also have feedback links:

```
┌─────────────────────────────────────────────┐
│ ✓ Complete   Read file.tsx        1.2s     │
│ ⎿                                           │
│   export function Component() {             │
│     return <div>Hello</div>                 │
│   }                                         │
│                                             │
│ [Leave feedback]                            │
└─────────────────────────────────────────────┘
```

#### Session-Level Feedback

For issues affecting the entire conversation, use the session feedback button:

```
┌─────────────────────────────────────────────┐
│ Claude Code Session  hello-world-1          │
│                                             │
│ [Leave feedback] [Close Session]            │
└─────────────────────────────────────────────┘
```

### Feedback Dialog

When you click any feedback link, this dialog appears:

```
┌─────────────────────────────────────────────┐
│            Leave Feedback                   │
├─────────────────────────────────────────────┤
│                                             │
│ Help us improve Claude Code by describing  │
│ what happened.                              │
│                                             │
│ What did you expect to happen? *            │
│ ┌─────────────────────────────────────────┐ │
│ │                                         │ │
│ │                                         │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ What actually happened? *                   │
│ ┌─────────────────────────────────────────┐ │
│ │                                         │ │
│ │                                         │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ℹ️ A screenshot will be included            │
│    automatically                            │
│                                             │
│        [Cancel]  [Submit Feedback]          │
└─────────────────────────────────────────────┘
```

### What Information is Captured

- **Your feedback**: Expected vs actual behavior descriptions
- **Screenshot**: Current state of the application
- **Message history**: All messages in the current session
- **Session metadata**: Project, repository, and timing information
- **Server logs**: Relevant backend logs for debugging

### Success Confirmation

After submission, you'll see:

```
┌─────────────────────────────────────────────┐
│            Feedback Submitted               │
├─────────────────────────────────────────────┤
│                                             │
│ ✓ Thank you for your feedback!              │
│                                             │
│ Your feedback has been saved with:          │
│ • Screenshot of the current state           │
│ • Complete message history                  │
│ • Relevant server logs                      │
│                                             │
│ Feedback ID: fb-2024-01-15-abc123          │
│                                             │
│                      [Close]                │
└─────────────────────────────────────────────┘
```

## Technical Implementation

### Client-Side Components

- **FeedbackDialog**: Modal dialog for collecting user input
- **FeedbackLink**: Reusable link component for triggering feedback
- **useFeedback**: Hook managing feedback flow and state
- **feedbackService**: Service handling screenshot and submission logic

### Server-Side Components

- **feedback-handler**: Processes feedback and extracts logs
- **/api/feedback/screenshot**: Endpoint for screenshot upload
- **/api/feedback/submit**: Endpoint for feedback submission

## Screenshot Capture Implementation

### Client-Side Process

The screenshot capture uses the `dom-to-image` library for lightweight DOM rendering:

```javascript
async function captureScreenshot(): Promise<string> {
  try {
    const dataUrl = await domtoimage.toPng(document.body, {
      quality: 0.95,
      bgcolor: '#ffffff',
      width: document.body.scrollWidth,
      height: document.body.scrollHeight
    });
    return dataUrl;
  } catch (error) {
    console.error('Screenshot capture failed:', error);
    return null;
  }
}
```

### Process Flow

1. User clicks "Leave feedback"
2. `captureScreenshot()` function called immediately
3. DOM rendered to canvas via `dom-to-image.toPng()`
4. Canvas converted to Blob
5. Blob converted to base64 string
6. Base64 data sent to server

### Server-Side Processing

The server processes screenshots:

1. Receives base64 image data at `/api/feedback/screenshot`
2. Validates image size (max 10MB)
3. Generates filename: `{reponame}-{sessionid}-{timestamp}.png`
4. Strips base64 prefix (`data:image/png;base64,`)
5. Converts to Buffer
6. Saves to `feedback/screenshots/` directory
7. Returns relative path for feedback record

### Error Handling

- Screenshot capture failures don't block feedback submission
- Users are notified if screenshot fails but can continue
- Server validates image format and size
- Graceful degradation ensures feedback is always captured

## API Reference

### POST /api/feedback/screenshot

Uploads a screenshot for feedback.

**Request:**

```json
{
  "imageData": "data:image/png;base64,...",
  "sessionId": "project-xxx-hello-world-1-uuid",
  "repoName": "hello-world-1"
}
```

**Response:**

```json
{
  "success": true,
  "path": "feedback/screenshots/hello-world-1-xxx-123456789.png"
}
```

**Error Response:**

```json
{
  "success": false,
  "error": "Image size exceeds 10MB limit"
}
```

### POST /api/feedback/submit

Submits complete feedback with all context.

**Request:**

```json
{
  "expectedBehavior": "Claude should have understood the request",
  "actualBehavior": "Claude responded with an error",
  "sessionId": "project-xxx-hello-world-1-uuid",
  "repoName": "hello-world-1",
  "projectId": "project-xxx",
  "messageId": "msg-123",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "messages": [...],
  "mode": "default",
  "isConnected": true,
  "screenshotPath": "feedback/screenshots/hello-world-1-xxx-123.png"
}
```

**Response:**

```json
{
  "success": true,
  "feedbackId": "fb-2024-01-15-abc123"
}
```

## Feedback Data Structure

Complete feedback records are saved as JSON files:

```json
{
  "feedbackId": "fb-2024-01-15-abc123",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "user": {
    "expectedBehavior": "Claude should have understood the context",
    "actualBehavior": "Claude responded with unrelated information"
  },
  "context": {
    "sessionId": "project-xxx-hello-world-1-uuid",
    "repoName": "hello-world-1",
    "projectId": "project-xxx",
    "messageId": "msg-123",
    "mode": "default",
    "isConnected": true
  },
  "messages": [
    {
      "id": "msg-123",
      "role": "user",
      "content": "Help me implement a feature",
      "timestamp": "2024-01-15T10:29:00.000Z"
    },
    {
      "id": "msg-124",
      "role": "assistant",
      "content": "I'll help you with that...",
      "timestamp": "2024-01-15T10:29:30.000Z"
    }
  ],
  "screenshotPath": "feedback/screenshots/hello-world-1-xxx-123.png",
  "serverLogs": {
    "claudeMessages": ["[2024-01-15T10:29:30.000Z] Claude response received..."],
    "events": ["[2024-01-15T10:29:00.000Z] CLAUDE_MESSAGE_RECEIVED..."],
    "errors": []
  }
}
```

## Testing Strategy

### Client-Side Testing

#### Unit Tests (Jest)

- FeedbackDialog component rendering and validation
- FeedbackLink component click handling
- useFeedback hook state management
- feedbackService screenshot and submission logic

#### E2E Tests (Playwright)

```typescript
describe('Feedback Feature', () => {
  test('should show feedback link on chat messages', async ({ page }) => {
    await page.goto('/projects/test-project/claude-code/hello-world-1');
    await page.waitForSelector('[data-testid="message-complete"]');
    const feedbackLink = await page.locator('text=Leave feedback');
    expect(await feedbackLink.isVisible()).toBe(true);
  });

  test('should capture screenshot when feedback is initiated', async ({ page }) => {
    await page.goto('/projects/test-project/claude-code/hello-world-1');
    await page.waitForSelector('[data-testid="message-complete"]');

    // Intercept screenshot upload
    const screenshotPromise = page.waitForRequest((req) =>
      req.url().includes('/api/feedback/screenshot')
    );

    await page.click('text=Leave feedback');
    const screenshotReq = await screenshotPromise;

    expect(screenshotReq.postData()).toContain('data:image/png;base64');
  });

  test('should handle screenshot capture failure gracefully', async ({ page }) => {
    await page.goto('/projects/test-project/claude-code/hello-world-1');

    // Mock dom-to-image to fail
    await page.addScriptTag({
      content: `
        window.domtoimage = {
          toPng: () => Promise.reject(new Error('Capture failed'))
        };
      `,
    });

    await page.click('text=Leave feedback');
    await page.fill('textarea[placeholder*="expect"]', 'Test expectation');
    await page.fill('textarea[placeholder*="actually"]', 'Test actual');
    await page.click('text=Submit Feedback');

    // Should still succeed without screenshot
    await expect(page.locator('text=Feedback Submitted')).toBeVisible();
  });

  test('should include message history in feedback', async ({ page }) => {
    await page.goto('/projects/test-project/claude-code/hello-world-1');

    // Send a message
    await page.fill('[data-testid="claude-input"]', 'Test message');
    await page.keyboard.press('Enter');
    await page.waitForSelector('[data-testid="message-complete"]');

    // Intercept feedback submission
    const feedbackPromise = page.waitForRequest((req) =>
      req.url().includes('/api/feedback/submit')
    );

    await page.click('text=Leave feedback');
    await page.fill('textarea[placeholder*="expect"]', 'Test');
    await page.fill('textarea[placeholder*="actually"]', 'Test');
    await page.click('text=Submit Feedback');

    const feedbackReq = await feedbackPromise;
    const data = JSON.parse(feedbackReq.postData());

    expect(data.messages).toHaveLength(2); // Greeting + user message
    expect(data.messageId).toBeDefined();
  });

  test('should handle session-level feedback', async ({ page }) => {
    await page.goto('/projects/test-project/claude-code/hello-world-1');

    const feedbackPromise = page.waitForRequest((req) =>
      req.url().includes('/api/feedback/submit')
    );

    await page.click('button:has-text("Leave feedback")');
    await page.fill('textarea[placeholder*="expect"]', 'Session test');
    await page.fill('textarea[placeholder*="actually"]', 'Session test');
    await page.click('text=Submit Feedback');

    const feedbackReq = await feedbackPromise;
    const data = JSON.parse(feedbackReq.postData());

    expect(data.messageId).toBeUndefined(); // No specific message
  });
});
```

### Server-Side Testing

#### Unit Tests

- Screenshot endpoint validation and file saving
- Feedback submission validation
- Log extraction by sessionId
- File system operations
- Error handling

#### Integration Tests

- End-to-end feedback flow
- Concurrent submission handling
- Large file handling
- Missing session data handling

## Acceptance Criteria

### Functional Requirements

- ✓ "Leave feedback" link appears on every chat message
- ✓ "Leave feedback" link appears on every tool execution
- ✓ Session feedback button appears next to "Close Session"
- ✓ Screenshot is automatically captured when feedback is initiated
- ✓ Dialog shows with expected/actual behavior fields
- ✓ Both fields are required for submission
- ✓ Feedback includes full message history
- ✓ Feedback includes relevant server logs
- ✓ Screenshot is saved with proper naming convention
- ✓ Feedback JSON is saved to correct directory
- ✓ User receives confirmation after submission

### Screenshot-Specific Criteria

- ✓ Screenshot captures entire viewport
- ✓ Screenshot includes all visible UI elements
- ✓ Screenshot maintains readable quality (95% PNG)
- ✓ Screenshot file size is optimized
- ✓ Screenshot filename follows convention: `{reponame}-{sessionid}-{timestamp}.png`
- ✓ Screenshot upload completes before feedback submission

### Non-Functional Requirements

- ✓ Screenshot capture completes within 2 seconds
- ✓ Feedback submission completes within 3 seconds
- ✓ Feedback files are properly organized
- ✓ System handles concurrent feedback submissions
- ✓ Graceful degradation if screenshot fails

### Edge Cases

- ✓ Handles very long message histories (>100 messages)
- ✓ Handles large screenshots (>5MB)
- ✓ Handles network failures during submission
- ✓ Handles missing session data
- ✓ Handles file system errors

## Developer Guide

### Adding Feedback to New Components

To add feedback capability to a new component:

1. Import the FeedbackLink component:

   ```typescript
   import { FeedbackLink } from './components/FeedbackLink';
   ```

2. Add the link to your component:

   ```typescript
   <FeedbackLink
     sessionId={sessionId}
     messageId={message.id} // optional
     context={{ /* additional context */ }}
   />
   ```

3. The link will automatically handle screenshot capture and dialog display.

### Processing Feedback Data

Feedback reports are saved as JSON files in `feedback/reports/`. To analyze:

```javascript
const fs = require('fs');
const path = require('path');

const reportsDir = path.join(__dirname, 'feedback/reports');
const reports = fs
  .readdirSync(reportsDir)
  .map((file) => JSON.parse(fs.readFileSync(path.join(reportsDir, file))));

// Filter by session, date, error type, etc.
const sessionReports = reports.filter((r) => r.context.sessionId === 'specific-session-id');
```

### Extending the Feedback System

The feedback system is designed to be extensible:

1. **Custom context**: Add any relevant data to the feedback context
2. **Additional captures**: Extend to capture console logs, network requests
3. **Different triggers**: Add keyboard shortcuts, error boundaries
4. **Analytics**: Integrate with error tracking services

## Troubleshooting

### Common Issues

#### Screenshot Capture Fails

**Symptom**: "Screenshot capture failed" in console
**Causes**:

- Large DOM size
- Cross-origin images
- Browser security restrictions

**Solution**: Feedback will still submit without screenshot. Check browser console for specific errors.

#### Feedback Submission Hangs

**Symptom**: Dialog stays open, no confirmation
**Causes**:

- Network timeout
- Server error
- Large payload

**Solution**: Check network tab for failed requests. Reduce message history if needed.

#### Missing Server Logs

**Symptom**: serverLogs field is empty or incomplete
**Causes**:

- Log rotation
- SessionId mismatch
- Timing issues

**Solution**: Check server log files directly in `server/logs/`.

### Log File Locations

- Client errors: Browser console
- Server errors: `server/logs/errors.log`
- Claude messages: `server/logs/claude-messages.log`
- Events: `server/logs/events.log`
- Feedback reports: `feedback/reports/`
- Screenshots: `feedback/screenshots/`

### Manual Feedback Recovery

If automatic submission fails, feedback can be manually reconstructed:

1. Take a manual screenshot
2. Copy console logs
3. Note the sessionId from the URL
4. Save as JSON in `feedback/reports/manual/`

## Future Enhancements

### Planned Improvements

- **Video capture**: Record user interactions leading to issues
- **Network request logging**: Include API calls in feedback
- **Console log capture**: Automatically include browser console
- **Feedback categories**: Classify issues (bug, UX, feature request)
- **Duplicate detection**: Identify similar reported issues

### Integration Possibilities

- **GitHub Issues**: Automatically create issues from feedback
- **Slack notifications**: Alert team of critical feedback
- **Analytics dashboard**: Visualize feedback trends
- **User follow-up**: Email users when issues are resolved

### Performance Optimizations

- **Lazy loading**: Load dom-to-image only when needed
- **Screenshot compression**: Reduce file sizes
- **Batch uploads**: Handle multiple feedbacks efficiently
- **Background processing**: Move log extraction to queue

This feedback system provides a comprehensive solution for capturing and diagnosing issues in Claude Code, making it easier to improve the user experience based on real-world usage.
