# Phase 3: Essential Tools - Research

**Researched:** 2026-01-19
**Domain:** Tool execution visualization, syntax highlighting, file browsing, search results display
**Confidence:** HIGH

## Summary

Phase 3 delivers the "essential tools" experience: visual feedback when Claude executes Read, Glob, and Grep tools. The infrastructure from Phases 1-2 (SSE streaming, SDK integration, message transformation) is established. This phase focuses on:

1. **Tool execution pipeline** - Progress indicators while tools run, completion states
2. **Read tool visualization** - File contents with syntax highlighting (CodeBlock already exists)
3. **Glob/Grep results** - File lists and search match displays
4. **File tree browser** - TreeView component exists, needs file system API
5. **Diff viewer** - FileDiff component already exists

The key insight is that most UI primitives already exist in ui-kit. Phase 3 work is primarily:
- Server endpoints to fetch file contents, list directories
- Client components that compose existing primitives (TreeView, CodeBlock, FileDiff)
- Tool result transformation to display-friendly formats

**Primary recommendation:** Leverage existing ui-kit components (TreeView, CodeBlock, FileDiff, Accordion) for tool output display. Focus engineering effort on the server file system API and client-side tool result renderers.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@ui-kit/react-chat` | workspace | ChatMessage with tool_calls parts | Already handles tool display, timer, expand/collapse |
| `@ui-kit/react-markdown` | workspace | CodeBlock with syntax highlighting | Prism.js based, 20+ languages supported |
| `@ui-kit/react` | workspace | TreeView, FileDiff, Accordion | Existing components ready for composition |
| `prismjs` | bundled | Syntax highlighting | Bundled with react-markdown, 20+ languages |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `fast-glob` | ^3.3.0 | Server-side glob patterns | Already used by Node.js for file patterns |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Prism.js | Shiki/Highlight.js | Prism already bundled, no benefit to change |
| TreeView | Custom file tree | TreeView has virtualization for 10k+ nodes |
| Custom diff parser | FileDiff | FileDiff already parses unified diff format |

**Installation:**
```bash
# Server - may need fast-glob if not using glob tool directly
cd apps/claude-code-web/server
pnpm add fast-glob

# Client - no new dependencies, use workspace packages
```

## Architecture Patterns

### Recommended Project Structure
```
apps/claude-code-web/
├── server/src/
│   ├── routes/
│   │   ├── agent.ts              # Existing SSE endpoint
│   │   └── files.ts              # NEW: File operations API
│   ├── services/
│   │   ├── agentService.ts       # Existing
│   │   └── fileService.ts        # NEW: File reading, listing
│   └── types/
│       └── index.ts              # Extended with file types
└── client/src/
    ├── components/
    │   ├── ChatView.tsx          # Existing
    │   ├── ToolResultDisplay.tsx # NEW: Router for tool result types
    │   ├── FileContent.tsx       # NEW: Read tool display (uses CodeBlock)
    │   ├── FileList.tsx          # NEW: Glob results display
    │   ├── SearchResults.tsx     # NEW: Grep results display
    │   ├── FileBrowser.tsx       # NEW: TreeView-based file tree
    │   └── DiffViewer.tsx        # NEW: Edit tool preview (uses FileDiff)
    ├── hooks/
    │   └── useFileContent.ts     # NEW: Fetch file for viewing
    └── utils/
        ├── messageTransformer.ts # Existing
        ├── toolResultTransformers.ts # NEW: Per-tool output formatters
        └── languageDetection.ts  # NEW: File extension to language mapping
