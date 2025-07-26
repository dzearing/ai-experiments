# @claude-flow/ui-kit

Framework-agnostic UI foundation with CSS variables, themes, and design tokens.

## Installation

```bash
pnpm add @claude-flow/ui-kit
```

## Quick Start

### 1. Add Styles and Theme Init

⚠️ **CRITICAL**: The theme-init.js script MUST be inlined directly in your HTML `<head>` to prevent flash of unstyled content (FOUC). Loading it as an external file will cause the page to render with the default theme before switching to the user's preference.

```html
<!-- index.html -->
<head>
  <!-- CSS Reset, Variables, and Themes -->
  <link rel="stylesheet" href="node_modules/@claude-flow/ui-kit/dist/styles.css" />

  <!-- ❌ WRONG - Will cause flash of unstyled content -->
  <!-- <script src="node_modules/@claude-flow/ui-kit/dist/theme-init.js"></script> -->

  <!-- ✅ CORRECT - Inline the script to prevent FOUC -->
  <script>
    /* Copy the contents of node_modules/@claude-flow/ui-kit/dist/theme-init.js here */
    (function () {
      'use strict';
      // ... theme initialization code ...
    })();
  </script>
</head>
```

For build tools, you can automate this inlining process during your build step.

### 2. Use CSS Variables

```css
/* Your component styles */
.button {
  background-color: var(--color-primary);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: var(--font-size-body);
  transition: all var(--duration-fast) var(--easing-ease);
}

.button:hover {
  background-color: var(--color-primary-hover);
}
```

## Features

- 🎨 **8 Built-in Themes** - Light and dark modes for each
- 🔧 **CSS Variables** - Comprehensive design tokens
- 📐 **CSS Reset** - Consistent cross-browser baseline
- 🚀 **Zero JS Runtime** - Pure CSS (except theme init)
- ♿ **Accessible** - WCAG compliant color contrasts
- 📱 **Responsive** - Mobile-first design tokens
- 🎯 **Framework Agnostic** - Works with any framework

## Design Tokens

### Colors

- Primary, Secondary, Neutral scales (50-900)
- Semantic colors (success, warning, error)
- Automatic dark mode variants

### Typography

- Modular type scale (display to caption)
- Font weights (300-700)
- Line heights (tight, normal, relaxed)

### Spacing

- 8px based scale (2xs to 3xl)
- Consistent rhythm and hierarchy

### Animation

- Duration scale (instant to deliberate)
- Easing functions (ease, ease-in, ease-out)
- Respects prefers-reduced-motion

### Corners (Border Radius)

- Scale from sharp to pill (none to full)
- Component-specific recommendations

## Theme Management

```typescript
import { ThemeManager } from '@claude-flow/ui-kit';

// Initialize theme manager
const themeManager = new ThemeManager();

// Get current theme
const currentTheme = themeManager.currentTheme;

// Change theme
themeManager.setTheme('ocean');

// Toggle dark mode
themeManager.setMode('dark');

// Listen for theme changes
themeManager.on('themeChange', (theme) => {
  console.log('Theme changed to:', theme);
});
```

## Development

```bash
# Install dependencies
pnpm install

# Start Storybook (view all tokens and themes)
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test

# Type checking
pnpm typecheck
```

## Storybook Documentation

The UI Kit comes with comprehensive Storybook documentation:

- **Foundations** - Interactive guides for all design tokens
- **Theme Showcase** - Preview all themes
- **Theme Creator** - Build custom themes with visual tools
- **Integration Examples** - Framework-specific guides
- **Accessibility** - Contrast checkers and guidelines

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- CSS Variables required (no IE11)

## License

Private - Internal use only
