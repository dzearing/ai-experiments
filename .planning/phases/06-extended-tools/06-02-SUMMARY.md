---
phase: 06-extended-tools
plan: 02
status: complete
subsystem: tool-visualization
tags: [bash, terminal, streaming, tool-display]
dependency_graph:
  requires: [phase-3]
  provides: [bash-result-display, task-output-display, streaming-terminal-output]
  affects: [phase-6-complete-tool-ui]
tech_stack:
  added: []
  patterns: [streaming-output, auto-scroll, terminal-styling]
key_files:
  created:
    - apps/claude-code-web/client/src/components/BashResultDisplay.tsx
    - apps/claude-code-web/client/src/components/BashResultDisplay.module.css
  modified:
    - apps/claude-code-web/client/src/components/ToolResultDisplay.tsx
decisions:
  - CodeIcon used instead of TerminalIcon (not available in ui-kit)
  - Bash and TaskOutput share same display component
  - Auto-scroll only when already at bottom during streaming
metrics:
  duration: 3min
  completed: 2026-01-20
---

# Phase 6 Plan 2: Bash Result Display Summary

Terminal-style Bash output with streaming support, background task indicators, and auto-scroll.

## What Was Built

### BashResultDisplay Component

Created a terminal-style component for displaying Bash tool output:

- **Command display**: Shows command with `$` prefix and green prompt styling
- **Streaming support**: `isExecuting` prop shows spinner while command runs
- **Background tasks**: `isBackground` prop shows pulsing indicator for background execution
- **Auto-scroll**: Automatically scrolls to bottom during streaming when user is at bottom
- **Collapsible output**: Header with line count, expandable content area
- **Max height**: 400px scrollable container prevents viewport overflow

### ToolResultDisplay Integration

Extended the tool router to handle Bash and TaskOutput tools:

```typescript
if (toolName === 'Bash' || toolName === 'TaskOutput') {
  return (
    <BashResultDisplay
      command={displayCommand}
      output={output}
      isExpanded={isExpanded}
      onToggleExpand={onToggleExpand}
      description={description}
      isBackground={isBackground}
      isExecuting={isExecuting}
      timeout={timeout}
    />
  );
}
```

## Component Props

```typescript
interface BashResultDisplayProps {
  command: string;           // Command to display
  output: string;            // Accumulated output (grows during streaming)
  isExpanded: boolean;       // Whether output section is expanded
  onToggleExpand: () => void;
  description?: string;      // Optional command description
  isBackground?: boolean;    // Shows background task indicator
  isExecuting?: boolean;     // Shows spinner during execution
  timeout?: number;          // Optional timeout value
}
```

## Styling

Terminal-style appearance using design tokens:

- Monospace font (`--font-mono`)
- Dark inset background (`--color-inset-background`)
- Green command prompt (`--color-success`)
- Spinner animation for executing state
- Pulse animation for background indicator

## Commits

| Hash | Description |
|------|-------------|
| 73f047e | Create BashResultDisplay component with streaming support |
| a200370 | Integrate BashResultDisplay into ToolResultDisplay router |
| 2009237 | Fix: use CodeIcon instead of missing TerminalIcon |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] TerminalIcon not available**

- **Found during:** Task 3 (build verification)
- **Issue:** TerminalIcon does not exist in @ui-kit/icons package
- **Fix:** Replaced with CodeIcon which is available
- **Files modified:** BashResultDisplay.tsx
- **Commit:** 2009237

## Verification Results

- Build passes: Yes
- TypeScript compiles: Yes
- Bash tool routes to BashResultDisplay: Yes
- Command shows with $ prefix: Yes
- Spinner shows when isExecuting=true: Yes
- Background indicator shows when isBackground=true: Yes
- Output scrollable with max-height: Yes

## Next Steps

- Phase 6 Plan 3: WebSearch and WebFetch tools
- Phase 6 Plan 4: NotebookEdit and TodoWrite tools
