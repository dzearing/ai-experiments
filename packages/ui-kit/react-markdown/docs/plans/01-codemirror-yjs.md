# Plan 01: CodeMirror 6 + Yjs (CRDT)

> **Reference:** [00-requirements.md](./00-requirements.md)

## Overview

This approach uses **CodeMirror 6** as the editor with **Yjs** (a CRDT library) for collaborative state management. This is the same architecture used by HackMD, HedgeDoc, and other production collaborative editors.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Component                       │
│                   <MarkdownEditor />                     │
├─────────────────────────────────────────────────────────┤
│                   CodeMirror 6 View                      │
│        (EditorView + extensions + theme)                 │
├─────────────────────────────────────────────────────────┤
│              y-codemirror.next Binding                   │
│    (yCollab extension + cursor awareness plugin)         │
├─────────────────────────────────────────────────────────┤
│                     Yjs Layer                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │   Y.Doc     │  │   Y.Text    │  │   Awareness     │  │
│  │ (document)  │  │  (content)  │  │   (cursors)     │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────┤
│                   Provider Layer                         │
│   (Local-only for AI / y-websocket for multi-user)      │
└─────────────────────────────────────────────────────────┘
```

### How It Works

1. **Y.Doc** is the root Yjs document containing all shared state
2. **Y.Text** is a collaborative text type that maps to CodeMirror's document
3. **y-codemirror.next** provides the `yCollab()` extension that synchronizes bidirectionally
4. **Awareness** protocol handles ephemeral data (cursors, selections, presence) separately from document
5. Changes flow: User types → CodeMirror transaction → Y.Text operation → Awareness updates → Other peers receive

### Key Insight: CRDT vs OT

Yjs uses the **YATA CRDT algorithm** which:
- Assigns globally unique IDs to each character
- Maintains relative ordering based on neighbors (not indices)
- Guarantees convergence without central authority
- Preserves intention: content inserted between two positions stays between them

---

## Dependencies

### New Dependencies Required

```bash
pnpm add yjs y-codemirror.next
```

| Package | Size (gzipped) | Purpose |
|---------|----------------|---------|
| `yjs` | ~28 KB | Core CRDT engine |
| `y-codemirror.next` | ~5 KB | CodeMirror 6 binding |
| **Total New** | ~33 KB | |

### Already Installed

```json
{
  "@codemirror/collab": "^6.1.1",
  "@codemirror/lang-markdown": "^6.5.0",
  "@codemirror/state": "^6.5.2",
  "@codemirror/view": "^6.39.0",
  "codemirror": "^6.0.2"
}
```

---

## Implementation

### File Structure

```
src/components/MarkdownEditor/
├── MarkdownEditor.tsx          # Main component (rewrite)
├── MarkdownEditor.module.css   # Styles (update)
├── useYjsCollaboration.ts      # NEW: Yjs + Awareness hook
├── useCodeMirrorEditor.ts      # NEW: CodeMirror setup hook
├── createEditorTheme.ts        # NEW: Theme from design tokens
├── types.ts                    # NEW: Shared types
└── index.ts                    # Exports (update)
```

### Core Hook: useYjsCollaboration

```typescript
import { useRef, useEffect, useCallback, useMemo } from 'react';
import * as Y from 'yjs';
import { yCollab, yUndoManagerKeymap } from 'y-codemirror.next';
import { keymap } from '@codemirror/view';
import type { Extension } from '@codemirror/state';

export interface CoAuthor {
  id: string;
  name: string;
  color: string;
  cursorPosition?: number;
  isAI?: boolean;
}

export interface UseYjsCollaborationOptions {
  initialContent?: string;
  localUser?: { id: string; name: string; color: string };
  onChange?: (content: string) => void;
}

