# Generate React TSX Mockup

Generate a comprehensive, production-ready React TSX mockup for: $ARGUMENTS

## IMPORTANT: Follow the mockup-guide.md EXACTLY

1. **READ FIRST**: Read `apps/ui-kit-mocks/docs/mockup-guide.md` completely
2. **FOLLOW ALL STEPS**: Follow every step in the guide exactly, including:
   - File naming conventions (PascalCase for components)
   - Directory structure (src/mocks/{category}/{component-name}/)
   - React component requirements
   - CSS modules usage
   - Updating component-data.json (CRITICAL - never skip this)
   - Updating MockViewer.tsx with dynamic import
   - All verification steps

3. **USE DESIGN TOKENS**: Read `docs/guides/TOKEN_CHEATSHEET.md` for the token system
4. **REUSE COMPONENTS**: Check and use components from:
   - `@claude-flow/ui-kit-react` for UI components
   - `@claude-flow/ui-kit-icons` for all icons

## Additional Requirements for This Mockup

Based on the user's request: "$ARGUMENTS"

Consider the following when creating the mockup:
- Determine the appropriate category (view-layouts, chat-components, form-components, etc.)
- Create reusable components that can be composed
- Use TypeScript for proper type safety
- Implement responsive behavior with CSS modules

## Required Component Structure

Create these files in `apps/ui-kit-mocks/src/mocks/{category}/{component-name}/`:

### 1. Main Component File ({ComponentName}.tsx)
- Define TypeScript interfaces for props
- Create the main component with proper typing
- Use existing ui-kit-react components where possible
- Use ui-kit-icons for all icons (NEVER create custom icons)

### 2. CSS Module ({ComponentName}.module.css)
- ONLY use design tokens from TOKEN_CHEATSHEET.md
- Use surface-based color pairs for accessibility
- Implement responsive layouts with media queries
- Add smooth transitions and animations

### 3. Example File (example.tsx)
- Create a comprehensive example showing all features
- Must have a default export for dynamic loading
- Include different states and variations
- Add interactive elements with React hooks

### 4. Index File (index.ts)
- Export the component and its types
- Re-export from the main component file

## Required Sections to Implement

Include ALL of these aspects in your mockup:

### Component States
- Normal state
- Hover state (with CSS :hover)
- Focus state (with focus-visible)
- Active/pressed state
- Disabled state (using disabled prop)
- Loading state (if applicable)
- Error state (if applicable)

### Component Variants
- Primary variant
- Secondary variant
- Success/Danger/Warning variants (if applicable)
- Different sizes (small, medium, large)
- With/without icons from ui-kit-icons

### Interactive Features
- State management with React hooks (useState, useEffect)
- Event handlers with proper TypeScript types
- Form handling (if applicable)
- Keyboard navigation support
- ARIA attributes for accessibility

### Responsive Behavior
```css
/* Mobile first approach */
.component {
  /* Mobile styles */
}

@media (min-width: 768px) {
  .component {
    /* Tablet styles */
  }
}

@media (min-width: 1024px) {
  .component {
    /* Desktop styles */
  }
}
```

## Component Reuse Requirements

### MANDATORY: Check these packages first:

```tsx
// Check @claude-flow/ui-kit-react for:
import { 
  Button, 
  Card, 
  Input, 
  Select,
  // ... other components
} from '@claude-flow/ui-kit-react';

// Check @claude-flow/ui-kit-icons for ALL icons:
import { 
  SearchIcon,
  CloseIcon,
  ChevronDownIcon,
  // ... never create custom icons
} from '@claude-flow/ui-kit-icons';
```

**ONLY create custom implementations when the component doesn't exist in these packages**

## Design Token Usage

### Required tokens (from TOKEN_CHEATSHEET.md):
```css
/* Colors - Always use same-surface pairs */
background: var(--color-primary-background);
color: var(--color-primary-text);
border: 1px solid var(--color-primary-border);

/* Spacing - 4px grid */
padding: var(--spacing);
margin: var(--spacing-small);
gap: var(--spacing-large);

/* Typography */
font-size: var(--font-size);
font-weight: var(--font-weight-medium);
line-height: var(--line-height-normal);

/* Layout */
border-radius: var(--radius-interactive);
box-shadow: var(--shadow-card);
```

### NEVER use:
- Hardcoded colors (#ffffff, rgb(), etc.)
- Hardcoded spacing (16px, 1rem, etc.)
- Mixed surface colors (e.g., primary background with accent text)
- Custom font families or weights

## TypeScript Requirements

```tsx
// Define proper interfaces
export interface ComponentProps {
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  onClick?: (event: React.MouseEvent) => void;
  children: React.ReactNode;
}

// Use proper event types
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  // Handler logic
};

// Type your state
const [isOpen, setIsOpen] = useState<boolean>(false);
const [selectedItem, setSelectedItem] = useState<string | null>(null);
```

## Accessibility Requirements

```tsx
// Semantic HTML
<nav aria-label="Main navigation">
  {/* Navigation items */}
</nav>

// ARIA attributes
<button
  aria-pressed={isActive}
  aria-expanded={isOpen}
  aria-label="Toggle menu"
>
  {/* Button content */}
</button>

// Keyboard support
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    // Handle activation
  }
};
```

## Configuration Updates (CRITICAL)

### 1. Update component-data.json
```json
{
  "categories": {
    "{category}": [
      {
        "name": "{Component Name}",
        "folder": "{category}/{component-name}",
        "plans": [],
        "mockups": ["{Component Display Name}"]
      }
    ]
  }
}
```

### 2. Update MockViewer.tsx
```tsx
switch (mockPath) {
  case '{category}/{component-name}':
    return import('./mocks/{category}/{component-name}/example');
  // ... other cases
}
```

## Testing Requirements

Ensure the mockup:
- Works in both light and dark modes
- Functions with keyboard navigation
- Has proper TypeScript types (no any types)
- Maintains accessibility standards
- Scales properly on different screen sizes
- Has no console errors or warnings

## Final Verification Checklist

Before completing the /mock command, verify:

✅ Component files are in: `apps/ui-kit-mocks/src/mocks/{category}/{component-name}/`
✅ Main component uses PascalCase: `{ComponentName}.tsx`
✅ CSS uses modules: `{ComponentName}.module.css`
✅ Example has default export: `export default {ComponentName}Example`
✅ All existing ui-kit-react components are reused
✅ All icons are from ui-kit-icons (no custom icons)
✅ Design tokens are used exclusively (no hardcoded values)
✅ Surface color pairs are consistent (same surface for bg/fg)
✅ `component-data.json` has been updated with the new entry
✅ `MockViewer.tsx` has been updated with the import case
✅ TypeScript types are properly defined (no any)
✅ Component is accessible with ARIA labels

## Summary Output

After generating the mockup, provide a summary:
- Category created/used: {category}
- Component folder: {component-name}
- Files created:
  - {ComponentName}.tsx
  - {ComponentName}.module.css
  - example.tsx
  - example.module.css
  - index.ts
- component-data.json: ✅ Updated
- MockViewer.tsx: ✅ Updated with import case
- Reused components from ui-kit-react: {list}
- Icons used from ui-kit-icons: {list}

Generate the complete React TSX mockup now with all sections fully implemented. Make it thorough, detailed, and production-ready.