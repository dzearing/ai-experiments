# Technology Stack Analysis

**Project:** @ui-kit monorepo - Coworker Design System Parity Milestone
**Researched:** 2026-02-01
**Confidence:** HIGH

---

## Executive Summary

This milestone extends existing validated capabilities with NO new runtime dependencies. The existing stack (React 19, TypeScript 5.4, Vite 5, CSS Modules, Storybook 10) supports all new features. Changes are architectural (new packages) and content (tokens, icons) rather than technology.

**Stack Verdict:** No new dependencies required. Leverage existing build patterns.

---

## Existing Stack (Validated)

### Build System
| Technology | Version | Role | Notes |
|------------|---------|------|-------|
| Vite | ^5.0.0 | Build tool | Used consistently across all React packages |
| vite-plugin-dts | ^4.5.4 | TypeScript declarations | Generates .d.ts files |
| vite-plugin-lib-inject-css | ^2.2.2 | CSS injection | Injects CSS into ES modules |
| TypeScript | ^5.4.0 | Type system | Consistent across monorepo |
| pnpm workspaces | N/A | Monorepo | Established pattern |

### React Packages
| Technology | Version | Role |
|------------|---------|------|
| React | ^19.1.0 | UI library |
| react-dom | ^19.1.0 | DOM rendering |
| Storybook | ^10.1.0 | Development environment |
| Vitest | ^3.2.4 | Testing |

### Core Package
| Technology | Version | Role |
|------------|---------|------|
| esbuild | ^0.20.0 | Theme generation build |
| tsx | ^4.20.3 | Build scripts |

### Icons Package
| Technology | Version | Role | Notes |
|------------|---------|------|-------|
| svgo | ^3.3.2 | SVG optimization | For new icon processing |
| sharp | ^0.33.5 | PNG generation | For icon exports |
| svgicons2svgfont | ^14.0.0 | Font generation | Existing capability |
| ttf2woff2 | ^6.0.1 | Font conversion | Existing capability |

**Verdict:** All build tools already in place. No additions needed.

---

## New Packages Required

### 1. @ui-kit/react-layout

**Purpose:** Page structure components (PageHeader, TitleBar, SidePanel)

**Stack:**
```json
{
  "dependencies": {
    "@ui-kit/core": "workspace:*",
    "@ui-kit/icons": "workspace:*",
    "@ui-kit/react": "workspace:*"
  },
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  },
  "devDependencies": {
    "@storybook/react": "^10.1.0",
    "@storybook/react-vite": "^10.1.0",
    "typescript": "^5.4.0",
    "vite": "^5.0.0",
    "vite-plugin-dts": "^4.5.4",
    "vite-plugin-lib-inject-css": "^2.2.2",
    "vitest": "^3.2.4"
  }
}
```

**Build Configuration:** Clone from `@ui-kit/react/vite.config.ts` (validated pattern)

**Why These Dependencies:**
- NO new runtime dependencies - pure React components
- Reuses icons, core tokens, and base React components
- CSS Modules for styling (existing pattern)

---

### 2. @ui-kit/react-cards

**Purpose:** Entity cards (FileCard, PersonCard, EventCard)

**Stack:**
```json
{
  "dependencies": {
    "@ui-kit/core": "workspace:*",
    "@ui-kit/icons": "workspace:*",
    "@ui-kit/react": "workspace:*"
  },
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  },
  "devDependencies": {
    "@storybook/react": "^10.1.0",
    "@storybook/react-vite": "^10.1.0",
    "typescript": "^5.4.0",
    "vite": "^5.0.0",
    "vite-plugin-dts": "^4.5.4",
    "vite-plugin-lib-inject-css": "^2.2.2",
    "vitest": "^3.2.4"
  }
}
```

**Build Configuration:** Clone from `@ui-kit/react/vite.config.ts` (validated pattern)

