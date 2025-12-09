# UI Kit Token Guide

This guide provides a comprehensive reference for using UI Kit design tokens. Tokens are CSS custom properties that ensure consistent styling across all components.

## Quick Reference

### When to Use Which Token

| I want to style... | Use these tokens |
|-------------------|------------------|
| Page background | `--page-bg` |
| Card/Panel background | `--card-bg` |
| Input field background | `--inset-bg` |
| Primary button | `--controlPrimary-bg`, `--controlPrimary-text` |
| Secondary button | `--control-bg`, `--control-text` |
| Ghost/subtle button | `--controlSubtle-bg`, `--controlSubtle-text` |
| Danger button | `--controlDanger-bg`, `--controlDanger-text` |
| Disabled control | `--controlDisabled-bg`, `--controlDisabled-text` |
| Primary text | `--page-text` or `--card-text` |
| Secondary text | `--page-text-soft` or `--card-text-soft` |
| Tertiary text | `--page-text-softer` or `--card-text-softer` |
| Borders | `--page-border`, `--card-border`, `--control-border` |
| Focus ring | `--focus-ring`, `--focus-ring-width`, `--focus-ring-offset` |

---

## Token Categories

### 1. Container Tokens (Static Backgrounds)

Container tokens are for static background regions that don't have interactive states.

#### Page (Main Background)
```css
--page-bg              /* Main app background */
--page-text            /* Primary text */
--page-text-soft       /* Secondary text (30% less contrast) */
--page-text-softer     /* Tertiary text (50% less contrast) */
--page-text-hard       /* Maximum contrast text */
--page-border          /* Borders */
```

#### Card (Elevated Containers)
```css
--card-bg              /* Card/panel background */
--card-text            /* Primary text on card */
--card-text-soft       /* Secondary text on card */
--card-text-softer     /* Tertiary text on card */
--card-border          /* Card border */
--card-shadow          /* Card shadow */
```

#### Inset (Recessed Areas - Inputs, Wells)
```css
--inset-bg             /* Default background */
--inset-bg-hover       /* Hover state */
--inset-bg-focus       /* Focus state */
--inset-text           /* Text color */
--inset-text-soft      /* Placeholder/hint text */
--inset-border         /* Border */
--inset-border-focus   /* Focus border (often same as --focus-ring) */
```

#### Overlay (Modal Layer)
```css
--overlay-bg           /* Modal/dialog background */
--overlay-text         /* Text on overlay */
--overlay-border       /* Border */
--overlay-shadow       /* Shadow */
--overlay-backdrop     /* Backdrop behind overlay (semi-transparent) */
```

#### Popout (Highest Elevation - Dropdowns, Menus)
```css
--popout-bg            /* Dropdown/menu background */
--popout-text          /* Text */
--popout-border        /* Border */
--popout-shadow        /* Shadow */
```

---

### 2. Control Tokens (Interactive Elements)

Control tokens include hover, pressed, and other state variations.

#### Control (Default Buttons/Controls)
```css
--control-bg                /* Default background */
--control-bg-hover          /* Hover background */
--control-bg-pressed        /* Active/pressed background */
--control-text              /* Text color */
--control-text-hover        /* Hover text */
--control-border            /* Border */
--control-border-hover      /* Hover border */
```

#### Control Primary (Primary Buttons/Actions)
```css
--controlPrimary-bg         /* Background (typically brand color) */
--controlPrimary-bg-hover   /* Hover background */
--controlPrimary-bg-pressed /* Pressed background */
--controlPrimary-text       /* Text (typically white) */
--controlPrimary-border     /* Border */
```

#### Control Danger (Destructive Actions)
```css
--controlDanger-bg          /* Background (red) */
--controlDanger-bg-hover    /* Hover background */
--controlDanger-bg-pressed  /* Pressed background */
--controlDanger-text        /* Text */
--controlDanger-border      /* Border */
```

#### Control Subtle (Ghost/Minimal Buttons)
```css
--controlSubtle-bg          /* Background (transparent or very subtle) */
--controlSubtle-bg-hover    /* Hover background */
--controlSubtle-bg-pressed  /* Pressed background */
--controlSubtle-text        /* Text color */
--controlSubtle-text-hover  /* Hover text */
```

#### Control Disabled
```css
--controlDisabled-bg        /* Disabled background */
--controlDisabled-text      /* Disabled text */
--controlDisabled-border    /* Disabled border */
```

---

### 3. Feedback Tokens (Status Colors)

These are semantic colors that maintain consistent meaning across themes.

