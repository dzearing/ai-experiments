# Component Mockup Guide

This guide provides best practices and requirements for creating React TSX mockups that demonstrate component designs using the ui-kit design system.

## Quick Start - FOLLOW THESE STEPS IN ORDER

### Step 0: READ THE TOKEN_CHEATSHEET.md (MANDATORY)

**🚨 CRITICAL FIRST STEP**: Before creating ANY mockup, you MUST read and understand the design token system:

1. **READ** `/docs/guides/TOKEN_CHEATSHEET.md` - This contains all available design tokens
2. **UNDERSTAND** the surface-based color system and spacing grid
3. **REFERENCE** the token examples throughout your mockup creation
4. **NEVER** use hardcoded colors, spacing, or typography values

**Your mockups MUST use ui-kit design tokens exclusively.** Any mockup using hardcoded values will be rejected.

### Step 1: Determine File Location and Naming

React mockups belong in `apps/ui-kit-mocks/src/mocks/{category}/{component-name}/`

Each part of the path is kebab-cased:
* **category**: Group by type (e.g. "view-layouts", "chat-components", "form-components") 
* **component-name**: The specific component/view name (kebab-cased)

Standard file structure:
```
src/mocks/{category}/{component-name}/
├── {ComponentName}.tsx           # Main component file
├── {ComponentName}.module.css    # CSS modules for styling
├── example.tsx                   # Example usage (default export)
├── example.module.css           # Example-specific styles
└── index.ts                     # Exports for the component
```

### Step 2: Create the Component Files

#### Main Component ({ComponentName}.tsx)
```tsx
import React from 'react';
import styles from './{ComponentName}.module.css';

export interface {ComponentName}Props {
  // Define your props here
}

export const {ComponentName}: React.FC<{ComponentName}Props> = (props) => {
  return (
    <div className={styles.container}>
      {/* Your component implementation */}
    </div>
  );
};
```

#### CSS Module ({ComponentName}.module.css)
```css
.container {
  /* ONLY use design tokens */
  padding: var(--spacing);
  background: var(--color-panel-background);
  color: var(--color-panel-text);
  border-radius: var(--radius-container);
}
```

#### Example File (example.tsx)
```tsx
import React from 'react';
import { {ComponentName} } from './{ComponentName}';
import styles from './example.module.css';

const {ComponentName}Example: React.FC = () => {
  return (
    <div className={styles.exampleContainer}>
      <{ComponentName} />
    </div>
  );
};

// IMPORTANT: Must be default export for dynamic loading
export default {ComponentName}Example;
```

### Step 3: Update component-data.json (NEVER SKIP THIS STEP)

**CRITICAL**: You MUST update `/apps/ui-kit-mocks/src/component-data.json` to register your mockups:

1. Open `component-data.json`
2. Find or create your category in the categories object
3. Add/update the component entry:
```json
{
  "name": "Your Component Name",
  "folder": "{category}/{component-name}",
  "plans": [],
  "mockups": ["Your Component"]
}
```

### Step 4: Update MockViewer.tsx

Add your component to the dynamic import switch in `/apps/ui-kit-mocks/src/MockViewer.tsx`:

```tsx
switch (mockPath) {
  case '{category}/{component-name}':
    return import('./mocks/{category}/{component-name}/example');
  // ... other cases
}
```

## Using UI Kit Components and Icons

### MANDATORY: Reuse Existing Components

**🚨 IMPORTANT**: Always check and reuse existing components from these packages:

#### From @claude-flow/ui-kit-react
```tsx
import { Button, Card, Input } from '@claude-flow/ui-kit-react';

// Use existing components whenever possible
<Button variant="primary" size="medium">
  Click Me
</Button>
```

#### From @claude-flow/ui-kit-icons
```tsx
import { ChevronDownIcon, SearchIcon, CloseIcon } from '@claude-flow/ui-kit-icons';

// Use icons from the icon library
<SearchIcon className={styles.icon} />
```

**Before creating ANY custom UI element:**
1. Check if it exists in `@claude-flow/ui-kit-react`
2. Check if an icon exists in `@claude-flow/ui-kit-icons`
3. Only create custom implementations if absolutely necessary for the mock

## Design Token Usage

### CSS Modules Best Practices

#### DO:
```css
/* Use design tokens exclusively */
.component {
  /* Spacing */
  padding: var(--spacing);
  margin: var(--spacing-small);
  gap: var(--spacing-large);
  
  /* Colors - ALWAYS use same-surface pairs */
  background: var(--color-primary-background);
  color: var(--color-primary-text);
  border: 1px solid var(--color-primary-border);
  
  /* Typography */
  font-size: var(--font-size);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-normal);
  
  /* Layout */
  border-radius: var(--radius-interactive);
  box-shadow: var(--shadow-card);
}

/* Use flexbox/grid for layout */
.container {
  display: flex;
  gap: var(--spacing);
  align-items: center;
}

/* Responsive design with CSS modules */
@media (min-width: 768px) {
  .component {
    padding: var(--spacing-large);
  }
}
```

