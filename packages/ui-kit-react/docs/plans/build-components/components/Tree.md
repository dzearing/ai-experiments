# Tree Component

## Overview
A hierarchical data component that displays nested items in an expandable tree structure, commonly used for file systems, navigation, or organizational data.

## Component Specification

### Props
```typescript
interface TreeProps<T = any> extends HTMLAttributes<HTMLDivElement> {
  // Data
  data: TreeNode<T>[];
  
  // Selection
  selectedKeys?: string[];
  onSelectionChange?: (keys: string[]) => void;
  selectionMode?: 'none' | 'single' | 'multiple';
  
  // Expansion
  expandedKeys?: string[];
  onExpansionChange?: (keys: string[]) => void;
  defaultExpandedKeys?: string[];
  expandOnSelect?: boolean;
  
  // Behavior
  checkable?: boolean; // Show checkboxes
  checkedKeys?: string[];
  onCheckedChange?: (keys: string[]) => void;
  
  // Drag and drop
  draggable?: boolean;
  onDrop?: (info: DropInfo<T>) => void;
  allowDrop?: (info: DropInfo<T>) => boolean;
  
  // Lazy loading
  loadData?: (node: TreeNode<T>) => Promise<TreeNode<T>[]>;
  
  // Rendering
  nodeRenderer?: (node: TreeNode<T>, props: NodeRendererProps) => ReactNode;
  iconRenderer?: (node: TreeNode<T>, expanded: boolean) => ReactNode;
  
  // Search/Filter
  searchValue?: string;
  filterNodes?: (node: TreeNode<T>, searchValue: string) => boolean;
  highlightMatches?: boolean;
  
  // Styling
  size?: 'sm' | 'md' | 'lg';
  showLines?: boolean; // Show connecting lines
  showRoot?: boolean; // Show root node
  indent?: number; // Indentation per level
  
  // Virtual scrolling
  virtual?: boolean;
  height?: number;
  itemHeight?: number;
  
  className?: string;
}

interface TreeNode<T = any> {
  key: string;
  title: ReactNode;
  children?: TreeNode<T>[];
  data?: T;
  
  // State
  disabled?: boolean;
  checkable?: boolean;
  disableCheckbox?: boolean;
  selectable?: boolean;
  
  // Visual
  icon?: ReactNode;
  switcherIcon?: ReactNode;
  
  // Async loading
  isLeaf?: boolean;
  loading?: boolean;
  
  // Drag and drop
  draggable?: boolean;
  droppable?: boolean;
}

interface NodeRendererProps {
  node: TreeNode;
  level: number;
  expanded: boolean;
  selected: boolean;
  checked: boolean;
  loading: boolean;
  onExpand: () => void;
  onSelect: () => void;
  onCheck: (checked: boolean) => void;
}
```

### Usage Examples
```tsx
// Basic tree
<Tree
  data={treeData}
  selectedKeys={selectedKeys}
  onSelectionChange={setSelectedKeys}
/>

// With checkboxes
<Tree
  data={fileSystemData}
  checkable
  checkedKeys={checkedKeys}
  onCheckedChange={setCheckedKeys}
  expandedKeys={expandedKeys}
  onExpansionChange={setExpandedKeys}
/>

// Custom node renderer
<Tree
  data={organizationData}
  nodeRenderer={(node, props) => (
    <div className="flex items-center gap-2">
      <Avatar src={node.data?.avatar} size="sm" />
      <span>{node.title}</span>
      {node.data?.role && (
        <Badge variant="secondary">{node.data.role}</Badge>
      )}
    </div>
  )}
/>

// With search
<Tree
  data={searchableData}
  searchValue={searchTerm}
  highlightMatches
  filterNodes={(node, searchValue) => 
    node.title.toLowerCase().includes(searchValue.toLowerCase())
  }
/>

// Lazy loading
<Tree
  data={lazyData}
  loadData={async (node) => {
    const children = await fetchChildren(node.key);
    return children;
  }}
/>

// Drag and drop
<Tree
  data={draggableData}
  draggable
  onDrop={(info) => {
    handleReorderNodes(info);
  }}
  allowDrop={(info) => {
    return info.dropToGap || info.node.droppable;
  }}
/>

// Virtual scrolling for large datasets
<Tree
  data={largeDataset}
  virtual
  height={400}
  itemHeight={32}
/>

// File system tree
<Tree
  data={fileTree}
  showLines
  iconRenderer={(node, expanded) => {
    if (node.isLeaf) {
      return <FileIcon type={node.data?.type} />;
    }
    return expanded ? <FolderOpenIcon /> : <FolderIcon />;
  }}
/>
```

