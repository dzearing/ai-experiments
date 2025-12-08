# Code Diff Visualizer Component Plan

## Overview
Inline diff viewer for code changes within chat tool executions, supporting unified and split views.

## Component Details

### Name
`CodeDiffVisualizer`

### Purpose
Display code changes with syntax highlighting, line numbers, and interactive diff navigation.

### Props Interface
```typescript
interface CodeDiffVisualizerProps {
  diff: DiffData
  viewMode?: 'unified' | 'split' | 'inline'
  syntax?: string
  collapsible?: boolean
  maxHeight?: number
  showLineNumbers?: boolean
  showFileHeader?: boolean
  onLineClick?: (lineNumber: number, side: 'old' | 'new') => void
}

interface DiffData {
  fileName: string
  language?: string
  oldContent: string
  newContent: string
  hunks: DiffHunk[]
  stats: {
    additions: number
    deletions: number
    changes: number
  }
}

interface DiffHunk {
  oldStart: number
  oldLines: number
  newStart: number
  newLines: number
  lines: DiffLine[]
}

interface DiffLine {
  type: 'add' | 'delete' | 'normal' | 'context'
  oldLineNumber?: number
  newLineNumber?: number
  content: string
}
```

## Design Tokens Usage

### Colors
- Added lines: `--color-success-backgroundSoft30`
- Added text: `--color-success-text`
- Deleted lines: `--color-danger-backgroundSoft30`
- Deleted text: `--color-danger-text`
- Line numbers: `--color-body-textSoft20`
- Gutter: `--color-panel-backgroundHard10`

### Spacing
- Line padding: `--spacing-small20`
- Gutter width: `--spacing-large20`
- File header padding: `--spacing-small10`

### Typography
- Code font: `--font-family-mono`
- Font size: `--font-size-small10`
- Line height: `--line-height-code`

## States

### View Modes

#### Unified View
- Changes shown in single column
- Added/removed lines intermixed
- Compact for small diffs

#### Split View
- Side-by-side old/new comparison
- Synchronized scrolling
- Better for large changes

#### Inline View
- Word-level diff highlighting
- Character-by-character changes
- Best for small edits

### Interaction States
- **Hover**: Highlight entire changed block
- **Selected**: Outline selected lines
- **Collapsed**: Show summary with expand option
- **Loading**: Skeleton while processing diff

## Behaviors

### Syntax Highlighting
- Auto-detect language from file extension
- Lazy load language grammars
- Fallback to plain text
- Theme-aware highlighting

### Navigation
- Jump to next/previous change
- Keyboard shortcuts (n/p)
- Mini-map for large files
- Sticky file header

### Copy Operations
- Copy specific lines
- Copy entire diff
- Copy just additions
- Copy with/without line numbers

### Collapse/Expand
- Collapse unchanged sections
- Expand context lines
- Remember collapse state
- Smooth animations

## Responsive Design

### Desktop
- Full split view available
- Wide gutters with line numbers
- Hover interactions
- Side-by-side comparison

### Mobile
- Unified view default
- Swipe between old/new in split
- Touch-friendly line selection
- Horizontal scroll for long lines

## Accessibility

### Keyboard Navigation
- Tab through changes
- Arrow keys for line navigation
- Shortcuts for view switching
- Copy shortcuts

### Screen Reader Support
- Announce additions/deletions
- Line number context
- Change statistics
- Navigation landmarks

## Performance Considerations

### Optimization Strategies
- Virtual scrolling for large diffs
- Incremental syntax highlighting
- Memoized diff computation
- Lazy load view modes

### Bundle Size
- Code-split syntax highlighters
- Dynamic language imports
- Minimal core bundle

## Integration Examples

### Basic Usage
```jsx
<CodeDiffVisualizer
  diff={{
    fileName: 'App.tsx',
    oldContent: 'const [count, setCount] = useState(0)',
    newContent: 'const [count, setCount] = useState<number>(0)',
    stats: { additions: 1, deletions: 1, changes: 1 }
  }}
/>
```

### With Options
```jsx
<CodeDiffVisualizer
  diff={diffData}
  viewMode="split"
  syntax="typescript"
  collapsible={true}
  maxHeight={400}
  showLineNumbers={true}
  onLineClick={(line, side) => console.log(line, side)}
/>
```

## Visual Examples

### Unified View
```
  components/Button.tsx
  @@ -10,7 +10,7 @@
  
  10  export function Button({ onClick, children }) {
  11    return (
- 12      <button className="btn" onClick={onClick}>
+ 12      <button className="btn primary" onClick={onClick}>
  13        {children}
  14      </button>
  15    )
```

### Split View
```
Old                          │ New
─────────────────────────────┼─────────────────────────────
10  export function Button    │ 10  export function Button
11    return (                │ 11    return (
12      <button className="btn"│ 12      <button className="btn primary"
13        {children}           │ 13        {children}
```

## Implementation Priority
**High** - Essential for showing code changes in tool executions

## Dependencies
- Syntax highlighter (Prism/Shiki)
- Diff algorithm library
- Virtual scroller
- Copy-to-clipboard utility

## Open Questions
1. Should we support three-way merge view?
2. How to handle binary file changes?
3. Should we integrate with git blame data?
4. Maximum diff size before truncation?