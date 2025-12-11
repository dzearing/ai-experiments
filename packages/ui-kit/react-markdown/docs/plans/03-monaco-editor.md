# Plan 03: Monaco Editor

> **Reference:** [00-requirements.md](./00-requirements.md)

## Overview

This approach uses **Monaco Editor** - the same editor that powers VSCode. Monaco provides rich IDE features out-of-the-box but requires significant bundle size and custom implementation for collaborative features.

**Key Insight:** Monaco has excellent APIs for programmatic editing and decorations, but no built-in collaboration. You'd need to implement cursor synchronization yourself or integrate with Yjs.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Component                       │
│             <MarkdownEditor /> (via @monaco-editor/react)│
├─────────────────────────────────────────────────────────┤
│                    Monaco Editor                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │ ITextModel  │  │ Decorations │  │   Themes        │  │
│  │ (document)  │  │ (cursors)   │  │   (styling)     │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────┤
│                   Web Workers                            │
│   (Language services, syntax highlighting)               │
├─────────────────────────────────────────────────────────┤
│              Custom Co-Author Layer                      │
│        (deltaDecorations for cursor display)             │
└─────────────────────────────────────────────────────────┘
```

### How It Works

1. **ITextModel** holds the document content independently of editor views
2. **pushEditOperations()** or **executeEdits()** apply programmatic changes
3. **deltaDecorations()** renders remote cursors and selections
4. **Web workers** provide syntax highlighting and language features
5. Position tracking via `getOffsetAt()` / `getPositionAt()` conversions

---

## Dependencies

### New Dependencies Required

```bash
pnpm add monaco-editor @monaco-editor/react
```

| Package | Size (gzipped) | Purpose |
|---------|----------------|---------|
| `monaco-editor` | ~1-2 MB | Core editor (large!) |
| `@monaco-editor/react` | ~50 KB | React wrapper |
| **Total New** | **~1.5-2 MB** | |

### Worker Configuration Required

Monaco requires web workers for language services:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    include: ['monaco-editor'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          monaco: ['monaco-editor'],
        },
      },
    },
  },
});
```

---

## Implementation

### File Structure

```
src/components/MarkdownEditor/
├── MarkdownEditor.tsx          # Main component (rewrite)
├── MarkdownEditor.module.css   # Styles (update)
├── useMonacoEditor.ts          # NEW: Monaco setup hook
├── useCoAuthorDecorations.ts   # NEW: Remote cursor decorations
├── monacoTheme.ts              # NEW: Theme from design tokens
├── types.ts                    # NEW: Shared types
└── index.ts                    # Exports (update)
```

### Core Hook: useMonacoEditor

