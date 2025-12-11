# UI Kit React Component Guide

This guide defines the standards and best practices for creating components in `@claude-flow/ui-kit-react`. Following these guidelines ensures consistency, accessibility, and quality across all components.

## Table of Contents

1. [Component Structure](#component-structure)
2. [Required Files](#required-files)
3. [Naming Conventions](#naming-conventions)
4. [Sizing Standards](#sizing-standards)
5. [Token Usage](#token-usage)
6. [Accessibility Requirements](#accessibility-requirements)
7. [Animation Guidelines](#animation-guidelines)
8. [Story Documentation](#story-documentation)
9. [Testing Requirements](#testing-requirements)
10. [Checklist](#checklist)

---

## Component Structure

Every component should be organized in its own directory:

```
src/components/ComponentName/
├── ComponentName.tsx           # Main component
├── ComponentName.module.css    # Styles
├── ComponentName.stories.tsx   # Storybook documentation
├── ComponentName.test.tsx      # Unit tests
└── index.ts                    # Public exports
```

---

## Required Files

### 1. Component File (`ComponentName.tsx`)

```tsx
import { type ReactNode, type HTMLAttributes } from 'react';
import styles from './ComponentName.module.css';

/**
 * ComponentName - Brief description of what it does
 *
 * Surfaces used:
 * - control (default state)
 * - controlPrimary (primary variant)
 *
 * Tokens used:
 * - --control-bg, --control-bg-hover, --control-bg-pressed
 * - --control-text
 * - --space-2, --space-4 (padding)
 * - --radius-md
 * - --focus-ring, --focus-ring-width, --focus-ring-offset
 * - --duration-fast, --ease-default
 */

export type ComponentNameSize = 'sm' | 'md' | 'lg';
export type ComponentNameVariant = 'default' | 'primary' | 'danger';

export interface ComponentNameProps extends HTMLAttributes<HTMLDivElement> {
  /** Brief description of prop */
  variant?: ComponentNameVariant;
  /** Brief description of prop */
  size?: ComponentNameSize;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Component content */
  children?: ReactNode;
}

export function ComponentName({
  variant = 'default',
  size = 'md',
  disabled = false,
  className,
  children,
  ...props
}: ComponentNameProps) {
  const classNames = [
    styles.root,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} {...props}>
      {children}
    </div>
  );
}
```

**Key Points:**
- Document surfaces and tokens used in the JSDoc comment
- Export types alongside the component
- Use consistent prop patterns (variant, size, disabled)
- Spread remaining props for extensibility
- Support className composition

### 2. Styles File (`ComponentName.module.css`)

```css
/**
 * ComponentName styles
 *
 * Surfaces: control, controlPrimary, controlDanger
 * See TOKEN_GUIDE.md for token reference
 */

.root {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-weight: var(--weight-medium);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-default);
  white-space: nowrap;
}

/* ==============================================
   Focus States
   ============================================== */

.root:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
}

/* ==============================================
   Size Variants - MUST match control height standards
   ============================================== */

.sm {
  height: 28px;                    /* --size-control-sm */
  padding: var(--space-1) var(--space-3);
  font-size: var(--text-sm);
}

.md {
  height: 36px;                    /* --size-control-md */
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-base);
}

.lg {
  height: 44px;                    /* --size-control-lg */
  padding: var(--space-3) var(--space-6);
  font-size: var(--text-lg);
}

/* ==============================================
   Variants
   ============================================== */

.default {
  background: var(--control-bg);
  color: var(--control-text);
  border: 1px solid var(--control-border);
}

.default:hover:not(:disabled) {
  background: var(--control-bg-hover);
}

.default:active:not(:disabled) {
  background: var(--control-bg-pressed);
}

.primary {
  background: var(--controlPrimary-bg);
  color: var(--controlPrimary-text);
  border: 1px solid var(--controlPrimary-border);
}

.primary:hover:not(:disabled) {
  background: var(--controlPrimary-bg-hover);
}

.primary:active:not(:disabled) {
  background: var(--controlPrimary-bg-pressed);
}

/* ==============================================
   Disabled State
   ============================================== */

.disabled {
  background: var(--controlDisabled-bg);
  color: var(--controlDisabled-text);
  border-color: var(--controlDisabled-border);
  cursor: not-allowed;
  pointer-events: none;
}

/* ==============================================
   Reduced Motion
   ============================================== */

@media (prefers-reduced-motion: reduce) {
  .root {
    transition: none;
  }
}
```

### 3. Index File (`index.ts`)

```ts
export { ComponentName } from './ComponentName';
export type {
  ComponentNameProps,
  ComponentNameSize,
  ComponentNameVariant,
} from './ComponentName';
```

---

## Naming Conventions

### Component Names
- Use PascalCase: `Button`, `SegmentedControl`, `TreeView`
- Be descriptive but concise
- Compound components use the parent name: `Tabs`, `TabList`, `TabPanel`

### File Names
- Match the component name: `Button.tsx`, `Button.module.css`
- Stories: `Button.stories.tsx`
- Tests: `Button.test.tsx`

### CSS Class Names
- Use camelCase: `.root`, `.primary`, `.isActive`
- Use semantic names, not visual: `.danger` not `.red`
- State modifiers: `.disabled`, `.active`, `.loading`

### Props
- Use consistent naming across components:
  - `variant` - visual style variation
  - `size` - sm | md | lg
  - `disabled` - boolean
  - `fullWidth` - boolean
  - `icon` - leading icon
  - `iconAfter` - trailing icon

---

## Sizing Standards

**CRITICAL:** All interactive controls MUST use consistent heights so they align when placed side-by-side.

### Standard Control Heights

| Size | Height | Use Case |
|------|--------|----------|
| `sm` | 28px | Compact UI, toolbars, table cells |
| `md` | 36px | Default for most controls |
| `lg` | 44px | Hero sections, touch targets |

### Components That Must Match

These components should all align when placed in a row:

- Button
- Input
- Select
- SegmentedControl
- Checkbox (with label)
- Radio (with label)
- Switch
- IconButton

### Example Alignment Test

```tsx
// These should all be the same height and align perfectly
<Stack direction="row" gap="sm" align="center">
  <Input size="md" placeholder="Search..." />
  <SegmentedControl size="md" options={viewOptions} />
  <Button size="md">Submit</Button>
  <IconButton size="md" icon={<SettingsIcon />} />
</Stack>
```

---

## Token Usage

Always use design tokens. Never hardcode values.

### Reference the Token Guide

See `@claude-flow/ui-kit-core/TOKEN_GUIDE.md` for complete token reference.

### Common Token Patterns

```css
/* Background colors */
background: var(--control-bg);
background: var(--inset-bg);
background: var(--card-bg);

/* Text colors */
color: var(--control-text);
color: var(--page-text-soft);   /* Secondary text */

/* Spacing */
padding: var(--space-2) var(--space-4);
gap: var(--space-2);
margin-bottom: var(--space-4);

/* Border radius */
border-radius: var(--radius-md);

/* Transitions */
transition: all var(--duration-fast) var(--ease-default);

/* Focus */
outline: var(--focus-ring-width) solid var(--focus-ring);
outline-offset: var(--focus-ring-offset);
```

### Forbidden Patterns

```css
/* NEVER do this */
background: #3b82f6;           /* Use --controlPrimary-bg */
color: white;                   /* Use --controlPrimary-text */
padding: 8px 16px;             /* Use var(--space-2) var(--space-4) */
border-radius: 4px;            /* Use var(--radius-md) */
transition: all 150ms ease;    /* Use var(--duration-fast) var(--ease-default) */
```

---

## Accessibility Requirements

### Keyboard Navigation

All interactive components MUST be keyboard accessible:

```tsx
// Support keyboard activation
<button
  type="button"
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleActivation();
    }
  }}
>
```

### ARIA Attributes

Use appropriate ARIA roles and attributes:

```tsx
// Radio group pattern (SegmentedControl, Tabs)
<div role="radiogroup" aria-label="View options">
  <button role="radio" aria-checked={isSelected}>Option</button>
</div>

// Tab pattern
<div role="tablist">
  <button role="tab" aria-selected={isActive} aria-controls="panel-id">
    Tab
  </button>
</div>
<div role="tabpanel" id="panel-id">Content</div>
```

### Focus Visibility

Always show visible focus indicators:

```css
.control:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
}

/* NEVER hide focus completely */
/* .control:focus { outline: none; } ← BAD */
```

### Screen Reader Support

- Provide `aria-label` for icon-only controls
- Use semantic HTML elements where possible
- Include `title` or tooltip for abbreviated content

### RTL Support

Components MUST work correctly in right-to-left layouts. RTL support is not optional.

#### Use CSS Logical Properties

**ALWAYS use logical properties** instead of physical directional properties:

| Physical (AVOID) | Logical (USE) |
|------------------|---------------|
| `margin-left` | `margin-inline-start` |
| `margin-right` | `margin-inline-end` |
| `padding-left` | `padding-inline-start` |
| `padding-right` | `padding-inline-end` |
| `left: 0` | `inset-inline-start: 0` |
| `right: 0` | `inset-inline-end: 0` |
| `text-align: left` | `text-align: start` |
| `text-align: right` | `text-align: end` |
| `border-left` | `border-inline-start` |
| `border-right` | `border-inline-end` |

**Note on positioning:** For absolute/fixed positioned elements, use `inset-inline-start` and `inset-inline-end` instead of `left` and `right`. This is critical for dropdown menus, tooltips, and popovers to align correctly in RTL.

```css
/* ❌ WRONG - Physical properties break in RTL */
.item {
  text-align: left;
  padding-left: var(--space-4);
  margin-right: var(--space-2);
}

/* ✅ CORRECT - Logical properties adapt to direction */
.item {
  text-align: start;
  padding-inline-start: var(--space-4);
  margin-inline-end: var(--space-2);
}
```

#### Flexbox and RTL

Flexbox `row` direction automatically reverses in RTL contexts, which is usually the desired behavior. However, be aware of edge cases:

```css
/* Flexbox gap and alignment work correctly in RTL */
.row {
  display: flex;
  flex-direction: row;  /* Items will flow right-to-left in RTL */
  gap: var(--space-2);
}
```

#### When to Use `dir` Prop

Components that have directional behavior (like submenus, arrow indicators) should accept a `dir` prop:

```tsx
interface Props {
  /** Direction for text and layout. Affects submenu expansion direction. */
  dir?: 'ltr' | 'rtl';
}

// Use dir to determine directional behavior
const expandKey = dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
const submenuIndicator = dir === 'rtl' ? '◀' : '▶';
```

#### RTL Testing Checklist

- [ ] Text is aligned to the start (right in RTL)
- [ ] Icons/indicators flip direction appropriately
- [ ] Submenus/popovers open in the correct direction
- [ ] Keyboard navigation (left/right arrows) respects direction
- [ ] Spacing is mirrored correctly

#### Story for RTL

Include an RTL story for components with directional behavior:

```tsx
export const RTLSupport: Story = {
  render: () => (
    <div dir="rtl" style={{ textAlign: 'right' }}>
      <Component dir="rtl" {...props} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'RTL mode: text aligns right, submenus expand left.',
      },
    },
  },
};
```

---

## Animation Guidelines

### Initial Render

Skip animations on initial render to prevent jarring effects:

```tsx
const [isInitialRender, setIsInitialRender] = useState(true);

useLayoutEffect(() => {
  // Position indicator immediately
  updateIndicator();

  // Mark initial render complete after first paint
  if (isInitialRender) {
    requestAnimationFrame(() => {
      setIsInitialRender(false);
    });
  }
}, [activeValue]);

// Apply transition only after initial render
const style = {
  transition: isInitialRender ? 'none' : undefined,
};
```

### Duration Standards

| Animation Type | Duration Token | Value |
|---------------|----------------|-------|
| Micro-interactions (hover, focus) | `--duration-fast` | 100ms |
| State changes (expand, slide) | `--duration-normal` | 200ms |
| Page transitions | `--duration-slow` | 300ms |

### Easing

Use `--ease-default` for most animations. It provides smooth deceleration.

### Respect Reduced Motion

Always include reduced motion media query:

```css
.animated {
  transition: transform var(--duration-normal) var(--ease-default);
}

@media (prefers-reduced-motion: reduce) {
  .animated {
    transition: none;
  }
}
```

### Animated Indicators

For sliding indicators (Tabs, SegmentedControl):

```css
.indicator {
  position: absolute;
  /* Use transform for smooth animation (GPU accelerated) */
  transition:
    transform var(--duration-normal) cubic-bezier(0.4, 0, 0.2, 1),
    width var(--duration-normal) cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, width;
}
```

---

## Story Documentation

Every component needs comprehensive Storybook documentation with consistent structure across all stories.

### Story File Structure

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { useState } from 'react';
import { ComponentName } from './ComponentName';

const meta = {
  title: 'Category/ComponentName',  // e.g., 'Actions/Button', 'Navigation/Tabs'
  component: ComponentName,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',  // 'centered' | 'padded' | 'fullscreen'
    docs: {
      description: {
        component: `
Brief description of the component and its purpose.

## When to Use

- Use case 1
- Use case 2
- Use case 3

## Variants

| Variant | Use Case |
|---------|----------|
| \`default\` | Secondary actions, most common usage |
| \`primary\` | Main call-to-action, one per section |
| \`danger\` | Destructive actions |

## Sizes

Heights match other controls for consistent alignment:

- **sm** (28px): Compact UI, toolbars, inline actions
- **md** (36px): Default size for most use cases
- **lg** (44px): Hero sections, prominent CTAs

## Accessibility

- Supports keyboard navigation (Enter/Space to activate)
- Uses \`role="button"\` for semantic meaning
- Focus visible with standard focus ring

## Usage

\\\`\\\`\\\`tsx
import { ComponentName } from '@claude-flow/ui-kit-react';

<ComponentName variant="primary" size="md">
  Click me
</ComponentName>
\\\`\\\`\\\`
        `,
      },
    },
  },
  // Use fn() for callback props to enable action logging
  args: {
    onChange: fn(),
    onClick: fn(),
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'primary', 'danger'],
      description: 'Visual style variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size variant matching control heights',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the component is disabled',
    },
    // Hide internal callbacks from controls
    onInternalCallback: {
      table: { disable: true },
    },
  },
} satisfies Meta<typeof ComponentName>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story with controls
export const Default: Story = {
  args: {
    children: 'Component',
    variant: 'default',
    size: 'md',
  },
};

// Individual variants
export const Primary: Story = {
  args: {
    children: 'Primary',
    variant: 'primary',
  },
};

// Size comparison
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <ComponentName size="sm">Small</ComponentName>
      <ComponentName size="md">Medium</ComponentName>
      <ComponentName size="lg">Large</ComponentName>
    </div>
  ),
};

// All variants comparison
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <ComponentName variant="default">Default</ComponentName>
      <ComponentName variant="primary">Primary</ComponentName>
      <ComponentName variant="danger">Danger</ComponentName>
    </div>
  ),
};

// Disabled states
export const Disabled: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <ComponentName disabled variant="default">Disabled Default</ComponentName>
      <ComponentName disabled variant="primary">Disabled Primary</ComponentName>
    </div>
  ),
};

// Controlled example (if applicable)
const ControlledExample = () => {
  const [value, setValue] = useState('option1');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <ComponentName value={value} onChange={setValue} options={...} />
      <p>Selected: <strong>{value}</strong></p>
    </div>
  );
};

