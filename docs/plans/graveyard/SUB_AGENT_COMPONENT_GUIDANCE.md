# Sub-Agent Component Specification Guidance

## Overview

This document provides guidance for sub-agents creating component specifications for the Claude Flow UI Kit. Based on the architectural critique, we're shifting focus from creating 120+ components to building ~30 excellent primitives that compose into complex components.

## Core Principles for Component Specification

### 1. Start with Primitives
Before specifying any complex component, identify and specify its primitive dependencies:
- What layout primitives does it need? (Box, Flex, Grid)
- What input primitives does it use? (TextField, Checkbox)
- What display primitives are required? (Text, Icon, Badge)

### 2. Think in Sub-Components
Every complex component should be broken down into logical sub-components:

```typescript
// Bad: Monolithic component
interface DatePickerProps {
  // 50+ props handling everything
}

// Good: Composed from sub-components
interface DatePickerProps {
  trigger?: ReactElement<DatePickerTriggerProps>;
  calendar?: ReactElement<CalendarProps>;
  input?: ReactElement<DateInputProps>;
}
```

### 3. Document the Composition Tree
For each component, clearly show how it's composed:

```
DatePicker
├── DatePickerTrigger (uses Button primitive)
├── DatePickerPopover (uses Popover primitive)
│   ├── Calendar
│   │   ├── CalendarHeader (uses Flex, Button, Text)
│   │   ├── CalendarGrid (uses Grid)
│   │   │   └── CalendarDay (uses Button)
│   │   └── CalendarFooter (uses Flex, Button)
│   └── DatePickerActions (uses Flex, Button)
└── DateInput (uses TextField primitive)
```

## Required Sections for Each Component Specification

### 1. Component Overview
- **Name**: Component name (e.g., `Select`)
- **Category**: Which level (Primitive/Base/Composite/Specialized)
- **Purpose**: One-sentence description
- **Composition**: List of sub-components

### 2. Dependencies
```typescript
// Primitive dependencies
import { Box, Flex, Text, Icon } from '../primitives';

// Base component dependencies  
import { Popover } from '../overlays';
import { List, ListItem } from '../data';

// Hooks and utilities
import { useControlled, useId } from '../hooks';
```

### 3. Sub-Component Specifications

For each sub-component, provide:

```typescript
// Main component
interface SelectProps {
  // ... main props
}

// Sub-component 1
interface SelectTriggerProps {
  isOpen?: boolean;
  disabled?: boolean;
  placeholder?: string;
  value?: string;
  onPress?: () => void;
  children?: ReactNode;
}

// Sub-component 2
interface SelectOptionProps {
  value: string;
  disabled?: boolean;
  selected?: boolean;
  onSelect?: (value: string) => void;
  children?: ReactNode;
}

// ... more sub-components
```

### 4. Composition Example

Show how the component is used with its sub-components:

```tsx
// Composed usage
<Select>
  <SelectTrigger />
  <SelectPopover>
    <SelectSearch />
    <SelectList>
      <SelectOption value="1">Option 1</SelectOption>
      <SelectOption value="2">Option 2</SelectOption>
    </SelectList>
  </SelectPopover>
</Select>

// Simplified usage (with internal composition)
<Select 
  options={options}
  value={value}
  onChange={onChange}
/>
```

### 5. State Management

Document how state flows through sub-components:

```typescript
// Parent manages state
const SelectContext = createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}>();

// Sub-components consume context
function SelectOption({ value, children }) {
  const { value: selectedValue, onValueChange } = useContext(SelectContext);
  const isSelected = value === selectedValue;
  // ...
}
```

### 6. Styling Architecture

Define how styles are applied through the component tree:

```css
/* Base component styles */
.select { /* container styles */ }

/* Sub-component styles */
.select-trigger { /* trigger button styles */ }
.select-popover { /* dropdown styles */ }
.select-option { /* option styles */ }
.select-option--selected { /* selected state */ }

/* Composition with primitives */
.select-trigger {
  /* Extends Button primitive styles */
  composes: button from '../Button/Button.module.css';
}
```

## Examples of Well-Specified Components

### Example 1: Simple Primitive (Badge)

```typescript
// Badge.tsx - A true primitive
interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'small' | 'medium';
  children: ReactNode;
}

// No sub-components needed - this IS a primitive
export function Badge({ variant = 'default', size = 'medium', children }: BadgeProps) {
  return (
    <span className={cn(styles.badge, styles[variant], styles[size])}>
      {children}
    </span>
  );
}
```

### Example 2: Composed Component (Alert)

