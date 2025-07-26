# UI Kit Theme Generation System

## Overview

This document outlines the implementation of an algorithmic theme generation system for the Claude Flow UI Kit. The system generates complete, WCAG-compliant theme token sets from minimal color definitions at build time.

## Goals

1. **Minimal Configuration**: Define a theme with just a primary color
2. **Complete Token Sets**: Generate 500+ design tokens per theme automatically
3. **WCAG Compliance**: Ensure all color combinations meet accessibility standards
4. **Build-Time Generation**: All computation happens during build, not runtime
5. **Type Safety**: Generate TypeScript definitions for all tokens
6. **Framework Agnostic**: Pure CSS variables usable anywhere

## Architecture

### File Structure

```
packages/ui-kit/
├── src/
│   ├── theme-generator/
│   │   ├── color-utils.ts          # Color manipulation functions
│   │   ├── accessibility.ts        # WCAG compliance checking
│   │   ├── surface-engine.ts       # Surface-based token generation
│   │   ├── theme-compiler.ts       # Main compilation logic
│   │   └── index.ts               # Public API
│   ├── themes/
│   │   ├── theme-types.ts         # TypeScript interfaces
│   │   ├── surface-definitions.ts  # Surface configurations
│   │   └── theme-definitions.ts   # Theme configurations
│   └── styles/
│       ├── base.css               # Element styles (uses theme vars)
│       └── fonts/                 # Segoe UI web fonts
├── dist/                          # Generated (not in git)
│   ├── theme-init.js             # Theme loader script
│   ├── styles.css                # Base styles
│   └── themes/                   # Generated theme CSS
│       ├── default-light.css
│       ├── default-dark.css
│       ├── ocean-light.css
│       ├── ocean-dark.css
│       └── ...
├── build-themes.js               # Build script
└── THEME-GENERATION-PLAN.md     # This document
```

### Build Process

```bash
# Build command
pnpm build
  → repo-scripts build       # TypeScript compilation
  → node build-themes.js     # Theme generation
    → Load compiled theme generator from lib/
    → Read theme definitions
    → Generate CSS for each theme (light & dark)
    → Create theme-manifest.json
    → Generate TypeScript definitions
```

### CSS Output Strategy

Each theme generates two CSS files:

- `{theme}-light.css` - Light mode tokens
- `{theme}-dark.css` - Dark mode tokens

Benefits:

