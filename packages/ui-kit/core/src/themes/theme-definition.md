# Theme Definition Guide

This document describes how to create theme JSON files for UI Kit. Themes are defined as JSON files in `src/themes/definitions/` and processed by the generator to produce CSS.

## Quick Start

Minimal theme definition:

```json
{
  "id": "my-theme",
  "name": "My Theme",
  "colors": {
    "primary": "#3b82f6"
  }
}
```

That's it! The generator will derive all other colors and tokens automatically.

---

## Complete Theme Structure

```json
{
  "id": "my-theme",
  "name": "My Theme",
  "description": "A custom theme with blue primary color",

  "colors": {
    "primary": "#3b82f6",
    "secondary": "#6366f1",
    "accent": "#f59e0b",
    "neutral": "#64748b"
  },

  "config": {
    "saturation": 0,
    "temperature": 0,
    "contrastBoost": 0
  },

  "typography": {
    "fontSans": "'Inter', sans-serif",
    "fontMono": "'JetBrains Mono', monospace",
    "fontSerif": "'Merriweather', serif",
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

  "overrides": {
    "light": {
      "--page-bg": "#fafafa"
    },
    "dark": {
      "--page-bg": "#0a0a0a"
    }
  }
}
```

---

## Property Reference

### `id` (required)
Unique identifier for the theme. Used in CSS selectors and file names.

- **Type:** `string`
- **Pattern:** `^[a-z][a-z0-9-]*$` (lowercase, hyphens allowed)
- **Examples:** `"default"`, `"high-contrast"`, `"my-custom-theme"`

```json
"id": "ocean-breeze"
```

### `name` (required)
Human-readable display name.

- **Type:** `string`
- **Examples:** `"Ocean Breeze"`, `"High Contrast"`, `"GitHub Dark"`

```json
"name": "Ocean Breeze"
```

### `description` (optional)
Brief description of the theme's visual style.

- **Type:** `string`

```json
"description": "Cool blues and aquatic tones inspired by the ocean"
```

---

## Colors

### `colors.primary` (required)
The main brand color. This is the only required color - all others can be derived.

- **Type:** `string` (hex color)
- **Used for:** Primary buttons, links, focus rings, selected states

```json
"colors": {
  "primary": "#2563eb"
}
```

### `colors.secondary` (optional)
Secondary brand color for complementary UI elements.

- **Type:** `string` (hex color)
- **Default:** Derived by shifting primary hue by 15 degrees
- **Used for:** Secondary buttons, accents, complementary elements

```json
"colors": {
  "primary": "#2563eb",
  "secondary": "#7c3aed"
}
```

### `colors.accent` (optional)
Accent color for highlights and special elements.

- **Type:** `string` (hex color)
- **Default:** Derived as complementary color (180 degree hue shift)
- **Used for:** Highlights, badges, special callouts

```json
"colors": {
  "primary": "#2563eb",
  "accent": "#f59e0b"
}
```

### `colors.neutral` (optional)
Base gray/neutral color for UI chrome.

- **Type:** `string` (hex color)
- **Default:** Derived by desaturating primary by 80%
- **Used for:** Borders, disabled states, secondary text

```json
"colors": {
  "primary": "#2563eb",
  "neutral": "#64748b"
}
```

---

## Config (Color Adjustments)

Fine-tune how colors are processed.

### `config.saturation`
Adjust color saturation globally.

- **Type:** `number`
- **Range:** `-100` to `100`
- **Default:** `0`
- **Effect:** Positive = more vibrant, Negative = more muted

```json
"config": {
  "saturation": 20
}
```

### `config.temperature`
Shift color temperature (warm/cool).

- **Type:** `number`
- **Range:** `-100` to `100`
- **Default:** `0`
- **Effect:** Positive = warmer (more red/yellow), Negative = cooler (more blue)

```json
"config": {
  "temperature": -15
}
```

### `config.contrastBoost`
Increase contrast between elements.

