# UI-Kit Scheme-Only Token System

## Executive Summary

This document proposes eliminating surface-prefixed tokens in favor of a pure scheme-based system with generic token names. Instead of defining 300+ tokens (concepts × states × surfaces), we define ~45-60 tokens (concepts × states) once, and schemes redefine their values. Every visual context becomes a scheme that redefines token values, solving the inheritance problem where child components need to manually adapt to parent surface changes.

## The Problem: Surface-Prefixed Tokens Don't Inherit

### Current System (Before)

Today, we have surface-prefixed tokens that create isolation between contexts:

```css
/* Current: Every surface has its own set of tokens */
--color-body-text: #404040;
--color-body-icon: #737373;
--color-body-background: #f5f7f9;

--color-primary-text: #ffffff;
--color-primary-icon: #ffffff;
--color-primary-background: #1976d2;

--color-danger-text: #ffffff;
--color-danger-icon: #ffffff;
--color-danger-background: #dc2626;
```

#### The Broken Experience

```jsx
// PROBLEM: Icon doesn't know parent changed context
<ListItem selected={true}>
  <Icon name="folder" /> {/* ❌ Still uses --color-body-icon (gray) */}
  <span>My Folder</span> {/* ✅ Manually changed to --color-primary-text */}
</ListItem>
```

When the list item becomes selected:
- ListItem manually switches to use `--color-primary-background` and `--color-primary-text`
- **BUT:** The Icon component has no idea - it still uses `--color-body-icon`
- Result: Gray icon on blue background (invisible!)

#### Current Workarounds Are Painful

```jsx
// Workaround 1: Prop drilling
<Icon name="folder" surface="primary" />

// Workaround 2: CSS overrides for every combination
.list-item.selected .icon { color: var(--color-primary-icon); }
.button-primary .icon { color: var(--color-primary-icon); }
.card-danger .icon { color: var(--color-danger-icon); }
// ... hundreds more overrides

// Workaround 3: Context providers
<SurfaceContext.Provider value="primary">
  <Icon /> {/* Component reads context */}
</SurfaceContext.Provider>
```

## The Solution: Generic Tokens + Schemes

### Clear Separation of Concerns

The new system separates visual context (schemes) from component structure (CSS modules):

1. **Schemes** - Define what token values mean in different contexts
   - Live in ui-kit as global CSS classes (not CSS modules)
   - Exported as TypeScript constants for type safety
   - Only redefine CSS custom property values
   - Examples: `scheme-primary`, `scheme-elevated`, `scheme-dark`

2. **Component Styles** - Define component structure using generic tokens
   - Live in CSS modules (e.g., `button.module.css`)
   - Never define color values directly
   - Only reference generic tokens like `--color-text`

3. **Components** - Apply schemes based on semantic meaning
   - Import schemes from `@claude-flow/ui-kit`
   - Get TypeScript intellisense for available schemes
   - Button with `variant="primary"` applies `schemes.primary`
   - Card applies `schemes.elevated` for raised surface

### TypeScript Integration

**@claude-flow/ui-kit/schemes.ts**
```typescript
// Scheme definitions with type safety
export const schemes = {
  // Contextual schemes
  primary: 'scheme-primary',
  danger: 'scheme-danger',
  success: 'scheme-success',
  warning: 'scheme-warning',
  info: 'scheme-info',
  
  // Surface elevation schemes
  elevated: 'scheme-elevated',
  modal: 'scheme-modal',
  popover: 'scheme-popover',
  
  // Soft background schemes
  dangerSoft: 'scheme-danger-soft',
  successSoft: 'scheme-success-soft',
  warningSoft: 'scheme-warning-soft',
  infoSoft: 'scheme-info-soft',
  
  // Theme schemes
  dark: 'scheme-dark',
  light: 'scheme-light',
} as const;

export type Scheme = typeof schemes[keyof typeof schemes];

// Helper to combine schemes with other classes
export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Type-safe scheme variants for components
export type ButtonVariant = 'default' | 'primary' | 'danger' | 'success';
export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

// Map component variants to schemes
export const buttonSchemes: Record<ButtonVariant, string | undefined> = {
  default: undefined, // Uses inherited tokens
  primary: schemes.primary,
  danger: schemes.danger,
  success: schemes.success,
};

export const alertSchemes: Record<AlertVariant, string> = {
  info: schemes.infoSoft,
  success: schemes.successSoft,
  warning: schemes.warningSoft,
  danger: schemes.dangerSoft,
};
```