export function useYjsCollaboration(options: UseYjsCollaborationOptions) {
  const docRef = useRef<Y.Doc | null>(null);
  const textRef = useRef<Y.Text | null>(null);
  const awarenessRef = useRef<LocalAwareness | null>(null);
  const undoManagerRef = useRef<Y.UndoManager | null>(null);

  // Initialize once
  if (!docRef.current) {
    const doc = new Y.Doc();
    const text = doc.getText('content');
    const awareness = new LocalAwareness();
    const undoManager = new Y.UndoManager(text);

    if (options.initialContent) {
      text.insert(0, options.initialContent);
    }

    if (options.localUser) {
      awareness.setLocalStateField('user', options.localUser);
    }

    docRef.current = doc;
    textRef.current = text;
    awarenessRef.current = awareness;
    undoManagerRef.current = undoManager;
  }

  const doc = docRef.current;
  const text = textRef.current!;
  const awareness = awarenessRef.current!;
  const undoManager = undoManagerRef.current!;

  // Observe changes
  useEffect(() => {
    const observer = () => options.onChange?.(text.toString());
    text.observe(observer);
    return () => text.unobserve(observer);
  }, [options.onChange, text]);

  // Build CodeMirror extensions
  const extensions = useMemo((): Extension[] => [
    yCollab(text, awareness, { undoManager }),
    keymap.of(yUndoManagerKeymap),
  ], [text, awareness, undoManager]);

  // Methods for AI co-authoring
  const insertAt = useCallback((position: number, content: string) => {
    text.insert(position, content);
  }, [text]);

  const deleteRange = useCallback((start: number, length: number) => {
    text.delete(start, length);
  }, [text]);

  const setCoAuthorCursor = useCallback((
    authorId: string,
    position: number,
    user: { name: string; color: string }
  ) => {
    awareness.setRemoteState(authorId, {
      user,
      cursor: Y.createRelativePositionFromTypeIndex(text, position),
    });
  }, [awareness, text]);

  return {
    doc,
    text,
    awareness,
    extensions,
    insertAt,
    deleteRange,
    setCoAuthorCursor,
    getContent: () => text.toString(),
  };
}

// Simple local-only awareness for AI co-authoring
class LocalAwareness {
  private states = new Map<string, any>();
  private listeners = new Set<() => void>();

  setLocalStateField(field: string, value: any) {
    const current = this.states.get('local') || {};
    this.states.set('local', { ...current, [field]: value });
    this.notify();
  }

  setRemoteState(clientId: string, state: any) {
    this.states.set(clientId, state);
    this.notify();
  }

  getStates() { return this.states; }

  on(_event: string, cb: () => void) { this.listeners.add(cb); }
  off(_event: string, cb: () => void) { this.listeners.delete(cb); }

  private notify() { this.listeners.forEach(cb => cb()); }
}
```

### Main Component

```typescript
import { forwardRef, useRef, useImperativeHandle, useEffect } from 'react';
import { EditorView } from '@codemirror/view';
import { useYjsCollaboration } from './useYjsCollaboration';
import { useCodeMirrorEditor } from './useCodeMirrorEditor';
import { createEditorTheme } from './createEditorTheme';
import styles from './MarkdownEditor.module.css';

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
      ...rest
    } = props;

    const containerRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);

    // Yjs collaboration layer
    const collab = useYjsCollaboration({
      initialContent: value ?? defaultValue,
      onChange,
      localUser: { id: 'local', name: 'You', color: '#3b82f6' },
    });

    // CodeMirror editor
    const { view, isReady } = useCodeMirrorEditor({
      parent: containerRef.current,
      extensions: [
        ...collab.extensions,
        createEditorTheme(),
      ],
      placeholder,
      readOnly,
    });

    useEffect(() => { viewRef.current = view; }, [view]);

    // Update co-author cursors
    useEffect(() => {
      coAuthors.forEach(author => {
        if (author.cursorPosition !== undefined) {
          collab.setCoAuthorCursor(author.id, author.cursorPosition, {
            name: author.name,
            color: author.color,
          });
        }
      });
    }, [coAuthors, collab]);

    // Expose ref methods
    useImperativeHandle(ref, () => ({
      getMarkdown: collab.getContent,
      setMarkdown: (md) => {
        collab.text.delete(0, collab.text.length);
        collab.text.insert(0, md);
      },
      insertAt: collab.insertAt,
      deleteRange: collab.deleteRange,
      focus: () => viewRef.current?.focus(),
      getCursorPosition: () => viewRef.current?.state.selection.main.head ?? 0,
      setCursorPosition: (pos) => {
        viewRef.current?.dispatch({ selection: { anchor: pos } });
      },
      getSelection: () => {
        const sel = viewRef.current?.state.selection.main;
        return { start: sel?.from ?? 0, end: sel?.to ?? 0 };
      },
      setSelection: (start, end) => {
        viewRef.current?.dispatch({ selection: { anchor: start, head: end } });
      },
    }), [collab]);

    return (
      <div className={`${styles.container} ${className || ''}`}>
        <div ref={containerRef} className={styles.editor} />
      </div>
    );
  }
);
```

---

## Cursor & Selection Rendering

### How y-codemirror.next Renders Cursors

The library uses CodeMirror's decoration system to render remote cursors:

**CSS Classes Generated:**
- `.yRemoteSelection` - Selection highlight background
- `.yRemoteSelectionHead` - Cursor caret
- `.yRemoteSelection-{clientId}` - Per-user selection
- `.yRemoteSelectionHead-{clientId}` - Per-user cursor

**Styling:**

```css
/* Remote selection highlighting */
.yRemoteSelection {
  background-color: var(--remote-selection-color, rgba(0, 0, 255, 0.2));
  border-radius: 2px;
}

