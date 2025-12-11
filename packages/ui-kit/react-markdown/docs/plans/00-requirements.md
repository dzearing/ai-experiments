# Collaborative Markdown Editor - Requirements Document

## Overview

This document defines the requirements and acceptance criteria for a collaborative markdown editor component that supports multiple simultaneous authors (human and AI). All implementation approaches must satisfy these requirements.

---

## Core Requirements

### CR-1: Real-time Co-authoring

The editor must support multiple authors editing the same document simultaneously without conflicts or data loss.

| ID | Requirement | Priority |
|----|-------------|----------|
| CR-1.1 | Support 2+ simultaneous editors (human or AI) | Must Have |
| CR-1.2 | Changes from one author appear in real-time for others | Must Have |
| CR-1.3 | No data loss during concurrent edits | Must Have |
| CR-1.4 | Conflict resolution is automatic and deterministic | Must Have |
| CR-1.5 | Support for simulated AI edits (programmatic insertions) | Must Have |

### CR-2: Cursor & Selection Preservation

Local user's cursor and selection must remain stable during external edits.

| ID | Requirement | Priority |
|----|-------------|----------|
| CR-2.1 | User cursor position preserved when AI types elsewhere | Must Have |
| CR-2.2 | User cursor position preserved when AI types at same location | Must Have |
| CR-2.3 | User selection preserved during external edits | Must Have |
| CR-2.4 | Scroll position stable during external edits | Must Have |
| CR-2.5 | No cursor "jumping" or flickering during rapid external changes | Must Have |

### CR-3: Co-author Visibility

All co-authors' positions and activities must be visible.

| ID | Requirement | Priority |
|----|-------------|----------|
| CR-3.1 | Display cursor position for each co-author | Must Have |
| CR-3.2 | Display co-author name/label near cursor | Must Have |
| CR-3.3 | Display co-author selection ranges | Must Have |
| CR-3.4 | Support overlapping selections from multiple authors | Must Have |
| CR-3.5 | Unique color per co-author | Must Have |
| CR-3.6 | Cursor/selection colors are customizable | Should Have |
| CR-3.7 | Show "typing" indicator when co-author is actively editing | Nice to Have |

### CR-4: Performance

The editor must perform well with large documents and many co-authors.

| ID | Requirement | Priority |
|----|-------------|----------|
| CR-4.1 | Handle documents up to 10,000 lines without lag | Must Have |
| CR-4.2 | Handle documents up to 50,000 lines acceptably | Should Have |
| CR-4.3 | Support up to 5 simultaneous co-authors | Must Have |
| CR-4.4 | Support up to 20 simultaneous co-authors | Nice to Have |
| CR-4.5 | Initial render time < 100ms for typical documents | Must Have |
| CR-4.6 | Keystroke latency < 16ms (60fps) | Must Have |

### CR-5: Theming & Customization

The editor must integrate with our design system.

| ID | Requirement | Priority |
|----|-------------|----------|
| CR-5.1 | Support custom color tokens for all UI elements | Must Have |
| CR-5.2 | Support custom typography tokens | Must Have |
| CR-5.3 | Support custom spacing tokens | Must Have |
| CR-5.4 | Support light/dark theme switching | Must Have |
| CR-5.5 | Co-author cursor colors configurable via props | Must Have |
| CR-5.6 | Syntax highlighting colors follow theme | Should Have |
| CR-5.7 | Scrollbar styling matches design system | Should Have |

### CR-6: API Surface

The component must expose a consistent, React-friendly API.

| ID | Requirement | Priority |
|----|-------------|----------|
| CR-6.1 | Controlled mode: `value` + `onChange` props | Must Have |
| CR-6.2 | Uncontrolled mode: `defaultValue` prop | Must Have |
| CR-6.3 | Ref methods: `getMarkdown()`, `setMarkdown()` | Must Have |
| CR-6.4 | Ref methods: `insertAt()`, `deleteRange()` | Must Have |
| CR-6.5 | Ref methods: `getCursorPosition()`, `setCursorPosition()` | Must Have |
| CR-6.6 | Ref methods: `getSelection()`, `setSelection()` | Must Have |
| CR-6.7 | Callback: `onSelectionChange` | Should Have |
| CR-6.8 | Callback: `onEditorReady` | Should Have |
| CR-6.9 | `coAuthors` prop for external cursor management | Must Have |
| CR-6.10 | `readOnly` prop | Must Have |
| CR-6.11 | `placeholder` prop | Should Have |