- Smaller file sizes (load only what's needed)
- Better caching
- Cleaner organization

## Theme Definition Format

### Minimal Definition

```typescript
interface ThemeDefinition {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string; // Required: base color
    secondary?: string; // Optional: computed if not provided
    accent?: string; // Optional: computed if not provided
  };
  accessibility: {
    targetLevel: 'AA' | 'AAA'; // WCAG compliance target
    enforceLevel?: boolean; // Auto-adjust colors to meet target
  };
  config?: {
    saturation?: number; // 0-1, affects color vibrancy
    temperature?: number; // -1 to 1, cool to warm shift
  };
}
```

### Example Themes

```typescript
const themes: ThemeDefinition[] = [
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Cool blues inspired by the sea',
    colors: { primary: '#0ea5e9' },
    accessibility: { targetLevel: 'AA', enforceLevel: true },
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Natural greens and earth tones',
    colors: {
      primary: '#22c55e',
      secondary: '#84cc16', // Explicitly set secondary
    },
    accessibility: { targetLevel: 'AA', enforceLevel: true },
  },
  {
    id: 'high-contrast',
    name: 'High Contrast',
    description: 'Maximum readability',
    colors: { primary: '#0052cc' },
    accessibility: {
      targetLevel: 'AAA', // Stricter compliance
      enforceLevel: true,
    },
  },
];
```

## Surface-Based Token System

### Surface Definition Structure

```typescript
interface SurfaceDefinition {
  name: string;
  base: {
    background: ColorComputation;
    text: ColorComputation;
    border: ColorComputation;
    link?: ColorComputation;
    icon?: ColorComputation;
  };
  variants?: {
    soft?: number[]; // [10, 20, 30, 40] - percentages
    hard?: number[]; // [10, 20] - percentages
  };
  states?: {
    hover?: StateModifier;
    active?: StateModifier;
    focus?: StateModifier;
    disabled?: StateModifier;
  };
}
```

### Color Computation Types

```typescript
// Direct color reference
{ value: '#0ea5e9' }

// Reference another token
{ ref: 'body.text' }

// Compute based on contrast
{
  fn: 'contrast',
  args: {
    against: 'body.background',
    target: 'AA',
    prefer: 'neutral.900',
    strategy: 'auto'
  }
}

// Mix colors
{
  fn: 'mix',
  args: {
    color1: 'primary.500',
    color2: 'neutral.500',
    ratio: 0.5
  }
}

// Adjust color properties
{
  fn: 'adjust',
  args: {
    color: 'body.background',
    lightness: -5,
    saturation: 10
  }
}
```

### Example Surface Definitions

```typescript
const surfaces: SurfaceDefinition[] = [
  {
    name: 'body',
    base: {
      background: {
        fn: 'auto',
        args: {
          light: 'surface.0', // Pure white
          dark: 'surface.-1', // Slightly off-black
        },
      },
      text: {
        fn: 'contrast',
        args: {
          against: 'body.background',
          target: 'AAA', // Use theme's target level
          prefer: 'neutral.900',
        },
      },
      border: 'neutral.200',
      link: 'primary.600',
      icon: { ref: 'body.text.soft20' },
    },
    variants: {
      soft: [10, 20, 30, 40], // Generates textSoft10, textSoft20, etc.
      hard: [10, 20],
    },
  },

  {
    name: 'panel',
    base: {
      background: 'surface.0',
      text: { ref: 'body.text' },
      border: {
        fn: 'adjust',
        args: { color: 'body.border', lightness: -5 },
      },
    },
  },

  {
    name: 'buttonPrimary',
    base: {
      background: 'primary.600',
      text: {
        fn: 'contrast',
        args: {
          against: 'buttonPrimary.background',
          target: 'AA',
          prefer: 'white',
          textSize: 'ui', // 3:1 ratio for UI elements
        },
      },
      border: 'transparent',
    },
    states: {
      hover: { lightness: -10 },
      active: { lightness: -15 },
      disabled: { opacity: 0.6 },
    },
  },
];
```

## Generated Token Structure

Each theme generates ~500+ tokens following this pattern:

```css
/* themes/ocean-light.css */
@import '../styles.css';

[data-theme='ocean'][data-theme-type='light'] {
  /* Color scales (11 shades per color) */
  --color-primary-50: #f0f9ff;
  --color-primary-100: #e0f2fe;
  --color-primary-200: #bae6fd;
  /* ... through 950 */

  /* Surface tokens */
  --color-body-background: #fafbfc;
  --color-body-text: #0c4a6e;
  --color-body-textSoft10: #1e5a7e;
  --color-body-textSoft20: #3a6a8a;
  --color-body-textSoft30: #567a96;
  --color-body-textSoft40: #728aa2;
  --color-body-textHard10: #0a3a5a;
  --color-body-textHard20: #082a4a;
  --color-body-link: #0284c7;
  --color-body-link-hover: #0369a1;
  --color-body-border: #e0e7ed;
  /* ... continues for all surfaces ... */
}
```

## Theme Loading System

### Enhanced theme-init.js

```javascript
// Key features:
// 1. Reads data-default-theme attribute
// 2. Checks localStorage for user preferences
// 3. Detects system light/dark preference
// 4. Dynamically loads appropriate theme CSS
// 5. Provides global API

// Usage:
<html data-default-theme="ocean">
  <script src="@claude-flow/ui-kit/dist/theme-init.js"></script>
</html>;

// API:
window.loadTheme('ocean'); // Uses system light/dark
window.loadTheme('ocean', 'dark'); // Force dark mode
window.__claudeFlowTheme.toggleThemeType(); // Toggle light/dark
```

### Base styles.css

Contains:

- CSS reset
- Segoe UI font-face definitions
- Non-color design tokens (spacing, typography, etc.)
- Element styling using theme variables
- Utility classes

```css
/* Example element styling */
body {
  font-family: 'Segoe UI Web', 'Segoe UI', system-ui, sans-serif;
  color: var(--color-body-text);
  background-color: var(--color-body-background);
}

button {
  color: var(--color-buttonNeutral-text);
  background-color: var(--color-buttonNeutral-background);
  border: 1px solid var(--color-buttonNeutral-border);
}

/* ... all HTML elements styled with theme variables ... */
```

## Storybook Integration

### Preview Configuration

```typescript
// .storybook/preview.ts
import { Preview } from '@storybook/react';

// Initialize theme system
const script = document.createElement('script');
script.src = '../dist/theme-init.js';
document.head.appendChild(script);

const preview: Preview = {
  globalTypes: {
    theme: {
      toolbar: {
        items: themeManifest.themes.map((theme) => ({
          value: theme.id,
          title: theme.name,
        })),
      },
    },
  },
  decorators: [
    (Story, context) => {
      window.loadTheme(context.globals.theme);
      return Story();
    },
  ],
};
```

### Theme Gallery Story

```typescript
// Shows all available themes
// Displays import instructions
// Shows WCAG compliance level
// Allows interactive theme switching
// Documents API usage
```

## Validation Checklist

After implementation, verify:

- [ ] `pnpm build` generates theme CSS files in dist/themes/
- [ ] Each theme has separate light and dark CSS files
- [ ] Theme files contain complete token sets (500+ variables)
- [ ] styles.css contains element styling with theme variables
- [ ] theme-init.js loads themes dynamically
- [ ] Storybook shows theme switcher in toolbar
- [ ] Theme Gallery story displays all themes
- [ ] Color contrast meets WCAG requirements
- [ ] TypeScript definitions are generated
- [ ] No theme CSS files are checked into git

## Migration Guide

### Converting Existing Themes

1. Extract primary color from existing theme
2. Create minimal theme definition
3. Build and compare output
4. Adjust if needed

Example:

```typescript
// Old: 1000+ lines of CSS
// New: 5 lines of config
{
  id: 'ocean',
  name: 'Ocean',
  colors: { primary: '#0ea5e9' },
  accessibility: { targetLevel: 'AA' }
}
```

### Breaking Changes

- Theme CSS files now split into light/dark
- Import paths change to dist/themes/
- Some token names may change
- Color values algorithmically generated (may differ slightly)

## Success Criteria

1. **Developer Experience**
   - Define theme with one color
   - Get complete, accessible theme
   - Easy to add new themes

2. **User Experience**
   - Instant theme switching
   - Consistent colors across all elements
   - Accessible by default

3. **Technical**
   - Build-time generation (no runtime cost)
   - Type-safe token access
   - Framework agnostic CSS

## Implementation Order

1. Create color utilities and accessibility module
2. Build surface-based token generator
3. Implement theme compiler
4. Create build integration
5. Update theme-init.js
6. Create base styles.css
7. Convert existing themes
8. Update Storybook
9. Create documentation

This system transforms theme creation from manual CSS authoring to algorithmic generation, ensuring consistency, accessibility, and completeness.