/* Remote cursor caret */
.yRemoteSelectionHead {
  position: absolute;
  border-left: 2px solid var(--remote-cursor-color, blue);
  height: 1.2em;
  margin-left: -1px;
}

/* Cursor label (user name) */
.yRemoteSelectionHead::after {
  content: attr(data-name);
  position: absolute;
  bottom: 100%;
  left: -2px;
  padding: 2px 6px;
  background: var(--remote-cursor-color);
  color: white;
  font-size: 11px;
  font-weight: 600;
  border-radius: 3px 3px 3px 0;
  white-space: nowrap;
}
```

### Dynamic Per-User Colors

Colors are injected dynamically based on awareness state:

```typescript
awareness.on('change', () => {
  const states = awareness.getStates();
  let css = '';

  states.forEach((state, clientId) => {
    if (!state.user) return;
    css += `
      .yRemoteSelection-${clientId} {
        background-color: ${state.user.color}33 !important;
      }
      .yRemoteSelectionHead-${clientId} {
        border-color: ${state.user.color} !important;
      }
      .yRemoteSelectionHead-${clientId}::after {
        background: ${state.user.color};
      }
    `;
  });

  // Inject stylesheet
  updateStylesheet('yjs-cursors', css);
});
```

---

## Theming Integration

### Creating Theme from Design Tokens

```typescript
import { EditorView } from '@codemirror/view';

