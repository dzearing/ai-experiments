# Tool Execution Container Component Plan

## Overview
Container component that wraps tool executions in chat, providing summary/expanded modes and managing multiple tool steps.

## Component Details

### Name
`ToolExecutionContainer`

### Purpose
Provides a unified interface for displaying tool executions with collapsible detail levels and progress tracking.

### Props Interface
```typescript
interface ToolExecutionContainerProps {
  tools: ToolExecution[]
  defaultMode?: 'summary' | 'expanded'
  onToolClick?: (toolId: string) => void
  showTimestamps?: boolean
  allowInterrupt?: boolean
  onInterrupt?: () => void
}

interface ToolExecution {
  id: string
  name: string
  status: 'pending' | 'running' | 'success' | 'error' | 'interrupted'
  summary: string
  startTime?: Date
  endTime?: Date
  steps?: ToolStep[]
  result?: any
  error?: Error
}

interface ToolStep {
  id: string
  type: 'file-read' | 'file-write' | 'search' | 'code-analysis' | 'shell' | 'web-fetch'
  description: string
  status: 'pending' | 'running' | 'success' | 'error'
  visualizer?: React.ComponentType<any>
  data?: any
}
```

## Design Tokens Usage

### Colors
- Container background: `--color-panel-background`
- Summary text: `--color-body-text`
- Progress indicator: `--color-progress-background`
- Success state: `--color-success-background`
- Error state: `--color-danger-background`
- Running state: `--color-info-background`

### Spacing
- Container padding: `--spacing-card`
- Tool item gap: `--spacing-small10`
- Step indent: `--spacing-large10`

### Typography
- Tool name: `--font-weight-semibold`, `--font-size`
- Summary: `--font-size-small10`
- Timestamps: `--font-size-small20`, `--color-body-textSoft20`

## States

### Summary Mode
- Single line per tool showing name, status icon, and brief summary
- Progress bar for running tools
- Expand button to show details

### Expanded Mode
- Full tool details with all steps visible
- Step-by-step execution timeline
- Integrated visualizers for each step
- Execution time and performance metrics

### Status States
- **Pending**: Queued indicator
- **Running**: Animated progress with spinner
- **Success**: Check mark with completion time
- **Error**: Error icon with message preview
- **Interrupted**: Warning icon with interrupt reason

## Behaviors

### Expand/Collapse
- Click header to toggle between summary and expanded
- Keyboard support (Space/Enter)
- Smooth height animation
- Remember user preference per session

### Real-time Updates
- Live progress updates for running tools
- Streaming output support
- Auto-scroll to active step
- Performance metrics update

### Error Handling
- Inline error display
- Retry button for failed tools
- Error details expansion
- Stack trace in developer mode

## Responsive Design

### Desktop
- Full-width container with indented steps
- Side-by-side visualizers where applicable
- Floating timestamp badges

### Mobile
- Compact summary mode by default
- Full-screen expansion option
- Swipe to expand/collapse
- Touch-optimized controls

## Accessibility

### Keyboard Navigation
- Tab through tools
- Arrow keys for step navigation
- Space/Enter to expand
- Escape to collapse all

### Screen Reader Support
- Status announcements
- Progress updates
- Tool completion notifications
- Descriptive ARIA labels

## Performance Considerations

### Optimization Strategies
- Virtual scrolling for many steps
- Lazy load visualizers
- Debounced progress updates
- Memoized step components

### Bundle Size
- Code-split visualizers
- Dynamic imports for heavy components
- Tree-shakeable status icons

## Integration Examples

### Basic Usage
```jsx
<ToolExecutionContainer
  tools={[
    {
      id: '1',
      name: 'Search Codebase',
      status: 'running',
      summary: 'Searching for "useState" across 142 files...'
    }
  ]}
/>
```

### With Visualizers
```jsx
<ToolExecutionContainer
  tools={[
    {
      id: '1',
      name: 'File Operations',
      status: 'success',
      summary: 'Modified 3 files',
      steps: [
        {
          type: 'file-write',
          description: 'Updated App.tsx',
          visualizer: CodeDiffVisualizer,
          data: { diff: '...' }
        }
      ]
    }
  ]}
  defaultMode="expanded"
/>
```

## Implementation Priority
**High** - Core component for tool visibility in chat

## Dependencies
- Tool step visualizers
- Progress indicators
- Collapse/expand animations
- Status icons

## Open Questions
1. Should we persist expand/collapse state?
2. How to handle very long-running tools?
3. Should we support tool cancellation?
4. Maximum number of visible steps before pagination?