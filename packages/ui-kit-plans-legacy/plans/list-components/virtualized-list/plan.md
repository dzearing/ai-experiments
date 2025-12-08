# Virtualized List Components Plan

## Overview

High-performance virtualized list components for handling thousands of items with dynamic heights, smooth animations, and minimal DOM operations. Built with vanilla JS internally for maximum performance, wrapped in React for developer experience.

## Core Architecture

### 1. Component Model

```typescript
interface VirtualizedComponent {
  // Called multiple times as data changes
  render(data: any, container: HTMLElement): void;
  
  // Called when component becomes active/inactive
  activate(): void;
  deactivate(): void;
  
  // Cleanup when component is destroyed
  dispose(): void;
}
```

### 2. Recycling Pool Architecture

```typescript
class ComponentRecycler<T extends VirtualizedComponent> {
  private activeComponents: Map<string, T>;
  private recyclePool: T[];
  private componentFactory: () => T;
  
  acquire(key: string): T {
    // Get from pool or create new
    const component = this.recyclePool.pop() || this.componentFactory();
    component.activate();
    this.activeComponents.set(key, component);
    return component;
  }
  
  release(key: string): void {
    const component = this.activeComponents.get(key);
    if (component) {
      component.deactivate();
      this.activeComponents.delete(key);
      this.recyclePool.push(component);
    }
  }
}
```

### 3. Virtual Scroll Engine

```typescript
interface VirtualScrollEngine {
  // Core measurements
  viewportHeight: number;
  scrollTop: number;
  scrollHeight: number;
  
  // Item management
  itemHeights: Map<string, number>;
  estimatedItemHeight: number;
  
  // Visible range calculation
  calculateVisibleRange(): { start: number; end: number };
  
  // Position calculation
  getItemPosition(index: number): number;
  
  // Dynamic height updates
  updateItemHeight(index: number, height: number): void;
}
```

## Component Types

### 1. Chat List (Bottom-Anchored)

**Features:**
- Starts at bottom of viewport
- New messages appear at bottom
- Smooth auto-scroll on new messages
- Dynamic message heights
- Graceful entrance animations

**Implementation:**
```typescript
class ChatList extends VirtualizedList {
  private isAtBottom: boolean = true;
  private lastScrollHeight: number = 0;
  
  onNewMessage() {
    if (this.isAtBottom) {
      this.smoothScrollToBottom();
    }
  }
  
  maintainScrollPosition() {
    // When items are added above viewport
    const scrollDelta = this.scrollHeight - this.lastScrollHeight;
    this.scrollTop += scrollDelta;
  }
}
```

### 2. Tree View

**Features:**
- Expand/collapse animations
- Nested virtualization
- Indentation handling
- Keyboard navigation
- Multi-select support

**Implementation:**
```typescript
interface TreeNode {
  id: string;
  expanded: boolean;
  level: number;
  hasChildren: boolean;
  data: any;
}

class TreeList extends VirtualizedList {
  private expandedNodes: Set<string>;
  
  toggleNode(nodeId: string) {
    const isExpanding = !this.expandedNodes.has(nodeId);
    
    if (isExpanding) {
      this.animateExpand(nodeId);
    } else {
      this.animateCollapse(nodeId);
    }
  }
}
```

### 3. Data Grid

**Features:**
- Column virtualization
- Row virtualization
- Fixed headers/columns
- Sort/filter without re-render
- Cell editing

## Animation System

### 1. Transform-Based Positioning

```css
.virtual-item {
  position: absolute;
  will-change: transform;
  transform: translateY(var(--item-y));
  transition: transform var(--duration-smooth) var(--easing-smooth);
}
```

### 2. Entrance Animations

```typescript
class EntranceAnimation {
  // Stagger animations for multiple items
  animateItems(items: HTMLElement[], direction: 'up' | 'down') {
    items.forEach((item, index) => {
      item.style.setProperty('--delay', `${index * 20}ms`);
      item.classList.add(`enter-${direction}`);
    });
  }
}
```

```css
.enter-down {
  animation: slideInDown var(--duration-normal) var(--delay) var(--easing-smooth) both;
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(calc(var(--item-y) - 20px));
  }
  to {
    opacity: 1;
    transform: translateY(var(--item-y));
  }
}
```

### 3. Exit Animations

```typescript
class ExitAnimation {
  async animateRemoval(items: HTMLElement[]): Promise<void> {
    // Add exit class
    items.forEach(item => item.classList.add('exit'));
    
    // Wait for animation
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Return to pool
    items.forEach(item => this.recycler.release(item.dataset.key));
  }
}
```

## Performance Optimizations

### 1. Measurement Caching

