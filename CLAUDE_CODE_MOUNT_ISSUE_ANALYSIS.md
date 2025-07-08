# Claude Code Mount/Unmount Issue Analysis

## Problem Summary

When navigating to the Claude Code page, the component undergoes rapid mount/unmount cycles that cause the SSE (Server-Sent Events) connection to be established and immediately closed before the greeting message can be delivered.

## Root Cause

The issue is caused by the `AnimatedTransition` component used in `AnimatedOutletWrapper` which wraps the React Router outlet in `ThemedLayoutV2.tsx`. 

### Component Lifecycle During Navigation

1. User clicks "Claude Code" button
2. React Router updates the location
3. AnimatedTransition detects the route change and:
   - Marks the current content as "exiting" 
   - Adds new content as "entering"
   - This causes ClaudeCode component to mount
4. AnimatedTransition immediately updates state to:
   - Keep old content visible during exit animation
   - This causes ClaudeCode to unmount (as it's removed from DOM)
5. After 50ms, AnimatedTransition brings in new content:
   - This causes ClaudeCode to mount again
6. After 200ms animation completes, old content is removed

### Impact on SSE Connection

- First mount: SSE connection established
- Immediate unmount (during exit phase): SSE connection closed
- Second mount: New SSE connection attempted
- Server has already started generating greeting for first connection
- Greeting arrives but finds 0 active connections

## Evidence from Logs

```
[2025-07-07T21:20:13.076Z] CLAUDE_SSE_CONNECTED | totalConnections:1
[2025-07-07T21:20:13.079Z] CLAUDE_SSE_DISCONNECTED | remainingConnections:0
[2025-07-07T21:20:18.376Z] No active connections to send greeting to
```

Time between connection and disconnection: **3ms**

## Solution Options

1. **Remove animation for Claude Code route** - Quick fix
2. **Delay SSE connection setup** - Wait for animation to complete
3. **Persist SSE connection** - Move it to a higher component that doesn't unmount
4. **Use CSS-only transitions** - Avoid component unmounting

## Implemented Debug Logging

Added logging to track mount/unmount cycles:
- `[ClaudeCodeProvider] MOUNTED #X at [timestamp]`
- `[ClaudeCodeProvider] UNMOUNTING #X at [timestamp], lifetime: Xms`
- `[ClaudeCode] Component rendering`

This helps identify when rapid mount/unmount cycles occur.