### CR-7: Markdown Features

The editor should support standard markdown editing features.

| ID | Requirement | Priority |
|----|-------------|----------|
| CR-7.1 | Syntax highlighting for markdown | Must Have |
| CR-7.2 | Line numbers (optional) | Should Have |
| CR-7.3 | Line wrapping | Must Have |
| CR-7.4 | Undo/redo with co-author awareness | Must Have |
| CR-7.5 | Find/replace | Must Have |
| CR-7.6 | Code block syntax highlighting (nested languages) | Must Have |

### CR-8: Search & Navigation

The editor must support efficient search and navigation on large documents.

| ID | Requirement | Priority |
|----|-------------|----------|
| CR-8.1 | Find text with highlighting of all matches | Must Have |
| CR-8.2 | Replace text (single and all) | Must Have |
| CR-8.3 | Regex search support | Should Have |
| CR-8.4 | Case-sensitive search toggle | Should Have |
| CR-8.5 | Whole word search toggle | Should Have |
| CR-8.6 | Search performance on 10K+ line documents | Must Have |
| CR-8.7 | Go to line number (dialog or command) | Must Have |
| CR-8.8 | Programmatic scroll to position | Must Have |

### CR-9: Code Folding

The editor must support collapsing/expanding content sections.

| ID | Requirement | Priority |
|----|-------------|----------|
| CR-9.1 | Fold/unfold code blocks | Must Have |
| CR-9.2 | Fold/unfold markdown headings (section folding) | Must Have |
| CR-9.3 | Visual fold indicators in gutter | Must Have |
| CR-9.4 | Keyboard shortcuts for fold/unfold | Should Have |
| CR-9.5 | Fold all / Unfold all commands | Should Have |
| CR-9.6 | Programmatic fold/unfold API | Should Have |
| CR-9.7 | Custom fold placeholder text | Nice to Have |

### CR-10: Document Overview

The editor should provide visual overview for large documents.

| ID | Requirement | Priority |
|----|-------------|----------|
| CR-10.1 | Minimap showing document structure | Should Have |
| CR-10.2 | Minimap shows viewport position indicator | Should Have |
| CR-10.3 | Click minimap to navigate | Should Have |
| CR-10.4 | Minimap can be toggled on/off | Should Have |
| CR-10.5 | Document outline (heading structure) | Nice to Have |

### CR-11: Accessibility

The editor must be accessible.

| ID | Requirement | Priority |
|----|-------------|----------|
| CR-11.1 | Keyboard navigation | Must Have |
| CR-11.2 | Screen reader support | Should Have |
| CR-11.3 | Focus management | Must Have |
| CR-11.4 | ARIA labels where appropriate | Should Have |

---

## Test Cases

Each implementation approach must pass these test scenarios.

### TC-1: Basic Co-authoring

```
GIVEN: Editor with initial content "Hello World"
WHEN: AI inserts " Beautiful" at position 5 (after "Hello")
THEN: Content becomes "Hello Beautiful World"
AND: User's cursor (if after position 5) shifts by 10 characters
AND: User's cursor (if before position 5) remains unchanged
```

### TC-2: Concurrent Typing - Different Locations

```
GIVEN: Editor with content "Line 1\nLine 2\nLine 3"
AND: User cursor is at end of Line 1
AND: AI is typing at end of Line 3
WHEN: User types "ABC" while AI types "XYZ" simultaneously
THEN: Final content is "Line 1ABC\nLine 2\nLine 3XYZ"
AND: User cursor is after "ABC"
AND: No characters are lost or duplicated
```