**@claude-flow/ui-kit/schemes.css**
```css
/* Global scheme classes - not CSS modules */

/* Primary context */
.scheme-primary {
  --color-text: #ffffff;
  --color-icon: #ffffff;
  --color-background: #1976d2;
  --color-border: #1565c0;
  
  --color-text-hover: #ffffff;
  --color-icon-hover: #e3f2fd;
  --color-background-hover: #1565c0;
}

/* Elevated surface */
.scheme-elevated {
  --color-background: #ffffff;
  --color-background-hover: #f5f5f5;
  /* Inherits other tokens from :root */
}

/* Danger soft background */
.scheme-danger-soft {
  --color-text: #991b1b;
  --color-icon: #dc2626;
  --color-background: #fef2f2;
  --color-border: #fecaca;
}

/* ... other schemes ... */
```

### New System (After)

Replace surface-prefixed tokens with generic names that schemes redefine:

```css
/* Base scheme on :root - defines ALL tokens with states */
:root {
  /* Base color tokens (~7-10 concepts) */
  --color-text: #404040;
  --color-text-soft: #666666;
  --color-text-muted: #999999;
  --color-icon: #737373;
  --color-background: #f5f7f9;
  --color-border: #d9d9d9;
  --color-link: #1976d2;
  
  /* State variants (×3-4 per concept = ~30-40 more) */
  --color-text-hover: #404040;
  --color-text-active: #404040;
  --color-text-disabled: #999999;
  
  --color-icon-hover: #5a5a5a;
  --color-icon-active: #404040;
  --color-icon-disabled: #b3b3b3;
  
  --color-background-hover: #ebeef1;
  --color-background-active: #e1e4e7;
  --color-background-disabled: #f5f7f9;
  
  --color-border-hover: #c0c0c0;
  --color-border-active: #a0a0a0;
  --color-border-disabled: #e5e5e5;
  
  /* Total: ~45-60 tokens vs 300+ with surface prefixes */
}
```

#### The Magic: Schemes Redefine Context

```css
/* When something needs different colors, it becomes a scheme */
.scheme-primary {
  --color-text: #ffffff;
  --color-icon: #ffffff;
  --color-background: #1976d2;
  --color-border: #1565c0;
  /* Inherits everything else from :root */
}

.scheme-danger {
  --color-text: #ffffff;
  --color-icon: #ffffff;
  --color-background: #dc2626;
  /* Inherits everything else from :root */
}
```

#### Components Use Generic Tokens

```jsx
// Icon component - dead simple
function Icon({ name }) {
  return <svg style={{ color: 'var(--color-icon)' }}>...</svg>;
}

// SOLVED: Icon automatically inherits correct color
<ListItem selected={true} className="scheme-primary">
  <Icon name="folder" /> {/* ✅ Automatically white via --color-icon */}
  <span>My Folder</span> {/* ✅ Automatically white via --color-text */}
</ListItem>
```

## Before/After Comparison

### Before: Surface-Prefixed Tokens