**Why These Dependencies:**
- NO new runtime dependencies - pure React components
- Reuses Avatar, Chip, and other base components from `@ui-kit/react`
- CSS Modules for structured card layouts

---

## Dependencies NOT Needed

### What We're NOT Adding

| Library | Why NOT | Alternative |
|---------|---------|-------------|
| `classnames` or `clsx` | Unnecessary - CSS Modules generates unique classes | Native `className` string manipulation |
| `@radix-ui/*` | Not needed for layout/cards - these are display components | Native HTML semantics |
| `framer-motion` | No animations specified in gap analysis | CSS transitions (existing pattern) |
| `tailwindcss` | CSS Modules pattern established throughout | Continue with CSS Modules |
| `styled-components` | CSS-in-JS not used in this codebase | CSS Modules |
| New icon library | All icons will be added to existing `@ui-kit/icons` | Extend existing icon system |

**Rationale:** The existing stack has proven patterns for component development. Adding new libraries would:
1. Increase bundle size unnecessarily
2. Introduce inconsistency across packages
3. Create learning curve for contributors
4. Deviate from established patterns

---

## Core Package Extensions

### Typography Token Additions

**Location:** `packages/ui-kit/core/src/tokens/typography.ts`

**New Tokens Required:**
```typescript
// Add to fontSizeTokens
'--text-5xl': '40px',           // Large Title
'--text-display': '68px',       // Display

// Add semantic typography tokens
'--text-title-1': '28px',       // Title 1
'--text-subtitle-1': '20px',    // Subtitle 1 (maps to xl)
'--text-subtitle-2': '16px',    // Subtitle 2
'--text-body-1': '16.6px',      // Body 1 (use 17px for simplicity)
'--text-body-2': '14px',        // Body 2
'--text-body-3': '12px',        // Body 3
'--text-caption-1': '12px',     // Caption 1 (same as body-3)
'--text-caption-2': '10px',     // Caption 2
```

**Integration Strategy:**
1. Add to `fontSizeTokens` const
2. Update `generateTypographyTokens()` to include new sizes
3. Maintain existing scale multiplier behavior
4. NO BREAKING CHANGES - purely additive

**Why This Approach:**
- Coworker has 14 typography levels, ui-kit has 8
- Adding 6 new levels bridges the gap
- Semantic names (`body-1`, `caption-1`) match Fluent/Coworker conventions
- Existing `--text-xl`, `--text-2xl` remain unchanged for backwards compatibility

---

### Brand Flair / Gradient Support

**Location:** `packages/ui-kit/core/src/themes/types.ts`

**New Theme Property:**
```typescript
export interface ThemeDefinition {
  // ... existing properties

  /** Brand gradient colors for AI features */
  brandFlair?: {
    color1: string;  // Primary gradient color
    color2: string;  // Secondary gradient color
    color3: string;  // Tertiary gradient color
  };
}
```

**Generated Tokens:**
```css
--brand-flair-1: #464FEB;
--brand-flair-2: #47CFFA;
--brand-flair-3: #B47CF8;
--gradient-brand: linear-gradient(90deg, var(--brand-flair-1), var(--brand-flair-2), var(--brand-flair-3));
```

**Generator Integration:** `packages/ui-kit/core/src/themes/generator.ts`
- Add `brandFlair` handling in `generateThemeTokens()`
- Generate gradient tokens when `brandFlair` is defined
- Optional property - themes without it skip gradient generation

**Why This Approach:**
- Copilot design uses gradients for AI/brand features
- Gradients are NOT derivable from primary color (artistic choice)
- Optional property maintains backwards compatibility
- 3-color gradients provide flexibility

---

### Copilot Theme Definition

**Location:** `packages/ui-kit/core/src/themes/copilot.ts` (NEW FILE)