### TC-3: Concurrent Typing - Same Location

```
GIVEN: Editor with content "Hello World"
AND: User cursor is at position 5
AND: AI cursor is at position 5
WHEN: User types "A" and AI types "B" near-simultaneously
THEN: Both characters appear (order may vary based on resolution)
AND: No characters are lost
AND: User can continue typing without interruption
```

### TC-4: Selection Preservation During External Edit

```
GIVEN: Editor with content "The quick brown fox"
AND: User has selected "quick" (positions 4-9)
WHEN: AI inserts "very " at position 4
THEN: Content becomes "The very quick brown fox"
AND: User selection now covers "quick" (positions 9-14)
AND: Selection highlight remains visible
```

### TC-5: Overlapping Selections

```
GIVEN: Editor with content "ABCDEFGH"
AND: User has selected "CDE" (positions 2-5)
AND: AI co-author has selection "DEF" (positions 3-6)
THEN: Both selections are visually displayed
AND: Overlapping region "DE" shows blended/layered highlight
AND: Each selection has distinct author color
```

### TC-6: Scroll Position Stability

```
GIVEN: Editor with 1000 lines of content
AND: User is viewing lines 500-550
AND: User cursor is on line 525
WHEN: AI inserts 10 new lines at line 100
THEN: User still sees approximately lines 510-560
AND: User cursor is now on line 535
AND: No visible scroll jump occurs
```

### TC-7: Rapid AI Streaming

```
GIVEN: Editor with content "Start: "
AND: User cursor is at end (position 7)
WHEN: AI streams 100 characters at position 7, one char every 20ms
AND: User simultaneously types "USER" starting at position 7
THEN: User's "USER" text appears contiguously
AND: AI's streamed text appears contiguously (before or after USER)
AND: No interleaving of characters
AND: User typing feels responsive (no lag)
```

### TC-8: Co-author Cursor Visibility

```
GIVEN: Editor with content "Hello World"
AND: CoAuthor "Alice" with cursor at position 5
AND: CoAuthor "Bob" with cursor at position 8
THEN: Two cursor indicators are visible
AND: Alice's cursor has her assigned color
AND: Bob's cursor has his assigned color
AND: Hovering shows author name tooltip (or inline label)
```

### TC-9: Theme Integration

```
GIVEN: Editor rendered with dark theme tokens
THEN: Background uses --color-inset-background
AND: Text uses --color-body-text
AND: Border uses --color-inset-border
AND: Cursor uses appropriate contrast color
AND: Line numbers use --color-body-textSoft20
AND: All colors update when theme changes
```

### TC-10: Large Document Performance

```
GIVEN: Editor with 10,000 lines of markdown content
WHEN: User types a character
THEN: Character appears in < 16ms
AND: No frame drops during typing
AND: Scrolling remains smooth (60fps)
```

### TC-11: Undo/Redo with Co-authors

```
GIVEN: Editor with content "Hello"
AND: User types " World" (content: "Hello World")
AND: AI inserts "!" at end (content: "Hello World!")
WHEN: User presses Ctrl+Z
THEN: User's " World" is undone (content: "Hello!")
AND: AI's "!" remains (was not user's action)
OR: Undo behavior is clearly defined and consistent
```

### TC-12: Programmatic Insertion API

```
GIVEN: Editor ref obtained via useRef
WHEN: Calling editorRef.current.insertAt(5, "TEST")
THEN: "TEST" is inserted at position 5
AND: All co-author cursors adjust appropriately
AND: onChange callback fires with new content
AND: Undo stack is updated
```

### TC-13: Syntax Highlighting

```
GIVEN: Editor with markdown content including:
  - # Heading
  - **bold** and *italic* text
  - [link](url)
  - ```javascript code block ```
THEN: Each element is visually distinct (different colors/styles)
AND: Code block content is highlighted per its language
AND: Highlighting updates as user types
```

### TC-14: Search and Replace

