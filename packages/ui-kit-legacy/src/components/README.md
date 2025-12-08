# UI Kit Components

This directory contains React components that integrate with the UI Kit design system.

## Components

### ThemeProvider

A React context provider that manages theme state and preferences for your application.

```tsx
import { ThemeProvider, useTheme } from '@claude-flow/ui-kit';

// Wrap your app
function App() {
  return (
    <ThemeProvider>
      <YourApp />
    </ThemeProvider>
  );
}

// Use in components
function MyComponent() {
  const { theme, mode, toggleMode } = useTheme();
  
  return (
    <button onClick={toggleMode}>
      Current theme: {theme} ({mode})
    </button>
  );
}
```

**Features:**
- Dynamic theme switching
- Automatic persistence to localStorage
- System preference detection
- TypeScript support
- Cross-tab synchronization

See the [ThemeProvider documentation](./ThemeProvider.mdx) for detailed usage.

### ThemeAwareColorSwatch

A color swatch component that automatically adapts to the current theme.

```tsx
import { ThemeAwareColorSwatch } from '@claude-flow/ui-kit';

<ThemeAwareColorSwatch 
  color="primary" 
  size="large" 
  showLabel 
/>
```

### ThemePreview

A component for previewing how themes look in different contexts.

```tsx
import { ThemePreview } from '@claude-flow/ui-kit';

<ThemePreview 
  theme="vibrant" 
  mode="dark" 
/>
```

## Component Guidelines

### Design Token Usage

All components in this directory must:

1. **Use CSS variables** for all styling values
   ```tsx
   // ✅ Good
   style={{ padding: 'var(--spacing-4)' }}
   
   // ❌ Bad
   style={{ padding: '16px' }}
   ```

2. **Support both light and dark modes**
   ```tsx
   // Use semantic color tokens that adapt
   backgroundColor: 'var(--color-surface)'
   color: 'var(--color-text)'
   ```

3. **Follow spacing conventions**
   ```tsx
   // Use spacing tokens consistently
   gap: 'var(--spacing-3)'
   margin: 'var(--spacing-6)'
   ```

### TypeScript

All components must be fully typed:

```tsx
export interface ComponentProps {
  /** Required prop */
  name: string;
  /** Optional prop with default */
  size?: 'small' | 'medium' | 'large';
  /** Event handler */
  onChange?: (value: string) => void;
}

export function Component({ 
  name, 
  size = 'medium',
  onChange,
}: ComponentProps) {
  // Implementation
}
```

### Testing

Every component must have:

1. **Unit tests** using Vitest and React Testing Library
2. **Storybook stories** showcasing all variants
3. **Accessibility tests** ensuring WCAG compliance

### Performance

Components should:

1. **Use React.memo** when appropriate
2. **Memoize callbacks** with useCallback
3. **Memoize expensive computations** with useMemo
4. **Lazy load** heavy dependencies

## Adding New Components

1. Create component file: `ComponentName.tsx`
2. Create test file: `ComponentName.test.tsx`
3. Create stories file: `ComponentName.stories.tsx`
4. Create styles if needed: `ComponentName.module.css`
5. Export from `index.ts`
6. Document in this README

## Component Checklist

Before submitting a new component:

- [ ] Uses design tokens for all values
- [ ] Works in light and dark modes
- [ ] Fully typed with TypeScript
- [ ] Has comprehensive tests
- [ ] Has Storybook stories
- [ ] Follows accessibility best practices
- [ ] Documented with JSDoc comments
- [ ] Exported from index.ts