```css
/* Token definitions - massive duplication */
:root {
  /* Body surface (default) */
  --color-body-text: #404040;
  --color-body-text-soft: #666666;
  --color-body-icon: #737373;
  --color-body-background: #f5f7f9;
  --color-body-border: #d9d9d9;
  
  /* Primary surface */
  --color-primary-text: #ffffff;
  --color-primary-text-soft: #e3f2fd;
  --color-primary-icon: #ffffff;
  --color-primary-background: #1976d2;
  --color-primary-border: #1565c0;
  
  /* Danger surface */
  --color-danger-text: #ffffff;
  --color-danger-text-soft: #ffe4e6;
  --color-danger-icon: #ffffff;
  --color-danger-background: #dc2626;
  --color-danger-border: #b91c1c;
  
  /* Panel surface (same as body but duplicated) */
  --color-panel-text: #404040;
  --color-panel-text-soft: #666666;
  --color-panel-icon: #737373;
  --color-panel-background: #ffffff;
  --color-panel-border: #d9d9d9;
  
  /* ... and 10+ more surfaces */
}

/* Component must know its surface */
.button-primary {
  background: var(--color-primary-background);
  color: var(--color-primary-text);
}

.button-primary .icon {
  color: var(--color-primary-icon); /* Manual override */
}
```

**Token Count:** ~300+ tokens (7 concepts × 4 states × 10+ surfaces)

### After: Scheme-Only System

```css
/* Token definitions - single source of truth */
:root {
  /* Only define tokens ONCE */
  --color-text: #404040;
  --color-text-soft: #666666;
  --color-icon: #737373;
  --color-background: #f5f7f9;
  --color-border: #d9d9d9;
}

/* Schemes only override what changes */
.scheme-primary {
  --color-text: #ffffff;
  --color-icon: #ffffff;
  --color-background: #1976d2;
}

.scheme-danger {
  --color-text: #ffffff;
  --color-icon: #ffffff;
  --color-background: #dc2626;
}

/* Component uses generic tokens (button.module.css) */
.button {
  background: var(--color-background);
  color: var(--color-text);
  padding: var(--spacing-buttonY) var(--spacing-buttonX);
  border-radius: var(--radius-interactive);
}
/* No manual overrides needed - icon inherits automatically */
```

**Token Count:** ~45-60 tokens (15 base × 3-4 states each)

## How Token Expansion Becomes Simple

### The Power of Scheme Extension

Since every scheme extends the base, adding new tokens is trivial:

```css
/* Want to add a new token? Just add it to :root */
:root {
  --color-text: #404040;
  --color-icon: #737373;
  --color-background: #f5f7f9;
  --color-accent: #9333ea;  /* NEW: Added once */
}

/* Schemes automatically inherit it */
.scheme-primary {
  --color-background: #1976d2;
  /* --color-accent inherited as #9333ea */
}

.scheme-danger {
  --color-background: #dc2626;
  --color-accent: #fbbf24;  /* Or override if needed */
}
```

### Before: Adding a Token Was Painful

```css
/* Before: Had to add to EVERY surface */
--color-body-accent: #9333ea;
--color-primary-accent: #fbbf24;  /* Different for primary */
--color-danger-accent: #fbbf24;   /* Different for danger */
--color-panel-accent: #9333ea;    /* Same as body but duplicated */
--color-success-accent: #34d399;  /* Different for success */
/* ... 10+ more definitions */
```

### After: Adding a Token Is Simple

```css
/* After: Add once, override only where different */
:root {
  --color-accent: #9333ea;  /* That's it! */
}

.scheme-primary {
  --color-accent: #fbbf24;  /* Override only if needed */
}
```

## Practical Examples

### Example 1: Button Component with Schemes

**button.module.css** - Component styles use generic tokens:
```css
/* Component styles - NOT a scheme */
.button {
  padding: var(--spacing-buttonY) var(--spacing-buttonX);
  border-radius: var(--radius-interactive);
  background: var(--color-background);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-small10);
}

.button:hover {
  /* Remap tokens to hover variants */
  --color-text: var(--color-text-hover);
  --color-icon: var(--color-icon-hover);
  --color-background: var(--color-background-hover);
  --color-border: var(--color-border-hover);
}

.button:active {
  /* Remap tokens to active variants */
  --color-text: var(--color-text-active);
  --color-icon: var(--color-icon-active);
  --color-background: var(--color-background-active);
  --color-border: var(--color-border-active);
}
```

