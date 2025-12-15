# Token System Update Plan

This plan outlines the migration from the current container-based token system to the new color group-based system.

**Reference:** http://localhost:5180/reference/new-tokens

---

## Overview

### The Change

**Before:** Tokens named by container type (`card`, `overlay`, `popout`, `control`, `controlPrimary`)
**After:** Tokens named by visual weight (`softer`, `soft`, `base`, `strong`, `stronger`, `primary`, `inverted`)

### Core Rule

> Pick a color group for your background. Use ONLY that group's foreground tokens. Contrast is guaranteed.

---

## Phase 1: Add New Tokens to Build System

### Files to Modify

- `packages/ui-kit/core/src/themes/schema/theme-rules.json`
- `packages/ui-kit/core/src/themes/generator.ts`

### New Token Structure

Each color group gets 12 tokens:

```
--{group}-bg
--{group}-bg-hover
--{group}-bg-pressed
--{group}-bg-disabled
--{group}-text-softer
--{group}-text-soft
--{group}-text
--{group}-text-strong
--{group}-text-stronger
--{group}-border-soft
--{group}-border
--{group}-border-strong
```

### New Color Groups (11 total)

| Group | Purpose |
|-------|---------|
| `softer` | Recessed areas, input backgrounds, wells |
| `soft` | Elevated cards, panels, alternating rows |
| `base` | Default page content, main surface |
| `strong` | Emphasized sections, highlights |
| `stronger` | Maximum emphasis areas |
| `primary` | Selection, active states, branded elements |
| `inverted` | Opposite color scheme (tooltips) |
| `success` | Success buttons, positive states |
| `warning` | Warning buttons, caution states |
| `danger` | Danger buttons, error states |
| `info` | Info buttons, informational states |

### New Semantic Text Tokens (7 total)

```
--text-primary           (brand colored text, links)
--text-primary-hover     (link hover)
--text-primary-pressed   (link active)
--text-danger            (inline error text)
--text-success           (inline success text)
--text-warning           (inline warning text)
--text-info              (inline info text)
```

### Legacy Tokens to Remove (Phase 4)

#### Container Tokens (REMOVE)
```
--page-bg, --page-text, --page-text-soft, --page-text-softer, --page-text-strong, --page-text-stronger
--page-border, --page-border-soft, --page-border-strong, --page-border-stronger, --page-shadow

--card-bg, --card-text, --card-text-soft, --card-text-strong, --card-text-stronger
--card-border, --card-border-soft, --card-border-strong, --card-border-stronger, --card-shadow

--overlay-bg, --overlay-text, --overlay-text-soft, --overlay-text-strong, --overlay-text-stronger
--overlay-border, --overlay-border-soft, --overlay-border-strong, --overlay-border-stronger, --overlay-shadow

--popout-bg, --popout-text, --popout-text-soft, --popout-text-strong, --popout-text-stronger
--popout-border, --popout-border-soft, --popout-border-strong, --popout-border-stronger, --popout-shadow

--inset-bg, --inset-bg-hover, --inset-bg-focus, --inset-text, --inset-text-soft
--inset-border, --inset-border-focus
```

#### Control Tokens (REMOVE)
```
--control-bg, --control-bg-hover, --control-bg-pressed
--control-text, --control-text-hover, --control-text-pressed
--control-border, --control-border-hover, --control-border-pressed, --control-shadow

--controlPrimary-bg, --controlPrimary-bg-hover, --controlPrimary-bg-pressed
--controlPrimary-text, --controlPrimary-border, --controlPrimary-shadow

--controlDanger-bg, --controlDanger-bg-hover, --controlDanger-bg-pressed
--controlDanger-text, --controlDanger-border, --controlDanger-shadow

--controlSubtle-bg, --controlSubtle-bg-hover, --controlSubtle-bg-pressed
--controlSubtle-text, --controlSubtle-text-hover, --controlSubtle-text-pressed, --controlSubtle-border

--controlDisabled-bg, --controlDisabled-text, --controlDisabled-border
```

#### Link Tokens (REMOVE)
```
--link, --link-hover, --link-pressed, --link-visited
```

