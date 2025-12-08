# Theme Rules Schema Definition

This document describes the `theme-rules.json` schema - the single source of truth for all UI Kit theming rules, token roles, and color derivation logic.

## Key Concepts

### Token Roles vs Surfaces

**Token Role:** The first part of a token name (e.g., `page` in `--page-bg`, `controlPrimary` in `--controlPrimary-text`). Roles define WHAT the token is for - its semantic purpose. Roles are NOT CSS classes.

**Surface:** A CSS class (e.g., `.surface-sidebar`, `.surface-hero`) that creates a scoped area where token values are redefined. Surfaces allow different visual contexts on the same page. For example:
- A sidebar surface might darken `--page-bg` in light mode
- A primary-colored hero surface would redefine `--controlPrimary-bg` to be neutral so buttons remain visible

## Overview

The theme rules schema defines:
- **Semantic colors** - Fixed colors for consistent UX meaning across all themes
- **Token roles** - Categories of tokens (containers, controls, feedback) with their properties
- **Special tokens** - Focus, selection, links, scrollbar, skeleton, highlight
- **Component tokens** - Shortcut tokens for common component patterns
- **Color derivation rules** - How colors are computed from theme inputs
- **Accessibility requirements** - WCAG contrast standards
- **Theme input schema** - What theme JSON files must contain

---

## Semantic Colors

Fixed colors that remain consistent across ALL themes for UX clarity. Users learn that green = success, red = danger, etc.

```json
"semanticColors": {
  "success": { "base": "#16a34a" },
  "warning": { "base": "#f59e0b" },
  "danger": { "base": "#dc2626" },
  "info": { "base": "#0ea5e9" }
}
```

| Color | Hex | Purpose |
|-------|-----|---------|
| `success` | `#16a34a` | Positive outcomes, confirmations, completion states |
| `warning` | `#f59e0b` | Caution states, attention needed, pending actions |
| `danger` | `#dc2626` | Errors, destructive actions, critical states |
| `info` | `#0ea5e9` | Informational, neutral status, help content |

**Important:** These colors are NOT customizable per theme. They're fixed to maintain consistent meaning.

---

## Token Roles

Token roles are the first segment of a token name, defining its semantic purpose. For example, in `--card-bg`, the role is `card`. Roles are organized into categories.

### Role Categories

#### 1. Container Roles
For static background regions.

| Role | Description | Use Cases |
|------|-------------|-----------|
| `page` | Main application background | Body, main content area |
| `card` | Elevated content containers | Cards, panels, sections |
| `overlay` | Modal layer | Dialogs, sheets, modals |
| `popout` | Highest elevation | Dropdowns, menus, tooltips |
| `inset` | Recessed areas | Input fields, wells, code blocks |

#### 2. Control Roles
For interactive elements with state variations.

| Role | Description | Use Cases |
|------|-------------|-----------|
| `control` | Default interactive | Secondary buttons, list items |
| `controlPrimary` | Primary actions | CTA buttons, selected states |
| `controlDanger` | Destructive actions | Delete buttons, dangerous operations |
| `controlSubtle` | Minimal/ghost style | Tabs, icon buttons, toolbar items |
| `controlDisabled` | Non-interactive state | Disabled buttons and controls |

#### 3. Feedback Roles
For status communication.

| Role | Description | Use Cases |
|------|-------------|-----------|
| `success` | Positive feedback | Success alerts, confirmations |
| `warning` | Caution feedback | Warning banners, pending states |
| `danger` | Error feedback | Error messages, validation errors |
| `info` | Informational feedback | Info banners, help text |

### Token Structure by Role

Each role generates tokens based on its category:

#### Container Role Tokens
```
--{role}-bg          Background color
--{role}-text        Primary text color
--{role}-text-soft   Secondary text (30% less contrast)
--{role}-text-softer Tertiary text (50% less contrast)
--{role}-text-hard   Maximum contrast text
--{role}-border      Border color
--{role}-shadow      Box shadow
```

#### Control Role Tokens
```
--{role}-bg            Default background
--{role}-bg-hover      Hover state background
--{role}-bg-pressed    Pressed/active state background
--{role}-text          Default text color
--{role}-text-hover    Hover state text
--{role}-text-pressed  Pressed state text
--{role}-border        Default border
--{role}-border-hover  Hover state border
--{role}-border-pressed Pressed state border
--{role}-shadow        Box shadow
```