```

### Pattern 1: Tool Result Rendering Router
**What:** Component that renders different UI based on tool name
**When to use:** For all tool result displays in ChatMessage
**Example:**
```typescript
// Source: ChatMessage tool_calls pattern
interface ToolResultDisplayProps {
  toolName: string;
  input: Record<string, unknown>;
  output: string;
  isComplete: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function ToolResultDisplay({
  toolName,
  input,
  output,
  isComplete,
  isExpanded,
  onToggleExpand,
}: ToolResultDisplayProps) {
  // Route to appropriate renderer based on tool name
  switch (toolName) {
    case 'Read':
      return (
        <FileContentResult
          filePath={input.file_path as string}
          content={output}
          isExpanded={isExpanded}
          onToggleExpand={onToggleExpand}
        />
      );

    case 'Glob':
      return (
        <FileListResult
          pattern={input.pattern as string}
          files={parseGlobOutput(output)}
          isExpanded={isExpanded}
          onToggleExpand={onToggleExpand}
        />
      );

    case 'Grep':
      return (
        <SearchResultsDisplay
          pattern={input.pattern as string}
          matches={parseGrepOutput(output)}
          isExpanded={isExpanded}
          onToggleExpand={onToggleExpand}
        />
      );

    default:
      // Fallback: plain text in pre block
      return (
        <DefaultToolResult
          output={output}
          isExpanded={isExpanded}
          onToggleExpand={onToggleExpand}
        />
      );
  }
}
```

### Pattern 2: File Content Display with Syntax Highlighting
**What:** Display file contents using existing CodeBlock
**When to use:** Read tool results, file viewer
**Example:**
```typescript
// Source: CodeBlock from react-markdown
import { CodeBlock } from '@ui-kit/react-markdown';
import { detectLanguage } from '../utils/languageDetection';

interface FileContentResultProps {
  filePath: string;
  content: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function FileContentResult({
  filePath,
  content,
  isExpanded,
  onToggleExpand,
}: FileContentResultProps) {
  const language = detectLanguage(filePath);
  const lineCount = content.split('\n').length;

  return (
    <div className={styles.fileContent}>
      <button
        className={styles.fileHeader}
        onClick={onToggleExpand}
        aria-expanded={isExpanded}
      >
        <span className={styles.filePath}>{filePath}</span>
        <span className={styles.lineCount}>{lineCount} lines</span>
        <ChevronIcon expanded={isExpanded} />
      </button>

      {isExpanded && (
        <CodeBlock
          code={content}
          language={language}
          showLineNumbers={true}
          collapsible={lineCount > 50}
          defaultCollapsed={lineCount > 100}
          maxHeight={400}
        />
      )}
    </div>
  );
}
```

### Pattern 3: File Tree with Click-to-View
**What:** TreeView displaying workspace files, clicking opens content
**When to use:** File browser panel, glob result navigation
**Example:**
```typescript
// Source: TreeView from @ui-kit/react
import { TreeView, type TreeNode } from '@ui-kit/react';
import { useCallback, useState } from 'react';

interface FileBrowserProps {
  rootPath: string;
  onFileSelect: (path: string) => void;
}

export function FileBrowser({ rootPath, onFileSelect }: FileBrowserProps) {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);

  // Load directory on expand
  const handleNodeExpand = useCallback(async (node: TreeNode) => {
    if (node.type === 'folder' && !node.children?.length) {
      const entries = await fetchDirectory(node.data?.path as string);
      // Update tree with fetched children
      setTreeData(prev => updateNodeChildren(prev, node.id, entries));
    }
  }, []);

  const handleSelect = useCallback((id: string | null, node: TreeNode | null) => {
    if (node && node.type === 'file') {
      onFileSelect(node.data?.path as string);
    }
  }, [onFileSelect]);

