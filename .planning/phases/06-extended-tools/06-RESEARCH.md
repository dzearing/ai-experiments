# Phase 6: Extended Tools - Research

**Researched:** 2026-01-19
**Domain:** Tool visualization, diff generation, streaming output, web content display
**Confidence:** HIGH

## Summary

Phase 6 extends the tool visualization system to support file modification tools (Write, Edit), command execution (Bash with background support), web tools (WebSearch, WebFetch), notebook editing (NotebookEdit), and task management (TodoWrite). The research identified that all necessary UI building blocks already exist in the ui-kit package, and the Claude Agent SDK provides well-defined type schemas for all tool inputs.

The existing pattern in `ToolResultDisplay.tsx` provides a clean router architecture where tools dispatch to specialized renderers. The key insight is that the `ChatMessage` component already has a `renderToolResult` callback pattern, meaning custom tool visualization can be injected from the application layer without modifying ui-kit packages.

**Primary recommendation:** Extend `ToolResultDisplay.tsx` with cases for Write, Edit, Bash, WebSearch, WebFetch, NotebookEdit, and TodoWrite tools, leveraging existing ui-kit components (FileDiff, Panel, CodeBlock) and the established permission dialog pattern.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @ui-kit/react | current | FileDiff, Panel, Spinner, Progress, CodeBlock | Already in codebase, provides diff visualization |
| @ui-kit/react-chat | current | ChatMessage renderToolResult callback | Established pattern for custom tool rendering |
| @ui-kit/react-markdown | current | MarkdownRenderer for WebFetch content | Already used for message content |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| diff | latest | Unified diff generation | When Edit tool needs diff preview (old_string vs new_string) |
| xterm.js | optional | Terminal emulation for Bash | Future enhancement if full terminal experience needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| diff library | Custom string diff | diff library handles edge cases (multi-line, Unicode), don't hand-roll |
| xterm.js | Pre-formatted CodeBlock | CodeBlock simpler for Phase 6, xterm for future if interactive terminal needed |
| Custom todo panel | List component | List is sufficient for MVP, custom panel if rich interaction needed |

**Installation:**
```bash
cd apps/claude-code-web/client && pnpm add diff
```

Note: diff package may already be a transitive dependency. Check first.

## Architecture Patterns

### Recommended Project Structure
```
apps/claude-code-web/client/src/
├── components/
│   ├── ToolResultDisplay.tsx      # Router - extend with new cases
│   ├── WriteResultDisplay.tsx     # Write tool result (new)
│   ├── EditResultDisplay.tsx      # Edit tool with diff viewer (new)
│   ├── BashResultDisplay.tsx      # Bash output streaming (new)
│   ├── WebSearchResultDisplay.tsx # Search results (new)
│   ├── WebFetchResultDisplay.tsx  # Fetched content (new)
│   ├── NotebookEditDisplay.tsx    # Notebook edits (new)
│   └── TodoWriteDisplay.tsx       # Task list panel (new)
├── utils/
│   └── diffGenerator.ts           # Unified diff from old/new strings (new)
└── hooks/
    └── useBashOutput.ts           # Background Bash polling (new)
```

### Pattern 1: Tool Result Router
**What:** Single switch/case component that routes tool names to specialized renderers
**When to use:** All tool result visualization
**Example:**
```typescript
// Source: existing ToolResultDisplay.tsx pattern
export function ToolResultDisplay({ toolName, input, output, ... }) {
  switch (toolName) {
    case 'Read': return <FileContentResult ... />;
    case 'Glob': return <FileListResult ... />;
    case 'Grep': return <SearchResultsDisplay ... />;
    case 'Write': return <WriteResultDisplay ... />;
    case 'Edit': return <EditResultDisplay ... />;
    case 'Bash': return <BashResultDisplay ... />;
    case 'WebSearch': return <WebSearchResultDisplay ... />;
    case 'WebFetch': return <WebFetchResultDisplay ... />;
    case 'NotebookEdit': return <NotebookEditDisplay ... />;
    case 'TodoWrite': return <TodoWriteDisplay ... />;
    default: return <DefaultToolResult ... />;
  }
}
```

