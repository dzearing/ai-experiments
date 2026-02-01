---
phase: 09-layout-components
plan: 01
subsystem: design-tokens
tags:
  - z-index
  - css-custom-properties
  - overlay-components

dependency-graph:
  requires: []
  provides:
    - z-index-scale
    - centralized-layer-management
  affects:
    - 09-02 (SidePanel)
    - 09-03 (PageHeader, TitleBar)
    - 09-04 (ContentLayout)

tech-stack:
  added: []
  patterns:
    - css-custom-property-tokens
    - centralized-z-index-scale

file-tracking:
  key-files:
    created:
      - packages/ui-kit/react/src/styles/z-index.css
    modified:
      - packages/ui-kit/react/src/index.ts
      - packages/ui-kit/react/src/components/Drawer/Drawer.module.css
      - packages/ui-kit/react/src/components/Modal/Modal.module.css
      - packages/ui-kit/react/src/components/Tooltip/Tooltip.module.css
      - packages/ui-kit/react/src/components/Toast/Toast.module.css

decisions:
  - id: z-index-scale-values
    choice: "11-level scale with 100-increment gaps"
    rationale: "Allows inserting new layers if needed; follows Bootstrap pattern"
  - id: modal-backdrop-layer
    choice: "Modal, Drawer, and Dialog share z-modal-backdrop (500)"
    rationale: "All use same overlay pattern, consistent stacking"
  - id: toast-above-tooltip
    choice: "Toast (900) > Tooltip (800)"
    rationale: "Notifications should remain visible even when tooltips are showing"

metrics:
  duration: "3 minutes"
  completed: "2026-02-01"
---

# Phase 9 Plan 01: Z-Index Scale Summary

Centralized z-index tokens using CSS custom properties for consistent layer management across all overlay components.

## What Was Built

### Z-Index Token Scale

Created `/packages/ui-kit/react/src/styles/z-index.css` with 11 named layers:

| Token | Value | Usage |
|-------|-------|-------|
| `--z-base` | 0 | Default, no elevation |
| `--z-dropdown` | 100 | Dropdown menus, select options |
| `--z-sticky` | 200 | Sticky headers, floating elements |
| `--z-fixed` | 300 | Fixed position elements |
| `--z-sidebar` | 400 | SidePanel in overlay mode |
| `--z-modal-backdrop` | 500 | Modal/dialog/drawer backdrop |
| `--z-modal` | 600 | Modal/dialog/drawer content |
| `--z-popover` | 700 | Popovers, context menus |
| `--z-tooltip` | 800 | Tooltips |
| `--z-toast` | 900 | Toast notifications |
| `--z-max` | 9999 | Dev tools, emergency UI |

### Component Migration

Updated 4 components to use the new tokens:
- **Drawer**: `z-index: 1000` -> `var(--z-modal-backdrop)`
- **Modal**: `z-index: 1000` -> `var(--z-modal-backdrop)`
- **Tooltip**: `z-index: 10000` -> `var(--z-tooltip)`
- **Toast**: `z-index: 9999` -> `var(--z-toast)`

### Package Integration

Added CSS import in `index.ts` so tokens are automatically available when the package is imported.

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 971d355 | feat | Create z-index token scale |
| a094092 | refactor | Migrate components to z-index tokens |
| 0fc9f13 | feat | Export z-index styles from package |

## Verification

- [x] File `z-index.css` exists with all 11 tokens
- [x] `grep "var(--z-"` shows token usage in Drawer, Modal, Tooltip, Toast
- [x] `pnpm build` succeeds without errors
- [x] Built CSS contains z-index custom properties
- [x] No hardcoded z-index values > 10 remain in component CSS

## Deviations from Plan

### Additional Components Migrated

**[Rule 2 - Missing Critical]** The plan specified Drawer and Dialog. However:
1. Dialog has no z-index (it uses Modal internally)
2. Tooltip and Toast had hardcoded high z-index values (10000 and 9999)

Migrated Tooltip and Toast as well to establish consistent layer management across all overlay components.

## Next Phase Readiness

- Z-index tokens are now available for SidePanel (09-02)
- Future overlay components should use `var(--z-*)` tokens
- Pattern established: 100-increment gaps allow adding new layers if needed