  return (
    <TreeView
      data={treeData}
      selectable={true}
      onSelect={handleSelect}
      onNodeExpand={handleNodeExpand}
      iconResolver={fileIconResolver}
      aria-label="File browser"
    />
  );
}
```

### Pattern 4: Clickable File Paths in Results
**What:** File paths that link to file viewer when clicked
**When to use:** Glob results, grep results, anywhere file paths appear
**Example:**
```typescript
// Source: ChatMessage onLinkClick pattern
interface ClickablePathProps {
  path: string;
  lineNumber?: number;
  onClick: (path: string, line?: number) => void;
}

export function ClickablePath({ path, lineNumber, onClick }: ClickablePathProps) {
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onClick(path, lineNumber);
  }, [path, lineNumber, onClick]);

  return (
    <button
      type="button"
      className={styles.clickablePath}
      onClick={handleClick}
    >
      {path}
      {lineNumber !== undefined && `:${lineNumber}`}
    </button>
  );
}
```

### Anti-Patterns to Avoid
- **Parsing tool output in render:** Parse once in transformer, not on every render
- **Loading all files at once:** Use lazy loading for TreeView children
- **Massive CodeBlock rendering:** Use `maxHeight` and `collapsible` props for large files
- **Custom syntax highlighting:** Use existing CodeBlock - it handles edge cases
- **Blocking UI for file operations:** File fetches should be async with loading states

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Syntax highlighting | Custom tokenizer | CodeBlock from react-markdown | Prism.js with 20 languages, themes, line numbers |
| File tree UI | Custom tree component | TreeView | Virtualized, keyboard nav, icon resolver |
| Diff display | Diff parser + renderer | FileDiff | Parses unified diff, line numbers, add/remove highlighting |
| Collapse/expand | Custom toggle | Accordion or existing tool toggle | Animation, accessibility built-in |
| Tool progress timer | setInterval counter | ToolTimer in ChatMessage | Already handles completion states |
| Language detection | Extension switch | detectLanguage utility | File path to Prism language mapping |

**Key insight:** The ui-kit packages solve the hard problems. Phase 3 composes them into tool-specific displays.

## Common Pitfalls

### Pitfall 1: Tool Output Not String
**What goes wrong:** Expecting tool output to always be a string, crashes on object
**Why it happens:** SDK may return structured data for some tools
**How to avoid:** Always stringify/transform tool output before display
**Warning signs:** "Cannot read property 'split' of object" errors

```typescript
// Safe output handling
const safeOutput = typeof output === 'string'
  ? output
  : JSON.stringify(output, null, 2);
```

### Pitfall 2: Large File Performance
**What goes wrong:** UI freezes when displaying 10k+ line files
**Why it happens:** Syntax highlighting is O(n), rendering all lines expensive
**How to avoid:** Use CodeBlock's `maxHeight` and virtualization (if needed)
**Warning signs:** Long pause after Read tool completes, laggy scrolling

```typescript
// Limit display size
<CodeBlock
  code={content}
  maxHeight={400} // Scrollable, not infinite
  collapsible={lineCount > 50}
  defaultCollapsed={lineCount > 100}
/>
```

### Pitfall 3: File Path Encoding Issues
**What goes wrong:** Paths with spaces/special chars break API calls
**Why it happens:** URL encoding not applied consistently
**How to avoid:** Always `encodeURIComponent` file paths in API URLs
**Warning signs:** 404 errors for files that exist, malformed URLs

```typescript
// Client: encode path in URL
const response = await fetch(`/api/files/read?path=${encodeURIComponent(filePath)}`);

// Server: decode path from query
const filePath = decodeURIComponent(req.query.path as string);
```

### Pitfall 4: Glob Pattern Security
**What goes wrong:** User-provided glob patterns access system files
**Why it happens:** No validation of patterns, path traversal
**How to avoid:** Restrict glob to working directory, validate patterns
**Warning signs:** Files outside project showing in results, `../` in patterns

```typescript
// Server: validate path stays within cwd
function isPathSafe(requestedPath: string, cwd: string): boolean {
  const resolved = path.resolve(cwd, requestedPath);
  return resolved.startsWith(cwd);
}
```

### Pitfall 5: Missing Language Detection Fallback
**What goes wrong:** Unknown file extensions show no highlighting
**Why it happens:** Language detection returns undefined, Prism fails
**How to avoid:** Default to 'plaintext' for unknown extensions
**Warning signs:** Code appears unstyled, console warnings about missing grammar

```typescript
// Always return a valid language
export function detectLanguage(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase().slice(1);
  return EXTENSION_MAP[ext] || 'plaintext';
}
```

### Pitfall 6: Expanding Tool Results Jumps Scroll
**What goes wrong:** Expanding a tool result causes chat to jump
**Why it happens:** Height change not managed, scroll position lost
**How to avoid:** ChatMessage already handles this with scroll restoration
**Warning signs:** User loses place in conversation when viewing tool output

## Code Examples

Verified patterns from ui-kit source and existing components:

### Language Detection Utility
```typescript
// Source: File extension to Prism language mapping
const EXTENSION_MAP: Record<string, string> = {
  // JavaScript/TypeScript
  js: 'javascript',
  jsx: 'jsx',
  ts: 'typescript',
  tsx: 'tsx',
  mjs: 'javascript',
  cjs: 'javascript',

  // Web
  html: 'html',
  css: 'css',
  scss: 'scss',
  json: 'json',

  // Backend
  py: 'python',
  rb: 'ruby',
  go: 'go',
  rs: 'rust',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  cs: 'csharp',

  // Config
  yaml: 'yaml',
  yml: 'yaml',
  toml: 'toml',
  md: 'markdown',
  sh: 'bash',
  bash: 'bash',
  zsh: 'bash',

  // Data
  sql: 'sql',
  graphql: 'graphql',
};