### Pattern 2: Permission Dialog Extension
**What:** Extend PermissionDialog to show tool-specific previews before approval
**When to use:** Write and Edit tools need preview before user approves
**Example:**
```typescript
// Source: existing PermissionDialog.tsx formatToolInput pattern
case 'Write': {
  const filePath = input.file_path as string | undefined;
  const content = input.content as string | undefined;
  // Show file path + content preview with syntax highlighting
  return (
    <div>
      <Text>File: {filePath}</Text>
      <CodeBlock code={content} language={detectLanguage(filePath)} />
    </div>
  );
}

case 'Edit': {
  const filePath = input.file_path as string | undefined;
  const oldString = input.old_string as string | undefined;
  const newString = input.new_string as string | undefined;
  // Show diff preview using FileDiff component
  return (
    <div>
      <Text>File: {filePath}</Text>
      <FileDiff path={filePath} diff={generateUnifiedDiff(oldString, newString)} />
    </div>
  );
}
```

### Pattern 3: Streaming Bash Output
**What:** Bash output that updates as command runs, with background task support
**When to use:** Long-running commands, background execution
**Example:**
```typescript
// Pattern: Output accumulates during execution, final result when complete
interface BashResultDisplayProps {
  command: string;
  output: string;  // Accumulated output
  isExecuting: boolean;
  isBackground?: boolean;
  taskId?: string;  // For background tasks
}

function BashResultDisplay({ command, output, isExecuting, isBackground, taskId }) {
  // If background task, show task ID and link to fetch output
  if (isBackground && taskId) {
    return (
      <Panel>
        <Text>Background task: {taskId}</Text>
        <Button onClick={() => fetchTaskOutput(taskId)}>View Output</Button>
      </Panel>
    );
  }

  return (
    <div>
      <Code>$ {command}</Code>
      <CodeBlock code={output} language="bash" />
      {isExecuting && <Spinner size="sm" />}
    </div>
  );
}
```

### Pattern 4: Web Content Display
**What:** Fetched web content rendered as markdown with source attribution
**When to use:** WebFetch results
**Example:**
```typescript
function WebFetchResultDisplay({ url, prompt, content }) {
  return (
    <Panel>
      <div className={styles.header}>
        <Link href={url} external>{new URL(url).hostname}</Link>
        <Text color="soft">Prompt: {prompt}</Text>
      </div>
      <MarkdownRenderer content={content} />
    </Panel>
  );
}
```

### Anti-Patterns to Avoid
- **Putting tool logic in ChatMessage:** Tool rendering should be in application code via renderToolResult callback, not in ui-kit
- **Blocking UI on long Bash commands:** Use streaming/incremental output, not loading until complete
- **Showing raw JSON for all tools:** Each tool should have semantic display matching its purpose
- **Permission approval without preview:** Write/Edit tools should show what will change before user approves

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Unified diff generation | String comparison logic | diff library | Handles edge cases: multi-line, Unicode, line ending normalization |
| Diff visualization | Custom table renderer | FileDiff from ui-kit | Already styled, handles line numbers, additions/deletions coloring |
| Syntax highlighting | Manual regex/tokenization | CodeBlock from ui-kit | Uses highlight.js, supports 100+ languages |
| Terminal output | Plain pre tag | CodeBlock with language="bash" | Proper monospace, scrolling, line numbers |
| Markdown rendering | Manual parsing | MarkdownRenderer | Already handles images, code blocks, links safely |
| Search result cards | Custom div layout | Panel + List | Consistent surface styling, accessibility |

**Key insight:** The ui-kit package already has all visualization primitives needed. Phase 6 is about composition and tool-specific formatting, not new primitive components.

## Common Pitfalls

### Pitfall 1: Edit Tool Without Original File Content
**What goes wrong:** Edit tool provides old_string and new_string, but not the full file context
**Why it happens:** SDK sends minimal data for the edit operation
**How to avoid:** For full-file diff preview, Read the file first (via file API) or generate inline diff from old_string/new_string only
**Warning signs:** Diff viewer shows only the changed section, not file context

