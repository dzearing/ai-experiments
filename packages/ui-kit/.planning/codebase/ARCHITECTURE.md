# Architecture

**Analysis Date:** 2026-01-17

## Pattern Overview

**Overall:** Multi-package UI component library monorepo with layered architecture

**Key Characteristics:**
- Framework-agnostic core with React bindings
- Token-based design system with tonal surfaces
- Data-driven theme generation from JSON rules
- Tree-shakeable packages with named exports per component
- CSS Modules for component styling

## Layers

**Core Layer (`core/`):**
- Purpose: Framework-agnostic design tokens, themes, surfaces, and runtime
- Location: `core/src/`
- Contains: Token definitions, theme generator, surface system, bootstrap runtime, Vite plugin
- Depends on: None (standalone)
- Used by: All React packages

**Component Layer (`react/`):**
- Purpose: Base React component library with 60+ primitive components
- Location: `react/src/`
- Contains: Buttons, inputs, overlays, navigation, feedback, layout components
- Depends on: `@ui-kit/core`, `@ui-kit/icons`
- Used by: `react-chat`, `react-markdown`, `react-pickers`, `mock-pages`, `website`

**Domain Component Layers:**
- `react-chat/src/`: Chat-specific components (ChatInput, ChatPanel, MessageQueue)
- `react-markdown/src/`: Markdown rendering and editing components
- `react-pickers/src/`: File and folder picker components
- `icons/src/`: Icon library with React components and SVG sprites

**Utility Layer:**
- `router/src/`: Lightweight React router
- `core/src/vite/`: Build tooling (Vite plugin for zero-flash themes)

**Demo/Documentation Layer:**
- `mock-pages/`: Example pages using Storybook
- `website/`: Documentation website
- `icons-stories/`: Icon catalog Storybook

## Data Flow

**Theme Resolution Flow:**

1. Bootstrap script (`core/src/runtime/bootstrap.ts`) runs immediately on page load
2. Reads `localStorage` for stored theme/mode preferences
3. Sets `data-theme` and `data-mode` attributes on `<html>`
4. Loads theme CSS file on-demand from configured base path
5. `ThemeProvider` (`react/src/context/ThemeProvider.tsx`) subscribes to changes
6. Components read CSS custom properties for styling

**Token Generation Flow:**

1. Theme definitions in JSON (`core/src/themes/definitions/`)
2. Theme rules (`core/src/themes/schema/theme-rules.json`) define derivation formulas
3. `generateThemeTokens()` compiles definition + rules into CSS custom properties
4. Surface classes generated with isolation (nested surfaces reset to theme defaults)
5. Output: Per-theme, per-mode CSS files (e.g., `default-light.css`, `default-dark.css`)

**Component Token Usage:**

1. Component uses CSS Modules (e.g., `Button.module.css`)
2. CSS references design tokens: `var(--base-bg)`, `var(--primary-bg)`, etc.
3. Surface context (`.surface.raised`) overrides token values
4. Components automatically adapt to theme/surface context

## Key Abstractions

**Design Tokens:**
- Purpose: Semantic CSS custom properties for consistent styling
- Location: `core/src/tokens/` (spacing, typography, radii, shadows, animation)
- Pattern: Static tokens exported as TypeScript objects, compiled to CSS

**Surfaces:**
- Purpose: Contextual color palettes that adapt to nesting
- Location: `core/src/surfaces/definitions.ts`
- Types: Tonal (`base`, `raised`, `sunken`, `soft`, `inverted`, `primary`, etc.) and Feedback (`success`, `warning`, `danger`, `info`)
- Pattern: CSS class `.surface.{modifier}` resets all color group tokens

**Color Groups:**
- Purpose: Semantic color sets with state variants
- Pattern: Each group has 18 tokens (bg, bg-hover, bg-pressed, border variants, fg variants, semantic fg colors)
- Examples: `--base-bg`, `--primary-fg`, `--danger-border-hover`

**Theme Definitions:**
- Purpose: Brand configuration for generating complete themes
- Location: `core/src/themes/definitions/*.json`
- Pattern: Minimal input (primary color + optional overrides) produces full token set

## Entry Points

**Package Entry Points:**
- `core/src/index.ts`: Token, surface, theme, color, and runtime exports
- `react/src/index.ts`: All 60+ component exports with types
- `react-chat/src/index.ts`: Chat component exports
- `react-markdown/src/index.ts`: Markdown component exports
- `icons/src/utils/createIcon.tsx`: Icon factory function (each icon is a separate entry)

**Runtime Entry Points:**
- `core/src/runtime/bootstrap.ts`: Browser bootstrap for theme initialization
- `core/src/vite/plugin.ts`: Build-time integration for Vite projects
- `react/src/context/ThemeProvider.tsx`: React context for theme state

**Storybook Entry Points:**
- Each package with `.storybook/` has `dev` script for component development
- Default ports: `react` (6033), `react-pickers` (6034), `mock-pages` (6007)

## Error Handling

**Strategy:** Fail gracefully with fallbacks

**Patterns:**
- Theme loading errors: Fall back to default theme, log warning
- localStorage unavailable: Use in-memory defaults
- Missing CSS custom properties: CSS uses fallback values via `var(--token, fallback)`
- Component prop errors: TypeScript enforces correct types at build time

## Cross-Cutting Concerns

**Theming:**
- Bootstrap script sets theme immediately (zero flash)
- ThemeProvider React context syncs React state with DOM
- `window.UIKit` API for runtime theme changes

**Accessibility:**
- Theme generator enforces contrast ratios (AA default, AAA optional)
- `ensureContrast()` utility adjusts colors to meet WCAG
- Components use semantic HTML and ARIA attributes

**Styling:**
- CSS Modules for component isolation
- Design tokens for consistency
- Surface system for contextual adaptation

**Build:**
- Vite for React packages
- ESBuild + custom scripts for core
- Storybook for component development/documentation

---

*Architecture analysis: 2026-01-17*