export function detectLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  return EXTENSION_MAP[ext] || 'plaintext';
}
```

### Glob Output Parser
```typescript
// Source: Parse Glob tool output format
interface GlobResult {
  files: string[];
  truncated: boolean;
  totalCount: number;
}

export function parseGlobOutput(output: string): GlobResult {
  const lines = output.trim().split('\n').filter(Boolean);

  // Check for truncation message
  const lastLine = lines[lines.length - 1];
  const truncationMatch = lastLine?.match(/\.\.\. and (\d+) more files/);

  if (truncationMatch) {
    return {
      files: lines.slice(0, -1),
      truncated: true,
      totalCount: lines.length - 1 + parseInt(truncationMatch[1], 10),
    };
  }

  return {
    files: lines,
    truncated: false,
    totalCount: lines.length,
  };
}
```

### Grep Output Parser
```typescript
// Source: Parse Grep tool output format
interface GrepMatch {
  file: string;
  line: number;
  content: string;
}

interface GrepResult {
  matches: GrepMatch[];
  truncated: boolean;
  totalMatches: number;
}

export function parseGrepOutput(output: string): GrepResult {
  const lines = output.trim().split('\n').filter(Boolean);
  const matches: GrepMatch[] = [];

  for (const line of lines) {
    // Format: "file:line:content" or "file:line-content"
    const match = line.match(/^(.+?):(\d+)[:-](.*)$/);
    if (match) {
      matches.push({
        file: match[1],
        line: parseInt(match[2], 10),
        content: match[3],
      });
    }
  }

  return {
    matches,
    truncated: matches.length >= 100, // Typical limit
    totalMatches: matches.length,
  };
}
```

### Server File Read Endpoint
```typescript
// Source: Express route pattern from Phase 1
import { Router } from 'express';
import { readFile } from 'fs/promises';
import path from 'path';

export const router = Router();

