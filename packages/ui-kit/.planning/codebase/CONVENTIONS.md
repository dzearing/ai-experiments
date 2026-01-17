# Coding Conventions

**Analysis Date:** 2026-01-17

## Naming Patterns

**Files:**
- Components: PascalCase (e.g., `Button.tsx`, `ChatInput.tsx`)
- Styles: Component name + `.module.css` (e.g., `Button.module.css`)
- Stories: Component name + `.stories.tsx` (e.g., `Button.stories.tsx`)
- Tests: Component name + `.test.tsx` or `.test.ts` (e.g., `CopyButton.test.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useChatEditor.ts`, `useFocusTrap.ts`)
- Index exports: `index.ts` in each component directory
- Type definitions: `types.ts` for standalone type files

**Functions:**
- camelCase for all functions and hooks
- Components use PascalCase function names
- Handlers prefixed with `handle` (e.g., `handleCopy`, `handleCopy`)
- Callbacks prefixed with `on` in props (e.g., `onClick`, `onSubmit`, `onCopy`)

**Variables:**
- camelCase for all variables
- Boolean variables often prefixed with `is`/`has` (e.g., `isClickable`, `isDurationMode`)
- Constants in UPPER_SNAKE_CASE (e.g., `TICK_INTERVAL`, `FAST_TICK_INTERVAL`)

**Types:**
- PascalCase for all type names
- Interfaces prefixed with component name (e.g., `ButtonProps`, `ChipProps`)
- Export types use `export type` syntax
- Union types for variants (e.g., `ButtonVariant = 'default' | 'primary' | 'danger'`)

## Code Style

**Formatting:**
- Prettier (configured in monorepo root `/.prettierrc.json`)
- Single quotes for strings
- 2-space indentation
- Semicolons required
- 100 character line width
- Trailing commas in ES5 contexts
- LF line endings
- Arrow functions always have parentheses

**Linting:**
- ESLint with shared config from `tools/eslint-config`
- TypeScript strict mode enabled
- `noUnusedLocals` and `noUnusedParameters` enforced
- No fallthrough in switch statements

## Import Organization

**Order:**
1. React and React types
2. External libraries (e.g., `@storybook/react`, `vitest`)
3. Internal workspace packages (e.g., `@ui-kit/core`, `@ui-kit/icons`)
4. Relative imports (components, hooks, utils)
5. CSS modules (always last)

**Examples:**
```typescript
// React imports
import { useState, useCallback, type ButtonHTMLAttributes, type ReactNode } from 'react';

// External libraries
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Workspace packages
import { Button } from '@ui-kit/react';
import { CopyIcon } from '@ui-kit/icons/CopyIcon';

// Relative imports
import { Tooltip } from '../Tooltip';

// CSS modules (always last)
import styles from './CopyButton.module.css';
```

**Type Import Syntax:**
- Use `import type { X }` for type-only imports
- Use `import { type X, Y }` when mixing types with values

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { type ReactNode } from 'react';
import { formatRelativeTime, type RelativeTimeFormat } from './formatRelativeTime';
```

**Path Aliases:**
- Workspace packages use `@ui-kit/*` aliases
- No path aliases within packages (use relative paths)

## Error Handling

**Patterns:**
- Use try/catch for async operations with user-facing errors
- Provide error callbacks in component props (e.g., `onError?: (error: Error) => void`)
- Convert unknown errors to Error instances: `error instanceof Error ? error : new Error('message')`
- Throw with descriptive messages for developer errors

**Example from CopyButton:**
```typescript
try {
  await navigator.clipboard.writeText(textToCopy);
  onCopy?.();
} catch (error) {
  onError?.(error instanceof Error ? error : new Error('Failed to copy'));
}
```

## Logging

**Framework:** None (console-based when needed)

**Patterns:**
- No logging in component code
- Test debugging uses console when necessary

## Comments

**When to Comment:**
- JSDoc blocks for exported functions/components
- Describe component purpose, features, surfaces used, and tokens used
- Example usage in JSDoc `@example` blocks
- Inline comments only for non-obvious logic

**JSDoc/TSDoc:**
- Required for all exported components
- Document props with `/** Prop description */` syntax
- Include surface and token documentation

**Example:**
```typescript
/**
 * CopyButton - A button that copies content to clipboard with visual feedback
 *
 * Features:
 * - Supports both icon-only mode (when no children) and labeled mode
 * - Shows "Copied!" tooltip and checkmark icon briefly after copying
 *
 * Surfaces used:
 * - control (default variant)
 * - controlSubtle (ghost variant)
 *
 * Tokens used:
 * - --duration-normal (feedback animation)
 * - --success-fg (checkmark color)
 */
export interface CopyButtonProps {
  /** Static content to copy */
  content?: string;
  /** Callback to get content dynamically (called when button is clicked) */
  getContent?: () => string | Promise<string>;
}
```

## Function Design

**Size:**
- Functions should be focused and single-purpose
- Components under 200 lines preferred
- Extract complex logic into hooks or helper functions

**Parameters:**
- Use destructuring for props
- Provide sensible defaults
- Group related props in interfaces

**Return Values:**
- React components return JSX
- Hooks return objects with named properties
- Utility functions have explicit return types

**Example:**
```typescript
export function CopyButton({
  content,
  getContent,
  variant = 'ghost',
  size = 'md',
  children,
  'aria-label': ariaLabel = 'Copy to clipboard',
  onCopy,
  onError,
  feedbackDuration = 2000,
  className,
  disabled,
  ...props
}: CopyButtonProps) {
```

## Module Design

**Exports:**
- One primary export per file (component, hook, or utility)
- Related types exported alongside primary export
- Barrel exports via `index.ts` files

**Example index.ts:**
```typescript
export { Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize, ButtonShape } from './Button';
```

**Barrel Files:**
- Each component directory has an `index.ts`
- Package root `index.ts` re-exports all components
- Organize exports by category (Actions, Inputs, Layout, etc.)

## Component Patterns

**Functional Components:**
- Always use function declarations for components
- Add `displayName` for debugging: `Component.displayName = 'Component';`
- Prefer composition over inheritance

**Props Interface:**
- Extend native HTML attributes when appropriate
- Use `Omit<>` to remove conflicting props
- Separate base props from HTML attributes

```typescript
export interface CopyButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'onClick' | 'onError'> {
  content?: string;
  children?: ReactNode;
  onClick?: () => void;
}
```

**CSS Class Construction:**
- Use array filter pattern for conditional classes
- CSS Modules for all styling

```typescript
const classNames = [
  styles.button,
  styles[variant],
  styles[size],
  fullWidth && styles.fullWidth,
  className,
]
  .filter(Boolean)
  .join(' ');
```

**Polymorphic Components:**
- Support `as` prop for element type flexibility
- Handle both button and anchor rendering patterns

---

*Convention analysis: 2026-01-17*
