# UI Kit React Component Development Guidelines

This document outlines the standards and best practices for developing components in the ui-kit-react package.

## Table of Contents
- [Component Structure](#component-structure)
- [Storybook Documentation Standards](#storybook-documentation-standards)
- [CSS & Design Token Requirements](#css--design-token-requirements)
- [Component Composition Principles](#component-composition-principles)
- [Validation Requirements](#validation-requirements)
- [Example Component](#example-component)

## Component Structure

### File Organization

Every component must follow this directory structure:

```
ComponentName/
├── ComponentName.tsx         # Main component file
├── ComponentName.module.css  # CSS module with design tokens only
├── ComponentName.stories.tsx # Storybook documentation
├── ComponentName.test.tsx    # Unit tests (when applicable)
└── index.ts                  # Re-export for clean imports
```

### Component Implementation Rules

1. **Use `React.forwardRef`** for any component that renders a native HTML element
2. **Extend HTML element props** appropriately:
   ```tsx
   interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
     variant?: 'primary' | 'secondary';
   }
   ```
3. **Always use design tokens** - no hardcoded values except `0` and `100%`
4. **Compose using existing components** - don't recreate functionality
5. **Support native HTML attributes** unless there's a specific reason not to

### TypeScript Requirements

- All props must have TypeScript interfaces
- Props should include JSDoc comments for documentation
- Export prop types for consumer usage
- Use discriminated unions for variant props

## Storybook Documentation Standards

### Story Structure

Every component MUST have these stories:

#### 1. "[ComponentName] Usage" (Default Story)

The main documentation page must include:
- Interactive component playground with all props
- **When to use** section with clear guidelines
- **When NOT to use** section with alternatives
- **Code examples** showing common patterns
- **Accessibility considerations**
- **Related components** section

Example structure:
```tsx
export default {
  title: 'Components/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component: `
Button triggers an action or event when activated.

### When to use
- To trigger actions like submit, delete, or cancel
- To navigate to another page (use as="a" prop)
- For calls to action

### When NOT to use
- For navigation within text, use Link component
- For toggling states, use Switch or Checkbox
- For selecting from options, use Radio or Select

### Accessibility
- Supports keyboard navigation (Space/Enter to activate)
- Includes focus indicators
- Supports screen readers with proper ARIA labels
        `,
      },
    },
  },
};

export const ButtonUsage: Story = {
  args: {
    children: 'Click me',
    variant: 'primary',
  },
};
```

#### 2. "Examples" Story

Practical usage scenarios with multiple examples:
- Each example must have a **header** and **description**
- Examples should **compose multiple components**
- Show **real-world patterns**, not isolated demos
- Group related examples together

For complex components, create sub-stories:
```
Examples/
├── Common Patterns
├── Form Integration  
├── Advanced Layouts
└── Edge Cases
```

### Story Implementation Rules

1. **NEVER use native HTML elements when a ui-kit component exists:**
   ```tsx
   // ❌ BAD
   <button style={{ padding: '8px' }}>Click</button>
   
   // ✅ GOOD
   <Button>Click</Button>
   ```

2. **All styling must use design tokens:**
   ```tsx
   // ❌ BAD
   <div style={{ marginBottom: '16px' }}>Content</div>
   
   // ✅ GOOD
   <div style={{ marginBottom: 'var(--spacing-large10)' }}>Content</div>
   
   // ✅ BETTER - use a component
   <Stack gap="large">Content</Stack>
   ```

3. **Examples should uncover missing features** - document them for implementation
4. **Each example should be self-contained** and copyable

## CSS & Design Token Requirements

### Token Categories

All CSS must use design tokens from these categories:

- **Colors**: `var(--color-[semantic]-[property]-[state])`
  ```css
  background: var(--color-buttonPrimary-background);
  color: var(--color-buttonPrimary-text);
  ```

- **Spacing**: `var(--spacing-[size])`
  ```css
  padding: var(--spacing-small10) var(--spacing-large10);
  margin-bottom: var(--spacing-large20);
  ```

- **Typography**: `var(--font-[property]-[size])`
  ```css
  font-size: var(--font-size-normal);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-normal);
  ```

- **Borders**: `var(--border-[property]-[size])` or `var(--radius-[size])`
  ```css
  border: var(--border-width-thin) solid var(--color-input-border);
  border-radius: var(--radius-button);
  ```

- **Shadows**: `var(--shadow-[type])`
  ```css
  box-shadow: var(--shadow-soft10);
  ```

- **Animation**: `var(--duration-[type])` and `var(--easing-[type])`
  ```css
  transition: opacity var(--duration-fast) var(--easing-default);
  ```

### CSS Module Rules

1. **No hardcoded values** except `0`, `100%`, and `50%` (for centering)
2. **Support theme switching** - all colors must use tokens
3. **Support RTL** with `[dir="rtl"]` selectors where needed:
   ```css
   .icon {
     margin-right: var(--spacing-small10);
   }
   
   [dir="rtl"] .icon {
     margin-right: 0;
     margin-left: var(--spacing-small10);
   }
   ```

4. **Support reduced motion**:
   ```css
   @media (prefers-reduced-motion: reduce) {
     .animated {
       animation: none;
       transition: none;
     }
   }
   ```

5. **Support high contrast**:
   ```css
   @media (prefers-contrast: high) {
     .button {
       border-width: 2px;
     }
   }
   ```

## Component Composition Principles

### Building Blocks Philosophy

Components should be like LEGO blocks - easy to snap together:

1. **Use existing components** - don't recreate functionality:
   ```tsx
   // ❌ BAD - Button recreates spinner
   const Button = ({ loading }) => (
     <button>
       {loading && <div className="spinner" />}
     </button>
   );
   
   // ✅ GOOD - Button uses Spinner component
   import { Spinner } from '../Spinner';
   
   const Button = ({ loading }) => (
     <button>
       {loading && <Spinner size="small" />}
     </button>
   );
   ```

2. **Composition over configuration**:
   ```tsx
   // ❌ BAD - Too many props
   <Card 
     title="Title"
     subtitle="Subtitle"
     footer="Footer"
     icon={icon}
     actions={actions}
   />
   
   // ✅ GOOD - Composable
   <Card>
     <CardHeader>
       <Icon /> Title
     </CardHeader>
     <CardBody>Content</CardBody>
     <CardFooter>
       <Button>Action</Button>
     </CardFooter>
   </Card>
   ```

### Missing Components to Create

When examples reveal missing components, add them to this list:

- **Link** - Styled anchor component with variants
- **Typography** - Heading, Text, Label components  
- **Stack** - Vertical layout with consistent spacing
- **Grid** - Responsive grid layout
- **Spacer** - Flexible spacing component
- **FormField** - Form field wrapper with label and error
- **FormGroup** - Groups related form fields
- **Divider** - Visual separator

## Validation Requirements

### Component Validation Checklist

Before marking a component as complete:

- [ ] All props are typed with TypeScript
- [ ] Props have JSDoc comments
- [ ] Component works with all variants in Storybook
- [ ] Keyboard navigation works correctly
- [ ] Screen reader announces correctly (test with NVDA/JAWS)
- [ ] ARIA attributes are properly set
- [ ] Focus indicators are visible
- [ ] Theme switching works (test all themes)
- [ ] RTL layout works correctly
- [ ] High contrast mode is supported
- [ ] Reduced motion is respected
- [ ] Component exports are in index.ts

### Story Validation Checklist

- [ ] Has "[Component] Usage" default story
- [ ] Has "Examples" story with practical scenarios
- [ ] All examples use ui-kit-react components (no native elements)
- [ ] All styling uses design tokens (no hardcoded values)
- [ ] Examples are self-contained and copyable
- [ ] Each example has clear description
- [ ] Interactive examples actually work

## Example Component

Here's an example of a well-implemented component following all guidelines:

### Link Component Structure

```
Link/
├── Link.tsx
├── Link.module.css
├── Link.stories.tsx
└── index.ts
```

### Link.tsx
```tsx
import React from 'react';
import styles from './Link.module.css';

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Visual style variant */
  variant?: 'primary' | 'subtle' | 'inline';
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Shows external link icon */
  external?: boolean;
}

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ 
    variant = 'primary',
    size = 'medium',
    external = false,
    className,
    children,
    ...props 
  }, ref) => {
    const classes = [
      styles.link,
      styles[variant],
      styles[size],
      external && styles.external,
      className,
    ].filter(Boolean).join(' ');

    return (
      <a
        ref={ref}
        className={classes}
        {...props}
      >
        {children}
        {external && (
          <span className={styles.externalIcon} aria-label="Opens in new window">
            ↗
          </span>
        )}
      </a>
    );
  }
);

Link.displayName = 'Link';
```

### Link.module.css
```css
.link {
  text-decoration: none;
  cursor: pointer;
  transition: color var(--duration-fast) var(--easing-default);
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-small20);
}

/* Variants */
.primary {
  color: var(--color-link);
}

.primary:hover {
  color: var(--color-link-hover);
  text-decoration: underline;
}

.subtle {
  color: var(--color-text-secondary);
}

.subtle:hover {
  color: var(--color-text);
}

.inline {
  color: inherit;
  text-decoration: underline;
}

/* Sizes */
.small {
  font-size: var(--font-size-small10);
}

.medium {
  font-size: var(--font-size-normal);
}

.large {
  font-size: var(--font-size-large10);
}

/* External icon */
.externalIcon {
  font-size: 0.75em;
  opacity: 0.7;
}

/* Focus */
.link:focus-visible {
  outline: var(--focusRing-width) solid var(--focusRing-color);
  outline-offset: var(--focusRing-offset);
  border-radius: var(--radius-small20);
}

/* RTL Support */
[dir="rtl"] .externalIcon {
  transform: scaleX(-1);
}

/* High contrast */
@media (prefers-contrast: high) {
  .link {
    text-decoration: underline;
  }
}
```

This example demonstrates all the principles: proper TypeScript, design token usage, accessibility support, and clean composition.