```typescript
import { useRef, useEffect, useCallback, useState } from 'react';
import * as monaco from 'monaco-editor';

export interface UseMonacoEditorOptions {
  initialValue?: string;
  language?: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  onSelectionChange?: (start: number, end: number) => void;
}

export function useMonacoEditor(options: UseMonacoEditorOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || editorRef.current) return;

    const editor = monaco.editor.create(containerRef.current, {
      value: options.initialValue || '',
      language: options.language || 'markdown',
      readOnly: options.readOnly,
      minimap: { enabled: false },
      lineNumbers: 'on',
      wordWrap: 'on',
      scrollBeyondLastLine: false,
      automaticLayout: true,
      fontSize: 14,
      fontFamily: 'var(--font-mono)',
    });

    // Listen for content changes
    editor.onDidChangeModelContent(() => {
      options.onChange?.(editor.getValue());
    });

    // Listen for selection changes
    editor.onDidChangeCursorSelection((e) => {
      const sel = e.selection;
      const model = editor.getModel();
      if (!model) return;

      const start = model.getOffsetAt(sel.getStartPosition());
      const end = model.getOffsetAt(sel.getEndPosition());
      options.onSelectionChange?.(start, end);
    });

    editorRef.current = editor;
    setIsReady(true);

    return () => {
      editor.dispose();
      editorRef.current = null;
    };
  }, []);

  // Insert text at position - preserves cursor!
  const insertAt = useCallback((offset: number, text: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    const model = editor.getModel();
    if (!model) return;

    const position = model.getPositionAt(offset);

    editor.executeEdits('ai', [{
      range: new monaco.Range(
        position.lineNumber,
        position.column,
        position.lineNumber,
        position.column
      ),
      text,
      forceMoveMarkers: true,
    }]);
  }, []);

  // Delete range
  const deleteRange = useCallback((start: number, length: number) => {
    const editor = editorRef.current;
    if (!editor) return;

    const model = editor.getModel();
    if (!model) return;

    const startPos = model.getPositionAt(start);
    const endPos = model.getPositionAt(start + length);

    editor.executeEdits('ai', [{
      range: new monaco.Range(
        startPos.lineNumber,
        startPos.column,
        endPos.lineNumber,
        endPos.column
      ),
      text: '',
    }]);
  }, []);

  // Set content while preserving cursor
  const setContent = useCallback((content: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    const model = editor.getModel();
    if (!model) return;

    // Save cursor position
    const position = editor.getPosition();
    const currentOffset = position ? model.getOffsetAt(position) : 0;

    // Replace content
    model.setValue(content);

    // Restore cursor (clamped to new content length)
    const newOffset = Math.min(currentOffset, content.length);
    const newPosition = model.getPositionAt(newOffset);
    editor.setPosition(newPosition);
  }, []);

  return {
    containerRef,
    editor: editorRef.current,
    isReady,
    insertAt,
    deleteRange,
    setContent,
    getContent: () => editorRef.current?.getValue() ?? '',
  };
}
```

### Co-Author Cursor Decorations

```typescript
import { useRef, useCallback } from 'react';
import * as monaco from 'monaco-editor';

export interface CoAuthorDecoration {
  authorId: string;
  cursorDecorationId: string[];
  selectionDecorationId: string[];
}

export function useCoAuthorDecorations(
  editor: monaco.editor.IStandaloneCodeEditor | null
) {
  const decorationsRef = useRef<Map<string, string[]>>(new Map());

  const updateCoAuthors = useCallback((coAuthors: CoAuthor[]) => {
    if (!editor) return;

    const model = editor.getModel();
    if (!model) return;

    // Collect all decoration IDs to remove
    const oldDecorations: string[] = [];
    decorationsRef.current.forEach(ids => oldDecorations.push(...ids));

    // Build new decorations
    const newDecorations: monaco.editor.IModelDeltaDecoration[] = [];

    for (const author of coAuthors) {
      if (author.cursorPosition === undefined) continue;

      const position = model.getPositionAt(
        Math.min(author.cursorPosition, model.getValueLength())
      );

      // Cursor decoration (thin line)
      newDecorations.push({
        range: new monaco.Range(
          position.lineNumber,
          position.column,
          position.lineNumber,
          position.column
        ),
        options: {
          className: `remote-cursor-${author.id}`,
          beforeContentClassName: 'remote-cursor-caret',
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          hoverMessage: { value: author.name },
        },
      });

      // Selection decoration (if present)
      if (author.selectionStart !== undefined && author.selectionEnd !== undefined) {
        const startPos = model.getPositionAt(author.selectionStart);
        const endPos = model.getPositionAt(author.selectionEnd);

        newDecorations.push({
          range: new monaco.Range(
            startPos.lineNumber,
            startPos.column,
            endPos.lineNumber,
            endPos.column
          ),
          options: {
            className: `remote-selection-${author.id}`,
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          },
        });
      }

      // Inject per-author CSS
      injectAuthorStyles(author);
    }

    // Apply decorations
    const newIds = editor.deltaDecorations(oldDecorations, newDecorations);

    // Store new IDs for future updates
    decorationsRef.current.clear();
    coAuthors.forEach((author, i) => {
      const ids = newIds.slice(i * 2, i * 2 + 2).filter(Boolean);
      decorationsRef.current.set(author.id, ids);
    });
  }, [editor]);

  return { updateCoAuthors };
}

// Inject dynamic CSS for each author's colors
function injectAuthorStyles(author: CoAuthor) {
  const styleId = `remote-cursor-style-${author.id}`;
  let style = document.getElementById(styleId) as HTMLStyleElement;

  if (!style) {
    style = document.createElement('style');
    style.id = styleId;
    document.head.appendChild(style);
  }

  style.textContent = `
    .remote-cursor-${author.id}::before {
      content: '';
      position: absolute;
      width: 2px;
      height: 1.2em;
      background-color: ${author.color};
      margin-left: -1px;
    }
    .remote-selection-${author.id} {
      background-color: ${author.color}33;
    }
  `;
}
```