**Button.tsx** - Component uses typed schemes:
```tsx
import styles from './button.module.css';
import { schemes, buttonSchemes, cn, type ButtonVariant } from '@claude-flow/ui-kit/schemes';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
}

function Button({ children, variant = 'default', className, ...props }: ButtonProps) {
  // Get scheme from typed mapping with intellisense
  const schemeClass = buttonSchemes[variant];
  
  return (
    <button 
      className={cn(styles.button, schemeClass, className)}
      {...props}
    >
      {children}
    </button>
  );
}

// Usage with type safety
<Button variant="primary"> {/* ✅ TypeScript knows valid variants */}
  <Icon name="check" /> {/* Automatically white from scheme-primary */}
  <span>Confirm</span>
</Button>

<Button variant="danger">
  <Icon name="trash" /> {/* Automatically white from scheme-danger */}
  <span>Delete</span>
</Button>

<Button> {/* No scheme, uses inherited tokens */}
  <Icon name="settings" /> {/* Gray from :root */}
  <span>Settings</span>
</Button>

// TypeScript error on invalid variant
<Button variant="invalid"> {/* ❌ Type error: "invalid" not in ButtonVariant */}
  Error
</Button>
```

### Example 2: Nested Schemes

```jsx
<div className="app">
  <Icon name="home" /> {/* Gray (#737373) from :root */}
  
  <div className="card scheme-elevated">
    <Icon name="settings" /> {/* Still gray, card doesn't change icon color */}
    
    <button className="button scheme-primary">
      <Icon name="save" /> {/* White (#ffffff) from scheme-primary */}
    </button>
    
    <div className="alert scheme-danger-soft">
      <Icon name="alert" /> {/* Dark red (#991b1b) from scheme-danger-soft */}
      <p>Error occurred</p> {/* Dark red text */}
    </div>
  </div>
</div>
```

### Example 3: Component Selection States

```css
/* Unselected state uses inherited tokens */
.list-item {
  background: transparent;
  color: var(--color-text);
}

/* Selected state becomes a scheme */
.list-item.selected {
  --color-text: #ffffff;
  --color-icon: #ffffff;
  --color-background: #1976d2;
  background: var(--color-background);
}

/* Hover state adjusts the scheme */
.list-item.selected:hover {
  --color-background: #1565c0;
}
```

## Handling Interactive States

### The Problem with Direct State Styling

In a naive approach, hover states require every component to know about its children:

```css
/* Bad: Parent must know about all children */
.button:hover .icon { color: var(--color-icon-hover); }
.button:hover .text { color: var(--color-text-hover); }
.list-item:hover .icon { color: var(--color-icon-hover); }
/* Hundreds of these rules... */
```

### The Solution: Token Indirection

Instead of components targeting children, we remap the base tokens to state tokens:

```css
/* Define both default and state values */
.button.primary {
  /* Default values */
  --color-text: #ffffff;
  --color-icon: #ffffff;
  --color-background: #1976d2;
  
  /* State-specific values */
  --color-text-hover: #ffffff;
  --color-icon-hover: #e3f2fd;     /* Slightly lighter */
  --color-background-hover: #1565c0; /* Darker blue */
}

/* On hover, remap base tokens to hover tokens */
.button:hover {
  --color-text: var(--color-text-hover);
  --color-icon: var(--color-icon-hover);
  --color-background: var(--color-background-hover);
}

/* Icon still just uses --color-icon */
.icon {
  color: var(--color-icon); /* Gets remapped on hover! */
}
```

### Complete State Management

This pattern scales to all interactive states:

```css
/* Component defines all state variations */
.interactive-element {
  /* Default */
  --color-text: #404040;
  --color-icon: #737373;
  --color-background: transparent;
  
  /* Hover */
  --color-text-hover: #404040;
  --color-icon-hover: #5a5a5a;
  --color-background-hover: #f0f0f0;
  
  /* Active/Pressed */
  --color-text-active: #404040;
  --color-icon-active: #404040;
  --color-background-active: #e0e0e0;
  
  /* Disabled */
  --color-text-disabled: #999999;
  --color-icon-disabled: #b3b3b3;
  --color-background-disabled: #f5f5f5;
}

/* State classes remap tokens */
.interactive-element:hover {
  --color-text: var(--color-text-hover);
  --color-icon: var(--color-icon-hover);
  --color-background: var(--color-background-hover);
}

.interactive-element:active {
  --color-text: var(--color-text-active);
  --color-icon: var(--color-icon-active);
  --color-background: var(--color-background-active);
}

.interactive-element:disabled {
  --color-text: var(--color-text-disabled);
  --color-icon: var(--color-icon-disabled);
  --color-background: var(--color-background-disabled);
}
```