#### Success (Green)
```css
--success-bg               /* Success alert background */
--success-text             /* Success text */
--success-border           /* Success border */
--success-icon             /* Success icon color */
```

#### Warning (Amber)
```css
--warning-bg               /* Warning alert background */
--warning-text             /* Warning text */
--warning-border           /* Warning border */
--warning-icon             /* Warning icon color */
```

#### Danger (Red)
```css
--danger-bg                /* Error alert background */
--danger-text              /* Error text */
--danger-border            /* Error border */
--danger-icon              /* Error icon color */
```

#### Info (Blue)
```css
--info-bg                  /* Info alert background */
--info-text                /* Info text */
--info-border              /* Info border */
--info-icon                /* Info icon color */
```

---

### 4. Special Tokens

#### Focus Ring
```css
--focus-ring               /* Focus ring color */
--focus-ring-width         /* Ring thickness (default: 2px) */
--focus-ring-offset        /* Space between element and ring (default: 2px) */
```

**Usage:**
```css
.my-element:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
}
```

#### Links
```css
--link                     /* Default link color */
--link-hover               /* Hover color */
--link-pressed             /* Active/pressed color */
--link-visited             /* Visited color */
```

#### Selection
```css
--selection-bg             /* Text selection background */
--selection-text           /* Selected text color */
```

#### Scrollbar
```css
--scrollbar-track          /* Scrollbar track */
--scrollbar-thumb          /* Scrollbar thumb */
--scrollbar-thumb-hover    /* Thumb hover state */
```

---

### 5. Spacing Tokens

Based on a 4px grid system.

```css
--space-0                  /* 0px */
--space-1                  /* 4px */
--space-2                  /* 8px */
--space-3                  /* 12px */
--space-4                  /* 16px (base unit) */
--space-5                  /* 20px */
--space-6                  /* 24px */
--space-8                  /* 32px */
--space-10                 /* 40px */
--space-12                 /* 48px */
--space-16                 /* 64px */
```

---

### 6. Typography Tokens

#### Font Families
```css
--font-sans                /* System sans-serif stack */
--font-mono                /* Monospace font stack */
--font-serif               /* Serif font stack */
```

#### Font Sizes
```css
--text-xs                  /* 11px - Fine print */
--text-sm                  /* 13px - Small text, captions */
--text-base                /* 15px - Body text (default) */
--text-lg                  /* 17px - Large body text */
--text-xl                  /* 20px - Subheadings */
--text-2xl                 /* 24px - Section headings */
--text-3xl                 /* 30px - Page headings */
--text-4xl                 /* 36px - Large headings */
```

#### Font Weights
```css
--weight-normal            /* 400 */
--weight-medium            /* 500 */
--weight-semibold          /* 600 */
--weight-bold              /* 700 */
```

#### Line Heights
```css
--leading-none             /* 1 */
--leading-tight            /* 1.25 */
--leading-snug             /* 1.375 */
--leading-normal           /* 1.5 (default) */
--leading-relaxed          /* 1.625 */
--leading-loose            /* 2 */
```

---

### 7. Border Radius Tokens

```css
--radius-none              /* 0px */
--radius-sm                /* 2px */
--radius-md                /* 4px (default for buttons) */
--radius-lg                /* 8px (default for cards) */
--radius-xl                /* 12px */
--radius-2xl               /* 16px */
--radius-full              /* 9999px (pill shape) */
```

---

### 8. Shadow Tokens

```css
--shadow-sm                /* Subtle shadow */
--shadow-md                /* Default card shadow */
--shadow-lg                /* Elevated elements */
--shadow-xl                /* Modals, overlays */
```

---

### 9. Animation Tokens

#### Durations
```css
--duration-instant         /* 0ms - Immediate feedback */
--duration-fast            /* 100ms - Micro-interactions */
--duration-normal          /* 200ms - Default (buttons, inputs) */
--duration-slow            /* 300ms - Larger elements */
--duration-slower          /* 500ms - Page transitions */
```

#### Easing Functions
```css
--ease-default             /* cubic-bezier(0.4, 0, 0.2, 1) - General purpose */
--ease-in                  /* cubic-bezier(0.4, 0, 1, 1) - Enter animations */
--ease-out                 /* cubic-bezier(0, 0, 0.2, 1) - Exit animations */
--ease-in-out              /* cubic-bezier(0.4, 0, 0.2, 1) - Continuous */
--ease-bounce              /* cubic-bezier(0.34, 1.56, 0.64, 1) - Playful */
```

---

### 10. Component Tokens

Pre-configured combinations for common patterns.