```
GIVEN: Editor with 5000 lines of content containing "foo" 50 times
WHEN: User opens search (Ctrl+F) and types "foo"
THEN: Search panel appears in < 100ms
AND: All 50 matches are highlighted
AND: Current match is distinct from other matches
AND: User can navigate between matches (F3 or Enter)
AND: Replace functionality works for single and all matches
```

### TC-15: Regex Search

```
GIVEN: Editor with content "test1 test2 test3 other"
WHEN: User searches with regex pattern "test\d"
THEN: "test1", "test2", "test3" are highlighted
AND: "other" is not highlighted
AND: Match count shows 3
```

### TC-16: Go to Line

```
GIVEN: Editor with 10,000 lines
WHEN: User presses Ctrl+G and enters "5000"
THEN: Dialog appears for line input
AND: Editor scrolls to line 5000
AND: Cursor is placed at beginning of line 5000
AND: Line 5000 is visible in viewport (centered or near top)
```

### TC-17: Code Folding - Code Blocks

```
GIVEN: Editor with markdown containing a 20-line code block
WHEN: User clicks fold icon in gutter next to code block
THEN: Code block collapses to single line with placeholder (e.g., "...")
AND: Fold icon changes to indicate collapsed state
AND: Clicking again expands the block
AND: Content is preserved after fold/unfold cycle
```

### TC-18: Code Folding - Headings

```
GIVEN: Editor with markdown:
  # Section 1
  Content under section 1
  ## Subsection 1.1
  Content under subsection
  # Section 2
  Content under section 2
WHEN: User folds "# Section 1"
THEN: All content until "# Section 2" is hidden
AND: "## Subsection 1.1" and its content are also hidden
AND: "# Section 2" remains visible
```

### TC-19: Fold All / Unfold All

```
GIVEN: Editor with multiple foldable regions (headings, code blocks)
WHEN: User executes "Fold All" command
THEN: All foldable regions collapse
AND: Document height significantly reduces
WHEN: User executes "Unfold All" command
THEN: All regions expand
AND: Full content is visible
```

### TC-20: Large Document Search Performance

```
GIVEN: Editor with 50,000 lines of content
WHEN: User searches for a term that appears 500 times
THEN: Search completes in < 500ms
AND: Scrolling through results is smooth
AND: No UI freeze during search
AND: Memory usage remains stable
```

### TC-21: Minimap Navigation

```
GIVEN: Editor with 5000 lines and minimap enabled
THEN: Minimap shows compressed view of entire document
AND: Current viewport is highlighted in minimap
WHEN: User clicks on a position in minimap
THEN: Editor scrolls to that position
AND: Viewport indicator updates to new position
```

### TC-22: Nested Code Block Highlighting

```
GIVEN: Editor with markdown containing:
  ```javascript
  const x = 1;
  function foo() { return x; }
  ```

  ```python
  def bar():
      return "hello"
  ```
THEN: JavaScript block has JS-specific highlighting (keywords, strings)
AND: Python block has Python-specific highlighting
AND: Both are distinct from surrounding markdown
```

---

## Evaluation Criteria

Each approach will be evaluated on:

| Criterion | Weight | Description |
|-----------|--------|-------------|
| Requirements Coverage | 30% | How many requirements are satisfied out-of-box vs custom code |
| Implementation Complexity | 20% | Lines of code, number of dependencies, conceptual complexity |
| Performance | 20% | Benchmarks on large documents, typing latency |
| Theming Flexibility | 15% | Ease of integrating with design tokens |
| Bundle Size | 10% | Additional KB added to the application |
| Maintenance Burden | 5% | Community activity, documentation quality, update frequency |

---

## Related Documents

- [01-codemirror-yjs.md](./01-codemirror-yjs.md) - CodeMirror 6 + Yjs (CRDT) approach
- [02-codemirror-standalone.md](./02-codemirror-standalone.md) - CodeMirror 6 with built-in collab
- [03-monaco-editor.md](./03-monaco-editor.md) - Monaco Editor approach
- [04-comparison-matrix.md](./04-comparison-matrix.md) - Side-by-side comparison