### Real-World Example: Card with Interactive Elements

```tsx
import { schemes, buttonSchemes, alertSchemes, cn } from '@claude-flow/ui-kit/schemes';
import type { ButtonVariant, AlertVariant } from '@claude-flow/ui-kit/schemes';
import styles from './components.module.css';

// Components with typed schemes
function Card({ children, className }: { 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <div className={cn(schemes.elevated, styles.card, className)}>
      {children}
    </div>
  );
}

function Button({ children, variant = 'default' }: { 
  children: React.ReactNode; 
  variant?: ButtonVariant;
}) {
  const schemeClass = buttonSchemes[variant];
  return (
    <button className={cn(styles.button, schemeClass)}>
      {children}
    </button>
  );
}

function Alert({ children, variant }: { 
  children: React.ReactNode; 
  variant: AlertVariant;
}) {
  return (
    <div className={cn(alertSchemes[variant], styles.alert)}>
      {children}
    </div>
  );
}

// Usage with full type safety and intellisense
<Card>
  <h2>Settings</h2>
  <Icon name="gear" />  {/* Gray icon inherited from :root */}
  
  <Alert variant="warning">
    <Icon name="alert" />  {/* Warning color from scheme-warning-soft */}
    Some settings require restart
  </Alert>
  
  <Button variant="primary">
    <Icon name="save" />  {/* White icon from scheme-primary */}
    Save Changes
  </Button>
</Card>
```

**Key Separation of Concerns:**

```css
/* SCHEMES - Define token values for contexts */
.scheme-primary {
  --color-text: #ffffff;
  --color-icon: #ffffff;
  --color-background: #1976d2;
  
  --color-text-hover: #ffffff;
  --color-icon-hover: #e3f2fd;
  --color-background-hover: #1565c0;
}

/* COMPONENTS - Use generic tokens, never define colors */
.button {
  background: var(--color-background);
  color: var(--color-text);
  padding: var(--spacing-buttonY) var(--spacing-buttonX);
  border-radius: var(--radius-interactive);
}

.button:hover {
  /* Remap to hover tokens */
  --color-text: var(--color-text-hover);
  --color-icon: var(--color-icon-hover);
  --color-background: var(--color-background-hover);
}

.icon {
  fill: var(--color-icon); /* Just uses the token */
}
```

## Scheme Definitions

### Base Scheme (:root)

```css
:root {
  /* Base tokens */
  --color-text: #404040;
  --color-text-soft: #666666;
  --color-text-muted: #999999;
  --color-link: #1976d2;
  --color-icon: #737373;
  --color-background: #f5f7f9;
  --color-border: #d9d9d9;
  
  /* Hover state tokens */
  --color-text-hover: #404040;
  --color-text-soft-hover: #666666;
  --color-icon-hover: #5a5a5a;
  --color-background-hover: #ebeef1;
  --color-border-hover: #c0c0c0;
  
  /* Active state tokens */
  --color-text-active: #404040;
  --color-icon-active: #404040;
  --color-background-active: #e1e4e7;
  --color-border-active: #a0a0a0;
  
  /* Disabled state tokens */
  --color-text-disabled: #999999;
  --color-icon-disabled: #b3b3b3;
  --color-background-disabled: #f5f7f9;
  --color-border-disabled: #e5e5e5;
  
  /* Semantic colors (for reference) */
  --color-info: #0ea5e9;
  --color-success: #16a34a;
  --color-warning: #f59e0b;
  --color-danger: #dc2626;
}
```

### Contextual Schemes (Minimal Overrides)

