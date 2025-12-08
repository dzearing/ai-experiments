# @claude-flow/ui-kit

A comprehensive, framework-agnostic design system built on CSS variables, featuring a surface-based color system, multiple themes, and extensive design tokens for building consistent, accessible user interfaces.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Surface-Based Color System](#surface-based-color-system)
- [Design Tokens](#design-tokens)
- [Theme System](#theme-system)
- [Internationalization](#internationalization)
- [Best Practices](#best-practices)
- [Migration Guide](#migration-guide)
- [Browser Support](#browser-support)

## Installation

```bash
pnpm add @claude-flow/ui-kit
```

## Quick Start

### 1. Add Styles and Theme Engine

The UI Kit provides a clean, symmetric theme architecture:

- **`src/theme.ts`** → **`dist/theme.js`** - Core theme engine (auto-initializes, handles persistence, system detection)
- **`src/theme-switcher.ts`** → **`dist/theme-switcher.js`** - Optional UI controls for demos/mockups

Both files are built as ES modules that can be imported in HTML.

```html
<!-- index.html -->
<head>
  <!-- CSS Reset, Variables, and Themes -->
  <link rel="stylesheet" href="node_modules/@claude-flow/ui-kit/dist/styles.css" />

  <!-- Theme Engine (auto-initializes, prevents FOUC) -->
  <script type="module" src="node_modules/@claude-flow/ui-kit/dist/theme.js"></script>
  
  <!-- Optional: Theme Switcher UI for demos/development -->
  <!-- <script type="module" src="node_modules/@claude-flow/ui-kit/dist/theme-switcher.js"></script> -->
</head>
```

The theme engine auto-initializes and prevents FOUC by immediately applying stored preferences or system defaults.

### 2. Configuration (Optional)

If your assets are not in the default location, you can configure the base path for UI Kit assets:

```html
<script>
  // Set the base path for all UI Kit assets (themes, fonts, icons, etc.)
  // This should be set before loading the theme engine
  window.__uiKitBasePath = '/path/to/ui-kit/assets/';
</script>
```

The theme engine will automatically use this path to load theme CSS files from `${__uiKitBasePath}themes/`. If not specified, it will use smart defaults based on your file structure.

### 3. Use Design Tokens

```css
/* Component using surface-based tokens */
.card {
  background: var(--color-raised-background);
  color: var(--color-raised-text);
  border: 1px solid var(--color-raised-border);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.card-title {
  color: var(--color-raised-textHard10); /* Emphasized text */
  font-size: var(--font-size-h4);
  font-weight: var(--font-weight-semibold);
  margin-block-end: var(--spacing-md);
}

.card-subtitle {
  color: var(--color-raised-textSoft20); /* Muted text */
  font-size: var(--font-size-body);
}
```

## Surface-Based Color System

Our design system uses a revolutionary surface-based approach to colors, ensuring perfect contrast ratios and accessibility compliance across all theme variations.

### Understanding Surfaces

A **surface** is a distinct visual context where content appears. Each surface defines a complete set of foreground colors that are guaranteed to meet WCAG contrast requirements with their background.

### Token Pattern

Every color token follows this pattern:

```
--color-[surface]-[concept]-[state]
```

- **Surface**: The background context (e.g., `body`, `raised`, `buttonPrimary`)
- **Concept**: The element type (e.g., `text`, `background`, `border`, `link`)
- **State**: Optional interaction state (e.g., `hover`, `active`, `disabled`)

### Example Usage

```css
/* Primary button using surface tokens */
.button-primary {
  background: var(--color-buttonPrimary-background);
  color: var(--color-buttonPrimary-text);
  border: 1px solid var(--color-buttonPrimary-border);
}

.button-primary:hover {
  background: var(--color-buttonPrimary-background-hover);
  color: var(--color-buttonPrimary-text-hover);
}

/* Error notification */
.notification-error {
  background: var(--color-noticeDanger-background);
  color: var(--color-noticeDanger-text);
  border-inline-start: 4px solid var(--color-noticeDanger-border);
}
```

### Soft/Hard Variants

Instead of arbitrary number scales, we use semantic contrast modifiers:

- **Soft**: Reduces contrast for subtle elements
  - `textSoft10` = 10% less contrast
  - `textSoft20` = 20% less contrast (replaces "muted")
  - `textSoft30` = 30% less contrast

- **Hard**: Increases contrast for emphasis
  - `textHard10` = 10% more contrast (replaces "heading")
  - `textHard20` = 20% more contrast

```css
.content {
  color: var(--color-body-text); /* Base text */
}

.content-muted {
  color: var(--color-body-textSoft20); /* Muted text */
}

.content-heading {
  color: var(--color-body-textHard10); /* Emphasized text */
}
```

### Available Surfaces

#### Base Surfaces
- `body` - Main application background
- `raised` - Cards and elevated panels
- `overlay` - Modals and dialogs

#### Action Surfaces
- `buttonPrimary` - Primary actions
- `buttonSecondary` - Secondary actions
- `buttonDanger` - Destructive actions
- `buttonSuccess` - Positive actions
- `buttonNeutral` - Default buttons

#### Notification Surfaces
- `noticeInfo` - Informational messages
- `noticeSuccess` - Success feedback
- `noticeWarning` - Warnings
- `noticeDanger` - Errors

#### Specialized Surfaces
- `codeBlock` - Code block backgrounds
- `codeInline` - Inline code
- `tooltip` - Tooltip backgrounds
- `menu` - Dropdown menus

## Design Tokens

### Typography

```css
/* Font Families */
--font-family         /* System font stack */
--font-family-mono    /* Monospace font stack */
--font-family-serif   /* Serif font stack */

/* Font Sizes - Modular Scale (1.2 ratio) */
--font-size-2xs       /* 0.694rem */
--font-size-xs        /* 0.833rem */
--font-size-sm        /* 0.875rem */
--font-size-base      /* 1rem */
--font-size-md        /* 1.2rem */
--font-size-lg        /* 1.44rem */
--font-size-xl        /* 1.728rem */
--font-size-2xl       /* 2.074rem */
--font-size-3xl       /* 2.488rem */
--font-size-4xl       /* 2.986rem */

/* Semantic Sizes */
--font-size-display   /* Display headings */
--font-size-h1        /* H1 headings */
--font-size-body      /* Body text */
--font-size-caption   /* Small text */
--font-size-code      /* Code text */

/* Font Weights */
--font-weight-light      /* 300 */
--font-weight-regular    /* 400 */
--font-weight-medium     /* 500 */
--font-weight-semibold   /* 600 */
--font-weight-bold       /* 700 */

/* Line Heights */
--line-height-none       /* 1 */
--line-height-tight      /* 1.2 */
--line-height-snug       /* 1.375 */
--line-height-normal     /* 1.5 */
--line-height-relaxed    /* 1.625 */
--line-height-loose      /* 1.75 */
```

### Spacing

Based on a 4px grid system:

```css
/* Base Spacing Scale */
--spacing-0        /* 0 */
--spacing-px       /* 1px */
--spacing-2xs      /* 2px */
--spacing-xs       /* 4px */
--spacing-sm       /* 8px */
--spacing-md       /* 12px */
--spacing-base-default /* 16px */
--spacing-lg       /* 20px */
--spacing-xl       /* 24px */
--spacing-2xl      /* 32px */
--spacing-3xl      /* 40px */
--spacing-4xl      /* 48px */
--spacing-5xl      /* 64px */

/* Component Spacing */
--spacing-button-x    /* Horizontal button padding */
--spacing-button-y    /* Vertical button padding */
--spacing-input-x     /* Input field padding */
--spacing-card        /* Card content padding */
--spacing-modal       /* Modal padding */
--spacing-section     /* Section spacing */
```

### Animation

```css
/* Durations */
--duration-fastest      /* 100ms */
--duration-fast20       /* 150ms */
--duration-fast10       /* 200ms */
--duration-normal       /* 300ms */
--duration-slow10       /* 400ms */
--duration-slow20       /* 600ms */
--duration-slowest      /* 1000ms */

/* Easing Functions */
--easing-linear        /* linear */
--easing-ease          /* ease */
--easing-ease-in       /* ease-in */
--easing-ease-out      /* ease-out */
--easing-ease-in-out   /* ease-in-out */
--easing-bounce        /* Custom bounce curve */
```

### Shadows

```css
--shadow-xs      /* Subtle shadow */
--shadow-sm      /* Small shadow */
--shadow-md      /* Medium shadow */
--shadow-lg      /* Large shadow */
--shadow-xl      /* Extra large shadow */
--shadow-inner   /* Inner shadow */
--shadow-none    /* No shadow */
```

### Border Radius

```css
--radius-none    /* 0 */
--radius-sm      /* 0.125rem */
--radius-md      /* 0.25rem */
--radius-lg      /* 0.5rem */
--radius-xl      /* 0.75rem */
--radius-2xl     /* 1rem */
--radius-3xl     /* 1.5rem */
--radius-full    /* 9999px */
```

## Theme System

### Built-in Themes

The UI Kit includes 8 professionally designed themes, each with light and dark modes:

- **Default** - Clean and modern
- **Ocean** - Cool blues and aquas
- **Sunset** - Warm oranges and purples
- **Nature** - Earthy greens and browns
- **Minimal** - Black, white, and grays
- **Vibrant** - Bold and colorful
- **Corporate** - Professional blues
- **Monochrome** - Single color variations

### Theme Management API

The UI Kit provides both a simple window-based API and a more advanced TypeScript API for theme management.

#### Simple Window API (Recommended for Easy Integration)

After including the theme script, you have access to the global `__uiKitTheme` API. Theme preferences are persisted in localStorage under the key `ui-kit-theme`.

```javascript
// Get current theme configuration
const config = window.__uiKitTheme.getTheme(); 
// Returns: { theme: 'ocean', mode: 'dark' }

// Change theme only (keeps current mode)
await window.__uiKitTheme.setTheme({ theme: 'ocean' });

// Change mode only (keeps current theme)  
await window.__uiKitTheme.setTheme({ mode: 'dark' });  // Options: 'light', 'dark', 'auto'

// Change both theme and mode
await window.__uiKitTheme.setTheme({ theme: 'sunset', mode: 'light' });

// Toggle between light and dark modes
await window.__uiKitTheme.toggleMode();

// Get all available themes
const themes = await window.__uiKitTheme.getAvailableThemes();
// Returns: [
//   { id: 'default', name: 'Default', modes: ['light', 'dark'] },
//   { id: 'ocean', name: 'Ocean', modes: ['light', 'dark'] },
//   ...
// ]

// Listen for theme changes (including from other tabs)
window.addEventListener('themechange', (event) => {
  console.log('Theme changed:', event.detail);
  // event.detail = { theme: 'ocean', type: 'dark', requestedType: 'auto' }
});
```

#### Easy Theme Switcher for Demos

For development and demos, use the built-in theme switcher:

```html
<!-- Automatically adds theme controls to the page -->
<script type="module" src="node_modules/@claude-flow/ui-kit/dist/theme-switcher.js"></script>
```

Or customize it:

```html
<script type="module">
  import { createThemeSwitcher } from '@claude-flow/ui-kit/dist/theme-switcher.js';
  
  createThemeSwitcher({
    position: 'top-left', // 'top-right', 'bottom-left', 'bottom-right'
    compact: true        // Smaller, vertical layout
  });
</script>
```

#### Advanced TypeScript API

For more complex applications, you can use the TypeScript API:

```typescript
// Import from the built module or from the package
import { setTheme, getTheme, toggleMode, reset, subscribe, getAvailableThemes } from '@claude-flow/ui-kit/dist/theme.js';
// or 
import { setTheme, getTheme, toggleMode, reset, subscribe, getAvailableThemes } from '@claude-flow/ui-kit';

// Get current theme and mode
const config = getTheme(); // { theme: 'ocean', mode: 'dark' }

// Change theme
await setTheme({ theme: 'sunset' });

// Change mode
await setTheme({ mode: 'dark' });
await setTheme({ mode: 'auto' }); // Follows system preference

// Toggle between light and dark
await toggleMode();

// Listen for changes
const unsubscribe = subscribe(({ theme, mode, effectiveMode }) => {
  console.log(`Theme changed to ${theme} (${effectiveMode} mode)`);
});

// Get all available themes
const themes = await getAvailableThemes();

// Reset to defaults
await reset();

// Cleanup listener
unsubscribe();
```

### Custom Theme Creation

Create custom themes using the theme generator:

```typescript
import { generateTheme } from '@claude-flow/ui-kit/theme-generator';

const customTheme = generateTheme({
  id: 'my-theme',
  name: 'My Custom Theme',
  description: 'A theme for my brand',
  colors: {
    primary: '#6200EA',
    secondary: '#03DAC6', // Optional - computed if not provided
    accent: '#FF0266',     // Optional - computed if not provided
    neutral: '#37474F'     // Optional - derived from primary
  },
  accessibility: {
    targetLevel: 'AA',     // 'AA' | 'AAA'
    enforceLevel: true,    // Auto-adjust colors for compliance
    largeTextLevel: 'AA'   // Lower requirement for large text
  },
  config: {
    saturation: 10,        // Boost saturation by 10%
    temperature: -5,       // Slightly cooler
    contrastBoost: 15      // Increase contrast between elements
  }
});
```

## Internationalization

### RTL/LTR Support

The UI Kit uses CSS logical properties for seamless RTL/LTR support:

```css
/* Use logical properties instead of physical ones */
.component {
  /* ❌ Avoid */
  margin-left: var(--spacing-md);
  padding-right: var(--spacing-lg);
  
  /* ✅ Preferred */
  margin-inline-start: var(--spacing-md);
  padding-inline-end: var(--spacing-lg);
}

/* Border radius with logical properties */
.card {
  border-start-start-radius: var(--radius-lg);
  border-start-end-radius: var(--radius-lg);
}
```

### Direction-Aware Utilities

```css
/* Automatically flips in RTL */
.icon-arrow {
  transform: rotate(0deg);
}

[dir="rtl"] .icon-arrow {
  transform: rotate(180deg);
}

/* Use CSS logical values */
.text-start {
  text-align: start; /* left in LTR, right in RTL */
}

.float-end {
  float: inline-end; /* right in LTR, left in RTL */
}
```

## Best Practices

### 1. Always Use Complete Surface Sets

```css
/* ✅ Good - Using colors from the same surface */
.alert-error {
  background: var(--color-noticeDanger-background);
  color: var(--color-noticeDanger-text);
  border: 1px solid var(--color-noticeDanger-border);
}

/* ❌ Bad - Mixing colors from different surfaces */
.alert-error {
  background: var(--color-noticeDanger-background);
  color: var(--color-body-text); /* May not have proper contrast! */
}
```

### 2. Leverage Semantic Tokens

```css
/* ✅ Good - Using semantic spacing */
.form-group {
  margin-block-end: var(--spacing-lg);
}

.form-label {
  margin-block-end: var(--spacing-xs);
}

/* ❌ Bad - Using arbitrary values */
.form-group {
  margin-bottom: 20px; /* Not aligned with design system */
}
```

### 3. Respect Motion Preferences

```css
/* ✅ Good - Respecting user preferences */
.animated {
  transition: transform var(--duration-normal) var(--easing-ease);
}

@media (prefers-reduced-motion: reduce) {
  .animated {
    transition: none;
  }
}
```

### 4. Use Logical Properties for I18n

```css
/* ✅ Good - Works in both LTR and RTL */
.sidebar {
  width: var(--sidebar-width);
  border-inline-end: 1px solid var(--color-body-border);
  padding-inline: var(--spacing-lg);
}

/* ❌ Bad - Only works in LTR */
.sidebar {
  border-right: 1px solid var(--color-body-border);
  padding-left: var(--spacing-lg);
  padding-right: var(--spacing-lg);
}
```

### 5. Maintain Contrast Ratios

```css
/* ✅ Good - Using soft/hard variants for hierarchy */
.content {
  color: var(--color-body-text);
}

.content-muted {
  color: var(--color-body-textSoft20);
}

.content-emphasis {
  color: var(--color-body-textHard10);
}
```

## Migration Guide

### From Traditional Color Systems

If you're migrating from a traditional numbered color system (e.g., `color-gray-500`), use this mapping:

| Old Pattern | New Surface-Based Pattern | Purpose |
|------------|---------------------------|---------|
| `--color-gray-50` | `--color-body-backgroundSoft20` | Subtle backgrounds |
| `--color-gray-100` | `--color-body-backgroundSoft10` | Light backgrounds |
| `--color-gray-200` | `--color-raised-background` | Card backgrounds |
| `--color-gray-500` | `--color-body-textSoft20` | Muted text |
| `--color-gray-700` | `--color-body-textSoft10` | Secondary text |
| `--color-gray-900` | `--color-body-text` | Primary text |
| `--color-primary-500` | `--color-body-link` | Links |
| `--color-primary-600` | `--color-buttonPrimary-background` | Primary buttons |
| `--color-danger-600` | `--color-buttonDanger-background` | Danger buttons |
| `--color-danger-100` | `--color-noticeDanger-background` | Error backgrounds |

### From Physical to Logical Properties

| Physical Property | Logical Property | Notes |
|------------------|------------------|-------|
| `margin-left` | `margin-inline-start` | Start side margin |
| `margin-right` | `margin-inline-end` | End side margin |
| `padding-top` | `padding-block-start` | Block start padding |
| `padding-bottom` | `padding-block-end` | Block end padding |
| `left` | `inset-inline-start` | Positioning |
| `right` | `inset-inline-end` | Positioning |
| `text-align: left` | `text-align: start` | Text alignment |
| `float: right` | `float: inline-end` | Floating |
| `border-left` | `border-inline-start` | Borders |

### Step-by-Step Migration

1. **Audit Current Usage**
   ```bash
   # Find hardcoded colors
   grep -r "#[0-9a-fA-F]\{3,6\}" src/
   
   # Find physical properties
   grep -r "margin-left\|margin-right\|padding-left\|padding-right" src/
   ```

2. **Replace Colors with Surface Tokens**
   - Identify the surface context (body, button, card, etc.)
   - Replace color values with appropriate surface tokens
   - Test contrast ratios remain compliant

3. **Update to Logical Properties**
   - Replace physical properties with logical equivalents
   - Test in both LTR and RTL modes

4. **Verify Theme Compatibility**
   - Test all themes in both light and dark modes
   - Ensure no hardcoded colors remain

## Browser Support

- Chrome/Edge 88+ (latest - 2 versions)
- Firefox 85+ (latest - 2 versions)
- Safari 14+ (latest - 2 versions)
- CSS Variables (Custom Properties) required
- CSS Logical Properties required
- No Internet Explorer support

## License

Private - Internal use only
