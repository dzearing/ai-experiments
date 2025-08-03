# Sub-Agent Task: Data Display & Lists Specialist

## Objective
Create detailed specifications for data display and list components with a focus on performance, large dataset handling, and flexible data presentation patterns.

## Assigned Components (High Priority: 11, Medium Priority: 8)

### High Priority Components
1. VirtualizedList
2. InfiniteList
3. DataTable
4. TablePagination
5. TableSort
6. ListView
7. ListEmptyState
8. ListLoadingState
9. ListErrorState
10. FileTree
11. FolderTree

### Medium Priority Components
1. GroupedList
2. SortableList
3. FilterableList
4. SelectableList
5. KanbanBoard
6. KanbanColumn
7. KanbanCard
8. GridView

## Required Deliverables for Each Component

### 1. Performance Specifications
- Maximum item count before virtualization
- Render optimization strategies
- Memory management approach
- Scroll performance targets
- Update/re-render patterns

### 2. Data Interface Patterns
```typescript
// Example for DataTable
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDefinition<T>[];
  
  // Virtualization
  virtualizeThreshold?: number; // default: 50
  rowHeight?: number | ((item: T) => number);
  
  // Selection
  selectable?: boolean;
  selection?: Selection<T>;
  onSelectionChange?: (selection: Selection<T>) => void;
  
  // Sorting
  sortable?: boolean;
  defaultSort?: SortConfig<T>;
  onSort?: (sort: SortConfig<T>) => void;
  
  // ... complete specification
}
```

### 3. HTML Mockups with States

#### Example: DataTable Mockup
```html
<!-- DataTable - Default State with Virtual Scrolling -->
<div class="data-table" role="table" aria-label="Data table">
  <div class="data-table__header" role="rowgroup">
    <div class="data-table__row" role="row">
      <div class="data-table__cell data-table__cell--header" role="columnheader">
        <button class="sort-button" aria-label="Sort by name">
          Name
          <svg class="sort-icon"><!-- arrow icon --></svg>
        </button>
      </div>
      <div class="data-table__cell data-table__cell--header" role="columnheader">
        Status
      </div>
      <div class="data-table__cell data-table__cell--header" role="columnheader">
        Actions
      </div>
    </div>
  </div>
  
  <div class="data-table__body" role="rowgroup" style="height: 400px; overflow-y: auto;">
    <!-- Virtual scroll container -->
    <div class="virtual-scroll-spacer" style="height: 2000px; position: relative;">
      <!-- Only visible rows rendered -->
      <div class="data-table__row" role="row" style="position: absolute; top: 0px;">
        <div class="data-table__cell" role="cell">Item 1</div>
        <div class="data-table__cell" role="cell">
          <span class="status-badge status-badge--active">Active</span>
        </div>
        <div class="data-table__cell" role="cell">
          <button class="icon-button" aria-label="More actions">⋮</button>
        </div>
      </div>
      <!-- ... only ~10-15 visible rows rendered ... -->
    </div>
  </div>
  
  <div class="data-table__footer">
    <div class="data-table__pagination">
      <span>Showing 1-10 of 1000</span>
      <button aria-label="Previous page">Previous</button>
      <button aria-label="Next page">Next</button>
    </div>
  </div>
</div>

<style>
.data-table {
  --row-height: 48px;
  --header-height: 56px;
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.data-table__row {
  display: grid;
  grid-template-columns: 1fr auto 100px;
  height: var(--row-height);
  border-bottom: 1px solid var(--color-border-subtle);
}

/* Virtual scrolling performance */
.virtual-scroll-spacer {
  will-change: transform;
  contain: strict;
}
</style>
```

### 4. Virtualization Strategy
- Define when to use virtual scrolling vs pagination
- Intersection Observer vs scroll event handling
- Buffer zone calculations
- Dynamic row height handling
- Smooth scrolling maintenance

### 5. State Management Patterns
```typescript
// Example: List state management
interface ListState<T> {
  items: T[];
  loading: boolean;
  error: Error | null;
  
  // Selection
  selectedIds: Set<string>;
  lastSelectedIndex: number;
  
  // Virtualization
  scrollTop: number;
  visibleRange: { start: number; end: number };
  
  // Filtering/Sorting
  filters: FilterConfig[];
  sort: SortConfig;
}
```

### 6. Composite Component Architecture
```
DataTable
├── TableHeader
│   ├── TableHeaderCell
│   └── SortButton
├── TableBody
│   ├── VirtualScroller
│   └── TableRow
│       └── TableCell
└── TableFooter
    └── TablePagination
```

## KanbanBoard Special Requirements

### Drag & Drop Specification
```typescript
interface DragDropContext {
  draggedItem: KanbanCard | null;
  draggedFrom: { columnId: string; index: number };
  dropTarget: { columnId: string; index: number } | null;
  isDragging: boolean;
}
```

### HTML Mockup for Drag State
```html
<!-- KanbanBoard - Dragging State -->
<div class="kanban-board">
  <div class="kanban-column" data-column-id="todo">
    <div class="kanban-column__header">To Do (3)</div>
    <div class="kanban-column__cards">
      <div class="drop-indicator drop-indicator--active"></div>
      <div class="kanban-card kanban-card--placeholder">
        <!-- Placeholder for dragged item -->
      </div>
      <div class="kanban-card">Card 2</div>
    </div>
  </div>
  
  <!-- Dragged card (follows cursor) -->
  <div class="kanban-card kanban-card--dragging" style="position: fixed; left: 100px; top: 200px;">
    <div class="kanban-card__title">Dragged Card</div>
  </div>
</div>
```

## FileTree Special Requirements

### Tree Node Interface
```typescript
interface TreeNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: TreeNode[];
  expanded?: boolean;
  depth: number;
  path: string;
  
  // Lazy loading
  hasChildren?: boolean;
  loading?: boolean;
}
```

## Success Criteria
1. All components have performance benchmarks defined
2. Virtualization implemented for lists > 50 items
3. Drag & drop is accessible and smooth
4. Tree components support lazy loading
5. Table components are fully accessible
6. Mobile gestures are supported
7. Keyboard navigation is complete

## Performance Targets
- Initial render: < 16ms for up to 1000 items
- Scroll performance: 60fps maintained
- Memory usage: < 50MB for 10,000 items
- Update performance: < 8ms for single item update

## Accessibility Requirements
- Full keyboard navigation
- Screen reader announcements
- Focus management
- ARIA labels and roles
- High contrast mode support
- Reduced motion support