#### DON'T:
```css
/* Don't use hardcoded values */
.component {
  padding: 16px;           /* ❌ Use --spacing tokens */
  background: #ffffff;     /* ❌ Use --color tokens */
  border-radius: 8px;      /* ❌ Use --radius tokens */
  font-size: 14px;        /* ❌ Use --font-size tokens */
}

/* Don't mix surface colors */
.bad {
  background: var(--color-primary-background);
  color: var(--color-accent-text);  /* ❌ Wrong surface! */
}

/* Don't override theme system */
body {
  font-family: Arial;     /* ❌ Theme provides this */
}
```

### Important Token Guidelines

- **NEVER** assume token names - only use tokens documented in TOKEN_CHEATSHEET.md
- **ALWAYS** use surface-based color pairs (background + text from same surface)
- **FOLLOW** the 4px spacing grid exclusively
- **USE** semantic token names (e.g., `--color-success-text` not `--color-green`)

## React Component Best Practices

### State Management
```tsx
// Use React hooks appropriately
const [isOpen, setIsOpen] = useState(false);
const [selectedItem, setSelectedItem] = useState<string | null>(null);

// Use useEffect for side effects
useEffect(() => {
  // Effect logic
}, [dependencies]);
```

### Event Handlers
```tsx
// Define handlers clearly
const handleClick = (e: React.MouseEvent) => {
  e.preventDefault();
  // Handler logic
};

// Use proper TypeScript types
const handleChange = (value: string) => {
  // Handler logic
};
```

### Accessibility
```tsx
// Always include proper ARIA attributes
<button
  aria-label="Close dialog"
  aria-pressed={isActive}
  onClick={handleClose}
>
  <CloseIcon />
</button>

// Use semantic HTML
<nav aria-label="Main navigation">
  {/* Navigation items */}
</nav>
```

## Mockup Types and Examples

### 1. Layout Components
Components that provide page structure:
```tsx
// ViewTemplate, PageLayout, SplitView, etc.
export const LayoutComponent: React.FC = () => {
  return (
    <div className={styles.layout}>
      <header className={styles.header}>...</header>
      <main className={styles.main}>...</main>
      <aside className={styles.sidebar}>...</aside>
    </div>
  );
};
```

### 2. Interactive Components
Components with user interaction:
```tsx
// Forms, Modals, Dropdowns, etc.
export const InteractiveComponent: React.FC = () => {
  const [value, setValue] = useState('');
  
  return (
    <form className={styles.form}>
      <Input
        value={value}
        onChange={setValue}
        placeholder="Enter text"
      />
      <Button onClick={handleSubmit}>Submit</Button>
    </form>
  );
};
```

### 3. Data Display Components
Components that show information:
```tsx
// Tables, Lists, Cards, Charts, etc.
export const DataDisplay: React.FC<{data: Item[]}> = ({ data }) => {
  return (
    <div className={styles.list}>
      {data.map(item => (
        <Card key={item.id} className={styles.card}>
          {/* Card content */}
        </Card>
      ))}
    </div>
  );
};
```

## Final Verification Checklist

Before completing your mockup, verify EVERY item:

### TOKEN REQUIREMENTS (MANDATORY)
- [ ] **READ** `/docs/guides/TOKEN_CHEATSHEET.md` before starting
- [ ] **ALL** colors use design tokens AND same-surface pairs
- [ ] **ALL** spacing uses design tokens from the cheatsheet  
- [ ] **ALL** typography uses design tokens from the cheatsheet
- [ ] **NO** hardcoded values (colors, px values, font names) anywhere

### Component Reuse
- [ ] **CHECKED** @claude-flow/ui-kit-react for existing components
- [ ] **CHECKED** @claude-flow/ui-kit-icons for existing icons
- [ ] **REUSED** all available components instead of creating custom ones
- [ ] **IMPORTED** icons properly from the icon library

### Files and Structure
- [ ] Files are in `src/mocks/{category}/{component-name}/` directory
- [ ] Component file uses PascalCase naming
- [ ] CSS modules use `.module.css` extension
- [ ] Example file has default export
- [ ] Index file exports component and types

### Configuration Updates (CRITICAL)
- [ ] `component-data.json` has been updated
- [ ] Category exists in the categories object
- [ ] Component entry includes mockup name
- [ ] `MockViewer.tsx` updated with import case

### Quality Checks
- [ ] TypeScript types are properly defined
- [ ] Component is accessible (ARIA attributes, semantic HTML)
- [ ] Responsive behavior works at different sizes
- [ ] Test in both light and dark modes
- [ ] CSS modules use only design tokens
- [ ] No console errors or warnings

### Summary
After completing, you should be able to confirm:
- ✅ Component files created in correct location
- ✅ component-data.json and MockViewer.tsx updated
- ✅ Mock appears in the ui-kit-mocks catalog
- ✅ Mock loads independently at `/mock/{category}/{component-name}`
- ✅ All existing ui-kit components and icons are reused
- ✅ All styles use design tokens via CSS modules