#### Feedback Tokens (KEEP but restructure)
```
--success-bg, --success-text, --success-text-soft, --success-border, --success-icon
--warning-bg, --warning-text, --warning-text-soft, --warning-border, --warning-icon
--danger-bg, --danger-text, --danger-text-soft, --danger-border, --danger-icon
--info-bg, --info-text, --info-text-soft, --info-border, --info-icon
```
These become full color groups with hover/pressed/disabled states.

---

## Phase 2: Update Legacy Usage in ui-kit/* Packages

### Token Migration Map

| Legacy Token | New Token | Notes |
|--------------|-----------|-------|
| `--page-bg` | `--base-bg` | |
| `--page-text` | `--base-text` | |
| `--page-text-soft` | `--base-text-soft` | |
| `--page-text-softer` | `--base-text-softer` | |
| `--page-text-strong` | `--base-text-strong` | |
| `--page-text-stronger` | `--base-text-stronger` | |
| `--page-border` | `--base-border` | |
| `--page-border-soft` | `--base-border-soft` | |
| `--page-border-strong` | `--base-border-strong` | |
| `--card-bg` | `--soft-bg` | |
| `--card-text` | `--soft-text` | |
| `--card-text-soft` | `--soft-text-soft` | |
| `--card-text-strong` | `--soft-text-strong` | |
| `--card-border` | `--soft-border` | |
| `--card-shadow` | `--soft-shadow` | Add shadow token per group |
| `--overlay-bg` | `--soft-bg` | Overlays use soft group |
| `--overlay-text` | `--soft-text` | |
| `--overlay-shadow` | `--soft-shadow` | |
| `--popout-bg` | `--soft-bg` | Popouts use soft group |
| `--popout-text` | `--soft-text` | |
| `--popout-shadow` | `--soft-shadow` | |
| `--inset-bg` | `--softer-bg` | |
| `--inset-bg-hover` | `--softer-bg-hover` | |
| `--inset-bg-focus` | `--softer-bg-pressed` | Map focus to pressed |
| `--inset-text` | `--softer-text` | |
| `--inset-text-soft` | `--softer-text-soft` | |
| `--inset-border` | `--softer-border` | |
| `--control-bg` | `--base-bg` | Default buttons use base |
| `--control-bg-hover` | `--base-bg-hover` | |
| `--control-bg-pressed` | `--base-bg-pressed` | |
| `--control-text` | `--base-text` | |
| `--control-border` | `--base-border` | |
| `--controlPrimary-bg` | `--primary-bg` | |
| `--controlPrimary-bg-hover` | `--primary-bg-hover` | |
| `--controlPrimary-bg-pressed` | `--primary-bg-pressed` | |
| `--controlPrimary-text` | `--primary-text` | |
| `--controlPrimary-border` | `--primary-border` | |
| `--controlDanger-bg` | `--danger-bg` | |
| `--controlDanger-bg-hover` | `--danger-bg-hover` | |
| `--controlDanger-bg-pressed` | `--danger-bg-pressed` | |
| `--controlDanger-text` | `--danger-text` | |
| `--controlSubtle-bg` | `transparent` | Subtle buttons are transparent |
| `--controlSubtle-bg-hover` | `--base-bg-hover` | Or use opacity |
| `--controlSubtle-text` | `--base-text-soft` | |
| `--controlSubtle-text-hover` | `--base-text` | |
| `--controlDisabled-bg` | `--base-bg-disabled` | |
| `--controlDisabled-text` | `--base-text-softer` | Disabled text is very muted |
| `--link` | `--text-primary` | |
| `--link-hover` | `--text-primary-hover` | |
| `--link-pressed` | `--text-primary-pressed` | |

### Files to Update

#### packages/ui-kit/react/src/components/

- [ ] `Button/Button.module.css`
- [ ] `IconButton/IconButton.module.css`
- [ ] `Dropdown/Dropdown.module.css`
- [ ] `Segmented/Segmented.module.css`
- [ ] `Toolbar/Toolbar.module.css`
- [ ] `Tooltip/Tooltip.module.css`
- [ ] `TableOfContents/TableOfContents.module.css`

#### packages/ui-kit/website/src/