```css
/* Elevated surfaces (cards, modals) */
.scheme-elevated {
  --color-background: #ffffff;
  --color-background-hover: #f5f5f5;
  /* Everything else inherited */
}

/* Primary context (selected, active, primary buttons) */
.scheme-primary {
  /* Default state */
  --color-text: #ffffff;
  --color-text-soft: #e3f2fd;
  --color-icon: #ffffff;
  --color-background: #1976d2;
  --color-border: #1565c0;
  
  /* Hover state */
  --color-text-hover: #ffffff;
  --color-icon-hover: #e3f2fd;
  --color-background-hover: #1565c0;
  --color-border-hover: #0d47a1;
  
  /* Active state */
  --color-text-active: #ffffff;
  --color-icon-active: #bbdefb;
  --color-background-active: #0d47a1;
}

/* Danger context */
.scheme-danger {
  /* Default state */
  --color-text: #ffffff;
  --color-icon: #ffffff;
  --color-background: #dc2626;
  --color-border: #b91c1c;
  
  /* Hover state */
  --color-text-hover: #ffffff;
  --color-icon-hover: #ffe4e6;
  --color-background-hover: #b91c1c;
  
  /* Active state */
  --color-text-active: #ffffff;
  --color-icon-active: #fecaca;
  --color-background-active: #991b1b;
}

/* Soft danger (error regions) */
.scheme-danger-soft {
  --color-text: #991b1b;
  --color-icon: #dc2626;
  --color-background: #fef2f2;
  --color-border: #fecaca;
  
  --color-text-hover: #7f1d1d;
  --color-icon-hover: #b91c1c;
  --color-background-hover: #fee2e2;
}

/* Dark mode */
.scheme-dark {
  /* Default state */
  --color-text: #e5e5e5;
  --color-text-soft: #b3b3b3;
  --color-text-muted: #808080;
  --color-icon: #b3b3b3;
  --color-background: #1a1a1a;
  --color-border: #404040;
  
  /* Hover state */
  --color-text-hover: #f5f5f5;
  --color-icon-hover: #d0d0d0;
  --color-background-hover: #2a2a2a;
  --color-border-hover: #505050;
  
  /* Active state */
  --color-text-active: #ffffff;
  --color-icon-active: #e5e5e5;
  --color-background-active: #0f0f0f;
}
```

### Complex Example: List Item with Selection and Hover

```css
/* Base list item */
.list-item {
  /* Default tokens from :root */
  padding: var(--spacing);
  background: transparent;
  color: var(--color-text);
  
  /* Define hover for unselected state */
  --color-background-hover: #f0f0f0;
  --color-text-hover: #404040;
  --color-icon-hover: #5a5a5a;
}

/* Selected list item becomes a scheme */
.list-item.selected {
  /* Selected state tokens */
  --color-text: #ffffff;
  --color-icon: #ffffff;
  --color-background: #1976d2;
  
  /* Selected + hover tokens */
  --color-text-hover: #ffffff;
  --color-icon-hover: #e3f2fd;
  --color-background-hover: #1565c0;
  
  background: var(--color-background);
}

/* Single hover rule handles both states */
.list-item:hover {
  --color-text: var(--color-text-hover);
  --color-icon: var(--color-icon-hover);
  --color-background: var(--color-background-hover);
  background: var(--color-background);
}

/* Icon inside automatically adapts */
.list-item .icon {
  fill: var(--color-icon); /* Works for all states! */
}
```

Usage:
```jsx
<ul>
  <li className="list-item">
    <Icon name="file" />  {/* Gray icon, darker on hover */}
    <span>Document.pdf</span>
  </li>
  <li className="list-item selected">
    <Icon name="folder" />  {/* White icon, lighter blue on hover */}
    <span>Selected Folder</span>
  </li>
</ul>
```

## Scheme Composition and Nesting

### The Challenge: Nested Context Conflicts

When schemes nest, they can create visual conflicts:

```tsx
// Problem: Primary button in error context
<Banner className={schemes.dangerSoft}>
  Error: Failed to save
  <Button variant="primary">  {/* Blue button on red background? */}
    Try Again
  </Button>
</Banner>
```