**Theme Structure:**
```typescript
import type { ThemeDefinition } from './types';

export const copilotTheme: ThemeDefinition = {
  id: 'copilot',
  name: 'Copilot',
  description: 'Microsoft Copilot brand theme',

  colors: {
    primary: '#0F6CBD',  // Fluent brand blue
    neutral: '#242424',
  },

  typography: {
    fontSans: "'Segoe UI Variable', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
  },

  brandFlair: {
    color1: '#464FEB',
    color2: '#47CFFA',
    color3: '#B47CF8',
  },

  // Light mode overrides
  overrides: {
    light: {
      '--page-bg': '#fafafa',
      '--page-text': '#242424',
    },
    dark: {
      '--page-bg': '#1a1a1a',
      '--page-text': '#e5e5e5',
    },
  },
};
```

**Export from Core:**
```typescript
// packages/ui-kit/core/src/index.ts
export { copilotTheme } from './themes/copilot';
```

**Why This Approach:**
- Single theme definition supports light, dark, and high-contrast modes
- Theme generator automatically creates all 3 modes
- High contrast derives from `accessibility.level: 'AAA'` (no separate definition needed)
- Follows existing theme pattern (see `packages/ui-kit/core/src/themes/`)

---

## Icon Additions

**Location:** `packages/ui-kit/icons/src/svgs/`

**New Icons Required (30 total):**

### UI Icons (9)
- `sparkle.svg` - AI/magic indicator
- `microphone.svg` - Voice input
- `microphone-off.svg` - Muted mic
- `shield.svg` - Sensitivity/security
- `shield-lock.svg` - Protected content
- `pin.svg` - Pin/unpin
- `bookmark.svg` - Bookmark
- `briefcase.svg` - Work/business
- `attachment.svg` - File attachment (if not exists)

### Microsoft Product Icons (11)
- `copilot.svg` - Copilot logo (mono version)
- `copilot-color.svg` - Copilot logo (color version)
- `word.svg` - Microsoft Word
- `excel.svg` - Microsoft Excel
- `powerpoint.svg` - Microsoft PowerPoint
- `outlook.svg` - Microsoft Outlook
- `teams.svg` - Microsoft Teams
- `onedrive.svg` - OneDrive
- `sharepoint.svg` - SharePoint
- `defender.svg` - Microsoft Defender
- `power-apps.svg` - Power Apps

### Agent Icons (7)
- `analyst.svg` - Analyst agent
- `researcher.svg` - Researcher agent
- `catch-up.svg` - Catch Up agent
- `planner.svg` - Planner agent
- `flow-builder.svg` - Flow Builder
- `sales.svg` - Sales agent
- `photos.svg` - Photos agent

### Additional Status Icons (3)
- `needs-input.svg` - Needs user input
- `proactive-reply.svg` - Proactive suggestion
- `running-alt.svg` - Alternative running indicator (if needed)

**Build Process:**
1. Add SVG files to `src/svgs/`
2. Run `pnpm build:components` - generates React components
3. Run `pnpm build:sprite` - generates sprite.svg
4. Run `pnpm build:font` - generates WOFF2 font
5. Run `pnpm build:metadata` - updates search index

**Existing Build Tools Support All:**
- SVG optimization: `svgo` (already installed)
- Component generation: `tsx scripts/generate-components.ts` (existing)
- Sprite generation: `tsx scripts/generate-sprite.ts` (existing)
- Font generation: Pipeline already exists
- PNG exports: `sharp` (already installed)

**No New Dependencies Required.**

---

## Chat Package Extensions

**Location:** `packages/ui-kit/react-chat/`

**New Components (NO new dependencies):**

### Attachment Components
- `AttachmentPill.tsx` - Individual attachment
- `AttachmentList.tsx` - List of attachments

**Stack:** Pure React + CSS Modules (existing pattern)

### Citation Components
- `Citation.tsx` - Inline citation link
- `ReferenceList.tsx` - List of references

**Stack:** Pure React + CSS Modules (existing pattern)