export function createEditorTheme() {
  return EditorView.theme({
    '&': {
      backgroundColor: 'var(--color-inset-background)',
      color: 'var(--color-body-text)',
    },
    '.cm-content': {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--font-size)',
      padding: 'var(--spacing-small10)',
      caretColor: 'var(--color-body-text)',
    },
    '.cm-cursor': {
      borderLeftColor: 'var(--color-body-text)',
    },
    '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
      backgroundColor: 'var(--color-body-backgroundSelected)',
    },
    '.cm-gutters': {
      backgroundColor: 'var(--color-panel-background)',
      color: 'var(--color-body-textSoft20)',
      borderRight: '1px solid var(--color-body-border)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'var(--color-body-backgroundHover)',
    },
    '.cm-placeholder': {
      color: 'var(--color-body-textSoft20)',
    },
    // Remote cursor styling
    '.yRemoteSelection': {
      mixBlendMode: 'multiply',
    },
    '.yRemoteSelectionHead': {
      zIndex: 10,
    },
  });
}
```

---

## Requirements Coverage

| Requirement | Status | Notes |
|-------------|--------|-------|
| **CR-1: Real-time Co-authoring** | ✅ Full | Native CRDT support |
| CR-1.1 Multiple editors | ✅ | Built-in |
| CR-1.2 Real-time changes | ✅ | Via Y.Text observers |
| CR-1.3 No data loss | ✅ | CRDT guarantees convergence |
| CR-1.4 Automatic conflict resolution | ✅ | YATA algorithm |
| CR-1.5 AI edits support | ✅ | `text.insert()` works seamlessly |
| **CR-2: Cursor Preservation** | ✅ Full | Native with Yjs |
| CR-2.1-2.5 All cursor requirements | ✅ | Relative positions preserve through changes |
| **CR-3: Co-author Visibility** | ✅ Full | Awareness protocol |
| CR-3.1-3.5 Cursors & selections | ✅ | Built into y-codemirror.next |
| CR-3.6 Customizable colors | ✅ | Via awareness state |
| CR-3.7 Typing indicator | ⚠️ Partial | Must implement manually |
| **CR-4: Performance** | ✅ Good | "Fastest CRDT implementation" |
| CR-4.1 10K lines | ✅ | Handled well |
| CR-4.2 50K lines | ⚠️ | May need optimization |
| CR-4.5-4.6 Latency | ✅ | CodeMirror is fast |
| **CR-5: Theming** | ✅ Full | EditorView.theme() + CSS vars |
| **CR-6: API Surface** | ✅ Full | Can implement all methods |
| **CR-7: Markdown Features** | ✅ Full | @codemirror/lang-markdown |
| **CR-8: Accessibility** | ✅ Good | CodeMirror has good a11y |

---

## Test Case Analysis

| Test Case | Expected Result |
|-----------|-----------------|
| TC-1: Basic Co-authoring | ✅ Pass - Y.Text handles position mapping |
| TC-2: Concurrent Different Locations | ✅ Pass - CRDT merges cleanly |
| TC-3: Concurrent Same Location | ✅ Pass - Deterministic ordering |
| TC-4: Selection Preservation | ✅ Pass - Relative positions |
| TC-5: Overlapping Selections | ✅ Pass - Awareness renders both |
| TC-6: Scroll Stability | ✅ Pass - No cursor jumping |
| TC-7: Rapid AI Streaming | ✅ Pass - Designed for this |
| TC-8: Cursor Visibility | ✅ Pass - Built-in |
| TC-9: Theme Integration | ✅ Pass - CSS vars supported |
| TC-10: Large Document | ⚠️ Needs testing at 10K+ lines |
| TC-11: Undo/Redo | ✅ Pass - Y.UndoManager per-client |
| TC-12: Programmatic API | ✅ Pass - text.insert() |

---

## Pros & Cons

### Pros

1. **Native cursor preservation** - No workarounds needed
2. **Battle-tested** - Used by HackMD, HedgeDoc, Proton Docs
3. **Offline support** - CRDTs work without server
4. **Network agnostic** - Can add real multi-user later
5. **Per-client undo** - Each user has own history
6. **Rich awareness** - Presence, typing indicators built-in
7. **Zero runtime deps** - Yjs has no dependencies

### Cons

1. **Bundle size** - Adds ~33KB gzipped
2. **Document growth** - CRDTs grow over time (tombstones)
3. **Learning curve** - CRDT concepts differ from traditional
4. **Large doc perf** - May struggle with 50K+ lines
5. **Custom cursor UI** - y-codemirror.next styling is basic

---

## Implementation Effort

| Task | Estimate |
|------|----------|
| Add dependencies | 5 min |
| useYjsCollaboration hook | 2 hrs |
| useCodeMirrorEditor hook | 1 hr |
| Theme integration | 1 hr |
| MarkdownEditor rewrite | 2 hrs |
| Cursor styling | 1 hr |
| Testing & refinement | 2 hrs |
| **Total** | **~9 hrs** |

---

## When to Choose This Approach

**Choose Yjs + CodeMirror when:**
- You need robust cursor preservation (primary requirement)
- You may add real multi-user collaboration later
- Offline editing capability is valuable
- 33KB bundle increase is acceptable
- You want a proven, production-tested solution

**Don't choose when:**
- Bundle size is critical (every KB matters)
- You only need single-user + AI (simpler options exist)
- Documents exceed 50K lines regularly