- [ ] `pages/Reference/ReferencePage.module.css`
- [ ] `pages/Home/Home.module.css`
- [ ] `components/TableOfContents/TableOfContents.module.css`
- [ ] Any other CSS files using legacy tokens

#### packages/ui-kit/core/src/

- [ ] `surfaces/definitions.ts` - Update surface class definitions
- [ ] `runtime/bootstrap.ts` - If token references exist

### Update Strategy

For each file:
1. Search for legacy token patterns (`--page-`, `--card-`, `--control`, etc.)
2. Replace with new token names per migration map
3. Ensure color group consistency (don't mix groups within a component)

---

## Phase 3: Build and Validate Stories

### Commands

```bash
# Build all packages
pnpm build

# Run Storybook
pnpm storybook

# Run type checking
pnpm typecheck
```

### Validation Checklist

- [ ] All components render without CSS errors
- [ ] Button variants (primary, danger, subtle, disabled) look correct
- [ ] IconButton states work properly
- [ ] Dropdown styling is correct
- [ ] Tooltip/popout styling is correct
- [ ] All surfaces display properly
- [ ] Light and dark modes both work
- [ ] Focus states are visible
- [ ] Disabled states are properly muted

### Visual Regression

For each component story:
1. Screenshot before migration
2. Screenshot after migration
3. Compare for unintended changes

---

## Phase 4: Remove Legacy Tokens

### Files to Modify

- `packages/ui-kit/core/src/themes/schema/theme-rules.json` - Remove old role definitions
- `packages/ui-kit/core/src/themes/generator.ts` - Remove old token generation

### Tokens to Remove

See "Legacy Tokens to Remove" section in Phase 1.

### Verification

```bash
# Search for any remaining legacy token usage
grep -r "--page-" packages/ui-kit/
grep -r "--card-" packages/ui-kit/
grep -r "--overlay-" packages/ui-kit/
grep -r "--popout-" packages/ui-kit/
grep -r "--inset-" packages/ui-kit/
grep -r "--control-" packages/ui-kit/
grep -r "--controlPrimary-" packages/ui-kit/
grep -r "--controlDanger-" packages/ui-kit/
grep -r "--controlSubtle-" packages/ui-kit/
grep -r "--controlDisabled-" packages/ui-kit/
grep -r "--link" packages/ui-kit/
```

If any matches found, update them before proceeding.

---

## Phase 5: Final Build and Validation

### Commands

```bash
# Clean build
pnpm clean
pnpm install
pnpm build

# Run all tests
pnpm test

# Run Storybook
pnpm storybook

# Type check
pnpm typecheck
```

### Final Checklist

- [ ] Build completes without errors
- [ ] All tests pass
- [ ] Storybook runs without errors
- [ ] All component stories render correctly
- [ ] Light mode works
- [ ] Dark mode works
- [ ] Theme switching works
- [ ] No console errors in browser
- [ ] Documentation pages render correctly

---

## Token Count Summary

| Category | Count |
|----------|-------|
| Color groups (11) × 12 tokens | 132 |
| Semantic text tokens | 7 |
| **Total new color tokens** | **139** |

### Tokens Kept (unchanged)

- Typography: `--text-*`, `--weight-*`, `--leading-*`, `--font-*`
- Spacing: `--space-*`
- Radii: `--radius-*`
- Shadows: `--shadow-*`
- Animation: `--duration-*`, `--ease-*`
- Focus: `--focus-ring`, `--focus-ring-width`, `--focus-ring-offset`
- Selection: `--selection-bg`, `--selection-text`
- Scrollbar: `--scrollbar-*`
- Skeleton: `--skeleton-*`
- Highlight: `--highlight-*`

---

## Rollback Plan

If issues are found after Phase 4:

1. Revert `theme-rules.json` and `generator.ts` to restore legacy tokens
2. Legacy tokens will be generated alongside new tokens
3. Components will work with either system during transition

---

## Success Criteria

1. All components render correctly with new tokens
2. No visual regressions in any component
3. Token selection is predictable: "pick a color group, stay within it"
4. Light/dark mode both work
5. Theme switching works
6. Build is clean with no warnings