### Reasoning Components
- `ReasoningSteps.tsx` - Chain of thought container
- `ReasoningStep.tsx` - Individual reasoning step
- `ReasoningProgress.tsx` - Progress indicator

**Stack:** Pure React + CSS Modules (existing pattern)

### Feedback Components
- `FeedbackButtons.tsx` - Thumbs up/down
- `FeedbackForm.tsx` - Feedback form

**Stack:** Pure React + CSS Modules (existing pattern)

**Why No New Dependencies:**
- All components are presentational (display data, emit events)
- Rich text editing already handled by TipTap (existing in react-chat)
- Collapsible behavior uses native `<details>` element or React state
- No complex interactions requiring external libraries

---

## React Package Extensions

**Location:** `packages/ui-kit/react/`

**New Components (NO new dependencies):**

### Notification Components
- `NotificationBell.tsx` - Bell icon with badge
- `NotificationItem.tsx` - Individual notification
- `NotificationList.tsx` - List of notifications

**Stack:** Pure React + CSS Modules

### Onboarding Components
- `TourPopover.tsx` - Step-by-step tour
- `OnboardingDialog.tsx` - Initial setup dialog

**Stack:** Pure React + CSS Modules + Popover component (already exists)

**Why No New Dependencies:**
- Popover positioning using CSS `position: absolute` or existing Popover component
- Tour state management with React hooks
- No need for tour libraries (react-joyride, etc.) - simple use case

---

## Build Process Additions

### New Package Scaffolding

**Steps:**
1. Create package directory structure
2. Copy `vite.config.ts` from `@ui-kit/react`
3. Copy `tsconfig.json` from `@ui-kit/react`
4. Copy `.storybook/` from `@ui-kit/react`
5. Update `package.json` with correct name/description
6. Add to root `pnpm-workspace.yaml` (if not auto-discovered)

**No New Build Tools Required.**

---

## Testing Strategy

**No New Testing Dependencies:**
- Unit tests: Vitest (already configured)
- Component tests: `@testing-library/react` (already in react packages)
- Visual tests: Storybook (already configured)

**Test Coverage for New Features:**
- Layout components: Render tests, prop validation
- Card components: Render tests, interaction tests
- Typography tokens: Visual regression in Storybook
- Brand gradients: Visual tests in Storybook
- Icons: Snapshot tests (existing pattern)

---

## Migration from Existing Code

### NOT Needed
This milestone does NOT migrate existing code. All new components are additive.

### Integration Points
New packages integrate at build time:
- `@ui-kit/react-layout` imports from `@ui-kit/react`
- `@ui-kit/react-cards` imports from `@ui-kit/react`
- Both use `@ui-kit/core` tokens
- Both use `@ui-kit/icons`

**No Runtime Integration Complexity.**

---

## Deployment Considerations

### Package Publication
Each package builds independently:
```bash
cd packages/ui-kit/react-layout && pnpm build
cd packages/ui-kit/react-cards && pnpm build
```

### Breaking Changes
**NONE.** All changes are additive:
- New packages don't affect existing packages
- New tokens don't break existing themes
- New icons extend existing icon system

### Versioning
- Core: Bump minor version (new tokens)
- Icons: Bump minor version (new icons)
- React-layout: Initial version 0.0.1
- React-cards: Initial version 0.0.1
- React-chat: Bump minor version (new components)
- React: Bump minor version (new components)

---

## Confidence Assessment

| Area | Confidence | Source |
|------|-----------|--------|
| Build tools | HIGH | Verified from existing package.json files |
| React patterns | HIGH | Existing packages use identical patterns |
| Typography extension | HIGH | Reviewed typography.ts, additive changes only |
| Theme architecture | HIGH | Reviewed generator.ts and types.ts |
| Icon pipeline | HIGH | Verified existing build scripts support all formats |
| NO new dependencies | HIGH | Gap analysis shows display-only components |

---

## Risks and Mitigations