router.get('/read', async (req, res) => {
  const filePath = decodeURIComponent(req.query.path as string);
  const cwd = process.cwd();

  // Security: ensure path is within working directory
  const absolutePath = path.resolve(cwd, filePath);
  if (!absolutePath.startsWith(cwd)) {
    res.status(403).json({ error: 'Path outside working directory' });
    return;
  }

  try {
    const content = await readFile(absolutePath, 'utf-8');
    res.json({
      path: filePath,
      content,
      size: content.length,
      lines: content.split('\n').length,
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      res.status(404).json({ error: 'File not found' });
    } else {
      res.status(500).json({ error: 'Failed to read file' });
    }
  }
});
```

### TreeView File Icon Resolver
```typescript
// Source: TreeView iconResolver API
import { FolderIcon } from '@ui-kit/icons/FolderIcon';
import { FileIcon } from '@ui-kit/icons/FileIcon';
import { FileCodeIcon } from '@ui-kit/icons/FileCodeIcon';
import { FileJsonIcon } from '@ui-kit/icons/FileJsonIcon';
import type { TreeNode, IconResolver } from '@ui-kit/react';

const FILE_ICON_MAP: Record<string, React.ComponentType> = {
  ts: FileCodeIcon,
  tsx: FileCodeIcon,
  js: FileCodeIcon,
  jsx: FileCodeIcon,
  json: FileJsonIcon,
  // ... more mappings
};

export const fileIconResolver: IconResolver = (type, node) => {
  if (type === 'folder') {
    return <FolderIcon />;
  }

  // Get extension from label
  const label = typeof node.label === 'string' ? node.label : '';
  const ext = label.split('.').pop()?.toLowerCase() || '';
  const IconComponent = FILE_ICON_MAP[ext] || FileIcon;

  return <IconComponent />;
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Raw pre blocks | CodeBlock with Prism | ui-kit | Proper highlighting, line numbers |
| Full file in memory | Lazy loading + maxHeight | N/A | Better performance for large files |
| Nested toggle state | ChatMessage built-in expand | Phase 2 | Handles scroll position |

**Deprecated/outdated:**
- Custom tool display components: ChatMessage handles tool_calls with parts array
- Manual syntax highlighting: Use CodeBlock from react-markdown

## Open Questions

Things that couldn't be fully resolved:

1. **Tool Output Streaming**
   - What we know: Tool results come as complete output after tool finishes
   - What's unclear: Can we show partial Grep/Glob results while searching?
   - Recommendation: Start with complete results only; streaming would require SDK changes

2. **File Viewer Panel vs Inline**
   - What we know: TreeView + file display is standard pattern
   - What's unclear: Should file viewer be a side panel or replace chat?
   - Recommendation: Inline expand for tool results; side panel for file browser (Phase 3-04)

3. **Binary File Handling**
   - What we know: Read tool may return binary content for images, etc.
   - What's unclear: Best way to detect and display non-text content
   - Recommendation: Check for null bytes, show placeholder for binary files

## Sources

### Primary (HIGH confidence)
- `packages/ui-kit/react/src/components/TreeView/TreeView.tsx` - Virtualized tree component
- `packages/ui-kit/react/src/components/FileDiff/FileDiff.tsx` - Diff parser and display
- `packages/ui-kit/react-markdown/src/components/MarkdownRenderer/renderers/CodeBlock.tsx` - Syntax highlighting
- `packages/ui-kit/react-markdown/src/utils/syntaxHighlighter.ts` - Prism.js integration
- `packages/ui-kit/react-chat/src/components/ChatMessage/ChatMessage.tsx` - Tool display patterns
- `.planning/research/AGENT_SDK.md` - Tool input/output schemas

### Secondary (MEDIUM confidence)
- Existing `apps/claude-code-web/` implementation from Phases 1-2

### Tertiary (LOW confidence)
- None - all findings verified against source code

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing ui-kit components
- Architecture: HIGH - Patterns derived from working ui-kit code
- Pitfalls: HIGH - Based on actual component implementations

**Research date:** 2026-01-19
**Valid until:** 2026-02-19 (30 days - stable components)

---

## Implementation Checklist Summary

For the planner, key implementation areas:

1. **Server**
   - [ ] File read endpoint (`/api/files/read`)
   - [ ] Directory listing endpoint (`/api/files/list`)
   - [ ] Path security validation (cwd containment)

2. **Client - Tool Result Components**
   - [ ] ToolResultDisplay router component
   - [ ] FileContentResult (uses CodeBlock)
   - [ ] FileListResult (Glob output)
   - [ ] SearchResultsDisplay (Grep output)
   - [ ] DefaultToolResult (fallback pre block)

3. **Client - File Browser**
   - [ ] FileBrowser component (uses TreeView)
   - [ ] File viewer panel/modal
   - [ ] useFileContent hook for fetching

4. **Client - Utilities**
   - [ ] languageDetection.ts (file ext to Prism language)
   - [ ] toolResultTransformers.ts (Glob/Grep output parsers)
   - [ ] File icon resolver for TreeView

5. **Integration**
   - [ ] Wire tool results into ChatMessage parts
   - [ ] Clickable file paths link to file viewer
   - [ ] Tool progress indicators (already in ChatMessage)
