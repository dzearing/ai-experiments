# UI Kit Design Principles

## Surface-Based Color System

Our color system is built on the concept of **surfaces** - distinct visual contexts where content appears. Each surface defines a complete set of foreground colors that are guaranteed to meet accessibility contrast requirements.

### The Three-Part Token Pattern

Every color token follows this pattern:

```
--[surface]-[foreground]-[state]
```

1. **Surface** (extensible): The background context
   - `body`, `buttonPrimary`, `noticeDanger`, etc.
   - New surfaces can be added as needed
   - Use camelCase for multi-word surfaces

2. **Foreground** (fixed set): The element type
   - `text`, `link`, `border`, `icon`, `background`, `shadow`, `overlay`
   - Includes soft/hard variants: `textSoft10`, `textHard20`
   - This set is intentionally limited for consistency

3. **State** (optional, fixed set): Interaction states
   - `-hover`, `-active`, `-focus`, `-selected`, `-disabled`, `-visited`
   - Compound states use camelCase: `-selectedHover`

### Examples

```css
/* Basic usage */
--body-text              /* Text on body surface */
--buttonPrimary-text     /* Text on primary button */
--noticeDanger-border    /* Border on danger notice */

/* With soft/hard variants */
--body-textSoft20        /* Muted text (20% less contrast) */
--body-textHard10        /* Emphasized text (10% more contrast) */

/* With states */
--body-link-hover        /* Link hover state */
--body-text-disabled     /* Disabled text */
--body-background-selectedHover  /* Selected AND hovered */
```

## Soft/Hard Contrast Scale

Instead of arbitrary numbers (50-900), we use a semantic scale:

- **Soft**: Reduces contrast with the surface (subtler)
  - `soft10` = 10% less contrast
  - `soft20` = 20% less contrast
  - `soft30` = 30% less contrast

- **Hard**: Increases contrast with the surface (stronger)
  - `hard10` = 10% more contrast
  - `hard20` = 20% more contrast

- **Base**: The default contrast level (no modifier)

This system replaces ambiguous concepts:

- `textSoft20` replaces "muted text"
- `textHard10` replaces "heading text"
- `borderSoft10` replaces "subtle border"

## Accessibility Requirements

### WCAG Contrast Standards

All color combinations within a surface must meet:

- **Normal text**: 4.5:1 contrast ratio (WCAG AA)
- **Large text** (18pt+): 3:1 contrast ratio (WCAG AA)
- **Enhanced** (AAA): 7:1 for normal text, 4.5:1 for large text

### Surface Groupings

Each surface guarantees proper contrast for all its foreground elements:

```css
/* Good - Using colors from the same surface */
.notice {
  background: var(--noticeDanger);
  color: var(--noticeDanger-text);
  border: 1px solid var(--noticeDanger-border);
}

/* Bad - Mixing colors from different surfaces */
.notice {
  background: var(--noticeDanger);
  color: var(--body-text); /* Wrong! May not have proper contrast */
}
```

### Testing Contrast

1. Always test foreground/background pairs from the same surface
2. Use browser DevTools or contrast checking tools
3. Test in both light and dark modes
4. Consider color blindness simulations

## Common Surfaces

### Base Surfaces

- `body`: Main application background
- `raised`: Elevated cards and panels
- `overlay`: Modal and dialog backgrounds

### Action Surfaces

- `buttonPrimary`: Primary action buttons
- `buttonDanger`: Destructive actions
- `buttonSuccess`: Positive actions
- `buttonNeutral`: Default buttons

### Notification Surfaces

- `noticeInfo`: Informational messages
- `noticeSuccess`: Success feedback
- `noticeWarning`: Warning messages
- `noticeDanger`: Error states

### Specialized Surfaces

- `codeBlock`: Code block backgrounds
- `codeInline`: Inline code snippets
- `tooltip`: Tooltip backgrounds
- `menu`: Dropdown menus

## Migration from Numbered Scale

| Old System            | New System                |
| --------------------- | ------------------------- |
| `--color-neutral-50`  | `--body-backgroundSoft20` |
| `--color-neutral-100` | `--body-backgroundSoft10` |
| `--color-neutral-200` | `--body-background`       |
| `--color-neutral-600` | `--body-textSoft20`       |
| `--color-neutral-700` | `--body-textSoft10`       |
| `--color-neutral-900` | `--body-text`             |
| `--color-primary-600` | `--buttonPrimary`         |
| `--color-error-600`   | `--buttonDanger`          |

## Dark Mode Considerations

Dark mode adjusts surface colors while maintaining contrast ratios:

1. Surface colors invert (light → dark)
2. Foreground colors adjust to maintain readability
3. Soft/hard relationships remain consistent
4. Some colors may need different hues (e.g., `codeInline-text`)

## Best Practices

1. **Always use complete surface sets**

   ```css
   /* Use all colors from one surface */
   background: var(--raised);
   color: var(--raised-text);
   border: 1px solid var(--raised-border);
   ```

2. **Respect surface boundaries**
   - Don't mix `--body-text` on `--buttonPrimary` surface
   - Each surface is a complete, self-contained system

3. **Use semantic surfaces**
   - `buttonDanger` for destructive actions
   - `noticeDanger` for error messages
   - Different surfaces = different visual purposes

4. **Leverage soft/hard variants**
   - Use `textSoft20` instead of creating new "muted" concepts
   - Use `textHard10` for emphasis without new tokens

5. **Test accessibility**
   - Verify contrast ratios for all combinations
   - Test with screen readers
   - Check both light and dark modes

## Adding New Surfaces

When creating a new surface:

1. Define the surface color and its states
2. Define ALL standard foreground elements:
   - `text`, `textSoft*`, `textHard*`
   - `link`, `link-hover`, `link-visited`
   - `border`, `icon`, `background`
3. Test all combinations for proper contrast
4. Document the surface's purpose and usage
5. Ensure dark mode compatibility

Example:

```css
/* New surface for promotional content */
--promo: #673ab7;
--promo-text: #ffffff;
--promo-textSoft10: rgba(255, 255, 255, 0.9);
--promo-link: #ffc107;
--promo-link-hover: #ffca28;
--promo-border: rgba(255, 255, 255, 0.2);
```
