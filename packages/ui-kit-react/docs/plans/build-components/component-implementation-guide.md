# Component Implementation Guide

This guide outlines the standards and best practices for implementing components in the Claude Flow UI Kit React library.

## CSS Modules & Styling

### File Structure
- Each component has a corresponding CSS module file: `[ComponentName].module.css`
- The root element always uses the class `.root`
- All style values must use design tokens from `@claude-flow/ui-kit`

### CSS Layering
```css
/* Styles for components in the library. */
@layer base {
  .root {
    /* component styles */
  }
}
```

### Specificity Guidelines
- **Avoid `!important`** - use CSS layers to manage cascade instead
- **Keep specificity as low as possible** - prefer single class selectors
- **Use composition over complex selectors** - combine classes rather than nesting
- **Root element gets classname/styles** - Make sure to always pass along the classname and style to the root container.
- **Use `overrides` layer for overrides** - If you need to override the style of a child component, wrap the override in an overrides layer to ensure the rules are more specific.

### Class Naming Conventions
- Root: `.root`
- Variants: `.primary`, `.secondary`, `.warning`, etc.
- States: `.disabled`, `.loading`, `.active`, `.focused`, etc.
- Elements: `.icon`, `.label`, `.content`, `.header`, etc.
- Sizes: `.small`, `.medium`, `.large`

### Example CSS Module
```css
@layer base {
  .root {
    display: inline-flex;
    align-items: center;
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-default);
    font-family: var(--font-family-default);
    transition: all var(--transition-fast);
  }

  .primary {
    background-color: var(--color-primary);
    color: var(--color-on-primary);
  }

  .icon {
    margin-inline-end: var(--spacing-2);
  }
}
```

## Component Structure

### File Organization
```
ComponentName/
├── ComponentName.tsx          # Main component file
├── ComponentName.module.css   # CSS module
├── ComponentName.stories.tsx  # Storybook stories
├── ComponentName.test.tsx     # Tests (if not using .test.tsx)
├── index.ts                   # Public exports
└── README.md                  # Component documentation
```

### Component Template
```tsx
import React from 'react';
import cx from 'clsx';
import styles from './ComponentName.module.css';

export interface ComponentNameProps {
  className?: string;
  children?: React.ReactNode;
  // ... other props
}

export const ComponentName = React.forwardRef<HTMLDivElement, ComponentNameProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div 
        ref={ref}
        className={cx(styles.root, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ComponentName.displayName = 'ComponentName';
```

## Performance Best Practices

### Memoization Strategy
- Use `React.memo` for components that receive complex props or render frequently
- Apply `useMemo` for expensive calculations that depend on specific props
- Use `useCallback` for event handlers passed to memoized child components

### Lazy Loading
- Split heavy dependencies using dynamic imports
- Load non-critical features on demand using React.lazy and async imports. If you do this, make sure the user experience (while waiting) is not to freeze the app, that there is some kind of progress which shows up within a threshold.

### Render Optimization
- Minimize initial render payload
- Defer non-essential UI elements
- Implement progressive enhancement
- Avoid layout shift with proper sizing

## Accessibility Standards

### ARIA Requirements
- All interactive elements must have appropriate ARIA labels
- Use semantic HTML elements when possible
- Implement proper focus management
- Support keyboard navigation

### Keyboard Support
- Tab navigation for all interactive elements
- Enter/Space for activation
- Escape for dismissal (modals, dropdowns)
- Arrow keys for navigation within components

## Testing Requirements

### Unit Tests
- Test all prop variations
- Verify event handler execution
- Check accessibility attributes
- Test error boundaries and edge cases

### Integration Tests
- Test component composition
- Verify theme integration
- Test responsive behavior
- Check performance characteristics

## TypeScript Guidelines

### Prop Interfaces
- Export all component prop interfaces
- Use descriptive names (ComponentNameProps)
- Document complex props with JSDoc comments
- Extend appropriate HTML element props

### Type Safety
- Avoid `any` types
- Use discriminated unions for variants
- Leverage TypeScript's type inference
- Export useful type utilities

## Documentation Standards

### Component README
Each component should have a README.md with:
- Brief description
- Basic usage example
- Props documentation
- Accessibility notes
- Related components

### Storybook Stories
Essential stories for every component:
- Default - minimal props
- Playground - all props exposed
- Variants - each visual variant
- States - loading, error, disabled
- Composition - common use cases

## Bundle Size Considerations

### Optimization Techniques
- Tree-shake unused exports
- Minimize runtime dependencies
- Use CSS over JavaScript for styling
- Lazy load optional features

### Monitoring
- Track component size impact
- Use bundle analyzer tools
- Set size budgets
- Regular optimization reviews