- **Type:** `number`
- **Range:** `0` to `100`
- **Default:** `0`
- **Effect:** Higher values increase contrast for better readability

```json
"config": {
  "contrastBoost": 20
}
```

---

## Typography

Customize font settings.

### `typography.fontSans`
Primary sans-serif font stack.

- **Type:** `string`
- **Default:** `'Segoe UI Web', 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', sans-serif`

```json
"typography": {
  "fontSans": "'Inter', -apple-system, sans-serif"
}
```

### `typography.fontMono`
Monospace font stack for code.

- **Type:** `string`
- **Default:** `'JetBrains Mono', 'Fira Code', 'Consolas', monospace`

```json
"typography": {
  "fontMono": "'Fira Code', monospace"
}
```

### `typography.fontSerif`
Serif font stack for special content.

- **Type:** `string`
- **Default:** `'Merriweather', Georgia, 'Times New Roman', serif`

```json
"typography": {
  "fontSerif": "'Playfair Display', Georgia, serif"
}
```

### `typography.scale`
Scale multiplier for all font sizes.

- **Type:** `number`
- **Default:** `1.0`
- **Effect:** `0.9` = 90% of default, `1.1` = 110% of default

```json
"typography": {
  "scale": 1.1
}
```

### `typography.baseSize`
Base font size in pixels.

- **Type:** `number`
- **Default:** `15`

```json
"typography": {
  "baseSize": 16
}
```

---

## Spacing

Customize spacing scale.

### `spacing.scale`
Scale multiplier for all spacing values.

- **Type:** `number`
- **Default:** `1.0`
- **Effect:** `0.8` = compact, `1.2` = spacious

```json
"spacing": {
  "scale": 0.9
}
```

### `spacing.baseUnit`
Base spacing unit in pixels.

- **Type:** `number`
- **Default:** `4`

```json
"spacing": {
  "baseUnit": 4
}
```

---

## Border Radius

Customize corner rounding.

### `radii.scale`
Scale multiplier for all radius values.

- **Type:** `number`
- **Default:** `1.0`

```json
"radii": {
  "scale": 1.5
}
```

### `radii.style`
Preset radius style.

- **Type:** `"sharp"` | `"subtle"` | `"rounded"` | `"pill"`
- **Default:** `"rounded"`

| Style | Effect |
|-------|--------|
| `sharp` | No rounding (0px) |
| `subtle` | Minimal rounding (2px base) |
| `rounded` | Standard rounding (4px base) |
| `pill` | Heavy rounding (8px base) |

```json
"radii": {
  "style": "pill"
}
```

---

## Animation

Customize motion settings.

### `animation.scale`
Scale multiplier for all animation durations.

- **Type:** `number`
- **Default:** `1.0`
- **Effect:** `0.5` = faster, `2.0` = slower

```json
"animation": {
  "scale": 0.8
}
```

### `animation.reduceMotion`
Minimize animations for accessibility.

- **Type:** `boolean`
- **Default:** `false`

```json
"animation": {
  "reduceMotion": true
}
```

---

## Accessibility

Configure accessibility requirements.

### `accessibility.level`
Target WCAG contrast level.

- **Type:** `"AA"` | `"AAA"`
- **Default:** `"AA"`

| Level | Normal Text | Large Text | UI Components |
|-------|-------------|------------|---------------|
| AA | 4.5:1 | 3:1 | 3:1 |
| AAA | 7:1 | 4.5:1 | 4.5:1 |

```json
"accessibility": {
  "level": "AAA"
}
```

---

## Overrides

Directly override specific CSS tokens per mode.

### `overrides.light`
Token overrides for light mode.

- **Type:** `object` (token name → value)

```json
"overrides": {
  "light": {
    "--page-bg": "#ffffff",
    "--page-text": "#1a1a1a",
    "--card-shadow": "0 2px 8px rgba(0,0,0,0.1)"
  }
}
```

