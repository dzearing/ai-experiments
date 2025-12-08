# Code Graph Visualizer Component Plan

## Overview
Interactive graph visualization for displaying code relationships, dependencies, and AST structures.

## Component Details

### Name
`CodeGraphVisualizer`

### Purpose
Visualize code relationships including imports, exports, function calls, and component hierarchies.

### Props Interface
```typescript
interface CodeGraphVisualizerProps {
  data: GraphData
  layout?: 'force' | 'tree' | 'radial' | 'hierarchical'
  interactive?: boolean
  showLabels?: boolean
  showMetrics?: boolean
  onNodeClick?: (node: GraphNode) => void
  onEdgeClick?: (edge: GraphEdge) => void
  highlightPath?: string[]
  filters?: GraphFilters
  maxDepth?: number
}

interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
  metrics?: GraphMetrics
}

interface GraphNode {
  id: string
  label: string
  type: 'file' | 'function' | 'class' | 'component' | 'module' | 'variable'
  metadata: {
    filePath?: string
    lineNumber?: number
    size?: number
    complexity?: number
  }
  group?: string
  level?: number
}

interface GraphEdge {
  source: string
  target: string
  type: 'import' | 'export' | 'calls' | 'extends' | 'implements' | 'uses'
  weight?: number
  label?: string
}

interface GraphFilters {
  nodeTypes?: string[]
  edgeTypes?: string[]
  minWeight?: number
  searchTerm?: string
}
```

## Design Tokens Usage

### Colors
- Node types:
  - File: `--color-info-background`
  - Function: `--color-success-background`
  - Class: `--color-warning-background`
  - Component: `--color-primary-background`
- Edges: `--color-body-textSoft30`
- Selected: `--color-selection-background`
- Hover: `--color-hover-background`

### Spacing
- Node padding: `--spacing-small20`
- Graph margin: `--spacing`
- Label offset: `--spacing-small30`

### Typography
- Node labels: `--font-size-small10`
- Edge labels: `--font-size-small20`
- Metrics: `--font-family-mono`

## States

### Layout Modes

#### Force-Directed
- Physics simulation
- Clusters naturally form
- Interactive dragging
- Best for organic relationships

#### Tree Layout
- Hierarchical structure
- Clear parent-child
- Top-down or left-right
- Best for dependencies

#### Radial Layout
- Central focus node
- Concentric circles
- Distance = relationship
- Best for impact analysis

### Interaction States
- **Hover**: Highlight connected nodes
- **Selected**: Bold outline, show details
- **Focused**: Dim unrelated nodes
- **Dragging**: Ghost node while moving

## Behaviors

### Navigation
- Pan and zoom canvas
- Click to select node
- Double-click to focus
- Breadcrumb trail

### Filtering
- Hide node types
- Filter by connection
- Search highlighting
- Depth limiting

### Analysis Features
- Shortest path finding
- Cycle detection
- Cluster identification
- Impact analysis

### Details Panel
- Node information
- Connection list
- Metrics display
- Quick actions

## Responsive Design

### Desktop
- Full interactive canvas
- Side panel for details
- Minimap navigation
- Keyboard shortcuts

### Mobile
- Touch gestures
- Simplified layout
- Full-screen mode
- Swipe between nodes

## Accessibility

### Keyboard Navigation
- Tab through nodes
- Arrow keys for graph traversal
- Enter to expand
- Escape to unfocus

### Screen Reader Support
- Graph structure description
- Relationship announcements
- Node type and metrics
- Alternative table view

## Performance Considerations

### Optimization Strategies
- WebGL rendering for large graphs
- Level-of-detail rendering
- Viewport culling
- Progressive loading

### Bundle Size
- Lazy load graph library
- Optional 3D rendering
- Modular layout algorithms

## Integration Examples

### Basic Usage
```jsx
<CodeGraphVisualizer
  data={{
    nodes: [
      { id: '1', label: 'App.tsx', type: 'file' },
      { id: '2', label: 'Button', type: 'component' }
    ],
    edges: [
      { source: '1', target: '2', type: 'import' }
    ]
  }}
/>
```

### Advanced Features
```jsx
<CodeGraphVisualizer
  data={astGraph}
  layout="hierarchical"
  interactive={true}
  showMetrics={true}
  filters={{
    nodeTypes: ['function', 'class'],
    minWeight: 2
  }}
  highlightPath={['App.tsx', 'Button.tsx']}
  onNodeClick={(node) => openFile(node.metadata.filePath)}
/>
```

## Visual Examples

### Dependency Graph
```
    [App.tsx]
    ↙    ↓    ↘
[Header] [Main] [Footer]
    ↓       ↓       ↓
[Logo]  [Content] [Links]
```

### Call Graph
```
     main()
    ↙      ↘
init()    process()
  ↓          ↓
setup()   validate()
            ↓
         transform()
```

### Component Tree
```
      <App>
     /  |  \
<Header> <Router> <Footer>
         /    \
    <Home>  <About>
      |
   <Hero>
```

## Implementation Priority
**Medium** - Advanced feature for code analysis

## Dependencies
- Graph rendering library (D3/Cytoscape/Sigma)
- Layout algorithms
- WebGL renderer (optional)
- Graph analysis utilities

## Open Questions
1. Should we support 3D visualization?
2. How to handle very large graphs (>1000 nodes)?
3. Should we integrate with LSP for real-time updates?
4. Export formats (SVG, PNG, GraphML)?