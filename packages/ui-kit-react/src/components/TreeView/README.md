# TreeView

A virtualized tree view component with full keyboard accessibility for displaying hierarchical data structures.

## Features

- **Virtualization**: Efficiently renders only visible nodes for optimal performance with large datasets
- **Keyboard Navigation**: Full ARIA-compliant keyboard support including arrow keys, Home/End, Page Up/Down
- **Controlled/Uncontrolled**: Supports both controlled and uncontrolled expanded state
- **Accessible**: Proper ARIA roles, labels, and keyboard navigation patterns
- **Zero Dependencies**: Built with pure React, no external virtualization libraries

## Usage

```tsx
import { TreeView } from '@claude-flow/ui-kit-react';

const data = [
  {
    id: '1',
    label: 'Folder',
    type: 'folder',
    children: [
      { id: '1-1', label: 'File.txt', type: 'file' }
    ]
  }
];

function App() {
  return (
    <TreeView
      data={data}
      height={400}
      onNodeClick={(node) => console.log('Clicked:', node)}
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `TreeNode[]` | Required | The tree data structure |
| `height` | `number` | `400` | Height of the tree container in pixels |
| `itemHeight` | `number` | `32` | Height of each tree node in pixels |
| `selectedNodeId` | `string \| null` | `null` | ID of the selected node |
| `expandedNodes` | `Set<string>` | - | Controlled expanded node IDs |
| `onExpandedNodesChange` | `(nodes: Set<string>) => void` | - | Callback when expanded nodes change |
| `onNodeClick` | `(node: TreeNode) => void` | - | Callback when a node is clicked |
| `onNodeExpand` | `(node: TreeNode) => void` | - | Callback when a folder is expanded |
| `onNodeCollapse` | `(node: TreeNode) => void` | - | Callback when a folder is collapsed |
| `className` | `string` | - | Additional CSS class for the container |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `ArrowUp` | Move focus to previous node |
| `ArrowDown` | Move focus to next node |
| `ArrowLeft` | Collapse folder or move to parent |
| `ArrowRight` | Expand folder or move to first child |
| `Enter` / `Space` | Toggle folder or select file |
| `Home` | Move to first node |
| `End` | Move to last visible node |
| `PageUp` | Move up by page |
| `PageDown` | Move down by page |

## TreeNode Interface

```tsx
interface TreeNode {
  id: string;
  label: string;
  type: 'folder' | 'file';
  children?: TreeNode[];
}
```

## Performance

The TreeView uses virtualization to maintain high performance even with thousands of nodes. Only visible nodes (plus a small buffer) are rendered in the DOM. The virtualization:

- Calculates visible range based on scroll position
- Adds a 5-item buffer above and below visible area for smooth scrolling
- Uses transform for positioning to avoid reflows
- Maintains node references only for visible items

## Accessibility

The component follows WAI-ARIA tree view patterns:

- Proper `role="tree"` and `role="treeitem"` attributes
- `aria-expanded` for folders
- `aria-selected` for selected nodes
- `aria-level` for hierarchy depth
- Full keyboard navigation support
- Focus management with `tabIndex`