### Pitfall 2: Background Bash Missing Output
**What goes wrong:** Background task completes but UI never shows output
**Why it happens:** No polling or SSE for background task completion
**How to avoid:** Use TaskOutput tool pattern - either poll or establish separate SSE channel for background task updates
**Warning signs:** Background tasks show "running" indefinitely

### Pitfall 3: Large Bash Output Freezing UI
**What goes wrong:** Rendering 10,000+ lines of output causes jank
**Why it happens:** Full re-render on each output accumulation
**How to avoid:** Virtualize long outputs, truncate with "show more" pattern, or stream to CodeBlock with max-height
**Warning signs:** UI becomes unresponsive during builds or large file operations

### Pitfall 4: WebFetch Content Injection
**What goes wrong:** Malicious content in fetched HTML could execute
**Why it happens:** Rendering untrusted web content as-is
**How to avoid:** SDK processes content through AI first (the prompt parameter), returns safe markdown. Trust SDK output but sanitize any raw HTML.
**Warning signs:** Script tags or event handlers appearing in fetched content

### Pitfall 5: TodoWrite State Sync
**What goes wrong:** Todo list shows stale state after updates
**Why it happens:** TodoWrite replaces entire list, not incremental updates
**How to avoid:** TodoWrite always provides complete todo list, render full state from latest output
**Warning signs:** Items appearing/disappearing unexpectedly, counts mismatched

## Code Examples

Verified patterns from SDK types and existing codebase:

### SDK Tool Input Types (from sdk-tools.d.ts)

```typescript
// Write tool input
interface FileWriteInput {
  file_path: string;  // Absolute path
  content: string;    // Full file content
}

// Edit tool input
interface FileEditInput {
  file_path: string;   // Absolute path
  old_string: string;  // Text to replace
  new_string: string;  // Replacement text
  replace_all?: boolean;  // Replace all occurrences
}

// Bash tool input
interface BashInput {
  command: string;
  timeout?: number;  // Max 600000ms
  description?: string;
  run_in_background?: boolean;
  dangerouslyDisableSandbox?: boolean;
}

// WebSearch tool input
interface WebSearchInput {
  query: string;
  allowed_domains?: string[];
  blocked_domains?: string[];
}

// WebFetch tool input
interface WebFetchInput {
  url: string;
  prompt: string;  // What to extract from the page
}

// NotebookEdit tool input
interface NotebookEditInput {
  notebook_path: string;
  cell_id?: string;  // Cell to edit, or insert position
  new_source: string;
  cell_type?: 'code' | 'markdown';
  edit_mode?: 'replace' | 'insert' | 'delete';
}

// TodoWrite tool input
interface TodoWriteInput {
  todos: Array<{
    content: string;
    status: 'pending' | 'in_progress' | 'completed';
    activeForm: string;
  }>;
}
```

### Unified Diff Generation Utility

```typescript
// Source: Pattern from diff library usage
import { createPatch } from 'diff';

export function generateUnifiedDiff(
  filePath: string,
  oldContent: string,
  newContent: string
): string {
  // createPatch returns unified diff format
  return createPatch(
    filePath,
    oldContent,
    newContent,
    'Original',
    'Modified',
    { context: 3 }  // 3 lines of context
  );
}

// For Edit tool with just old_string/new_string (no full file)
export function generateInlineDiff(
  oldString: string,
  newString: string
): string {
  return createPatch(
    'changes',
    oldString,
    newString,
    'before',
    'after',
    { context: 3 }
  );
}
```

### FileDiff Component Usage (from ui-kit)

```typescript
// Source: packages/ui-kit/react/src/components/FileDiff/FileDiff.tsx
import { FileDiff } from '@ui-kit/react';

<FileDiff
  path="/path/to/file.ts"
  changeType="modified"  // 'added' | 'modified' | 'deleted' | 'renamed'
  diff={unifiedDiffString}
  showHeader={true}
  showLineNumbers={true}
  maxHeight="400px"
/>
```