export const Controlled: Story = {
  render: () => <ControlledExample />,
};

// Alignment test (for controls)
export const AlignmentTest: Story = {
  name: 'Alignment with Other Controls',
  render: () => (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <Input size="md" placeholder="Input" style={{ width: 150 }} />
      <ComponentName size="md">Component</ComponentName>
      <Button size="md">Button</Button>
    </div>
  ),
};
```

### Individual Story Descriptions

Add descriptions to individual stories to explain specific behaviors or use cases:

```tsx
export const IconOnly: Story = {
  args: {
    options: iconOptions,
    defaultValue: 'align-left',
    iconOnly: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Icon-only mode for compact toolbars. Labels are visually hidden but still accessible to screen readers.',
      },
    },
  },
};
```

### Decorators for Story Context

Use decorators when stories need specific container sizing or context:

```tsx
export const FullWidth: Story = {
  args: {
    options: basicOptions,
    fullWidth: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '400px' }}>
        <Story />
      </div>
    ),
  ],
};

// For fullscreen layouts
const meta = {
  // ...
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh', padding: '16px', boxSizing: 'border-box' }}>
        <Story />
      </div>
    ),
  ],
};
```

### Layout Parameters

Use the `layout` parameter to control story canvas behavior:

| Value | Use Case |
|-------|----------|
| `centered` | Default, centers component (good for buttons, controls) |
| `padded` | Adds padding around component (good for cards, panels) |
| `fullscreen` | No padding, fills canvas (good for page layouts, editors) |

### Story Categories

Organize stories into these categories:

| Category | Components |
|----------|------------|
| Actions | Button, IconButton, LinkButton |
| Inputs | Input, Textarea, Checkbox, Radio, Switch, Select, Slider |
| Navigation | Tabs, Breadcrumb, Pagination, Menu, SegmentedControl |
| Layout | Stack, Grid, Divider, Panel, Card, SplitPane |
| Overlays | Modal, Dialog, Drawer, Tooltip, Popover, Dropdown |
| Feedback | Alert, Toast, Banner, Progress, Spinner, Skeleton |
| Data Display | Avatar, Chip, Table, List, TreeView, Accordion |
| Typography | Text, Heading, Code, Link |
| Animation | Transition, Fade, Slide, Collapse |

---

## Testing Requirements

### Unit Tests (`ComponentName.test.tsx`)

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  // Rendering tests
  it('renders correctly', () => {
    render(<ComponentName>Content</ComponentName>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('applies variant classes', () => {
    render(<ComponentName variant="primary">Primary</ComponentName>);
    expect(screen.getByText('Primary')).toHaveClass('primary');
  });

  it('applies size classes', () => {
    render(<ComponentName size="lg">Large</ComponentName>);
    expect(screen.getByText('Large')).toHaveClass('lg');
  });

  // Disabled state
  it('handles disabled state', () => {
    render(<ComponentName disabled>Disabled</ComponentName>);
    expect(screen.getByText('Disabled')).toHaveClass('disabled');
  });

  // Interaction tests
  it('calls onChange when clicked', () => {
    const handleChange = jest.fn();
    render(<ComponentName onChange={handleChange}>Click me</ComponentName>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleChange).toHaveBeenCalled();
  });

  // Keyboard accessibility
  it('activates on Enter key', () => {
    const handleChange = jest.fn();
    render(<ComponentName onChange={handleChange}>Press Enter</ComponentName>);
    fireEvent.keyDown(screen.getByText('Press Enter'), { key: 'Enter' });
    expect(handleChange).toHaveBeenCalled();
  });

  it('activates on Space key', () => {
    const handleChange = jest.fn();
    render(<ComponentName onChange={handleChange}>Press Space</ComponentName>);
    fireEvent.keyDown(screen.getByText('Press Space'), { key: ' ' });
    expect(handleChange).toHaveBeenCalled();
  });

  // Accessibility tests
  it('has correct ARIA attributes', () => {
    render(<ComponentName aria-label="Test">Content</ComponentName>);
    expect(screen.getByLabelText('Test')).toBeInTheDocument();
  });

  // Controlled vs uncontrolled
  it('works as controlled component', () => {
    const { rerender } = render(<ComponentName value="a">A</ComponentName>);
    expect(screen.getByText('A')).toHaveAttribute('aria-checked', 'true');

    rerender(<ComponentName value="b">A</ComponentName>);
    expect(screen.getByText('A')).toHaveAttribute('aria-checked', 'false');
  });
});
```

