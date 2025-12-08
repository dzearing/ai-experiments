# Tree View Component Mockup

## Visual Design

```
┌─────────────────────────────────────────────────────────────┐
│ File Explorer                                         [⚙️]  │
├─────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────────┐   │
│ │ 📁 src/                                              │   │
│ │ ├─ 📁 components/                                    │   │
│ │ │  ├─ 📁 ui/                                        │   │
│ │ │  │  ├─ 📄 Button.tsx                             │   │
│ │ │  │  ├─ 📄 Input.tsx                              │   │
│ │ │  │  └─ 📄 Card.tsx                               │   │
│ │ │  ├─ 📁 layout/                                    │   │
│ │ │  │  ├─ 📄 Header.tsx                             │   │
│ │ │  │  └─ 📄 Footer.tsx                             │   │
│ │ │  └─ 📁 forms/                                     │   │
│ │ │     └─ 📄 LoginForm.tsx                          │   │
│ │ ├─ 📁 hooks/                                        │   │
│ │ │  ├─ 📄 useAuth.ts                                │   │
│ │ │  └─ 📄 useData.ts                                │   │
│ │ ├─ 📁 utils/                                        │   │
│ │ │  └─ 📄 helpers.ts                                │   │
│ │ └─ 📄 App.tsx                                       │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ [Status: 15 items, 3 selected]                             │
└─────────────────────────────────────────────────────────────┘
```

## Component Structure

### Tree Node
```html
<div class="tree-node" 
     data-node-id="node-123" 
     data-level="2"
     data-expanded="true"
     style="--item-y: 120px; --indent-level: 2;">
  
  <!-- Indent guides -->
  <div class="tree-node__guides">
    <span class="tree-guide"></span>
    <span class="tree-guide"></span>
  </div>
  
  <!-- Node content -->
  <div class="tree-node__content">
    <button class="tree-node__toggle" aria-expanded="true">
      <svg class="tree-node__arrow">▶</svg>
    </button>
    
    <span class="tree-node__icon">📁</span>
    
    <span class="tree-node__label">components</span>
    
    <span class="tree-node__badge">12</span>
  </div>
  
  <!-- Actions (on hover) -->
  <div class="tree-node__actions">
    <button aria-label="Add">+</button>
    <button aria-label="Rename">✏️</button>
    <button aria-label="Delete">🗑️</button>
  </div>
</div>
```

## Animation Sequences

### Expand Animation
```
Frame 0: Children hidden, arrow pointing right (0deg)
Frame 1-5: Arrow rotates to down (90deg)
Frame 6-15: Children fade in and slide down from -10px to 0px
Total duration: 200ms with ease-out
```

### Collapse Animation
```
Frame 0: Children visible, arrow pointing down (90deg)
Frame 1-5: Children fade out and slide up 10px
Frame 6-10: Arrow rotates to right (0deg)
Total duration: 150ms with ease-in
```

### Multi-Select Animation
```
Selection rectangle appears with dashed border
Selected items get subtle background highlight
Transition: 100ms ease-out
```

## States

### Hover State
```
┌─────────────────────────────────────────┐
│ 📁 components/        [+] [✏️] [🗑️]     │  <- Actions visible
└─────────────────────────────────────────┘
Background: var(--color-hover-background)
```

### Selected State
```
┌─────────────────────────────────────────┐
│ 📁 components/ ✓                         │  <- Checkmark shown
└─────────────────────────────────────────┘
Background: var(--color-selected-background)
Border: 2px solid var(--color-accent-border)
```

### Dragging State
```
┌─────────────────────────────────────────┐
│ 📁 components/                           │  <- Semi-transparent
└─────────────────────────────────────────┘
Opacity: 0.5
Cursor: grabbing
```

### Drop Target State
```
┌─────────────────────────────────────────┐
│ 📁 target-folder/                        │
│ ┌───────────────────────────────────┐   │  <- Drop indicator
│ │ Drop here to move items            │   │
│ └───────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

## Interaction Patterns

### Keyboard Navigation
- **↑/↓**: Navigate between nodes
- **←/→**: Collapse/Expand nodes
- **Space**: Toggle selection
- **Shift+Click**: Range select
- **Ctrl/Cmd+Click**: Multi-select
- **Enter**: Activate node
- **F2**: Rename node

### Mouse Interactions
- **Click Arrow**: Expand/Collapse
- **Click Node**: Select
- **Double Click**: Open/Activate
- **Right Click**: Context menu
- **Drag**: Move nodes
- **Ctrl+Drag**: Copy nodes

## CSS Implementation

```css
.tree-view {
  --tree-indent: var(--spacing-large10);
  --tree-line-height: 32px;
  --tree-guide-width: 1px;
  --tree-arrow-size: 12px;
  
  position: relative;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  font-size: var(--font-size);
}

