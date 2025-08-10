# File Tree Visualizer Component Plan

## Overview
Virtualized tree view component for displaying file system structures within tool executions.

## Component Details

### Name
`FileTreeVisualizer`

### Purpose
Display directory structures with expandable folders, file icons, and search/filter capabilities.

### Props Interface
```typescript
interface FileTreeVisualizerProps {
  data: FileNode[]
  expandedPaths?: Set<string>
  selectedPath?: string
  onSelect?: (node: FileNode) => void
  onExpand?: (path: string) => void
  onCollapse?: (path: string) => void
  showIcons?: boolean
  showSizes?: boolean
  showModified?: boolean
  searchable?: boolean
  maxHeight?: number
  virtualizeThreshold?: number
}

interface FileNode {
  path: string
  name: string
  type: 'file' | 'directory'
  size?: number
  modified?: Date
  children?: FileNode[]
  icon?: string | React.ComponentType
  badge?: {
    text: string
    variant: 'info' | 'success' | 'warning' | 'error'
  }
  isNew?: boolean
  isModified?: boolean
  isDeleted?: boolean
}
```

## Design Tokens Usage

### Colors
- Background: `--color-panel-background`
- Selected item: `--color-selection-background`
- Hover state: `--color-hover-background`
- File icons: `--color-body-textSoft10`
- Folder icons: `--color-info-text`
- New files: `--color-success-text`
- Modified files: `--color-warning-text`
- Deleted files: `--color-danger-text`

### Spacing
- Tree indent: `--spacing`
- Item padding: `--spacing-small20`
- Icon gap: `--spacing-small30`

### Typography
- File names: `--font-size-small10`
- Metadata: `--font-size-small20`, `--color-body-textSoft20`
- Search input: `--font-size`

## States

### Tree States
- **Collapsed**: Folder closed with chevron right
- **Expanded**: Folder open with chevron down
- **Loading**: Skeleton or spinner for lazy-loaded folders
- **Empty**: Placeholder for empty directories

### Item States
- **Normal**: Default appearance
- **Hover**: Subtle background highlight
- **Selected**: Strong background, bold text
- **Focused**: Keyboard focus outline
- **Disabled**: Grayed out, non-interactive

### File Status Indicators
- **New**: Green dot or "NEW" badge
- **Modified**: Orange dot or "M" indicator
- **Deleted**: Red strikethrough or "D" indicator
- **Renamed**: Arrow indicator showing old → new

## Behaviors

### Expand/Collapse
- Click folder to toggle
- Keyboard shortcuts (Arrow keys)
- Expand/collapse all buttons
- Remember expansion state

### Selection
- Single click to select
- Double click to open (emit event)
- Multi-select with Ctrl/Cmd
- Range select with Shift

### Search & Filter
- Real-time search box
- Highlight matching text
- Auto-expand to show results
- Filter by file type

### Virtualization
- Render only visible nodes
- Smooth scrolling
- Dynamic height calculation
- Preserve scroll position

## Responsive Design

### Desktop
- Full tree with all metadata
- Hover tooltips for long names
- Right-click context menu
- Drag and drop support

### Mobile
- Compact mode without metadata
- Touch-friendly tap targets
- Swipe actions for operations
- Full-screen expansion option

## Accessibility

### Keyboard Navigation
- Arrow keys for tree navigation
- Enter to expand/collapse
- Space to select
- Type-ahead search

### Screen Reader Support
- Announce tree structure
- Level announcements
- Selection state
- File type and status

## Performance Considerations

### Optimization Strategies
- Virtual scrolling for large trees
- Lazy load deep directories
- Debounced search
- Memoized node rendering

### Bundle Size
- Lazy load file icons
- Tree-shakeable icon sets
- Minimal core implementation

## Integration Examples

### Basic Usage
```jsx
<FileTreeVisualizer
  data={[
    {
      path: '/src',
      name: 'src',
      type: 'directory',
      children: [
        {
          path: '/src/App.tsx',
          name: 'App.tsx',
          type: 'file',
          size: 2048
        }
      ]
    }
  ]}
  onSelect={(node) => console.log('Selected:', node.path)}
/>
```

### With Features
```jsx
<FileTreeVisualizer
  data={fileTree}
  expandedPaths={new Set(['/src', '/src/components'])}
  selectedPath="/src/App.tsx"
  showIcons={true}
  showSizes={true}
  showModified={true}
  searchable={true}
  maxHeight={400}
  virtualizeThreshold={100}
/>
```

## Visual Layout

### Tree Structure
```
📁 src/
  📁 components/
    📄 Button.tsx (2.1 KB)
    📄 Card.tsx (1.8 KB) [M]
  📁 utils/
    📄 helpers.ts (3.2 KB)
    📄 constants.ts (0.5 KB) [NEW]
  📄 App.tsx (4.5 KB)
  📄 index.tsx (0.8 KB)
```

### Compact Mode
```
▶ src/
▼ components/
  Button.tsx
  Card.tsx ●
▶ utils/
App.tsx
index.tsx
```

## Implementation Priority
**High** - Essential for file system operations in tools

## Dependencies
- Virtual scroll library
- File icon set
- Tree traversal utilities
- Search/filter algorithm

## Open Questions
1. Should we support file preview on hover?
2. How to handle symlinks?
3. Should we show git status integration?
4. Maximum tree depth before truncation?