```typescript
class MeasurementCache {
  private cache: Map<string, DOMRect>;
  private resizeObserver: ResizeObserver;
  
  observe(element: HTMLElement, key: string) {
    this.resizeObserver.observe(element);
    this.cache.set(key, element.getBoundingClientRect());
  }
  
  getCached(key: string): DOMRect | undefined {
    return this.cache.get(key);
  }
}
```

### 2. Batch DOM Operations

```typescript
class DOMBatcher {
  private pendingReads: (() => void)[] = [];
  private pendingWrites: (() => void)[] = [];
  private scheduled = false;
  
  read(fn: () => void) {
    this.pendingReads.push(fn);
    this.schedule();
  }
  
  write(fn: () => void) {
    this.pendingWrites.push(fn);
    this.schedule();
  }
  
  private schedule() {
    if (!this.scheduled) {
      this.scheduled = true;
      requestAnimationFrame(() => this.flush());
    }
  }
  
  private flush() {
    // Batch reads first
    this.pendingReads.forEach(fn => fn());
    this.pendingReads = [];
    
    // Then batch writes
    this.pendingWrites.forEach(fn => fn());
    this.pendingWrites = [];
    
    this.scheduled = false;
  }
}
```

### 3. Virtual Scrollbar

```typescript
class VirtualScrollbar {
  private scrollbarHeight: number;
  private thumbHeight: number;
  private isDragging: boolean = false;
  
  updateThumbPosition(scrollTop: number, scrollHeight: number) {
    const scrollRatio = scrollTop / (scrollHeight - this.viewportHeight);
    const thumbY = scrollRatio * (this.scrollbarHeight - this.thumbHeight);
    
    this.thumb.style.transform = `translateY(${thumbY}px)`;
  }
}
```

## React Integration

### 1. Hook Interface

```typescript
function useVirtualizedList<T>({
  items,
  estimatedItemHeight,
  getItemKey,
  renderItem,
  onScroll,
}: VirtualizedListOptions<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<VirtualScrollEngine>();
  
  useEffect(() => {
    if (containerRef.current) {
      engineRef.current = new VirtualScrollEngine({
        container: containerRef.current,
        items,
        estimatedItemHeight,
      });
    }
  }, []);
  
  return {
    containerRef,
    visibleItems: engineRef.current?.getVisibleItems() || [],
  };
}
```

### 2. Component Wrapper

```tsx
export function VirtualizedList<T>({
  items,
  renderItem,
  className,
  ...props
}: VirtualizedListProps<T>) {
  const { containerRef, visibleItems } = useVirtualizedList(props);
  
  return (
    <div ref={containerRef} className={className}>
      <div className="virtual-scroller">
        {visibleItems.map(item => (
          <VirtualizedItem key={item.key} data={item} />
        ))}
      </div>
    </div>
  );
}
```

## Design Tokens

```css
:root {
  /* Animation timing */
  --duration-smooth: 200ms;
  --duration-bounce: 300ms;
  --easing-smooth: cubic-bezier(0.4, 0, 0.2, 1);
  --easing-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  
  /* Spacing */
  --list-item-gap: var(--spacing-small20);
  --list-padding: var(--spacing);
  
  /* Chat specific */
  --chat-message-gap: var(--spacing-small10);
  --chat-bubble-padding: var(--spacing-small20) var(--spacing);
  
  /* Tree specific */
  --tree-indent: var(--spacing-large10);
  --tree-line-height: 32px;
  
  /* Grid specific */
  --grid-header-height: 40px;
  --grid-row-height: 36px;
}
```

## Implementation Phases

### Phase 1: Core Engine
- [ ] Virtual scroll engine
- [ ] Component recycler
- [ ] Measurement cache
- [ ] DOM batcher

### Phase 2: Chat List
- [ ] Bottom-anchored scrolling
- [ ] Dynamic heights
- [ ] Message animations
- [ ] Auto-scroll behavior

### Phase 3: Tree View
- [ ] Expand/collapse
- [ ] Nested virtualization
- [ ] Keyboard navigation
- [ ] Selection model

### Phase 4: Data Grid
- [ ] Column virtualization
- [ ] Fixed headers
- [ ] Sort/filter
- [ ] Cell editing

### Phase 5: Polish
- [ ] Smooth animations
- [ ] Performance tuning
- [ ] Accessibility
- [ ] Mobile optimization

## Performance Targets

- Initial render: < 16ms (60fps)
- Scroll performance: < 8ms (120fps)
- Item addition: < 4ms per item
- Memory usage: < 50MB for 10,000 items
- DOM nodes: < 100 active at any time

## Testing Strategy

### Unit Tests
- Virtual scroll calculations
- Recycler pool management
- Animation timing
- Measurement caching

### Performance Tests
- Scroll frame rate
- Memory usage
- DOM node count
- Time to interactive

### E2E Tests
- Chat scenarios
- Tree interactions
- Grid operations
- Mobile gestures