#### Inset Role Tokens
```
--inset-bg           Default background
--inset-bg-hover     Hover state
--inset-bg-focus     Focus state
--inset-text         Text color
--inset-text-soft    Placeholder/secondary text
--inset-border       Default border
--inset-border-focus Focus ring border
```

#### Feedback Role Tokens
```
--{role}-bg        Background color
--{role}-text      Text color
--{role}-text-soft Secondary text
--{role}-border    Border color
--{role}-icon      Icon color
```

---

## Derivation Rules

Derivation rules define HOW token values are computed from theme inputs.

### Derivation Syntax

| Pattern | Description | Example |
|---------|-------------|---------|
| `theme:primary` | Reference theme's primary color | `"bg": "theme:primary"` |
| `semantic:danger` | Reference semantic color | `"bg": "semantic:danger"` |
| `inherit:surface.token` | Inherit from another surface | `"text": "inherit:page.text"` |
| `transparent` | Literal transparent | `"border": "transparent"` |
| `contrast(bg)` | Auto-contrast text for background | `"text": "contrast(bg)"` |
| `darken(color, amount)` | Darken a color | `"bg-hover": "darken(theme:primary, 8)"` |
| `lighten(color, amount)` | Lighten a color | `"bg-hover": "lighten(theme:primary, 8)"` |
| `mix(color1, color2, weight)` | Blend two colors | `"text-soft": "mix(text, bg, 0.3)"` |
| `shiftHue(color, degrees)` | Rotate hue | `"secondary": "shiftHue(primary, 15)"` |
| `desaturate(color, amount)` | Reduce saturation | `"neutral": "desaturate(primary, 80)"` |

### Mode-Specific Derivation

Rules can specify different values for light/dark modes:

```json
"derivation": {
  "bg-hover": {
    "light": "darken(theme:primary, 8)",
    "dark": "lighten(theme:primary, 8)"
  }
}
```

### Built-in Color Derivation Rules

```json
"colorDerivation": {
  "rules": {
    "text-soft": {
      "formula": "mix(text, bg, 0.3)",
      "description": "30% less contrast than base text"
    },
    "text-softer": {
      "formula": "mix(text, bg, 0.5)",
      "description": "50% less contrast than base text"
    },
    "text-hard": {
      "formula": { "light": "#000000", "dark": "#ffffff" },
      "description": "Maximum contrast text"
    },
    "border-default": {
      "formula": { "light": "#e5e5e5", "dark": "#333333" },
      "description": "Subtle border color"
    },
    "secondary-from-primary": {
      "formula": "shiftHue(primary, 15)",
      "description": "Secondary derived by shifting primary hue 15 degrees"
    },
    "accent-from-primary": {
      "formula": "shiftHue(primary, 180)",
      "description": "Accent as complementary color to primary"
    },
    "neutral-from-primary": {
      "formula": "desaturate(primary, 80)",
      "description": "Neutral derived by desaturating primary"
    }
  }
}
```

---

## Special Tokens

Tokens for specific UI features that don't belong to surfaces.

### Focus Ring
```
--focus-ring         Color of focus ring (derived from primary)
--focus-ring-offset  Space between element and ring (default: 2px)
--focus-ring-width   Thickness of ring (default: 2px)
```

### Text Selection
```
--selection-bg       Background of selected text
--selection-text     Color of selected text
```

### Links
```
--link           Default link color
--link-hover     Hover state
--link-pressed   Active/pressed state
--link-visited   Visited link color
```

### Scrollbar
```
--scrollbar-track       Track background
--scrollbar-thumb       Thumb color
--scrollbar-thumb-hover Thumb hover state
```

### Skeleton Loading
```
--skeleton-bg      Base skeleton color
--skeleton-shimmer Shimmer highlight color
```

### Text Highlight
```
--highlight-bg    Search/highlight background
--highlight-text  Highlighted text color
```

---

## Component Tokens

Shortcut tokens for common component patterns. These reference spacing/radius tokens.