#### Size Tokens (Height Standards)
```css
--size-control-sm          /* 28px - Small controls */
--size-control-md          /* 36px - Default controls */
--size-control-lg          /* 44px - Large controls */
```

**IMPORTANT:** All interactive controls (buttons, inputs, selects, segmented controls) should use these height tokens to ensure they align when placed side-by-side.

#### Button Padding
```css
--button-padding-x         /* Horizontal padding */
--button-padding-y         /* Vertical padding */
--button-radius            /* Border radius */
```

#### Input Dimensions
```css
--input-height             /* Input field height */
--input-padding-x          /* Horizontal padding */
```

#### Card/Panel Padding
```css
--card-padding             /* Standard card padding */
--modal-padding            /* Modal content padding */
```

---

## Common Patterns

### Button Styling
```css
.button {
  /* Use control tokens */
  background: var(--control-bg);
  color: var(--control-text);
  border: 1px solid var(--control-border);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-4);
  font-weight: var(--weight-medium);
  transition: all var(--duration-fast) var(--ease-default);
}

.button:hover:not(:disabled) {
  background: var(--control-bg-hover);
}

.button:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
}

.button:disabled {
  background: var(--controlDisabled-bg);
  color: var(--controlDisabled-text);
  cursor: not-allowed;
}
```

### Input Field Styling
```css
.input {
  background: var(--inset-bg);
  color: var(--inset-text);
  border: 1px solid var(--inset-border);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
  transition: all var(--duration-fast) var(--ease-default);
}

.input::placeholder {
  color: var(--inset-text-soft);
}

.input:hover:not(:disabled) {
  background: var(--inset-bg-hover);
}

.input:focus {
  background: var(--inset-bg-focus);
  border-color: var(--focus-ring);
  box-shadow: 0 0 0 var(--focus-ring-width) var(--focus-ring);
  outline: none;
}
```

### Card Styling
```css
.card {
  background: var(--card-bg);
  color: var(--card-text);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: var(--shadow-md);
}
```

### Animated Indicator (Tabs, Segmented Controls)
```css
.indicator {
  background: var(--controlPrimary-bg);
  border-radius: var(--radius-md);
  transition:
    transform var(--duration-normal) var(--ease-default),
    width var(--duration-normal) var(--ease-default);
  will-change: transform, width;
}

/* Skip animation on initial render */
.indicator.initial {
  transition: none;
}

/* Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .indicator {
    transition: none;
  }
}
```

---

## Accessibility Requirements

### Contrast Ratios

| Content Type | AA (Default) | AAA (High Contrast) |
|-------------|--------------|---------------------|
| Normal text | 4.5:1 | 7:1 |
| Large text (18px+) | 3:1 | 4.5:1 |
| UI components | 3:1 | 4.5:1 |

The token system automatically ensures these ratios when you use the proper tokens.

### Focus Visibility

Always provide visible focus indicators:

```css
/* Use the focus ring tokens */
.interactive:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
}

/* Never hide focus completely */
/* BAD: .element:focus { outline: none; } */
```

### Reduced Motion

Always respect the user's motion preferences:

```css
.animated {
  transition: transform var(--duration-normal) var(--ease-default);
}

@media (prefers-reduced-motion: reduce) {
  .animated {
    transition: none;
  }
}
```

---

## Don'ts

### Never Hardcode Colors
```css
/* BAD */
.button {
  background: #3b82f6;
  color: white;
}

/* GOOD */
.button {
  background: var(--controlPrimary-bg);
  color: var(--controlPrimary-text);
}
```

### Never Hardcode Spacing
```css
/* BAD */
.card {
  padding: 16px;
  margin-bottom: 24px;
}

/* GOOD */
.card {
  padding: var(--space-4);
  margin-bottom: var(--space-6);
}
```

### Never Hardcode Durations
```css
/* BAD */
.button {
  transition: background 150ms ease;
}

/* GOOD */
.button {
  transition: background var(--duration-fast) var(--ease-default);
}
```

### Never Skip Focus Styles
```css
/* BAD - removes focus for everyone */
.button:focus {
  outline: none;
}

/* GOOD - styles focus properly */
.button:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
}
```

---

## Fallback Values

When using tokens, always provide fallbacks for robustness:

```css
.element {
  /* Fallback ensures styling works even if token is undefined */
  background: var(--card-bg, #ffffff);
  color: var(--card-text, #1a1a1a);
  border-radius: var(--radius-md, 4px);
}
```

---

## See Also

- [Theme Definition Guide](./src/themes/theme-definition.md) - Creating custom themes
- [Schema Definition](./src/themes/schema/schema-definition.md) - Token roles and derivation rules