### Theme from Design Tokens

```typescript
import * as monaco from 'monaco-editor';

export function createMonacoTheme(): void {
  // Monaco doesn't support CSS variables directly
  // We need to read computed values and create a static theme

  const computedStyle = getComputedStyle(document.documentElement);

  const getToken = (name: string, fallback: string) => {
    const value = computedStyle.getPropertyValue(name).trim();
    return value || fallback;
  };

  monaco.editor.defineTheme('claude-flow-theme', {
    base: 'vs-dark', // or 'vs' for light
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
      { token: 'keyword', foreground: '569CD6' },
      { token: 'string', foreground: 'CE9178' },
      { token: 'number', foreground: 'B5CEA8' },
    ],
    colors: {
      'editor.background': getToken('--color-inset-background', '#1e1e1e'),
      'editor.foreground': getToken('--color-body-text', '#d4d4d4'),
      'editor.lineHighlightBackground': getToken('--color-body-backgroundHover', '#2d2d2d'),
      'editorCursor.foreground': getToken('--color-body-text', '#ffffff'),
      'editor.selectionBackground': getToken('--color-body-backgroundSelected', '#264f78'),
      'editorLineNumber.foreground': getToken('--color-body-textSoft20', '#858585'),
      'editorGutter.background': getToken('--color-panel-background', '#1e1e1e'),
    },
  });
}

// Call this when theme changes
export function updateMonacoTheme(): void {
  createMonacoTheme();
  // Re-apply to all editors
  monaco.editor.setTheme('claude-flow-theme');
}
```

### Main Component (Using @monaco-editor/react)