---

## Checklist

Before submitting a new component, verify all items:

### Structure
- [ ] Component in its own directory
- [ ] All required files present (tsx, css, stories, test, index)
- [ ] Exported from main `index.ts`
- [ ] Types exported alongside component

### Naming
- [ ] Component name is PascalCase
- [ ] Files match component name
- [ ] Props use standard naming (variant, size, disabled)

### Styling
- [ ] Uses CSS modules
- [ ] All values from design tokens (no hardcoded colors, spacing, etc.)
- [ ] Heights match control size standards (28px/36px/44px)
- [ ] Proper focus ring styles
- [ ] Disabled state styled
- [ ] Reduced motion media query included

### Accessibility
- [ ] Keyboard accessible (Tab, Enter, Space, Arrow keys as appropriate)
- [ ] Proper ARIA roles and attributes
- [ ] Focus visible for all interactive states
- [ ] Works with screen readers

### RTL Support
- [ ] Uses CSS logical properties (not left/right, use start/end)
- [ ] `text-align: start` instead of `text-align: left`
- [ ] `margin-inline-start/end` instead of `margin-left/right`
- [ ] `padding-inline-start/end` instead of `padding-left/right`
- [ ] Directional indicators flip in RTL (arrows, chevrons)
- [ ] Keyboard navigation respects direction (if applicable)