The button's `scheme-primary` completely overrides the banner's `scheme-danger-soft`, potentially creating:
- **Poor contrast** - Blue on red-tinted background
- **Confusing hierarchy** - Primary action in error context
- **Inconsistent design** - Mixed color semantics

### Solution 1: Inheritance by Default

Components inherit parent scheme unless explicitly overridden:

```tsx
// schemes.ts
export interface ButtonProps {
  variant?: ButtonVariant;
  emphasis?: 'subtle' | 'normal' | 'strong';  // Relative to parent
  override?: boolean;  // Explicit scheme override
}

// Button component
function Button({ variant, emphasis = 'normal', override, ...props }: ButtonProps) {
  // Only apply scheme if override or no parent context
  const schemeClass = override || !useHasParentScheme() 
    ? buttonSchemes[variant] 
    : undefined;
    
  const emphasisClass = emphasisLevels[emphasis];
  
  return (
    <button className={cn(styles.button, schemeClass, emphasisClass)} {...props} />
  );
}
```

Usage:
```tsx
<Alert className={schemes.dangerSoft}>
  <Button>  {/* Inherits danger-soft scheme */}
    Cancel
  </Button>
  
  <Button emphasis="strong">  {/* Danger-soft + strong emphasis */}
    Dismiss Error
  </Button>
  
  <Button variant="primary" override>  {/* Explicit blue button */}
    Save Anyway
  </Button>
</Alert>
```

### Solution 2: Context-Aware Scheme Variants

Define how schemes adapt when nested:

```css
/* Primary button in normal context */
.scheme-primary {
  --color-background: #1976d2;
  --color-text: #ffffff;
}

/* Primary button adapts to danger context */
.scheme-danger-soft .scheme-primary {
  --color-background: #dc2626;  /* Red instead of blue */
  --color-text: #ffffff;
  --color-background-hover: #b91c1c;
}

/* Primary button adapts to success context */
.scheme-success-soft .scheme-primary {
  --color-background: #16a34a;  /* Green instead of blue */
  --color-text: #ffffff;
}
```

### Solution 3: Composition Rules

Define explicit rules for scheme combinations:

```typescript
// schemes.ts
export const schemeComposition = {
  'danger-soft': {
    // Allowed child schemes
    allowed: ['danger', 'neutral', 'emphasis'],
    
    // Automatic remapping
    remap: {
      'primary': 'danger',     // Primary becomes danger
      'success': 'neutral',    // Success becomes neutral
    },
    
    // Warning for problematic combinations
    warn: ['success', 'info'],
  },
  
  'success-soft': {
    allowed: ['success', 'neutral', 'emphasis'],
    remap: {
      'primary': 'success',
      'danger': 'neutral',
    },
  },
};

// Helper hook
function useComposedScheme(variant: ButtonVariant): string | undefined {
  const parentScheme = useParentScheme();
  
  if (!parentScheme) {
    return buttonSchemes[variant];
  }
  
  const composition = schemeComposition[parentScheme];
  if (!composition) {
    return buttonSchemes[variant];
  }
  
  // Check for remapping
  const remapped = composition.remap?.[variant];
  if (remapped) {
    console.info(`Remapping ${variant} to ${remapped} in ${parentScheme} context`);
    return buttonSchemes[remapped];
  }
  
  // Warn about problematic combinations
  if (composition.warn?.includes(variant)) {
    console.warn(`${variant} button in ${parentScheme} context may have poor contrast`);
  }
  
  return buttonSchemes[variant];
}
```

### Solution 4: Emphasis Modifiers

Instead of absolute schemes, use relative emphasis:

```css
/* Emphasis modifiers work with any scheme */
.emphasis-subtle {
  --color-background: color-mix(
    in oklch,
    var(--color-background) 30%,
    transparent 70%
  );
  --color-text: color-mix(
    in oklch,
    var(--color-text) 80%,
    var(--color-background) 20%
  );
}

.emphasis-normal {
  /* No changes - uses parent scheme as-is */
}

.emphasis-strong {
  /* Strengthen the current scheme */
  --color-background: color-mix(
    in oklch,
    var(--color-background) 100%,
    black 10%
  );
  filter: saturate(1.1);
}
```

