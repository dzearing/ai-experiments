const fs = require('fs').promises;
const path = require('path');

// Simple script to test the Claude Code mount/unmount issue
// Since we can't run Playwright, we'll create a script that tells the user what to do

async function analyzeServerLogs() {
  console.log('=== Claude Code Mount/Unmount Issue Analysis ===\n');

  const instructions = `
To manually test and capture the mount/unmount issue:

1. **Clear browser console**: Open browser DevTools (F12) and clear the console

2. **Navigate to the app**: Go to http://localhost:5173

3. **Follow this path**:
   - Click "Projects" in the sidebar
   - Click on "apisurf" project
   - Click "Claude Code" button

4. **Observe the console logs** for these patterns:
   - [ClaudeCode] Component rendering
   - [ClaudeCodeProvider] MOUNTED #X
   - [ClaudeCodeProvider] UNMOUNTING #X
   - SSE connection messages
   - "Message not found for chunk" errors

5. **Expected issue**: You should see multiple mount/unmount cycles within milliseconds

6. **Check server logs**: Look at the latest entries in:
   - server/logs/claude-messages.log
   - server/logs/events.log

The issue is caused by the AnimatedTransition component wrapping the routes.
When navigating to ClaudeCode, the component is:
1. Mounted initially
2. Unmounted by AnimatedTransition during the "exiting" phase
3. Re-mounted during the "entering" phase

This causes the SSE connection to be established and immediately closed,
preventing the greeting message from being delivered.
`;

  console.log(instructions);

  // Try to analyze the most recent server logs
  try {
    const logsPath = path.join(__dirname, '..', 'server', 'logs');
    const claudeLog = await fs.readFile(path.join(logsPath, 'claude-messages.log'), 'utf-8');
    const eventsLog = await fs.readFile(path.join(logsPath, 'events.log'), 'utf-8');

    // Get last 20 lines of each
    const claudeLines = claudeLog.split('\n').filter(Boolean).slice(-20);
    const eventsLines = eventsLog.split('\n').filter(Boolean).slice(-20);

    console.log('\n=== Recent Claude Messages Log ===');
    claudeLines.forEach((line) => console.log(line));

    console.log('\n=== Recent Events Log ===');
    eventsLines.forEach((line) => console.log(line));

    // Look for the problematic pattern
    const hasNoActiveConnections = claudeLines.some((line) =>
      line.includes('No active connections to send greeting to')
    );
    const hasDisconnects = eventsLines.some((line) => line.includes('CLAUDE_SSE_DISCONNECTED'));

    if (hasNoActiveConnections && hasDisconnects) {
      console.log(
        '\n⚠️  ISSUE CONFIRMED: The logs show SSE disconnections followed by "No active connections" when trying to send greeting!'
      );
    }
  } catch (error) {
    console.log("\nCouldn't read server logs:", error.message);
  }
}

analyzeServerLogs();