### Animation
- [ ] Skip animation on initial render
- [ ] Uses duration tokens
- [ ] Uses easing tokens
- [ ] Respects prefers-reduced-motion

### Documentation
- [ ] Story file with autodocs tag
- [ ] Component description in meta
- [ ] All variants documented
- [ ] All sizes documented
- [ ] Disabled states shown
- [ ] Controlled example (if applicable)
- [ ] Alignment test with other controls
- [ ] RTL story (for directional components)

### Testing
- [ ] Renders correctly
- [ ] Variants apply correct classes
- [ ] Sizes apply correct classes
- [ ] Disabled state works
- [ ] Interactions fire callbacks
- [ ] Keyboard navigation works
- [ ] ARIA attributes correct

---

## Examples of Well-Implemented Components

Reference these components as examples of proper implementation:

- **Button** - Variants, sizes, icons, disabled states
- **Input** - Inset styling, focus states, error states
- **Tabs** - Animated indicator, keyboard navigation, ARIA
- **Modal** - Overlay, focus trap, escape to close
- **Accordion** - Expand/collapse animation, keyboard nav

---

## Getting Help

- **Token Reference**: See `@claude-flow/ui-kit-core/TOKEN_GUIDE.md`
- **Theme System**: See `@claude-flow/ui-kit-core/src/themes/theme-definition.md`
- **Existing Components**: Browse `src/components/` for patterns