### Best Practices for Scheme Nesting

1. **Prefer inheritance over override**
   ```tsx
   // ✅ Good: Inherit parent context
   <Alert variant="error">
     <Button emphasis="strong">Dismiss</Button>
   </Alert>
   
   // ⚠️ Caution: Override only when necessary
   <Alert variant="error">
     <Button variant="primary" override>Save Anyway</Button>
   </Alert>
   ```

2. **Use semantic variants in context**
   ```tsx
   // ✅ Good: Semantic alignment
   <Banner variant="success">
     <Button variant="success">Continue</Button>
   </Banner>
   
   // ❌ Bad: Conflicting semantics
   <Banner variant="success">
     <Button variant="danger">Delete</Button>
   </Banner>
   ```

3. **Provide visual hierarchy through emphasis**
   ```tsx
   <Card className={schemes.elevated}>
     <Button emphasis="subtle">Cancel</Button>
     <Button emphasis="strong">Confirm</Button>
   </Card>
   ```

4. **Test combinations for accessibility**
   - Ensure WCAG AA contrast ratios
   - Test with color blindness simulators
   - Verify focus states remain visible

### TypeScript Safety for Composition

```typescript
// Enhanced button with composition safety
interface ButtonProps {
  variant?: ButtonVariant;
  emphasis?: EmphasisLevel;
  override?: boolean;
  // Warn at type level for problematic combinations
  _context?: never;  // Prevents direct context passing
}

// Context-aware wrapper
function ContextButton(props: ButtonProps) {
  const parentScheme = useParentScheme();
  const composition = schemeComposition[parentScheme];
  
  // TypeScript warning for problematic combinations
  if (composition?.warn?.includes(props.variant)) {
    console.warn(
      `⚠️ ${props.variant} button in ${parentScheme} context - ` +
      `consider using ${composition.remap[props.variant] || 'emphasis'} instead`
    );
  }
  
  return <Button {...props} />;
}
```

## Benefits of Scheme-Only System

### 1. Automatic Inheritance
- Child components automatically get correct colors
- No prop drilling or context providers needed
- CSS custom properties handle everything

### 2. Fewer Total Tokens
- ~45-60 tokens (base + states) instead of 300+
- Each concept has 3-4 states (default, hover, active, disabled)
- No duplication across surfaces (×15 surfaces saved)
- Single source of truth

### 3. Simpler Mental Model
- "Use `--color-text` for text" - that's it
- No need to think about which surface you're on
- Context determines values automatically

### 4. Easy Token Expansion
- Add new tokens once to :root
- Schemes inherit automatically
- Override only where needed

### 5. Component Simplification
- Components don't need surface props
- No CSS overrides for child elements
- Cleaner, more maintainable code

### 6. Better Performance
- Smaller CSS bundle
- Fewer CSS variables to process
- Natural CSS cascade optimization

### 7. Elegant State Management
- Token indirection handles all interactive states
- Icons and nested components adapt automatically on hover/active/disabled
- No parent components targeting children with state-specific selectors
- Single hover rule works for all child components

## Migration Strategy

### Phase 1: Token Mapping
1. Map all surface-prefixed tokens to generic equivalents
2. Create compatibility layer for gradual migration
3. Define base scheme on :root

### Phase 2: Component Updates
1. Update components to use generic tokens
2. Remove surface prop requirements
3. Apply schemes where contexts change

### Phase 3: Cleanup
1. Remove surface-prefixed token definitions
2. Remove compatibility layer
3. Update documentation

## Conclusion

By eliminating surface prefixes and embracing a scheme-only system, we solve the fundamental inheritance problem while dramatically simplifying our token architecture. Components become simpler, tokens become fewer, and the system becomes more maintainable and intuitive.

The key insight: **Every visual context is just a scheme that redefines what the generic tokens mean.**