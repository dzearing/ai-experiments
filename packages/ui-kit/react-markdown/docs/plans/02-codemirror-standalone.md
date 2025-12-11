# Plan: Rewrite MarkdownEditor with CodeMirror 6

> **Requirements:** [00-requirements.md](./00-requirements.md)

## Summary

Replace the current textarea-based `MarkdownEditor` component with CodeMirror 6. The `MarkdownCoEditor` component consumes `MarkdownEditor` and will automatically benefit from this change.

**Goal:** A robust markdown/code editor with syntax highlighting, search, folding, co-author cursors, and all features defined in the requirements document.

---

## What We're Changing

```
packages/ui-kit/react-markdown/src/components/MarkdownEditor/
├── MarkdownEditor.tsx          # REWRITE - Replace textarea with CodeMirror 6
├── MarkdownEditor.module.css   # UPDATE - CodeMirror theming
├── useCodeMirrorEditor.ts      # NEW - Core CodeMirror hook
├── useCoAuthorDecorations.ts   # NEW - Remote cursor/selection decorations
├── extensions/                 # NEW - CodeMirror extensions
│   ├── search.ts               # Search/replace configuration
│   ├── folding.ts              # Code folding configuration
│   └── theme.ts                # Theme from design tokens
├── types.ts                    # NEW - Shared TypeScript types
└── index.ts                    # UPDATE - Exports
```

**Note:** `MarkdownCoEditor` consumes `MarkdownEditor` - no changes needed there.

---

## Dependencies

**Already installed (no new packages needed):**

```json
{
  "@codemirror/lang-markdown": "^6.5.0",
  "@codemirror/language-data": "^6.5.2",
  "@codemirror/state": "^6.5.2",
  "@codemirror/view": "^6.39.0",
  "codemirror": "^6.0.2"
}
```

**Need to add for search and folding:**

```bash
pnpm add @codemirror/search @codemirror/commands
```

---

## Features to Implement

### 1. Core Editor (CR-6, CR-7)

```typescript
// Extensions to include
import { markdown } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { history, historyKeymap } from '@codemirror/commands';
import { EditorView, lineNumbers, drawSelection } from '@codemirror/view';

const extensions = [
  markdown({ codeLanguages: languages }), // Nested code block highlighting
  history(),                               // Undo/redo
  lineNumbers(),                           // Optional line numbers
  EditorView.lineWrapping,                 // Line wrapping
  drawSelection(),                         // Selection rendering
];
```

### 2. Search & Navigation (CR-8)

```typescript
import { search, searchKeymap, gotoLine } from '@codemirror/search';
import { keymap } from '@codemirror/view';

const searchExtensions = [
  search({
    top: true,  // Search panel at top
  }),
  keymap.of([
    ...searchKeymap,           // Ctrl+F, F3, etc.
    { key: 'Ctrl-g', run: gotoLine }, // Go to line
  ]),
];
```

### 3. Code Folding (CR-9)

```typescript
import { foldGutter, codeFolding, foldKeymap } from '@codemirror/language';
import { keymap } from '@codemirror/view';

const foldingExtensions = [
  foldGutter(),      // Fold icons in gutter
  codeFolding(),     // Enable folding
  keymap.of(foldKeymap), // Ctrl+Shift+[ to fold, etc.
];
```

### 4. Co-Author Cursors (CR-3)

```typescript
// Custom StateField for remote cursor decorations
const coAuthorField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(decorations, tr) {
    decorations = decorations.map(tr.changes); // Auto-map through changes

    for (const effect of tr.effects) {
      if (effect.is(setCoAuthorsEffect)) {
        // Rebuild decorations for each co-author
        decorations = buildCoAuthorDecorations(effect.value, tr.state);
      }
    }
    return decorations;
  },
  provide: field => EditorView.decorations.from(field),
});
```

### 5. Theming (CR-5)

```typescript
const theme = EditorView.theme({
  '&': {
    backgroundColor: 'var(--color-inset-background)',
    color: 'var(--color-body-text)',
  },
  '.cm-content': {
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--font-size)',
    padding: 'var(--spacing-small10)',
  },
  '.cm-gutters': {
    backgroundColor: 'var(--color-panel-background)',
    color: 'var(--color-body-textSoft20)',
    borderRight: '1px solid var(--color-body-border)',
  },
  '.cm-cursor': {
    borderLeftColor: 'var(--color-body-text)',
  },
  // ... more theme rules
});
```

### 6. API Surface (CR-6)