```typescript
import { forwardRef, useRef, useImperativeHandle, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { useCoAuthorDecorations } from './useCoAuthorDecorations';
import { createMonacoTheme } from './monacoTheme';
import styles from './MarkdownEditor.module.css';
import type * as monaco from 'monaco-editor';

export const MarkdownEditor = forwardRef<MarkdownEditorRef, MarkdownEditorProps>(
  function MarkdownEditor(props, ref) {
    const {
      defaultValue = '',
      value,
      onChange,
      coAuthors = [],
      placeholder,
      readOnly,
      className,
    } = props;

    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const { updateCoAuthors } = useCoAuthorDecorations(editorRef.current);

    const handleEditorMount: OnMount = (editor, monaco) => {
      editorRef.current = editor;
      createMonacoTheme();
      monaco.editor.setTheme('claude-flow-theme');
    };

    // Update co-author cursors
    useEffect(() => {
      if (editorRef.current) {
        updateCoAuthors(coAuthors);
      }
    }, [coAuthors, updateCoAuthors]);

    // Helper functions
    const insertAt = (offset: number, text: string) => {
      const editor = editorRef.current;
      if (!editor) return;

      const model = editor.getModel();
      if (!model) return;

      const position = model.getPositionAt(offset);
      editor.executeEdits('ai', [{
        range: new monaco.Range(
          position.lineNumber, position.column,
          position.lineNumber, position.column
        ),
        text,
        forceMoveMarkers: true,
      }]);
    };

    const deleteRange = (start: number, length: number) => {
      const editor = editorRef.current;
      if (!editor) return;

      const model = editor.getModel();
      if (!model) return;

      const startPos = model.getPositionAt(start);
      const endPos = model.getPositionAt(start + length);

      editor.executeEdits('ai', [{
        range: new monaco.Range(
          startPos.lineNumber, startPos.column,
          endPos.lineNumber, endPos.column
        ),
        text: '',
      }]);
    };

    // Expose ref methods
    useImperativeHandle(ref, () => ({
      getMarkdown: () => editorRef.current?.getValue() ?? '',
      setMarkdown: (md) => editorRef.current?.setValue(md),
      insertAt,
      deleteRange,
      focus: () => editorRef.current?.focus(),
      getCursorPosition: () => {
        const editor = editorRef.current;
        const model = editor?.getModel();
        const pos = editor?.getPosition();
        if (!model || !pos) return 0;
        return model.getOffsetAt(pos);
      },
      setCursorPosition: (offset) => {
        const editor = editorRef.current;
        const model = editor?.getModel();
        if (!model) return;
        const pos = model.getPositionAt(offset);
        editor?.setPosition(pos);
      },
      getSelection: () => {
        const editor = editorRef.current;
        const model = editor?.getModel();
        const sel = editor?.getSelection();
        if (!model || !sel) return { start: 0, end: 0 };
        return {
          start: model.getOffsetAt(sel.getStartPosition()),
          end: model.getOffsetAt(sel.getEndPosition()),
        };
      },
      setSelection: (start, end) => {
        const editor = editorRef.current;
        const model = editor?.getModel();
        if (!model) return;
        const startPos = model.getPositionAt(start);
        const endPos = model.getPositionAt(end);
        editor?.setSelection(new monaco.Selection(
          startPos.lineNumber, startPos.column,
          endPos.lineNumber, endPos.column
        ));
      },
    }), []);

    return (
      <div className={`${styles.container} ${className || ''}`}>
        <Editor
          defaultValue={defaultValue}
          value={value}
          onChange={(value) => onChange?.(value ?? '')}
          language="markdown"
          options={{
            readOnly,
            minimap: { enabled: false },
            lineNumbers: 'on',
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            fontSize: 14,
          }}
          onMount={handleEditorMount}
        />
      </div>
    );
  }
);
```

---

## Requirements Coverage

| Requirement | Status | Notes |
|-------------|--------|-------|
| **CR-1: Real-time Co-authoring** | ⚠️ Partial | No built-in collab |
| CR-1.1 Multiple editors | ❌ | Needs Yjs or custom implementation |
| CR-1.2 Real-time changes | ✅ | Within same process |
| CR-1.3 No data loss | ✅ | Single source of truth |
| CR-1.4 Automatic conflict resolution | N/A | No conflicts in single process |
| CR-1.5 AI edits support | ✅ | executeEdits() API |
| **CR-2: Cursor Preservation** | ⚠️ Partial | setValue() resets cursor |
| CR-2.1-2.3 Basic cursor | ✅ | With executeEdits() |
| CR-2.4 Scroll stability | ✅ | Monaco handles well |
| CR-2.5 No flickering | ⚠️ | Depends on implementation |
| **CR-3: Co-author Visibility** | ⚠️ Custom | Must build decorations |
| CR-3.1-3.5 Cursors & selections | ✅ | Via deltaDecorations |
| CR-3.6 Customizable colors | ✅ | Dynamic CSS injection |
| CR-3.7 Typing indicator | ⚠️ | Must implement manually |
| **CR-4: Performance** | ⚠️ Mixed | Large but optimized |
| CR-4.1 10K lines | ✅ | Monaco handles well |
| CR-4.2 50K lines | ✅ | Designed for large files |
| CR-4.5 Initial render | ❌ | 1-2s load time |
| CR-4.6 Keystroke latency | ✅ | Fast after load |
| **CR-5: Theming** | ⚠️ Partial | No CSS variable support |
| CR-5.1-5.3 Tokens | ⚠️ | Must read computed values |
| CR-5.4 Theme switching | ⚠️ | Requires re-creating theme |
| **CR-6: API Surface** | ✅ Full | Rich API |
| **CR-7: Markdown Features** | ⚠️ Basic | Syntax only, no preview |
| **CR-8: Accessibility** | ⚠️ Partial | Known issues |