## Visual Design

### Size Variants
- **sm**: 24px row height, compact spacing
- **md**: 32px row height, standard spacing (default)
- **lg**: 40px row height, generous spacing

### Visual Elements
- Expand/collapse indicators
- Connecting lines (optional)
- Icons for different node types
- Selection highlighting
- Checkbox controls
- Drag and drop indicators

### Interactive States
- **Hover**: Subtle background highlight
- **Selected**: Clear selected state
- **Expanded**: Open folder/chevron icons
- **Loading**: Spinner for async operations
- **Disabled**: Reduced opacity

## Technical Implementation

### Core Structure
```typescript
const Tree = forwardRef<HTMLDivElement, TreeProps>(
  ({ 
    data,
    selectedKeys = [],
    onSelectionChange,
    selectionMode = 'single',
    expandedKeys = [],
    onExpansionChange,
    defaultExpandedKeys = [],
    expandOnSelect = false,
    checkable = false,
    checkedKeys = [],
    onCheckedChange,
    draggable = false,
    onDrop,
    allowDrop,
    loadData,
    nodeRenderer,
    iconRenderer,
    searchValue,
    filterNodes,
    highlightMatches = false,
    size = 'md',
    showLines = false,
    showRoot = true,
    indent = 24,
    virtual = false,
    height,
    itemHeight,
    className,
    ...props 
  }, ref) => {
    const [internalExpandedKeys, setInternalExpandedKeys] = useControlledState({
      prop: expandedKeys,
      defaultProp: defaultExpandedKeys,
      onChange: onExpansionChange
    });
    
    const [loadingKeys, setLoadingKeys] = useState<Set<string>>(new Set());
    const [dragState, setDragState] = useState<DragState | null>(null);
    
    // Flatten tree for virtual scrolling and search
    const flattenedNodes = useMemo(() => {
      const flatten = (nodes: TreeNode[], level = 0, parent?: TreeNode): FlatNode[] => {
        const result: FlatNode[] = [];
        
        for (const node of nodes) {
          // Apply search filter
          if (searchValue && filterNodes && !filterNodes(node, searchValue)) {\n            continue;\n          }\n          \n          const flatNode: FlatNode = {\n            ...node,\n            level,\n            parent,\n            expanded: internalExpandedKeys.includes(node.key),\n            selected: selectedKeys.includes(node.key),\n            checked: checkedKeys.includes(node.key),\n            loading: loadingKeys.has(node.key)\n          };\n          \n          result.push(flatNode);\n          \n          // Add children if expanded\n          if (flatNode.expanded && node.children) {\n            result.push(...flatten(node.children, level + 1, node));\n          }\n        }\n        \n        return result;\n      };\n      \n      return flatten(data);\n    }, [data, internalExpandedKeys, selectedKeys, checkedKeys, loadingKeys, searchValue, filterNodes]);\n    \n    const handleExpand = async (node: TreeNode) => {\n      const isExpanded = internalExpandedKeys.includes(node.key);\n      \n      if (!isExpanded && loadData && !node.children) {\n        setLoadingKeys(prev => new Set([...prev, node.key]));\n        \n        try {\n          const children = await loadData(node);\n          // Update node with children (this would typically be handled by parent component)\n          node.children = children;\n        } finally {\n          setLoadingKeys(prev => {\n            const next = new Set(prev);\n            next.delete(node.key);\n            return next;\n          });\n        }\n      }\n      \n      const newExpandedKeys = isExpanded\n        ? internalExpandedKeys.filter(key => key !== node.key)\n        : [...internalExpandedKeys, node.key];\n      \n      setInternalExpandedKeys(newExpandedKeys);\n    };\n    \n    const handleSelect = (node: TreeNode) => {\n      if (!node.selectable && node.selectable !== undefined) return;\n      if (selectionMode === 'none') return;\n      \n      let newSelectedKeys: string[];\n      \n      if (selectionMode === 'single') {\n        newSelectedKeys = selectedKeys.includes(node.key) ? [] : [node.key];\n      } else {\n        newSelectedKeys = selectedKeys.includes(node.key)\n          ? selectedKeys.filter(key => key !== node.key)\n          : [...selectedKeys, node.key];\n      }\n      \n      onSelectionChange?.(newSelectedKeys);\n      \n      if (expandOnSelect && !internalExpandedKeys.includes(node.key)) {\n        handleExpand(node);\n      }\n    };\n    \n    const handleCheck = (node: TreeNode, checked: boolean) => {\n      if (!checkable || node.disableCheckbox) return;\n      \n      // TODO: Implement cascade checking for parent/child relationships\n      const newCheckedKeys = checked\n        ? [...checkedKeys, node.key]\n        : checkedKeys.filter(key => key !== node.key);\n      \n      onCheckedChange?.(newCheckedKeys);\n    };\n    \n    if (virtual && height) {\n      return (\n        <VirtualizedTree\n          ref={ref}\n          nodes={flattenedNodes}\n          height={height}\n          itemHeight={itemHeight || (size === 'sm' ? 24 : size === 'lg' ? 40 : 32)}\n          nodeRenderer={nodeRenderer}\n          iconRenderer={iconRenderer}\n          onExpand={handleExpand}\n          onSelect={handleSelect}\n          onCheck={handleCheck}\n          {...props}\n        />\n      );\n    }\n    \n    return (\n      <div\n        ref={ref}\n        className={cn(\n          treeStyles.base,\n          treeStyles.size[size],\n          showLines && treeStyles.showLines,\n          className\n        )}\n        role=\"tree\"\n        aria-multiselectable={selectionMode === 'multiple'}\n        {...props}\n      >\n        {flattenedNodes.map(node => (\n          <TreeNode\n            key={node.key}\n            node={node}\n            nodeRenderer={nodeRenderer}\n            iconRenderer={iconRenderer}\n            onExpand={() => handleExpand(node)}\n            onSelect={() => handleSelect(node)}\n            onCheck={(checked) => handleCheck(node, checked)}\n            indent={indent}\n            checkable={checkable}\n            draggable={draggable}\n            highlightMatches={highlightMatches}\n            searchValue={searchValue}\n          />\n        ))}\n      </div>\n    );\n  }\n);\n```\n\n### TreeNode Sub-component\n```typescript\ninterface TreeNodeProps {\n  node: FlatNode;\n  nodeRenderer?: (node: TreeNode, props: NodeRendererProps) => ReactNode;\n  iconRenderer?: (node: TreeNode, expanded: boolean) => ReactNode;\n  onExpand: () => void;\n  onSelect: () => void;\n  onCheck: (checked: boolean) => void;\n  indent: number;\n  checkable: boolean;\n  draggable: boolean;\n  highlightMatches: boolean;\n  searchValue?: string;\n}\n\nconst TreeNode = ({\n  node,\n  nodeRenderer,\n  iconRenderer,\n  onExpand,\n  onSelect,\n  onCheck,\n  indent,\n  checkable,\n  draggable,\n  highlightMatches,\n  searchValue\n}: TreeNodeProps) => {\n  const hasChildren = node.children && node.children.length > 0;\n  const canExpand = hasChildren || (!node.isLeaf && loadData);\n  \n  const rendererProps: NodeRendererProps = {\n    node,\n    level: node.level,\n    expanded: node.expanded,\n    selected: node.selected,\n    checked: node.checked,\n    loading: node.loading,\n    onExpand,\n    onSelect,\n    onCheck\n  };\n  \n  if (nodeRenderer) {\n    return (\n      <div\n        className={cn(\n          treeStyles.nodeContainer,\n          node.selected && treeStyles.selected,\n          node.disabled && treeStyles.disabled\n        )}\n        style={{ paddingLeft: node.level * indent }}\n        role=\"treeitem\"\n        aria-expanded={canExpand ? node.expanded : undefined}\n        aria-selected={node.selected}\n        aria-level={node.level + 1}\n      >\n        {nodeRenderer(node, rendererProps)}\n      </div>\n    );\n  }\n  \n  return (\n    <div\n      className={cn(\n        treeStyles.nodeContainer,\n        node.selected && treeStyles.selected,\n        node.disabled && treeStyles.disabled\n      )}\n      style={{ paddingLeft: node.level * indent }}\n      role=\"treeitem\"\n      aria-expanded={canExpand ? node.expanded : undefined}\n      aria-selected={node.selected}\n      aria-level={node.level + 1}\n    >\n      {/* Expand/collapse button */}\n      {canExpand && (\n        <button\n          className={treeStyles.expandButton}\n          onClick={onExpand}\n          aria-label={node.expanded ? 'Collapse' : 'Expand'}\n        >\n          {node.loading ? (\n            <Spinner size=\"xs\" />\n          ) : node.switcherIcon || (\n            <ChevronRight className={cn(\n              treeStyles.chevron,\n              node.expanded && treeStyles.expanded\n            )} />\n          )}\n        </button>\n      )}\n      \n      {/* Checkbox */}\n      {checkable && (\n        <Checkbox\n          checked={node.checked}\n          onChange={onCheck}\n          disabled={node.disableCheckbox || node.disabled}\n          size=\"sm\"\n        />\n      )}\n      \n      {/* Icon */}\n      {(node.icon || iconRenderer) && (\n        <span className={treeStyles.icon}>\n          {iconRenderer ? iconRenderer(node, node.expanded) : node.icon}\n        </span>\n      )}\n      \n      {/* Title */}\n      <span\n        className={treeStyles.title}\n        onClick={onSelect}\n      >\n        {highlightMatches && searchValue ? (\n          <HighlightedText text={node.title} searchValue={searchValue} />\n        ) : (\n          node.title\n        )}\n      </span>\n    </div>\n  );\n};\n```\n\n### CSS Module Structure\n```css\n.base {\n  font-family: inherit;\n  color: var(--color-text-primary);\n  background: var(--color-surface);\n}\n\n.size {\n  &.sm {\n    font-size: var(--font-size-sm);\n  }\n  \n  &.md {\n    font-size: var(--font-size-md);\n  }\n  \n  &.lg {\n    font-size: var(--font-size-lg);\n  }\n}\n\n.showLines {\n  /* Add connecting lines styling */\n}\n\n.nodeContainer {\n  display: flex;\n  align-items: center;\n  gap: var(--spacing-xs);\n  padding: var(--spacing-xs) var(--spacing-sm);\n  cursor: pointer;\n  border-radius: var(--border-radius-sm);\n  transition: background-color 0.15s ease;\n}\n\n.nodeContainer:hover:not(.disabled) {\n  background: var(--color-surface-secondary);\n}\n\n.selected {\n  background: var(--color-primary-surface);\n  color: var(--color-primary-foreground);\n}\n\n.disabled {\n  opacity: 0.5;\n  cursor: not-allowed;\n}\n\n.expandButton {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 16px;\n  height: 16px;\n  border: none;\n  background: transparent;\n  cursor: pointer;\n  border-radius: var(--border-radius-sm);\n  transition: background-color 0.15s ease;\n}\n\n.expandButton:hover {\n  background: var(--color-surface-tertiary);\n}\n\n.chevron {\n  transition: transform 0.15s ease;\n}\n\n.chevron.expanded {\n  transform: rotate(90deg);\n}\n\n.icon {\n  display: flex;\n  align-items: center;\n  flex-shrink: 0;\n}\n\n.title {\n  flex: 1;\n  min-width: 0;\n  cursor: pointer;\n  user-select: none;\n}\n```\n\n## Accessibility Features\n- Proper ARIA tree roles and properties\n- Keyboard navigation (arrow keys, space, enter)\n- Screen reader support\n- Focus management\n- Hierarchical structure announcements\n\n### Keyboard Navigation\n```typescript\nconst handleKeyDown = (e: KeyboardEvent) => {\n  switch (e.key) {\n    case 'ArrowUp':\n    case 'ArrowDown':\n      // Navigate between nodes\n      break;\n    case 'ArrowLeft':\n      // Collapse or move to parent\n      break;\n    case 'ArrowRight':\n      // Expand or move to first child\n      break;\n    case 'Space':\n      // Toggle selection\n      break;\n    case 'Enter':\n      // Activate node\n      break;\n  }\n};\n```\n\n## Dependencies\n- React (forwardRef, useState, useMemo, useCallback)\n- Internal Checkbox and Spinner components\n- Icon components (ChevronRight)\n- CSS modules\n- Utility functions (cn)\n- Virtual scrolling library (optional)\n\n## Design Tokens Used\n- **Colors**: text, background, selection states\n- **Spacing**: padding, gaps, indentation\n- **Typography**: font sizes\n- **Border Radius**: node and button rounding\n- **Transitions**: hover and expand animations\n\n## Testing Considerations\n- Keyboard navigation\n- Screen reader compatibility\n- Large dataset performance\n- Async loading behavior\n- Drag and drop functionality\n- Search and filtering\n- Selection state management\n- Expansion/collapse behavior\n\n## Related Components\n- Checkbox (for checkable trees)\n- Spinner (for loading states)\n- VirtualList (for large datasets)\n- FileIcon (for file system trees)\n\n## Common Use Cases\n- File system browsers\n- Organization hierarchies\n- Navigation menus\n- Category trees\n- Taxonomy browsers\n- Decision trees\n- Code structure explorers\n- Content management systems