```typescript
export interface MarkdownEditorRef {
  // Content
  getMarkdown: () => string;
  setMarkdown: (markdown: string) => void;

  // Programmatic edits (for AI co-authoring)
  insertAt: (position: number, text: string) => void;
  deleteRange: (start: number, length: number) => void;

  // Cursor/selection
  focus: () => void;
  getCursorPosition: () => number;
  setCursorPosition: (position: number) => void;
  getSelection: () => { start: number; end: number };
  setSelection: (start: number, end: number) => void;

  // Navigation
  goToLine: (line: number) => void;
  scrollToPosition: (position: number) => void;

  // Folding
  foldAll: () => void;
  unfoldAll: () => void;
}

export interface MarkdownEditorProps {
  // Controlled/uncontrolled
  value?: string;
  defaultValue?: string;
  onChange?: (markdown: string) => void;

  // Co-authoring
  coAuthors?: CoAuthor[];

  // Options
  readOnly?: boolean;
  placeholder?: string;
  showLineNumbers?: boolean;

  // Callbacks
  onEditorReady?: (ref: MarkdownEditorRef) => void;
  onSelectionChange?: (start: number, end: number) => void;

  // Styling
  className?: string;
  height?: string | number;
}
```

---

## Implementation Steps

### Step 1: Create Type Definitions

Create `types.ts` with all interfaces.

### Step 2: Create Theme Extension

Create `extensions/theme.ts` that uses CSS variables from the design system.

### Step 3: Create Core Hook

Create `useCodeMirrorEditor.ts`:
- Initialize EditorView with extensions
- Handle controlled/uncontrolled modes
- Expose imperative methods
- Clean up on unmount

### Step 4: Create Co-Author Decorations

Create `useCoAuthorDecorations.ts`:
- StateField for decoration management
- Widget for cursor rendering
- Mark decorations for selections
- CSS for cursor/selection styling

### Step 5: Create Search Extension

Create `extensions/search.ts`:
- Configure search panel
- Add keyboard shortcuts
- Style search UI with design tokens

### Step 6: Create Folding Extension

Create `extensions/folding.ts`:
- Configure fold gutter
- Add markdown heading folding (custom fold service if needed)
- Add keyboard shortcuts

### Step 7: Rewrite MarkdownEditor Component

Replace the current textarea implementation:
- Use `useCodeMirrorEditor` hook
- Add all extensions
- Implement `forwardRef` with `useImperativeHandle`
- Handle props (value, onChange, coAuthors, etc.)

### Step 8: Update CSS

Update `MarkdownEditor.module.css`:
- Remove textarea styles
- Add CodeMirror container styles
- Add remote cursor styles
- Ensure design token usage

### Step 9: Update Exports

Update `index.ts` to export new types.

### Step 10: Update Stories

Update `MarkdownEditor.stories.tsx` and `MarkdownCoEditor.stories.tsx`:
- Verify all features work
- Add stories for search, folding, etc.

---

## Test Cases to Validate

After implementation, verify these test cases from requirements:

| Test | Description | How to Verify |
|------|-------------|---------------|
| TC-1 | Basic co-authoring | AI insert preserves user cursor |
| TC-2 | Concurrent typing | User and AI type at different locations |
| TC-4 | Selection preservation | Selection maps through external edits |
| TC-6 | Scroll stability | No jumps during AI edits |
| TC-7 | Rapid AI streaming | 100 chars at 20ms intervals |
| TC-8 | Cursor visibility | Co-author cursors visible with colors |
| TC-9 | Theme integration | CSS variables applied correctly |
| TC-10 | Large document | 10K lines, <16ms keystroke |
| TC-13 | Syntax highlighting | Markdown + nested code blocks |
| TC-14 | Search/replace | Find, highlight all, replace |
| TC-15 | Regex search | Pattern matching works |
| TC-16 | Go to line | Ctrl+G opens dialog, navigates |
| TC-17 | Fold code blocks | Click gutter to fold/unfold |
| TC-18 | Fold headings | Section folding works |
| TC-22 | Nested code highlighting | JS, Python blocks highlighted |

---

## Storybook Validation

Create/update stories to demonstrate:

1. **Basic editing** - Type, undo, redo
2. **Syntax highlighting** - Markdown + code blocks
3. **Search** - Open with Ctrl+F, find/replace
4. **Folding** - Fold code blocks and headings
5. **Co-authoring** - AI cursor visible, AI typing
6. **Large document** - 10K line performance
7. **Theme** - Light/dark mode switching

---

## Success Criteria

- [ ] All 22 test cases pass
- [ ] MarkdownCoEditor stories work unchanged
- [ ] No new dependencies beyond @codemirror/search and @codemirror/commands
- [ ] Bundle size increase < 50KB
- [ ] Storybook demonstrates all features
- [ ] TypeScript compiles without errors
- [ ] Existing API surface maintained (no breaking changes)