---

## Test Case Analysis

| Test Case | Expected Result |
|-----------|-----------------|
| TC-1: Basic Co-authoring | ✅ Pass - executeEdits handles it |
| TC-2: Concurrent Different Locations | ✅ Pass - Within process |
| TC-3: Concurrent Same Location | ⚠️ N/A - Single process |
| TC-4: Selection Preservation | ⚠️ Partial - Must use executeEdits |
| TC-5: Overlapping Selections | ✅ Pass - Multiple decorations |
| TC-6: Scroll Stability | ✅ Pass - Monaco handles well |
| TC-7: Rapid AI Streaming | ✅ Pass - executeEdits is fast |
| TC-8: Cursor Visibility | ✅ Pass - deltaDecorations |
| TC-9: Theme Integration | ⚠️ Partial - No CSS vars |
| TC-10: Large Document | ✅ Pass - Monaco optimized |
| TC-11: Undo/Redo | ✅ Pass - Built-in history |
| TC-12: Programmatic API | ✅ Pass - executeEdits |

---

## Known Issues

### Mobile Support
- Monaco is optimized for desktop
- Touch interactions less polished
- **Replit saw 70% increase in mobile retention after switching to CodeMirror**

### Accessibility
- Screen reader support has known issues
- Line numbers not keyboard accessible
- IntelliSense suggestions not read correctly

### Theming Limitations
- **No CSS variable support** (open issue #2427 since 2021)
- Must read computed values and recreate theme
- Theme switching requires extra code

### Bundle Size
- **1-2 MB gzipped** - 30-60x larger than CodeMirror
- Requires web workers
- Difficult to tree-shake below 1 MB

---

## Pros & Cons

### Pros

1. **VSCode familiarity** - Users know the UX
2. **Rich IntelliSense** - Out-of-box language features
3. **Large file support** - Excellent performance
4. **Inline suggestions** - Ghost text API (Copilot-style)
5. **Mature ecosystem** - Many extensions available
6. **Extensive API** - Can do almost anything

### Cons

1. **Huge bundle** - 1-2 MB gzipped
2. **No CSS variables** - Theming is awkward
3. **Poor mobile** - Not optimized for touch
4. **Web workers required** - Build config complexity
5. **No built-in collab** - Must implement yourself
6. **Accessibility issues** - Known problems
7. **Overkill for markdown** - Built for full IDE

---

## Implementation Effort

| Task | Estimate |
|------|----------|
| Add dependencies & config | 1 hr |
| useMonacoEditor hook | 1.5 hrs |
| Co-author decorations | 2 hrs |
| Theme integration (no CSS vars) | 2 hrs |
| MarkdownEditor component | 1.5 hrs |
| Build/worker configuration | 1 hr |
| Testing & refinement | 2 hrs |
| **Total** | **~11 hrs** |

---

## When to Choose This Approach

**Choose Monaco when:**
- You need VSCode-like experience
- IntelliSense and language features are critical
- Users are developers familiar with VSCode
- Bundle size (1-2 MB) is acceptable
- Desktop is primary target
- You want ghost text / inline suggestions

**Don't choose when:**
- Bundle size is a concern
- Mobile support is important
- CSS variable theming is required
- You just need markdown editing (overkill)
- Accessibility is critical

---

## Comparison Note

Several major companies have **migrated away from Monaco**:

- **Sourcegraph**: "Monaco was 40% of our dependencies"
- **Replit**: "70% increase in mobile retention" after switching to CodeMirror

Monaco is powerful but may be overkill for a markdown editor. Consider CodeMirror for a lighter-weight solution with better mobile support and CSS variable theming.
