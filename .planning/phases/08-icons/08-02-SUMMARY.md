---
phase: 08-icons
plan: 02
subsystem: ui-kit
tags: [icons, product-icons, react, build-pipeline]
dependency_graph:
  requires: []
  provides:
    - "@ui-kit/react-product-icons package structure"
    - "Multi-size product icon build pipeline"
    - "ProductIconProps type with size union"
    - "createProductIcon factory function"
  affects:
    - "08-03 (Microsoft app icons)"
    - "08-04 (Agent icons)"
tech_stack:
  added:
    - "@ui-kit/react-product-icons (new package)"
  patterns:
    - "Size-specific SVG variants for pixel-perfect rendering"
    - "Factory pattern for icon component generation"
    - "Multi-color fill preservation (not currentColor)"
key_files:
  created:
    - packages/ui-kit/react-product-icons/package.json
    - packages/ui-kit/react-product-icons/tsconfig.json
    - packages/ui-kit/react-product-icons/vite.config.ts
    - packages/ui-kit/react-product-icons/README.md
    - packages/ui-kit/react-product-icons/.gitignore
    - packages/ui-kit/react-product-icons/src/utils/types.ts
    - packages/ui-kit/react-product-icons/src/utils/createProductIcon.tsx
    - packages/ui-kit/react-product-icons/src/utils/index.ts
    - packages/ui-kit/react-product-icons/scripts/utils.ts
    - packages/ui-kit/react-product-icons/scripts/generate-components.ts
    - packages/ui-kit/react-product-icons/scripts/build.ts
  modified: []
decisions:
  - id: size-variants
    choice: "Support discrete sizes (16, 24, 32, 48) with nearest-match fallback"
    rationale: "Product icons need pixel-perfect rendering at specific sizes"
  - id: color-preservation
    choice: "SVGO config preserves fill/stroke colors"
    rationale: "Product icons use multi-color fills for brand identity"
  - id: factory-pattern
    choice: "createProductIcon factory instead of inline components"
    rationale: "Consistent component generation with size-mapped content"
metrics:
  duration: "~8 minutes"
  completed: "2026-02-01"
---

# Phase 08 Plan 02: React Product Icons Package Structure Summary

**One-liner:** New @ui-kit/react-product-icons package with build pipeline for multi-color, multi-size product icons supporting discrete sizes (16/24/32/48) and color preservation.

## What Was Built

### Package Structure
Created new package at `packages/ui-kit/react-product-icons/` with:
- **package.json**: Configured as `@ui-kit/react-product-icons` with build scripts, peer deps (React 18/19)
- **tsconfig.json**: TypeScript config matching existing icons package
- **vite.config.ts**: Library build with per-icon entry points for tree-shaking
- **README.md**: Usage documentation, API reference, development guide
- **.gitignore**: Ignores dist/ and generated components

### Type System
- **ProductIconProps**: Extends SVG props with `size` (16|24|32|48|number) and `title` for accessibility
- **ProductIconSize**: Union type for discrete sizes
- **ProductIconMetadata**: Build-time metadata (name, category, keywords, sizes)
- **SizeMappedContent**: Maps sizes to SVG content strings

### Component Factory
`createProductIcon()` factory function:
- Accepts size-mapped SVG content (different SVGs for different sizes)
- Returns forwardRef component with accessibility support
- Selects nearest available size for non-standard requests
- Preserves original fill/stroke colors (multi-color icons)

### Build Pipeline
1. **utils.ts**: SVG parsing, filename parsing (detects size suffixes like `-24.svg`)
2. **generate-components.ts**: Scans src/svgs/{microsoft,agents}/, generates React components
3. **build.ts**: Orchestrates clean, generate, Vite build, package.json exports update

### Key Differences from UI Icons
| Feature | UI Icons (@ui-kit/icons) | Product Icons (@ui-kit/react-product-icons) |
|---------|--------------------------|---------------------------------------------|
| Colors | currentColor (themeable) | Multi-color fills (brand colors) |
| Sizes | Any size (scales) | Discrete sizes (16, 24, 32, 48) |
| Variants | Single SVG | Size-specific SVGs when available |
| Use case | UI actions | App logos, agent avatars |

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

All verification criteria passed:
- [x] Package directory structure exists with correct files
- [x] package.json has correct name, scripts, and dependencies
- [x] ProductIconProps defines size union (16|24|32|48|number)
- [x] createProductIcon factory exists and handles size selection
- [x] Build scripts run successfully (0 icons processed - expected, no SVGs yet)
- [x] `pnpm install` succeeded in package directory

## Commits

| Commit | Type | Description |
|--------|------|-------------|
| 44ed171 | feat | Create package structure and configuration |
| 01da951 | feat | Add ProductIconProps types and createProductIcon factory |
| 00d4331 | feat | Add build scripts for product icon generation |

## Next Steps

1. **08-03**: Add Microsoft product icon SVGs (Word, Excel, etc.)
2. **08-04**: Add agent icon SVGs with persona visuals
3. Test icon rendering at various sizes in Storybook

## Technical Notes

- SVGO config explicitly excludes `removeUselessStrokeAndFill` to preserve multi-color fills
- Size detection parses filenames: `word-24.svg` -> size 24, `word.svg` -> all sizes
- Generated components use `dangerouslySetInnerHTML` for performance (same as UI icons)
- Empty components directory is gitignored; regenerated on each build