### Risk: Typography Token Naming Conflicts
**Likelihood:** LOW
**Impact:** MEDIUM
**Mitigation:** New tokens use distinct names (`--text-display`, `--text-body-1`) that don't conflict with existing `--text-{size}` pattern

### Risk: Brand Gradient Browser Support
**Likelihood:** LOW
**Impact:** LOW
**Mitigation:** CSS gradients supported in all modern browsers. Fallback: solid color using `--brand-flair-1`

### Risk: Package Interdependencies
**Likelihood:** LOW
**Impact:** LOW
**Mitigation:** All new packages depend only on `@ui-kit/core`, `@ui-kit/icons`, `@ui-kit/react` (established packages). No circular dependencies.

---

## Alternatives Considered

### Alternative 1: Use Radix UI for Layout Components
**Rejected Because:**
- Layout components are simple containers (header, panel, titlebar)
- No complex interactions requiring Radix primitives
- Adds 50KB+ to bundle for minimal benefit
- Inconsistent with existing component patterns

### Alternative 2: Use Tailwind for New Packages
**Rejected Because:**
- CSS Modules pattern established across all packages
- Switching mid-project creates inconsistency
- Tailwind requires build configuration changes
- Token system already provides design system values

### Alternative 3: Framer Motion for Animations
**Rejected Because:**
- Gap analysis doesn't specify animations
- CSS transitions sufficient for hover/press states
- 45KB library for features not in requirements
- Can add later if animations become requirement

### Alternative 4: Separate Icon Package per Category
**Rejected Because:**
- Single `@ui-kit/icons` package already supports 100+ icons
- Build pipeline handles all icon types uniformly
- Splitting would complicate imports and versioning
- No performance benefit (tree-shaking works at icon level, not package level)

---

## Installation Commands

### For Development
```bash
# Install all dependencies (from monorepo root)
pnpm install

# Build core with new tokens
cd packages/ui-kit/core && pnpm build

# Build icons with new icons
cd packages/ui-kit/icons && pnpm build

# Build new packages
cd packages/ui-kit/react-layout && pnpm build
cd packages/ui-kit/react-cards && pnpm build

# Build extended packages
cd packages/ui-kit/react-chat && pnpm build
cd packages/ui-kit/react && pnpm build
```

### For Consumers
```bash
# Install specific packages
pnpm add @ui-kit/react-layout @ui-kit/react-cards

# Or install all
pnpm add @ui-kit/core @ui-kit/icons @ui-kit/react @ui-kit/react-chat @ui-kit/react-layout @ui-kit/react-cards
```

---

## Success Metrics

**Stack is adequate if:**
- [ ] New packages build without adding dependencies
- [ ] All 30+ new icons process through existing pipeline
- [ ] Typography tokens generate correctly in theme system
- [ ] Brand gradient tokens appear in generated CSS
- [ ] Copilot theme exports light, dark, high-contrast modes
- [ ] Storybook renders all new components
- [ ] Bundle sizes remain reasonable (no bloat)

**All metrics achievable with existing stack.**

---

## Next Steps for Roadmap

Based on this stack analysis, roadmap should prioritize:

1. **Phase 1: Core Extensions** (No new packages)
   - Add typography tokens to core
   - Add brandFlair support to theme generator
   - Create Copilot theme definition
   - Validate with Storybook

2. **Phase 2: Icon Additions** (Extend existing package)
   - Design/source 30 new icons
   - Add SVGs to icons package
   - Run build pipeline
   - Validate in Storybook

3. **Phase 3: New Packages** (Parallel development)
   - Create `@ui-kit/react-layout` package structure
   - Create `@ui-kit/react-cards` package structure
   - Scaffold from `@ui-kit/react` template
   - Set up Storybook for each

4. **Phase 4: Component Development** (Parallel per package)
   - Implement layout components
   - Implement card components
   - Implement chat extensions
   - Implement react extensions

**No blocked dependencies. All phases can start immediately after planning.**