### Permission Dialog Format for Edit Tool

```typescript
// Source: Pattern extension of existing PermissionDialog formatToolInput
case 'Edit': {
  const filePath = input.file_path as string | undefined;
  const oldString = input.old_string as string | undefined;
  const newString = input.new_string as string | undefined;
  const replaceAll = input.replace_all as boolean | undefined;

  if (filePath && oldString && newString) {
    const lines = [
      `File: ${filePath}`,
      replaceAll ? '\n(Replace ALL occurrences)\n' : '',
      `\n--- Before ---`,
      oldString,
      `\n+++ After ---`,
      newString,
    ];
    return lines.filter(Boolean).join('');
  }

  return JSON.stringify(input, null, 2);
}
```

### Background Task Output Retrieval

```typescript
// Source: SDK TaskOutputInput type pattern
interface TaskOutputInput {
  task_id: string;  // From Bash run_in_background result
  block: boolean;   // Wait for completion
  timeout: number;  // Max wait time in ms
}

// Usage pattern for background Bash
function useBashOutput(taskId: string | undefined) {
  const [output, setOutput] = useState<string>('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!taskId) return;

    const poll = async () => {
      // TaskOutput retrieval would be via SDK
      // For web client, need API endpoint
      const result = await fetch(`/api/task-output/${taskId}`);
      const data = await result.json();

      setOutput(data.output);
      setIsComplete(data.isComplete);

      if (!data.isComplete) {
        setTimeout(poll, 1000);  // Poll every second
      }
    };

    poll();
  }, [taskId]);

  return { output, isComplete };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Raw JSON output for all tools | Semantic tool-specific renderers | Claude Code web project | Better UX, tool outputs more understandable |
| Static diff display | Interactive FileDiff component | ui-kit v1.0 | Line numbers, syntax highlighting, collapsible |
| Blocking on long commands | Streaming output with progress | SDK streaming events | Commands don't freeze UI |

**Deprecated/outdated:**
- `toolCalls` prop on ChatMessage: Use `parts` array with `tool_calls` type instead (parts supports interleaved text and tool calls)

## Open Questions

Things that couldn't be fully resolved:

1. **Background Task SSE Channel**
   - What we know: SDK has TaskOutput tool for polling background tasks
   - What's unclear: Whether server should push completion events via SSE or client should poll
   - Recommendation: Start with polling for simplicity, SSE channel if latency matters

2. **WebSearch Result Format**
   - What we know: SDK returns search results
   - What's unclear: Exact format of result (titles, snippets, URLs)
   - Recommendation: Implement with flexible rendering that handles various result shapes

3. **NotebookEdit Cell Preview**
   - What we know: Tool modifies Jupyter notebook cells
   - What's unclear: How to display notebook structure without full notebook renderer
   - Recommendation: Show cell_id + new_source in CodeBlock with markdown/python highlighting based on cell_type

## Sources

### Primary (HIGH confidence)
- SDK sdk-tools.d.ts - Complete type definitions for all tool inputs
- packages/ui-kit/react/src/components/FileDiff/FileDiff.tsx - Diff visualization API
- apps/claude-code-web/client/src/components/ToolResultDisplay.tsx - Existing router pattern
- apps/claude-code-web/client/src/components/PermissionDialog.tsx - formatToolInput patterns

### Secondary (MEDIUM confidence)
- packages/ui-kit/react-chat/src/components/ChatMessage/ChatMessage.tsx - renderToolResult callback
- apps/claude-code-web/server/src/services/agentService.ts - SDK integration patterns

### Tertiary (LOW confidence)
- diff library API (training data, verify with npm docs before use)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All components exist in codebase, SDK types verified
- Architecture: HIGH - Extending proven existing patterns
- Pitfalls: MEDIUM - Some based on general web development experience

**Research date:** 2026-01-19
**Valid until:** 2026-02-19 (30 days - stable patterns)