.tree-node {
  position: absolute;
  width: 100%;
  height: var(--tree-line-height);
  transform: translateY(var(--item-y));
  transition: transform var(--duration-smooth) var(--easing-smooth);
  will-change: transform;
  display: flex;
  align-items: center;
  padding: 0 var(--spacing-small20);
  cursor: pointer;
}

/* Indentation */
.tree-node__guides {
  display: flex;
  width: calc(var(--indent-level) * var(--tree-indent));
  height: 100%;
  position: relative;
}

.tree-guide {
  position: absolute;
  width: var(--tree-guide-width);
  height: 100%;
  background: var(--color-border-soft);
  left: calc(var(--tree-indent) * var(--guide-index));
}

/* Node content */
.tree-node__content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--spacing-small30);
  height: 100%;
  padding: 0 var(--spacing-small20);
  border-radius: var(--radius-small);
  transition: background var(--duration-fast);
}

/* Toggle arrow */
.tree-node__toggle {
  width: var(--tree-arrow-size);
  height: var(--tree-arrow-size);
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tree-node__arrow {
  width: 100%;
  height: 100%;
  transition: transform var(--duration-fast);
  transform: rotate(0deg);
}

.tree-node[data-expanded="true"] .tree-node__arrow {
  transform: rotate(90deg);
}

/* Hide toggle for leaf nodes */
.tree-node[data-has-children="false"] .tree-node__toggle {
  visibility: hidden;
  width: var(--tree-arrow-size);
}

/* Icons */
.tree-node__icon {
  font-size: 16px;
  line-height: 1;
  flex-shrink: 0;
}

/* Label */
.tree-node__label {
  flex: 1;
  color: var(--color-body-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Badge */
.tree-node__badge {
  font-size: var(--font-size-small);
  color: var(--color-body-textSoft20);
  background: var(--color-badge-background);
  padding: 2px 6px;
  border-radius: var(--radius-small);
}

/* Actions */
.tree-node__actions {
  display: flex;
  gap: var(--spacing-small30);
  opacity: 0;
  transition: opacity var(--duration-fast);
}

.tree-node:hover .tree-node__actions {
  opacity: 1;
}

.tree-node__actions button {
  width: 20px;
  height: 20px;
  padding: 0;
  background: var(--color-button-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-small);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

/* States */
.tree-node:hover .tree-node__content {
  background: var(--color-hover-background);
}

.tree-node[data-selected="true"] .tree-node__content {
  background: var(--color-selected-background);
  border: 1px solid var(--color-accent-border);
}

.tree-node[data-focused="true"] .tree-node__content {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: -2px;
}

/* Expand/Collapse animations */
@keyframes expandChildren {
  from {
    opacity: 0;
    transform: translateY(calc(var(--item-y) - 10px));
  }
  to {
    opacity: 1;
    transform: translateY(var(--item-y));
  }
}

.tree-node.expanding {
  animation: expandChildren var(--duration-normal) var(--easing-smooth);
}

@keyframes collapseChildren {
  from {
    opacity: 1;
    transform: translateY(var(--item-y));
  }
  to {
    opacity: 0;
    transform: translateY(calc(var(--item-y) - 10px));
  }
}

.tree-node.collapsing {
  animation: collapseChildren var(--duration-fast) var(--easing-smooth);
}

/* Drag and drop */
.tree-node.dragging {
  opacity: 0.5;
  cursor: grabbing;
}

.tree-node.drop-target {
  background: var(--color-accent-backgroundSoft);
  border: 2px dashed var(--color-accent-border);
}

/* Loading state */
.tree-node--loading .tree-node__label {
  color: var(--color-body-textSoft20);
}

.tree-node--loading::after {
  content: "...";
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% { content: "."; }
  33% { content: ".."; }
  66% { content: "..."; }
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .tree-view {
    --tree-line-height: 40px;
    --tree-indent: var(--spacing);
  }
  
  .tree-node__actions {
    opacity: 1; /* Always visible on mobile */
  }
  
  .tree-node__content {
    padding: var(--spacing-small20);
  }
}
```

## Performance Optimizations

### Virtual Rendering
- Only render visible nodes + buffer
- Recycle DOM elements for off-screen nodes
- Maintain scroll position during expand/collapse

### Lazy Loading
- Load children only when parent expands
- Show loading indicator during fetch
- Cache expanded state in memory

### Batch Operations
- Batch DOM updates in requestAnimationFrame
- Debounce rapid expand/collapse operations
- Use CSS transforms instead of layout changes