```json
"componentTokens": {
  "button-padding-x": "var(--space-4)",
  "button-padding-y": "var(--space-2)",
  "button-radius": "var(--radius-md)",
  "input-height": "40px",
  "input-padding-x": "var(--space-3)",
  "card-padding": "var(--space-4)",
  "modal-padding": "var(--space-6)",
  "avatar-size-sm": "24px",
  "avatar-size-md": "32px",
  "avatar-size-lg": "48px"
}
```

---

## Accessibility Requirements

WCAG contrast ratio requirements enforced by the generator.

### AA Level (Default)
| Content Type | Minimum Ratio |
|--------------|---------------|
| Normal text | 4.5:1 |
| Large text (18px+) | 3:1 |
| UI components | 3:1 |

### AAA Level (High Contrast)
| Content Type | Minimum Ratio |
|--------------|---------------|
| Normal text | 7:1 |
| Large text (18px+) | 4.5:1 |
| UI components | 4.5:1 |

---

## Theme Input Schema

Defines what theme JSON files must contain.

### Required Fields
- `id` - Unique identifier (lowercase, hyphens allowed, e.g., `"my-theme"`)
- `name` - Display name (e.g., `"My Theme"`)
- `colors.primary` - Primary brand color (hex format)

### Optional Fields
- `description` - Theme description
- `colors.secondary` - Secondary color (auto-derived if omitted)
- `colors.accent` - Accent color (auto-derived if omitted)
- `colors.neutral` - Neutral/gray base (auto-derived if omitted)
- `config` - Color adjustments
- `typography` - Font settings
- `spacing` - Spacing scale
- `radii` - Border radius style
- `animation` - Animation settings
- `accessibility` - Target contrast level
- `overrides` - Direct token overrides

See [theme-definition.md](../theme-definition.md) for complete theme authoring guide.

---

## Surfaces (CSS Classes)

Surfaces are CSS classes that create scoped areas where token values are redefined. They enable different visual contexts on the same page while maintaining accessibility.

### Why Surfaces Exist

The default token values work well for the main page context. But when you have:
- A **sidebar** with a different background shade
- A **hero section** with a primary-colored background
- A **footer** with an inverted color scheme

...the default token values may not provide sufficient contrast or visual hierarchy. Surfaces solve this by redefining tokens within their scope.

### Surface Examples

#### Sidebar Surface
A sidebar might be slightly darker (light mode) or lighter (dark mode) than the main page:

```css
.surface-sidebar {
  --page-bg: #f0f0f0;           /* Darker than default #fafafa */
  --card-bg: #ffffff;           /* Cards pop more against darker bg */
  --control-bg: #e5e5e5;        /* Adjusted for new context */
}

[data-mode="dark"] .surface-sidebar {
  --page-bg: #1a1a1a;           /* Lighter than default #0f0f0f */
  --card-bg: #262626;
  --control-bg: #333333;
}
```

#### Primary Hero Surface
On a primary-colored background, primary buttons would be invisible. Redefine them:

```css
.surface-primary-hero {
  --page-bg: var(--controlPrimary-bg);
  --page-text: var(--controlPrimary-text);

  /* Primary buttons become neutral on primary bg */
  --controlPrimary-bg: #ffffff;
  --controlPrimary-text: var(--controlPrimary-bg);
  --controlPrimary-bg-hover: #f0f0f0;
}
```

#### Inverted Surface
For dark sections in light mode (or vice versa):

```css
.surface-inverted {
  --page-bg: #1a1a1a;
  --page-text: #e5e5e5;
  --card-bg: #262626;
  --control-bg: #333333;
  /* ... all tokens redefined for inverted context */
}
```

### Surface Best Practices

1. **Only redefine what's necessary** - Don't copy all tokens, just the ones that need adjustment
2. **Maintain contrast ratios** - Ensure text remains readable (4.5:1 for AA)
3. **Test both modes** - A surface should work in both light and dark modes
4. **Nest carefully** - Surfaces can nest, but deeply nested surfaces get complex
5. **Use semantic names** - `.surface-sidebar` not `.surface-dark-gray`

### Surface vs Token Roles

| Concept | What it is | Example |
|---------|-----------|---------|
| **Token Role** | First part of token name, defines purpose | `card` in `--card-bg` |
| **Surface** | CSS class that redefines tokens in a scope | `.surface-sidebar` |

Token roles are defined in this schema. Surfaces are authored by theme creators or application developers to handle specific UI contexts.
