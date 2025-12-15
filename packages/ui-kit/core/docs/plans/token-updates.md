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

Each color group gets 18 tokens:

**Backgrounds (4):**
```
--{group}-bg
--{group}-bg-hover
--{group}-bg-pressed
--{group}-bg-disabled
```

**Borders (4):**
```
--{group}-border
--{group}-border-hover
--{group}-border-pressed
--{group}-border-disabled
```

**Foregrounds (10):**
```
--{group}-fg              (primary text color)
--{group}-fg-soft         (secondary text, 30% less contrast)
--{group}-fg-softer       (tertiary text, 50% less contrast)
--{group}-fg-strong       (emphasized text)
--{group}-fg-stronger     (maximum contrast text)
--{group}-fg-primary      (link/accent color, accessible on this bg)
--{group}-fg-danger       (error text, accessible on this bg)
--{group}-fg-success      (success text, accessible on this bg)
--{group}-fg-warning      (warning text, accessible on this bg)
--{group}-fg-info         (info text, accessible on this bg)
```

**Key Principle:** All `fg-*` tokens in a group are guaranteed accessible on that group's `bg` token.

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

### Semantic Foreground Tokens (Scoped per Group)

Instead of standalone `--text-primary`, `--text-danger`, etc., these semantic colors are now scoped within each color group:

```
--base-fg-primary        (link color on base background)
--base-fg-danger         (error text on base background)
--soft-fg-primary        (link color on soft background)
--soft-fg-danger         (error text on soft background)
--inverted-fg-primary    (link color on inverted background)
...etc for all groups
```

This ensures accessibility: `--base-fg-primary` is guaranteed accessible on `--base-bg`, while `--soft-fg-primary` is guaranteed accessible on `--soft-bg`.

### Link Special Tokens (Kept)

For universal link styling, use the special `--link` tokens:
```
--link                   (link color, inherits from theme primary)
--link-hover             (link hover state)
--link-pressed           (link pressed state)
--link-visited           (visited link color)
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
| `--page-text` | `--base-fg` | `text` → `fg` |
| `--page-text-soft` | `--base-fg-soft` | |
| `--page-text-softer` | `--base-fg-softer` | |
| `--page-text-strong` | `--base-fg-strong` | |
| `--page-text-stronger` | `--base-fg-stronger` | |
| `--page-border` | `--base-border` | |
| `--page-border-soft` | `--base-border` | Single border, use states |
| `--page-border-strong` | `--base-border-hover` | |
| `--card-bg` | `--soft-bg` | |
| `--card-text` | `--soft-fg` | `text` → `fg` |
| `--card-text-soft` | `--soft-fg-soft` | |
| `--card-text-strong` | `--soft-fg-strong` | |
| `--card-border` | `--soft-border` | |
| `--overlay-bg` | `--soft-bg` | Overlays use soft group |
| `--overlay-text` | `--soft-fg` | |
| `--popout-bg` | `--soft-bg` | Popouts use soft group |
| `--popout-text` | `--soft-fg` | |
| `--inset-bg` | `--softer-bg` | |
| `--inset-bg-hover` | `--softer-bg-hover` | |
| `--inset-bg-focus` | `--softer-bg-pressed` | Map focus to pressed |
| `--inset-text` | `--softer-fg` | `text` → `fg` |
| `--inset-text-soft` | `--softer-fg-soft` | |
| `--inset-border` | `--softer-border` | |
| `--control-bg` | `--base-bg` | Default buttons use base |
| `--control-bg-hover` | `--base-bg-hover` | |
| `--control-bg-pressed` | `--base-bg-pressed` | |
| `--control-text` | `--base-fg` | `text` → `fg` |
| `--control-border` | `--base-border` | |
| `--controlPrimary-bg` | `--primary-bg` | |
| `--controlPrimary-bg-hover` | `--primary-bg-hover` | |
| `--controlPrimary-bg-pressed` | `--primary-bg-pressed` | |
| `--controlPrimary-text` | `--primary-fg` | `text` → `fg` |
| `--controlPrimary-border` | `--primary-border` | |
| `--controlDanger-bg` | `--danger-bg` | |
| `--controlDanger-bg-hover` | `--danger-bg-hover` | |
| `--controlDanger-bg-pressed` | `--danger-bg-pressed` | |
| `--controlDanger-text` | `--danger-fg` | `text` → `fg` |
| `--controlSubtle-bg` | `transparent` | Subtle buttons are transparent |
| `--controlSubtle-bg-hover` | `--base-bg-hover` | Or use opacity |
| `--controlSubtle-text` | `--base-fg-soft` | `text` → `fg` |
| `--controlSubtle-text-hover` | `--base-fg` | |
| `--controlDisabled-bg` | `--base-bg-disabled` | |
| `--controlDisabled-text` | `--base-fg-softer` | Disabled text is very muted |
| `--link` | `--link` | KEEP - special token |
| `--link-hover` | `--link-hover` | KEEP |
| `--link-pressed` | `--link-pressed` | KEEP |
| `--text-primary` | `--base-fg-primary` | Now scoped to group |
| `--text-danger` | `--base-fg-danger` | Now scoped to group |
| `--text-success` | `--base-fg-success` | Now scoped to group |
| `--text-warning` | `--base-fg-warning` | Now scoped to group |
| `--text-info` | `--base-fg-info` | Now scoped to group |

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
| Color groups (11) × 18 tokens | 198 |
| Link special tokens | 4 |
| **Total new color tokens** | **202** |

### Breakdown per Color Group (18 tokens each)

| Token Type | Count | Examples |
|------------|-------|----------|
| Background states | 4 | `bg`, `bg-hover`, `bg-pressed`, `bg-disabled` |
| Border states | 4 | `border`, `border-hover`, `border-pressed`, `border-disabled` |
| Foreground variants | 5 | `fg`, `fg-soft`, `fg-softer`, `fg-strong`, `fg-stronger` |
| Semantic foregrounds | 5 | `fg-primary`, `fg-danger`, `fg-success`, `fg-warning`, `fg-info` |

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
