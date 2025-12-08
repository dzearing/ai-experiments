# UI-Kit Revisions

A complete blueprint for revising the UI-Kit design system to be intuitive, learnable, and production-ready.

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Goals](#2-goals)
3. [Component & State Taxonomy](#3-component--state-taxonomy)
4. [Token Architecture](#4-token-architecture)
5. [Theme System](#5-theme-system)
6. [Build Tools](#6-build-tools)
7. [UI-Kit Website](#7-ui-kit-website)
8. [UI-Kit-React Updates](#8-ui-kit-react-updates)
9. [Validation Strategy](#9-validation-strategy)
10. [Implementation Roadmap](#10-implementation-roadmap)

---

## 1. Current State Analysis

### 1.1 Package Structure (New)

```
packages/
├── ui-kit/
│   ├── core/              # @ui-kit/core - tokens, themes, surfaces, build tools
│   ├── react/             # @ui-kit/react - React component library
│   ├── website/           # @ui-kit/website - documentation site
│   └── mock-pages/        # @ui-kit/mock-pages - Storybook with mock UI pages
├── ui-kit-legacy/         # Old ui-kit (renamed, kept for reference during migration)
└── ui-kit-react/          # Old ui-kit-react (to be migrated)
```

Note: UI-Kit is framework-agnostic and has no relationship to the parent repository. It happens to live here for convenience but should be treated as an independent package.

### 1.2 What Exists Today

**Strengths:**
- Surface-based color architecture (guarantees accessibility)
- Theme generator that compiles minimal definitions into complete CSS
- 15 built-in themes with light/dark modes (30 CSS files)
- WCAG AA compliance built into color generation
- Storybook documentation with interactive token browsers

**Problems:**

| Issue | Example | Impact |
|-------|---------|--------|
| Documentation doesn't match implementation | README says `--spacing-xs`, code uses `--spacing-small20` | Developers can't trust docs |
| Two parallel theme systems | `test/themes/` uses different tokens than `dist/themes/` | Confusion about which is canonical |
| Inconsistent naming | `small10` vs `small20` (counterintuitive - higher number = smaller) | Hard to learn |
| Missing surfaces | No `menu`, `tooltip`, `overlay` despite being documented | Incomplete system |
| No component guidance | Tokens exist but no mapping to real components | Developers guess which tokens to use |

### 1.3 File Structure Issues

```
packages/ui-kit/
├── src/
│   ├── styles/variables/        # Token definitions
│   │   ├── spacing.css          # Uses small10/large20 naming
│   │   ├── typography.css       # Uses small10/large20 naming
│   │   └── colors.css           # Mostly fallbacks, real colors in themes
│   ├── themes/
│   │   ├── surface-definitions.ts  # Defines: body, panel, primary, neutral, danger, success, warning, info, input, *Soft variants
│   │   └── theme-definitions.ts    # 15 theme color palettes
│   └── theme-generator/         # Compiles themes
├── test/
│   └── themes/                  # DIFFERENT token system (--background, --color vs --color-body-background)
└── dist/
    └── themes/                  # Generated CSS (30 files)
```

### 1.4 Current Token Examples

**Spacing (confusing):**
```css
--spacing-small20: 4px;   /* 20 = smallest? */
--spacing-small10: 8px;   /* 10 = larger than 20? */
--spacing-small5: 12px;
--spacing: 16px;          /* base */
--spacing-large5: 20px;
--spacing-large10: 24px;  /* larger numbers = larger values here */
```

**Surfaces (incomplete):**
```typescript
// surface-definitions.ts defines these:
'body', 'panel', 'primary', 'neutral', 'danger', 'success', 'warning', 'info', 'input',
'infoSoft', 'successSoft', 'warningSoft', 'dangerSoft'

// README claims these exist (but they don't):
'raised', 'overlay', 'buttonPrimary', 'buttonSecondary', 'buttonNeutral',
'codeBlock', 'codeInline', 'tooltip', 'menu', 'noticeInfo', 'noticeDanger'
```

---

## 2. Goals

### 2.1 Build Any UX Control
The token system must support ALL common UI components without requiring component-specific tokens. Extract commonalities into robust, predictable patterns.

### 2.2 Easy to Learn
- A developer should understand the system in under 30 minutes
- Token names should be self-documenting
- Website with tutorials, not just reference docs

### 2.3 Runtime vs Compile-Time Flexibility
- Colors: runtime (CSS variables) for theming
- Spacing/typography: can be static for performance
- Configurable per-project

### 2.4 Optimal Bundle Size
- Not so many tokens it bloats the bundle
- Not so few it impedes usability
- Target: ~150-200 tokens, ~4KB gzipped per theme

### 2.5 Theme Designer Experience
- Visual tool to create themes
- Adjust colors, contrast, temperature
- Add custom surfaces
- Export as JSON, compile to CSS

### 2.6 High-Contrast AAA Theme
- Built-in AAA-compliant theme (7:1 contrast)
- Auto-detect `prefers-contrast: more`
- Light and dark variants

### 2.7 Zero-Flash Theme Loading
- Inline script prevents white-to-dark flash
- Reads system preference + localStorage
- Loads correct CSS before first paint

### 2.8 Polished Website
- The UI-Kit website IS the proving ground
- Must be beautiful, well-crafted, smooth transitions
- Uses UI-Kit exclusively for its own styling
- Step-by-step learning path

---

## 3. Component & State Taxonomy

### 3.1 The Challenge

We need tokens that work for:

| Category | Components |
|----------|------------|
| **Buttons** | Primary, secondary, ghost, danger, icon-only |
| **Inputs** | Text, textarea, select, date picker |
| **Selection** | Checkbox, radio, switch/toggle |
| **Progress** | Progress bar, spinner, skeleton |
| **Navigation** | Tabs, breadcrumbs, pagination |
| **Lists** | List items, menu items, tree items |
| **Feedback** | Alerts, toasts, banners |
| **Overlays** | Modal, dialog, popover, dropdown, tooltip |
| **Data** | Table rows, cards, avatars |
| **Tags** | Chips, badges, labels |
| **Text** | Headings, body, captions, code, links |

Each can have states:
- **rest** - default appearance
- **hover** - mouse over
- **pressed/active** - mouse down or activated
- **focus** - keyboard focus
- **selected** - chosen/checked state
- **disabled** - non-interactive

### 3.2 Extracting Commonalities

Instead of `--button-primary-bg`, `--checkbox-checked-bg`, `--tab-selected-bg`, we identify WHAT these share:

```
┌─────────────────────────────────────────────────────────────────┐
│                    SURFACE TYPES                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CONTAINERS (static backgrounds)                                │
│  ├── page      → The main application background                │
│  ├── card      → Elevated content containers                    │
│  ├── overlay   → Modals, dialogs, sheets, popovers              │
│  ├── popout    → Dropdowns, menus, tooltips (highest elevation) │
│  └── inset     → Recessed areas (input fields, wells)           │
│                                                                 │
│  CONTROLS (interactive elements)                                │
│  ├── control          → Default interactive (buttons, list items)│
│  ├── controlPrimary   → Primary actions (CTA buttons, selected) │
│  ├── controlDanger    → Destructive actions                     │
│  ├── controlSubtle    → Ghost/minimal buttons, tabs             │
│  └── controlDisabled  → Non-interactive state                   │
│                                                                 │
│  FEEDBACK (status communication)                                │
│  ├── success   → Positive outcomes, confirmations               │
│  ├── warning   → Caution, attention needed                      │
│  ├── danger    → Errors, destructive states                     │
│  └── info      → Informational, neutral status                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Component-to-Surface Mapping

This is the key insight: components don't need their own tokens, they USE surfaces:

| Component | Rest State | Hover | Pressed | Selected | Disabled |
|-----------|-----------|-------|---------|----------|----------|
| **Button (default)** | control | control-hover | control-pressed | - | controlDisabled |
| **Button (primary)** | controlPrimary | controlPrimary-hover | controlPrimary-pressed | - | controlDisabled |
| **Button (ghost)** | controlSubtle | controlSubtle-hover | controlSubtle-pressed | - | controlDisabled |
| **Button (danger)** | controlDanger | controlDanger-hover | controlDanger-pressed | - | controlDisabled |
| **Checkbox (unchecked)** | control | control-hover | control-pressed | - | controlDisabled |
| **Checkbox (checked)** | controlPrimary | controlPrimary-hover | controlPrimary-pressed | - | controlDisabled |
| **Switch (off)** | control | control-hover | - | - | controlDisabled |
| **Switch (on)** | controlPrimary | controlPrimary-hover | - | - | controlDisabled |
| **Radio (unselected)** | control | control-hover | control-pressed | - | controlDisabled |
| **Radio (selected)** | controlPrimary | controlPrimary-hover | - | - | controlDisabled |
| **Tab (unselected)** | controlSubtle | controlSubtle-hover | controlSubtle-pressed | - | controlDisabled |
| **Tab (selected)** | controlPrimary | - | - | - | - |
| **List item** | page (transparent) | controlSubtle-hover | controlSubtle-pressed | controlPrimary | controlDisabled |
| **Menu item** | popout | controlSubtle-hover | controlSubtle-pressed | controlPrimary | controlDisabled |
| **Dropdown trigger** | control | control-hover | control-pressed | control-pressed | controlDisabled |
| **Input field** | inset | inset-hover | inset-focus | - | controlDisabled |
| **Text input** | inset | inset-hover | inset-focus | - | controlDisabled |
| **Select** | inset | inset-hover | inset-focus | - | controlDisabled |
| **Card** | card | - | - | - | - |
| **Modal** | overlay | - | - | - | - |
| **Tooltip** | popout | - | - | - | - |
| **Dropdown menu** | popout | - | - | - | - |
| **Toast (success)** | success | - | - | - | - |
| **Toast (error)** | danger | - | - | - | - |
| **Alert banner** | info/warning/danger/success | - | - | - | - |
| **Progress bar track** | inset | - | - | - | - |
| **Progress bar fill** | controlPrimary | - | - | - | - |
| **Avatar** | card | - | - | - | - |
| **Chip/Tag** | control | control-hover | - | - | - |
| **Badge** | controlPrimary/danger/success | - | - | - | - |
| **Link** | (text + underline) | link-hover | link-pressed | link-visited | - |
| **Code inline** | inset (subtle) | - | - | - | - |
| **Code block** | inset | - | - | - | - |
| **Table row** | page | controlSubtle-hover | - | controlPrimary | - |
| **Skeleton** | inset (animated) | - | - | - | - |
| **Spinner** | controlPrimary (animated) | - | - | - | - |

### 3.4 Surface Token Structure

Each surface provides:

```css
/* For surface "control" */
--control-bg                 /* background color */
--control-bg-hover           /* background on hover */
--control-bg-pressed         /* background when pressed/active */
--control-text               /* text/icon color */
--control-text-hover
--control-text-pressed
--control-border             /* border color */
--control-border-hover
--control-border-pressed
--control-shadow             /* box-shadow value */
```

**Soft/Hard variants for text hierarchy:**
```css
--page-text              /* Base text (body copy) */
--page-text-soft         /* Muted text (captions, hints) */
--page-text-softer       /* Very muted (placeholders) */
--page-text-hard         /* Emphasized text (headings) */
```

### 3.5 Special Concepts

**Focus Ring:**
```css
--focus-ring              /* Focus ring color (typically primary) */
--focus-ring-offset       /* Gap between element and ring */
--focus-ring-width        /* Ring thickness */
```

**Selection:**
```css
--selection-bg            /* Text selection background */
--selection-text          /* Text selection foreground */
```

**Links:**
```css
--link                    /* Link color */
--link-hover
--link-pressed
--link-visited
```

**Scrollbar:**
```css
--scrollbar-track
--scrollbar-thumb
--scrollbar-thumb-hover
```

---

## 4. Token Architecture

### 4.1 Two-Layer System: Tokens + Surface Classes

UI-Kit uses a two-layer architecture:

1. **Tokens** - CSS custom properties defining all color/spacing/typography values
2. **Surface Classes** - Generated CSS classes that establish visual contexts by remapping tokens

```html
<!-- Surface class establishes context -->
<div class="surface-success">
  <!-- Components inside automatically use remapped tokens -->
  <p>This text uses --text (remapped to success text color)</p>
  <button class="button">Uses --control-bg (remapped for success surface)</button>
</div>
```

#### Why Surface Classes?

Without surface classes, colored backgrounds require either:
- Explosion of component-specific tokens (`--success-button-bg`, `--warning-button-bg`, etc.)
- Manual overrides for every component inside a colored region

Surface classes solve this by remapping the standard tokens within their scope. A button always uses `--control-bg`, but that token's value depends on the containing surface.

#### Generated Output

For each theme, the build generates:

**CSS with surface classes:**
```css
/* Tokens at root */
:root {
  --page-bg: #f8f9fa;
  --control-bg: #e9ecef;
  /* ... */
}

/* Surface classes remap and apply */
.surface-card {
  --bg: var(--card-bg);
  --text: var(--card-text);
  --shadow: var(--card-shadow);

  background: var(--bg);
  color: var(--text);
  box-shadow: var(--shadow);
}

.surface-success {
  --bg: var(--success-bg);
  --text: var(--success-text);
  --control-bg: var(--success-control-bg);
  --control-text: var(--success-control-text);
  /* ... only tokens that differ from body ... */

  background: var(--bg);
  color: var(--text);
}
```

**TypeScript exports:**
```typescript
// dist/surfaces.ts
export const surfaces = [
  'page', 'card', 'overlay', 'popout', 'inset',
  'control', 'controlPrimary', 'controlDanger', 'controlSubtle',
  'success', 'warning', 'danger', 'info',
] as const;

export type Surface = typeof surfaces[number];

export const surfaceClasses = {
  page: 'surface-page',
  card: 'surface-card',
  // ...
} as const;

export function surfaceClass(surface: Surface): string {
  return `surface-${surface}`;
}
```

**React usage:**
```tsx
import { surfaceClasses, type Surface } from 'ui-kit/surfaces';

function Toast({ variant, children }: { variant: Surface; children: React.ReactNode }) {
  return (
    <div className={surfaceClasses[variant]}>
      {children}
      <Button>Dismiss</Button> {/* Automatically styled for surface */}
    </div>
  );
}

<Toast variant="success">Operation completed!</Toast>
<Toast variant="danger">Something went wrong</Toast>
```

#### Build Optimization

The build system optimizes surface class output by:
1. Computing all token values for each surface
2. Diffing against the parent context (default: body/page)
3. Only emitting tokens that differ

This keeps CSS size minimal while maintaining full flexibility.

#### Custom Surfaces

Themes can define custom surfaces beyond the standard set:

```json
{
  "surfaces": {
    "brandHero": {
      "background": "linear-gradient(135deg, #667eea, #764ba2)",
      "text": "#ffffff"
    },
    "promoCard": {
      "background": "#1a1a2e",
      "text": "#eaeaea"
    }
  }
}
```

These generate additional `.surface-brandHero` and `.surface-promoCard` classes, and the TypeScript export includes them in the `Surface` type.

#### Gradient Background Handling

For gradient backgrounds, the build system validates contrast at compile time:

1. Sample contrast ratio of foreground against each gradient stop
2. All stops must meet the required ratio (4.5:1 for AA, 7:1 for AAA)
3. If any stop fails, attempt to flip foreground to white or black
4. If still failing, emit a build error with guidance

```
⚠️  Surface "brandHero": gradient stop #764ba2 has insufficient
    contrast (3.2:1) with text #ffffff. Adjusted text to #000000.

❌  Surface "badGradient": cannot achieve 4.5:1 contrast against
    gradient stop #888888. Adjust gradient colors.
```

### 4.2 Complete Token List

**Surfaces (~90 color tokens):**

| Surface | Tokens |
|---------|--------|
| page | bg, text, text-soft, text-softer, text-hard, border, shadow |
| card | bg, text, text-soft, text-hard, border, shadow |
| overlay | bg, text, text-soft, text-hard, border, shadow |
| popout | bg, text, text-soft, text-hard, border, shadow |
| inset | bg, bg-hover, bg-focus, text, text-soft, border, border-focus |
| control | bg, bg-hover, bg-pressed, text, text-hover, text-pressed, border, border-hover, border-pressed, shadow |
| controlPrimary | bg, bg-hover, bg-pressed, text, border, shadow |
| controlDanger | bg, bg-hover, bg-pressed, text, border, shadow |
| controlSubtle | bg, bg-hover, bg-pressed, text, text-hover, text-pressed, border |
| controlDisabled | bg, text, border |
| success | bg, text, text-soft, border, icon |
| warning | bg, text, text-soft, border, icon |
| danger | bg, text, text-soft, border, icon |
| info | bg, text, text-soft, border, icon |

**Special (~15 tokens):**
```css
--focus-ring, --focus-ring-offset, --focus-ring-width
--selection-bg, --selection-text
--link, --link-hover, --link-pressed, --link-visited
--scrollbar-track, --scrollbar-thumb, --scrollbar-thumb-hover
--highlight-bg, --highlight-text
```

**Spacing (~12 tokens):**
```css
--space-1    /* 4px */
--space-2    /* 8px */
--space-3    /* 12px */
--space-4    /* 16px (base) */
--space-5    /* 20px */
--space-6    /* 24px */
--space-8    /* 32px */
--space-10   /* 40px */
--space-12   /* 48px */
--space-16   /* 64px */
--space-20   /* 80px */
--space-24   /* 96px */
```

**Typography (~20 tokens):**
```css
/* Families */
--font-sans, --font-mono, --font-serif

/* Sizes */
--text-xs     /* 11px */
--text-sm     /* 13px */
--text-base   /* 15px */
--text-lg     /* 17px */
--text-xl     /* 20px */
--text-2xl    /* 24px */
--text-3xl    /* 30px */
--text-4xl    /* 36px */

/* Weights */
--weight-normal   /* 400 */
--weight-medium   /* 500 */
--weight-semibold /* 600 */
--weight-bold     /* 700 */

/* Line heights */
--leading-tight   /* 1.25 */
--leading-normal  /* 1.5 */
--leading-loose   /* 1.75 */
```

**Radii (~6 tokens):**
```css
--radius-sm    /* 2px */
--radius-md    /* 4px */
--radius-lg    /* 8px */
--radius-xl    /* 12px */
--radius-2xl   /* 16px */
--radius-full  /* 9999px */
```

**Shadows (~5 tokens):**
```css
--shadow-sm    /* subtle */
--shadow-md    /* cards */
--shadow-lg    /* dropdowns */
--shadow-xl    /* modals */
--shadow-inner /* inset */
```

**Animation (~8 tokens):**
```css
--duration-fast    /* 100ms */
--duration-normal  /* 200ms */
--duration-slow    /* 300ms */

--ease-default     /* ease-out */
--ease-in
--ease-out
--ease-in-out
--ease-bounce
```

**Component shortcuts (~10 tokens):**
```css
--button-padding-x
--button-padding-y
--button-radius
--input-height
--input-padding-x
--card-padding
--modal-padding
--avatar-size-sm, --avatar-size-md, --avatar-size-lg
```

### 4.3 Total Token Count

| Category | Count |
|----------|-------|
| Surface colors | ~90 |
| Special colors | ~15 |
| Spacing | 12 |
| Typography | 20 |
| Radii | 6 |
| Shadows | 5 |
| Animation | 8 |
| Component shortcuts | 10 |
| **Total** | **~166 tokens** |

### 4.4 CSS Variable Naming Convention

```
--[surface]-[property][-state][-variant]

Examples:
--control-bg
--control-bg-hover
--control-text
--page-text-soft
--controlPrimary-bg-pressed
```

This is flat, predictable, and searchable.

---

## 5. Theme System

### 5.1 Theme Definition Format

Themes are defined with comprehensive configuration covering colors, typography, spacing, radii, and animation:

```json
{
  "id": "ocean",
  "name": "Ocean",
  "description": "Cool blues and aquatic tones",

  "colors": {
    "primary": "#0ea5e9",
    "secondary": "#06b6d4",
    "accent": "#8b5cf6",
    "neutral": "#64748b"
  },

  "typography": {
    "fontSans": "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    "fontMono": "'JetBrains Mono', 'Fira Code', monospace",
    "fontSerif": "'Merriweather', Georgia, serif",
    "scale": 1.0,
    "baseSize": 15
  },

  "spacing": {
    "scale": 1.0,
    "baseUnit": 4
  },

  "radii": {
    "scale": 1.0,
    "style": "rounded"
  },

  "animation": {
    "scale": 1.0,
    "reduceMotion": false
  },

  "accessibility": {
    "level": "AA"
  },

  "config": {
    "saturation": 0,
    "temperature": -10,
    "contrastBoost": 0
  }
}
```

The theme generator expands this into all tokens for both light and dark modes.

### 5.2 Theme Configuration Options

#### Colors
| Property | Type | Description |
|----------|------|-------------|
| `primary` | hex | Primary brand color |
| `secondary` | hex | Secondary color (optional, computed if omitted) |
| `accent` | hex | Accent color (optional, computed if omitted) |
| `neutral` | hex | Neutral/gray base (optional, derived from primary) |

#### Typography
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `fontSans` | string | System stack | Sans-serif font family |
| `fontMono` | string | System mono | Monospace font family |
| `fontSerif` | string | System serif | Serif font family |
| `scale` | number | 1.0 | Multiplier for all font sizes (0.8 = compact, 1.2 = spacious) |
| `baseSize` | number | 15 | Base font size in pixels |

#### Spacing
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `scale` | number | 1.0 | Multiplier for all spacing (0.8 = compact, 1.2 = spacious) |
| `baseUnit` | number | 4 | Base spacing unit in pixels |

#### Radii (Roundedness)
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `scale` | number | 1.0 | Multiplier for all radii |
| `style` | enum | "rounded" | `"sharp"` (0), `"subtle"` (2px base), `"rounded"` (4px base), `"pill"` (8px base) |

#### Animation
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `scale` | number | 1.0 | Multiplier for all durations (0.5 = snappy, 2.0 = slow) |
| `reduceMotion` | boolean | false | If true, minimizes animations |

#### Config (Color Adjustments)
| Property | Type | Range | Description |
|----------|------|-------|-------------|
| `saturation` | number | -100 to 100 | Adjust color saturation |
| `temperature` | number | -100 to 100 | Warm (positive) or cool (negative) shift |
| `contrastBoost` | number | 0 to 100 | Increase contrast between elements |

### 5.3 Built-in Themes (~20 themes)

#### Core Themes
| Theme | Description | Accessibility |
|-------|-------------|---------------|
| default | Clean, professional blue | AA |
| minimal | Understated, neutral grays | AA |
| high-contrast | Maximum readability, bold borders | AAA |
| high-contrast-dark | Dark mode AAA variant | AAA |

#### Microsoft Family
| Theme | Description | Accessibility |
|-------|-------------|---------------|
| github | GitHub's design language | AA |
| linkedin | LinkedIn blues and professional tones | AA |
| teams | Microsoft Teams purple palette | AA |
| onedrive | OneDrive blues | AA |
| fluent | Microsoft Fluent/Fabric design | AA |

#### Creative/Novelty
| Theme | Description | Accessibility |
|-------|-------------|---------------|
| terminal | Green-on-black hacker aesthetic | AA |
| matrix | Matrix-inspired with glow effects | AA |
| sketchy | Hand-drawn, notebook style | AA |
| art-deco | 1920s geometric elegance | AA |
| cyberpunk | Neon pinks and cyans | AA |
| retro | 80s inspired pastels | AA |

#### Nature/Mood
| Theme | Description | Accessibility |
|-------|-------------|---------------|
| ocean | Cool blues and aquas | AA |
| forest | Natural greens and earth tones | AA |
| sunset | Warm oranges and purples | AA |
| midnight | Deep blues and purples | AA |
| arctic | Cool, crisp ice-inspired | AA |

### 5.4 High-Contrast AAA Theme

```json
{
  "id": "high-contrast",
  "name": "High Contrast",
  "description": "AAA-compliant theme for maximum accessibility",
  "colors": {
    "primary": "#0052cc",
    "neutral": "#000000"
  },
  "accessibility": {
    "level": "AAA"
  },
  "config": {
    "contrastBoost": 30
  },
  "overrides": {
    "light": {
      "--page-text": "#000000",
      "--page-bg": "#ffffff",
      "--focus-ring-width": "3px",
      "--control-border": "#000000"
    },
    "dark": {
      "--page-text": "#ffffff",
      "--page-bg": "#000000",
      "--focus-ring-width": "3px",
      "--control-border": "#ffffff"
    }
  }
}
```

### 5.5 Theme Loading (Zero Flash)

**Inline bootstrap script (~500 bytes minified):**

```html
<head>
  <script>
    (function() {
      var s = null;
      try { s = JSON.parse(localStorage.getItem('uikit-theme')); } catch(e) {}

      var theme = (s && s.theme) || 'default';
      var mode = (s && s.mode) || 'auto';

      if (mode === 'auto') {
        mode = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }

      // Check for high-contrast preference
      if (!s && matchMedia('(prefers-contrast: more)').matches) {
        theme = 'high-contrast';
      }

      document.documentElement.dataset.theme = theme;
      document.documentElement.dataset.mode = mode;

      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/themes/' + theme + '-' + mode + '.css';
      document.head.appendChild(link);
    })();
  </script>
  <link rel="stylesheet" href="/uikit/tokens.css">
</head>
```

### 5.6 Runtime Theme API

```javascript
// Get current theme
uikit.getTheme(); // { theme: 'ocean', mode: 'dark' }

// Set theme
await uikit.setTheme({ theme: 'forest' });
await uikit.setTheme({ mode: 'light' });
await uikit.setTheme({ theme: 'sunset', mode: 'dark' });

// Toggle light/dark
await uikit.toggleMode();

// Listen for changes
uikit.subscribe(({ theme, mode }) => {
  console.log(`Theme changed to ${theme} (${mode})`);
});

// Get available themes
const themes = await uikit.getThemes();
```

---

## 6. Build Tools

### 6.1 Theme Compiler CLI

```bash
# Compile a custom theme
npx uikit compile my-theme.json --output dist/themes/

# Compile with specific modes
npx uikit compile my-theme.json --modes light,dark

# Validate a theme definition
npx uikit validate my-theme.json

# Generate TypeScript types for tokens
npx uikit types --output src/tokens.d.ts
```

### 6.2 PostCSS Plugin (Optional Tree-Shaking)

```javascript
// postcss.config.js
module.exports = {
  plugins: [
    require('uikit/postcss')({
      // Only include tokens that are actually used
      purgeCSSVariables: true,
      // Keep these even if not detected
      safelist: ['--control-bg', '--page-text']
    })
  ]
}
```

### 6.3 Theme Designer Tool

Web-based visual editor with comprehensive controls:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Theme Designer                                        [Import] [Export ▼]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─ COLORS ─────────────────────────────────────────────────────────────┐  │
│  │                                                                       │  │
│  │  Primary        Secondary       Accent          Neutral               │  │
│  │  ┌─────────┐   ┌─────────┐    ┌─────────┐    ┌─────────┐             │  │
│  │  │ #0ea5e9 │   │ #06b6d4 │    │ #8b5cf6 │    │ #64748b │             │  │
│  │  └─────────┘   └─────────┘    └─────────┘    └─────────┘             │  │
│  │                                                                       │  │
│  │  Saturation    ├────────●────────┤  +10%                             │  │
│  │  Temperature   ├──────●──────────┤  -10 (cooler)                     │  │
│  │  Contrast      ├────────────●────┤  +15%                             │  │
│  │                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ TYPOGRAPHY ─────────────────────────────────────────────────────────┐  │
│  │                                                                       │  │
│  │  Sans Font     [Inter                              ▼]                 │  │
│  │  Mono Font     [JetBrains Mono                     ▼]                 │  │
│  │  Serif Font    [Merriweather                       ▼]                 │  │
│  │                                                                       │  │
│  │  Base Size     ├────────●────────┤  15px                             │  │
│  │  Scale         ├──────●──────────┤  1.0x (compact ↔ spacious)        │  │
│  │                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ SHAPE & SPACING ────────────────────────────────────────────────────┐  │
│  │                                                                       │  │
│  │  Corner Style  ○ Sharp  ○ Subtle  ● Rounded  ○ Pill                  │  │
│  │  Radius Scale  ├────────●────────┤  1.0x                             │  │
│  │                                                                       │  │
│  │  Spacing Unit  ├──────●──────────┤  4px                              │  │
│  │  Spacing Scale ├────────●────────┤  1.0x (compact ↔ spacious)        │  │
│  │                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ ANIMATION ──────────────────────────────────────────────────────────┐  │
│  │                                                                       │  │
│  │  Speed         ├──────●──────────┤  1.0x (snappy ↔ smooth)           │  │
│  │  Reduce Motion ☐                                                      │  │
│  │                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ ACCESSIBILITY ──────────────────────────────────────────────────────┐  │
│  │                                                                       │  │
│  │  Compliance    ● AA (4.5:1)  ○ AAA (7:1)                             │  │
│  │                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ CUSTOM SURFACES ────────────────────────────────────────────────────┐  │
│  │                                                                       │  │
│  │  Standard: page, card, overlay, popout, inset, control,              │  │
│  │            controlPrimary, controlDanger, success, warning, etc.     │  │
│  │                                                                       │  │
│  │  [+ Add Custom Surface]                                               │  │
│  │                                                                       │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │  │
│  │  │ brandHero                                                  [✕] │ │  │
│  │  │ Background: linear-gradient(135deg, #667eea, #764ba2)          │ │  │
│  │  │ Text: #ffffff (auto)  ✓ Contrast validated                     │ │  │
│  │  └─────────────────────────────────────────────────────────────────┘ │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │  │
│  │  │ promoCard                                                  [✕] │ │  │
│  │  │ Background: #1a1a2e                                            │ │  │
│  │  │ Text: #eaeaea (auto)  ✓ Contrast validated                     │ │  │
│  │  └─────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                       │  │
│  │  Custom surfaces generate .surface-{name} classes and are            │  │
│  │  included in the TypeScript Surface type export.                     │  │
│  │                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  PREVIEW                                              [Light ●] [Dark ○]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  ┌──────────────────────────────────────────────┐                  │   │
│  │  │  Card Title                                  │                  │   │
│  │  │  This is sample text on a card surface.     │                  │   │
│  │  │                                              │                  │   │
│  │  │  [Primary Button]  [Secondary]  [Ghost]     │                  │   │
│  │  └──────────────────────────────────────────────┘                  │   │
│  │                                                                     │   │
│  │  ┌──────────────────────────────────────────────┐                  │   │
│  │  │ ℹ️  This is an info banner with feedback     │                  │   │
│  │  └──────────────────────────────────────────────┘                  │   │
│  │                                                                     │   │
│  │  ☑ Checkbox   ○ Radio   [Toggle ●───]   [Select ▼]                 │   │
│  │                                                                     │   │
│  │  ┌──────────────────────────────────────────────┐                  │   │
│  │  │ Text input                              🔍   │                  │   │
│  │  └──────────────────────────────────────────────┘                  │   │
│  │                                                                     │   │
│  │  [Tab 1]  [Tab 2]  [Tab 3]                                         │   │
│  │  ━━━━━━━━                                                          │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Features

1. **Color Palette**
   - Visual color pickers for primary, secondary, accent, neutral
   - Real-time adjustment sliders for saturation, temperature, contrast
   - Automatic generation of full color scales

2. **Typography Controls**
   - Font family selection with preview
   - Base size adjustment (affects all type scale)
   - Scale multiplier for density control

3. **Shape & Spacing**
   - Corner style presets: Sharp (0), Subtle (2px), Rounded (4px), Pill (8px)
   - Radius scale multiplier for fine-tuning
   - Spacing unit and scale for overall density

4. **Animation Settings**
   - Duration scale (0.5x snappy to 2x smooth)
   - Reduce motion toggle for accessibility

5. **Custom Surfaces**
   - Add brand-specific surfaces beyond the standard set
   - Define background (solid or gradient), text colors
   - Auto-validates contrast at each gradient stop
   - Generates `.surface-{name}` CSS class
   - Adds to TypeScript `Surface` type export

6. **Live Preview**
   - Toggle between light and dark modes
   - See all component types with current settings
   - Real-time updates as settings change

7. **Import/Export**
   - Export as JSON (theme definition)
   - Export as CSS (compiled theme)
   - Import existing theme JSON to modify

---

## 7. UI-Kit Website

### 7.1 Purpose

The website serves as:
1. **Documentation** - Complete reference for all tokens
2. **Learning resource** - Step-by-step tutorials
3. **Proving ground** - Demonstrates UI-Kit's capabilities
4. **Tool host** - Theme designer, bootstrap generator

### 7.2 Design Requirements

- **Built with UI-Kit** - Uses UI-Kit exclusively for styling
- **Polished UX** - Smooth transitions, thoughtful animations
- **Theme support** - User can switch themes while browsing
- **Responsive** - Works on all devices
- **Fast** - Optimized performance, minimal JS

### 7.3 Site Structure

```
uikit.dev/
├── /                           # Landing page
│   ├── Hero with theme demo
│   ├── Key features
│   ├── Quick start code
│   └── CTA to learn
│
├── /learn/                     # Learning path (ordered)
│   ├── /1-getting-started      # Installation, first use
│   ├── /2-understanding-surfaces # Core concept
│   ├── /3-styling-components   # Practical usage
│   ├── /4-theming              # Creating themes
│   └── /5-advanced             # Custom surfaces, optimization
│
├── /reference/                 # Complete documentation
│   ├── /surfaces               # All surface tokens
│   ├── /spacing                # Spacing scale
│   ├── /typography             # Text tokens
│   ├── /animation              # Motion tokens
│   └── /api                    # JavaScript API
│
├── /themes/                    # Theme gallery
│   ├── /gallery                # Browse all themes
│   ├── /designer               # Visual theme creator
│   └── /[theme-id]             # Individual theme pages
│
├── /components/                # Component examples
│   ├── /buttons
│   ├── /forms
│   ├── /feedback
│   ├── /navigation
│   ├── /overlays
│   └── /data-display
│
└── /tools/                     # Developer tools
    ├── /bootstrap-generator    # Generate inline script
    ├── /token-browser          # Searchable token list
    └── /contrast-checker       # Accessibility validator
```

### 7.4 Landing Page Content

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  UI-Kit                                            [Theme ▼]    │
│                                                                 │
│  A design token system that makes                               │
│  accessible, themeable UIs intuitive.                           │
│                                                                 │
│  [Start Learning]        [Browse Themes]                        │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │ Surface │  │  Theme  │  │  WCAG   │  │  Zero   │            │
│  │  Based  │  │ System  │  │ AA/AAA  │  │  Flash  │            │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘            │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  30 Seconds to Start                                            │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ <script>/* inline bootstrap */</script>                   │ │
│  │ <link rel="stylesheet" href="uikit/tokens.css">           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ .card {                                                   │ │
│  │   background: var(--card-bg);                             │ │
│  │   color: var(--card-text);                                │ │
│  │   padding: var(--space-4);                                │ │
│  │   border-radius: var(--radius-lg);                        │ │
│  │ }                                                         │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Dark mode, accessibility, and theming — built in.              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.5 Technology Stack

- **Framework**: React 19 + TypeScript
- **Routing**: React Router v7
- **Styling**: CSS Modules + UI-Kit tokens (dogfooding)
- **Build**: Vite
- **Hosting**: Vercel/Netlify (static export)

#### Why React/TypeScript/CSS Modules?

1. **Consistency** - Same stack as ui-kit-react, shared learning
2. **Type Safety** - TypeScript ensures token names are correct
3. **CSS Modules** - Scoped styles, works perfectly with CSS variables
4. **Interactive** - Theme designer and other tools need rich interactivity
5. **Dogfooding** - Proves UI-Kit works well with React

#### Project Structure

```
packages/ui-kit/website/           # @ui-kit/website
├── src/
│   ├── components/                # Shared React components
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   └── Button.module.css
│   │   ├── Card/
│   │   ├── CodeBlock/
│   │   └── ...
│   ├── pages/                     # Route pages
│   │   ├── Home/
│   │   ├── Learn/
│   │   ├── Reference/
│   │   ├── Themes/
│   │   └── Tools/
│   ├── features/                  # Complex features
│   │   ├── ThemeDesigner/
│   │   ├── TokenBrowser/
│   │   └── BootstrapGenerator/
│   ├── hooks/                     # Custom hooks
│   │   ├── useTheme.ts
│   │   └── useTokens.ts
│   ├── styles/                    # Global styles
│   │   ├── global.css             # Imports @ui-kit/core
│   │   └── variables.css          # Site-specific overrides
│   ├── App.tsx
│   └── main.tsx
├── public/
│   └── themes/                    # Symlink or copy of @ui-kit/core themes
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### 7.6 Mock Pages Package

A separate package for testing themes against realistic UI layouts:

```
packages/ui-kit/mock-pages/        # @ui-kit/mock-pages
├── .storybook/
│   ├── main.ts
│   └── preview.ts
├── src/
│   ├── pages/                     # Full-page mock layouts
│   │   ├── Dashboard.stories.tsx
│   │   ├── Settings.stories.tsx
│   │   ├── EmailClient.stories.tsx
│   │   ├── ChatApp.stories.tsx
│   │   ├── ECommerce.stories.tsx
│   │   ├── Documentation.stories.tsx
│   │   ├── SocialFeed.stories.tsx
│   │   ├── AdminPanel.stories.tsx
│   │   └── ...
│   ├── components/                # Shared mock components
│   └── layouts/                   # Layout templates
├── package.json
└── tsconfig.json
```

**Purpose:**
- Provides realistic, full-page UI scenarios for theme testing
- Storybook allows switching themes/modes with visual comparison
- Validates that tokens work across diverse UI patterns
- Serves as input for the future UI audit phase

### 7.7 Theme Switcher Overlay (Dev Tool)

A floating UI overlay for quickly testing themes during development:

```typescript
// @ui-kit/core exports this for dev use
import { createThemeSwitcher } from '@ui-kit/core/dev';

// Initialize in development
if (process.env.NODE_ENV === 'development') {
  createThemeSwitcher({
    position: 'bottom-right',  // or 'top-right', 'bottom-left', etc.
    showModeToggle: true,
    showThemeList: true,
    collapsed: false,
  });
}
```

**Features:**
- Floating panel with theme dropdown and light/dark/auto toggle
- Persists selection to localStorage
- Can be collapsed to a small icon
- Only included in dev builds (tree-shaken in production)
- Works in any project using @ui-kit/core

#### CSS Module Example

```tsx
// Button.tsx
import styles from './Button.module.css';

export function Button({ variant = 'default', children }) {
  return (
    <button className={`${styles.button} ${styles[variant]}`}>
      {children}
    </button>
  );
}
```

```css
/* Button.module.css */
.button {
  background: var(--control-bg);
  color: var(--control-text);
  border: 1px solid var(--control-border);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-weight: var(--weight-medium);
  transition: all var(--duration-fast) var(--ease-default);
  cursor: pointer;
}

.button:hover {
  background: var(--control-bg-hover);
}

.button:active {
  background: var(--control-bg-pressed);
}

.button:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
}

.primary {
  background: var(--controlPrimary-bg);
  color: var(--controlPrimary-text);
  border-color: var(--controlPrimary-border);
}

.primary:hover {
  background: var(--controlPrimary-bg-hover);
}
```

---

## 8. @ui-kit/react (Clean Rewrite)

### 8.1 Approach

**Clean rewrite, not migration.** The new `@ui-kit/react` package at `packages/ui-kit/react` will be built from scratch using the new token system. The old `packages/ui-kit-react` remains untouched until consumers are ready to migrate.

### 8.2 Package Structure

```
packages/ui-kit/react/           # @ui-kit/react
├── src/
│   ├── components/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.module.css
│   │   │   ├── Button.test.tsx
│   │   │   └── index.ts
│   │   ├── Input/
│   │   ├── Card/
│   │   ├── Modal/
│   │   └── ...
│   ├── hooks/
│   │   ├── useTheme.ts
│   │   ├── useSurface.ts
│   │   └── useTokens.ts
│   ├── context/
│   │   └── ThemeProvider.tsx
│   └── index.ts
├── .storybook/
├── package.json
└── tsconfig.json
```

### 8.3 Component Token Documentation

Each component documents which tokens and surfaces it uses:

```tsx
/**
 * Button component
 *
 * Surfaces used:
 * - control (default variant)
 * - controlPrimary (variant="primary")
 * - controlDanger (variant="danger")
 * - controlSubtle (variant="ghost")
 * - controlDisabled (when disabled)
 *
 * Tokens used:
 * - --{surface}-bg, --{surface}-bg-hover, --{surface}-bg-pressed
 * - --{surface}-text
 * - --{surface}-border
 * - --space-2, --space-4 (padding)
 * - --radius-md
 * - --focus-ring, --focus-ring-offset, --focus-ring-width
 * - --duration-fast, --ease-default
 */
export function Button({ variant = 'default', ...props }: ButtonProps) {
  // ...
}
```

### 8.4 Surface-Aware Components

Components that establish a surface context re-export the surface for children:

```tsx
import { surfaceClasses } from '@ui-kit/core/surfaces';

function Toast({ variant, children }: ToastProps) {
  return (
    <div className={surfaceClasses[variant]} role="alert">
      {children}
      {/* Button inside automatically uses remapped tokens */}
      <Button variant="ghost">Dismiss</Button>
    </div>
  );
}
```

### 8.5 Component List

| Category | Components |
|----------|------------|
| **Actions** | Button, IconButton, LinkButton |
| **Inputs** | Input, Textarea, Select, Checkbox, Radio, Switch, Slider |
| **Layout** | Card, Panel, Divider, Stack, Grid |
| **Overlays** | Modal, Dialog, Drawer, Popover, Tooltip, Dropdown |
| **Navigation** | Tabs, Menu, Breadcrumb, Pagination |
| **Feedback** | Alert, Toast, Banner, Progress, Spinner, Skeleton |
| **Data** | Avatar, Badge, Chip, Tag, List, Table |
| **Typography** | Text, Heading, Code, Link |

---

## 9. Validation Strategy

### 9.1 Component Coverage Test

Create a comprehensive test page with ALL common components:

```
test/component-coverage.html
├── Buttons (all variants, all states)
├── Inputs (text, textarea, select, date)
├── Selection (checkbox, radio, switch)
├── Progress (bar, spinner, skeleton)
├── Navigation (tabs, breadcrumbs, pagination)
├── Lists (basic, selectable, menu)
├── Feedback (alerts, toasts, banners)
├── Overlays (modal, dropdown, tooltip, popover)
├── Data (table, card grid, avatar)
├── Tags (chips, badges, labels)
├── Text (headings, body, captions, code, links)
```

Every component must look correct in:
- All 8+ themes
- Light and dark modes
- Rest, hover, focus, pressed, selected, disabled states

### 9.2 Real-World UI Audit (Multi-Agent Task)

To validate the token system can represent real-world UIs:

**Task**: Analyze 100-200 UI screenshots from popular apps/websites and identify:
1. Which UI-Kit surfaces would be used for each element
2. Any UI patterns that don't fit the current surface model
3. Gaps in the token system

**Sources to audit**:
- GitHub, Linear, Notion, Figma, Slack, Discord
- Stripe, Vercel, Netlify dashboards
- Google Workspace, Microsoft 365
- Twitter/X, Instagram, YouTube
- Various e-commerce sites
- Mobile app screenshots

**Output**: Report identifying gaps and recommendations for additional surfaces or tokens.

### 9.3 Accessibility Validation

- All color combinations must pass WCAG AA (4.5:1 for text)
- High-contrast theme must pass AAA (7:1)
- Focus indicators must be visible
- Test with screen readers

### 9.4 Performance Validation

- Measure CSS file sizes
- Test theme switching speed
- Verify zero-flash on initial load
- Test on slow connections

---

## 10. Implementation Roadmap

### Phase 1: Setup & Foundation

**Package restructuring:**
- [ ] Rename `packages/ui-kit` to `packages/ui-kit-legacy`
- [ ] Create new `packages/ui-kit/` directory structure
- [ ] Initialize `packages/ui-kit/core` as `@ui-kit/core`
- [ ] Initialize `packages/ui-kit/website` as `@ui-kit/website`
- [ ] Initialize `packages/ui-kit/mock-pages` as `@ui-kit/mock-pages`
- [ ] Initialize `packages/ui-kit/react` as `@ui-kit/react`
- [ ] Set up workspace dependencies and build order

**Core token system:**
- [ ] Implement new token naming convention
- [ ] Define all surfaces with complete token lists
- [ ] Create surface class generation system
- [ ] Build TypeScript exports (surfaces, types)
- [ ] Implement theme switcher dev overlay

### Phase 2: Theme System

- [ ] Build theme compiler for new token structure
- [ ] Implement gradient contrast validation
- [ ] Create all 20 themes:
  - [ ] Core: default, minimal, high-contrast, high-contrast-dark
  - [ ] Microsoft: github, linkedin, teams, onedrive, fluent
  - [ ] Creative: terminal, matrix, sketchy, art-deco, cyberpunk, retro
  - [ ] Nature: ocean, forest, sunset, midnight, arctic
- [ ] Build zero-flash bootstrap script
- [ ] Implement runtime theme API
- [ ] Generate theme manifest and TypeScript types

### Phase 3: Mock Pages & Validation

- [ ] Set up mock-pages Storybook
- [ ] Build mock page layouts:
  - [ ] Dashboard
  - [ ] Settings/Preferences
  - [ ] Email/Inbox client
  - [ ] Chat application
  - [ ] E-commerce product page
  - [ ] Documentation site
  - [ ] Social feed
  - [ ] Admin panel
- [ ] Test all 20 themes × light/dark across all mock pages
- [ ] Accessibility testing (automated + manual)
- [ ] Performance benchmarking (CSS size, load time)

### Phase 4: Website

- [ ] Set up React + TypeScript + Vite + CSS Modules
- [ ] Build site shell (navigation, theme switcher, layout)
- [ ] Build landing page with interactive theme demo
- [ ] Create learning path content:
  - [ ] Getting Started
  - [ ] Understanding Surfaces
  - [ ] Styling Components
  - [ ] Theming
  - [ ] Advanced (custom surfaces, optimization)
- [ ] Build reference documentation with token browser
- [ ] Create theme gallery with live previews
- [ ] Build theme designer tool (full configurability)
- [ ] Build bootstrap generator tool
- [ ] Add smooth page transitions and micro-interactions

### Phase 5: React Components

- [ ] Create new `@ui-kit/react` from clean slate
- [ ] Build core components using new tokens:
  - [ ] Button, IconButton
  - [ ] Input, Textarea, Select, Checkbox, Radio, Switch
  - [ ] Card, Panel
  - [ ] Modal, Dialog, Popover, Tooltip
  - [ ] Tabs, Menu, Dropdown
  - [ ] Alert, Toast, Banner
  - [ ] Avatar, Badge, Chip
  - [ ] Progress, Spinner, Skeleton
- [ ] Document each component's token usage
- [ ] Storybook for all components
- [ ] Test all components × all themes

### Phase 6: Polish & Launch

- [ ] Website animations and transitions polish
- [ ] Cross-browser testing
- [ ] Mobile responsiveness
- [ ] Documentation review and copyediting
- [ ] Performance optimization
- [ ] Deploy website
- [ ] Publish packages to npm (or internal registry)

### Future: UI Audit Phase (Separate Project)

- [ ] Create project plan for multi-agent UI audit
- [ ] Audit 100-200 real-world UI screenshots
- [ ] Identify gaps in surface/token system
- [ ] Propose additions based on findings
- [ ] Implement validated additions

---

## Appendix A: Token Quick Reference

```css
/* SURFACES */
--page-bg, --page-text, --page-text-soft, --page-text-hard, --page-border
--card-bg, --card-text, --card-text-soft, --card-border, --card-shadow
--overlay-bg, --overlay-text, --overlay-border, --overlay-shadow
--popout-bg, --popout-text, --popout-border, --popout-shadow
--inset-bg, --inset-bg-hover, --inset-bg-focus, --inset-text, --inset-border

/* CONTROLS */
--control-bg, --control-bg-hover, --control-bg-pressed
--control-text, --control-text-hover, --control-text-pressed
--control-border, --control-border-hover

--controlPrimary-bg, --controlPrimary-bg-hover, --controlPrimary-bg-pressed
--controlPrimary-text, --controlPrimary-border

--controlDanger-bg, --controlDanger-bg-hover, --controlDanger-bg-pressed
--controlDanger-text, --controlDanger-border

--controlSubtle-bg, --controlSubtle-bg-hover, --controlSubtle-bg-pressed
--controlSubtle-text, --controlSubtle-text-hover

--controlDisabled-bg, --controlDisabled-text, --controlDisabled-border

/* FEEDBACK */
--success-bg, --success-text, --success-border, --success-icon
--warning-bg, --warning-text, --warning-border, --warning-icon
--danger-bg, --danger-text, --danger-border, --danger-icon
--info-bg, --info-text, --info-border, --info-icon

/* SPECIAL */
--focus-ring, --focus-ring-offset, --focus-ring-width
--selection-bg, --selection-text
--link, --link-hover, --link-pressed, --link-visited

/* SPACING */
--space-1 (4px) through --space-24 (96px)

/* TYPOGRAPHY */
--font-sans, --font-mono, --font-serif
--text-xs through --text-4xl
--weight-normal, --weight-medium, --weight-semibold, --weight-bold
--leading-tight, --leading-normal, --leading-loose

/* RADII */
--radius-sm, --radius-md, --radius-lg, --radius-xl, --radius-2xl, --radius-full

/* SHADOWS */
--shadow-sm, --shadow-md, --shadow-lg, --shadow-xl, --shadow-inner

/* ANIMATION */
--duration-fast, --duration-normal, --duration-slow
--ease-default, --ease-in, --ease-out, --ease-in-out, --ease-bounce
```

---

## Appendix B: Component Examples

### Button

```css
.button {
  background: var(--control-bg);
  color: var(--control-text);
  border: 1px solid var(--control-border);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-weight: var(--weight-medium);
  transition: all var(--duration-fast) var(--ease-default);
}

.button:hover {
  background: var(--control-bg-hover);
  color: var(--control-text-hover);
  border-color: var(--control-border-hover);
}

.button:active {
  background: var(--control-bg-pressed);
}

.button:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
}

.button-primary {
  background: var(--controlPrimary-bg);
  color: var(--controlPrimary-text);
  border-color: var(--controlPrimary-border);
}

.button-primary:hover {
  background: var(--controlPrimary-bg-hover);
}
```

### Card

```css
.card {
  background: var(--card-bg);
  color: var(--card-text);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: var(--shadow-md);
}

.card-title {
  color: var(--card-text-hard);
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
}

.card-description {
  color: var(--card-text-soft);
  font-size: var(--text-sm);
}
```

### Input

```css
.input {
  background: var(--inset-bg);
  color: var(--inset-text);
  border: 1px solid var(--inset-border);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
}

.input:hover {
  background: var(--inset-bg-hover);
}

.input:focus {
  background: var(--inset-bg-focus);
  border-color: var(--focus-ring);
  outline: none;
  box-shadow: 0 0 0 var(--focus-ring-width) var(--focus-ring);
}

.input::placeholder {
  color: var(--inset-text-soft);
}
```

### Alert

```css
.alert {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  border-left: 4px solid;
}

.alert-success {
  background: var(--success-bg);
  color: var(--success-text);
  border-color: var(--success-border);
}

.alert-warning {
  background: var(--warning-bg);
  color: var(--warning-text);
  border-color: var(--warning-border);
}

.alert-danger {
  background: var(--danger-bg);
  color: var(--danger-text);
  border-color: var(--danger-border);
}
```

### Checkbox

```css
.checkbox {
  appearance: none;
  width: 18px;
  height: 18px;
  background: var(--control-bg);
  border: 2px solid var(--control-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-default);
}

.checkbox:hover {
  background: var(--control-bg-hover);
  border-color: var(--control-border-hover);
}

.checkbox:checked {
  background: var(--controlPrimary-bg);
  border-color: var(--controlPrimary-border);
}

.checkbox:checked:hover {
  background: var(--controlPrimary-bg-hover);
}

.checkbox:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
}

.checkbox:disabled {
  background: var(--controlDisabled-bg);
  border-color: var(--controlDisabled-border);
  cursor: not-allowed;
}
```

### Switch/Toggle

```css
.switch {
  position: relative;
  width: 44px;
  height: 24px;
  background: var(--control-bg);
  border: 2px solid var(--control-border);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-default);
}

.switch::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background: var(--control-text);
  border-radius: var(--radius-full);
  transition: transform var(--duration-fast) var(--ease-default);
}

.switch:hover {
  background: var(--control-bg-hover);
}

.switch[aria-checked="true"] {
  background: var(--controlPrimary-bg);
  border-color: var(--controlPrimary-border);
}

.switch[aria-checked="true"]::after {
  background: var(--controlPrimary-text);
  transform: translateX(20px);
}

.switch:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
}
```

### Tab

```css
.tab-list {
  display: flex;
  gap: var(--space-1);
  border-bottom: 1px solid var(--page-border);
}

.tab {
  padding: var(--space-2) var(--space-4);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--controlSubtle-text);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-default);
}

.tab:hover {
  background: var(--controlSubtle-bg-hover);
  color: var(--controlSubtle-text-hover);
}

.tab[aria-selected="true"] {
  color: var(--controlPrimary-text);
  border-bottom-color: var(--controlPrimary-bg);
}

.tab:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring);
  outline-offset: calc(var(--focus-ring-offset) * -1);
}
```

### Modal/Dialog

```css
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal {
  background: var(--overlay-bg);
  color: var(--overlay-text);
  border: 1px solid var(--overlay-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  padding: var(--space-6);
  max-width: 500px;
  width: 90%;
}

.modal-title {
  font-size: var(--text-xl);
  font-weight: var(--weight-semibold);
  color: var(--overlay-text-hard);
  margin-bottom: var(--space-4);
}

.modal-body {
  color: var(--overlay-text);
  margin-bottom: var(--space-6);
}

.modal-footer {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
}
```

### List Item (Selectable)

```css
.list-item {
  padding: var(--space-3) var(--space-4);
  background: transparent;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-default);
}

.list-item:hover {
  background: var(--controlSubtle-bg-hover);
}

.list-item:active {
  background: var(--controlSubtle-bg-pressed);
}

.list-item[aria-selected="true"] {
  background: var(--controlPrimary-bg);
  color: var(--controlPrimary-text);
}

.list-item[aria-selected="true"]:hover {
  background: var(--controlPrimary-bg-hover);
}

.list-item:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring);
  outline-offset: calc(var(--focus-ring-offset) * -1);
}
```

### Progress Bar

```css
.progress-track {
  height: 8px;
  background: var(--inset-bg);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--controlPrimary-bg);
  border-radius: var(--radius-full);
  transition: width var(--duration-slow) var(--ease-out);
}

/* Indeterminate animation */
.progress-fill.indeterminate {
  width: 30%;
  animation: progress-slide 1.5s var(--ease-in-out) infinite;
}

@keyframes progress-slide {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(400%); }
}
```

---

*This document serves as the complete blueprint for the UI-Kit revision. Use it as a reference when implementing changes.*