```typescript
// Alert.tsx - Composed from primitives
interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  description?: string;
  icon?: ReactElement;
  actions?: ReactElement;
  onClose?: () => void;
}

// Sub-components
interface AlertIconProps {
  children: ReactElement;
}

interface AlertContentProps {
  title?: string;
  description?: string;
}

interface AlertActionsProps {
  children: ReactNode;
}

// Usage
<Alert variant="error">
  <AlertIcon>
    <ExclamationIcon />
  </AlertIcon>
  <AlertContent 
    title="Error"
    description="Something went wrong"
  />
  <AlertActions>
    <Button size="small">Retry</Button>
  </AlertActions>
</Alert>
```

### Example 3: Complex Component (DataTable)

```typescript
// DataTable is composed of many sub-components
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  // Composition props
  header?: ReactElement<TableHeaderProps>;
  body?: ReactElement<TableBodyProps>;
  footer?: ReactElement<TableFooterProps>;
}

// Sub-component tree
DataTable
├── Table (primitive)
├── TableHeader
│   ├── TableRow (primitive)
│   │   └── TableHeaderCell
│   │       ├── TableSortButton
│   │       └── TableFilterButton
├── TableBody
│   ├── TableRow (primitive)
│   │   └── TableCell (primitive)
│   └── TableEmptyState
└── TableFooter
    └── TablePagination
        ├── Button (primitive)
        └── Select (base component)
```

## Component Specification Template

```markdown
# Component: [ComponentName]

## Overview
- **Level**: Primitive | Base | Composite | Specialized
- **Purpose**: [One sentence description]
- **Design Pattern**: [e.g., Compound Component, Controlled/Uncontrolled]

## Dependencies
### Primitives Used
- Box (layout)
- Text (typography)
- Button (interaction)

### Base Components Used
- Popover (overlay)
- List (data display)

## Component Architecture

### Main Component
```typescript
interface ComponentNameProps {
  // Main component props
}
```

### Sub-Components
```typescript
// List each sub-component with its interface
interface SubComponentProps {
  // Props
}
```

## Composition Structure
```
ComponentName
├── SubComponent1
│   └── Primitive1
├── SubComponent2
│   ├── Primitive2
│   └── Primitive3
└── SubComponent3
```

## State Management
[Describe how state flows through the component tree]

## Styling Strategy
[Explain CSS module structure and design token usage]

## Accessibility
- ARIA attributes required
- Keyboard navigation pattern
- Screen reader behavior

## Examples
### Basic Usage
```tsx
// Simplest usage example
```

### Advanced Usage
```tsx
// Composed usage with sub-components
```
```

## Anti-Patterns to Avoid

### 1. Creating Unnecessary Primitives
```typescript
// Bad: Too specific to be a primitive
function ProjectCardHeader() { }

// Good: Use generic primitives
<Flex className={styles.projectCardHeader}>
  <Text variant="heading" />
</Flex>
```

### 2. Props Explosion
```typescript
// Bad: 50+ props on one component
interface SuperComplexProps {
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
  headerColor?: string;
  headerSize?: string;
  // ... 45 more props
}

// Good: Use composition
<Card>
  <CardHeader title="..." subtitle="..." />
  <CardBody />
</Card>
```

### 3. Over-Specialization
```typescript
// Bad: Too specific
function AIResponseStreamingChatBubbleWithMarkdown() { }

// Good: Composed from generic parts
<ChatBubble>
  <StreamingText markdown />
</ChatBubble>
```

## Deliverables for Each Component

1. **TypeScript Interfaces** - Complete type definitions for component and sub-components
2. **Composition Diagram** - Visual or text representation of component structure  
3. **HTML Mockup** - Semantic HTML structure showing component output
4. **CSS Module Structure** - Organization of styles across sub-components
5. **Usage Examples** - Both simple and composed usage patterns
6. **Accessibility Spec** - ARIA, keyboard, and screen reader requirements
7. **Performance Considerations** - When to memoize, virtualize, or lazy load

## Priority Order for Implementation

1. **Primitives First** (Week 1-2)
   - Box, Flex, Grid, Stack
   - Text, Heading
   - Button, IconButton
   - TextField, TextAreaField
   - Icon, Badge, Chip

2. **Base Components** (Week 3-4)
   - FormField, FormLabel
   - Modal, Popover, Tooltip
   - Table, List
   - Card

3. **Composite Components** (Week 5-6)
   - Select, DatePicker
   - DataTable, VirtualList
   - Alert, Toast
   - Tabs, Breadcrumb

4. **Specialized Components** (Week 7-8)
   - Only after primitives are complete
   - Composed entirely from existing components
   - No new primitives introduced

Remember: **Excellent primitives > Many specialized components**