### `overrides.dark`
Token overrides for dark mode.

- **Type:** `object` (token name → value)

```json
"overrides": {
  "dark": {
    "--page-bg": "#0a0a0a",
    "--page-text": "#e5e5e5",
    "--card-shadow": "0 2px 8px rgba(0,0,0,0.5)"
  }
}
```

### Available Override Tokens

You can override any generated token. Common ones include:

**Page/Container:**
- `--page-bg`, `--page-text`, `--page-border`
- `--card-bg`, `--card-text`, `--card-shadow`
- `--overlay-bg`, `--overlay-shadow`

**Controls:**
- `--control-bg`, `--control-text`
- `--controlPrimary-bg`, `--controlPrimary-text`

**Special:**
- `--focus-ring`, `--focus-ring-width`
- `--link`, `--link-hover`

**Sizing:**
- `--radius-sm`, `--radius-md`, `--radius-lg`
- `--shadow-sm`, `--shadow-md`, `--shadow-lg`

---

## Example Themes

### Minimal Theme
```json
{
  "id": "minimal",
  "name": "Minimal",
  "description": "Clean and understated",
  "colors": {
    "primary": "#374151"
  },
  "config": {
    "saturation": -20
  }
}
```

### High Contrast Theme
```json
{
  "id": "high-contrast",
  "name": "High Contrast",
  "description": "AAA-compliant for maximum accessibility",
  "colors": {
    "primary": "#0052cc"
  },
  "accessibility": {
    "level": "AAA"
  },
  "overrides": {
    "light": {
      "--page-text": "#000000",
      "--page-bg": "#ffffff",
      "--focus-ring-width": "3px"
    },
    "dark": {
      "--page-text": "#ffffff",
      "--page-bg": "#000000",
      "--focus-ring-width": "3px"
    }
  }
}
```

### Terminal Theme
```json
{
  "id": "terminal",
  "name": "Terminal",
  "description": "Green-on-black hacker aesthetic",
  "colors": {
    "primary": "#22c55e",
    "secondary": "#10b981",
    "accent": "#06b6d4"
  },
  "typography": {
    "fontSans": "'JetBrains Mono', monospace"
  },
  "overrides": {
    "dark": {
      "--page-bg": "#0a0a0a",
      "--page-text": "#22c55e",
      "--card-bg": "#111111"
    }
  }
}
```

---

## Adding a New Theme

1. Create a JSON file in `src/themes/definitions/`:
   ```
   src/themes/definitions/my-theme.json
   ```

2. Add required fields:
   ```json
   {
     "id": "my-theme",
     "name": "My Theme",
     "colors": {
       "primary": "#hexcolor"
     }
   }
   ```

3. Build to generate CSS:
   ```bash
   pnpm build
   ```

4. Use in your application:
   ```html
   <html data-theme="my-theme" data-mode="light">
   ```

---

## CSS Output

Each theme generates two CSS files:
- `{id}-light.css` - Light mode tokens
- `{id}-dark.css` - Dark mode tokens

The CSS includes:
1. All token variables (colors, spacing, typography, etc.)
2. Base typography rules

---

## Understanding Token Roles vs Surfaces

### Token Roles
The first part of a token name defines its **role** - its semantic purpose:
- `--page-bg` → role is `page` (main background)
- `--controlPrimary-text` → role is `controlPrimary` (primary button text)
- `--card-shadow` → role is `card` (card container shadow)

Roles are predefined in the schema and generate tokens automatically.

### Surfaces
Surfaces are CSS classes you create to redefine tokens in a scoped area. Use them when:
- A sidebar needs a different background shade
- A hero section has a colored background where buttons need adjustment
- A footer has an inverted color scheme

Example surface:
```css
.surface-sidebar {
  --page-bg: #f0f0f0;
  --card-bg: #ffffff;
}
```

See [schema-definition.md](./schema/schema-definition.md) for complete documentation on token roles and surface patterns.
