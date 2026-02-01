# Architecture Patterns: Coworker Design System Integration

**Domain:** UI Component Library (Design System)
**Researched:** 2026-02-01
**Context:** Milestone 2 - Adding layout components, card components, chat enhancements, and Copilot theme to existing ui-kit

## Existing Architecture

### Package Structure

The ui-kit uses a monorepo architecture with clear separation of concerns:

```
packages/ui-kit/
├── core/              # Framework-agnostic tokens and theme system
├── icons/             # SVG icon components
├── react/             # React component library
├── react-chat/        # Chat-specific components
├── react-markdown/    # Markdown rendering
├── react-pickers/     # Picker components
├── router/            # Routing utilities
├── website/           # Documentation site
└── mock-*-pages/      # Demo applications
```

**Dependency Flow:**
- `core` → No dependencies (foundation layer)
- `icons` → No dependencies (standalone)
- `react` → Depends on `core`, `icons`
- `react-chat` → Depends on `core`, `icons`, `react`, `react-markdown`
- Higher packages → Build on lower layers

### Theme System Architecture

**Core Components:**

1. **Theme Definitions** (`core/src/themes/definitions/*.json`)
   - JSON files defining theme colors, typography, config
   - Minimal input format (primary color + optional overrides)
   - Currently: 20 theme definitions (default, arctic, cyberpunk, fluent, github, etc.)

2. **Theme Generator** (`core/src/themes/generator.ts`)
   - Reads `theme-rules.json` (single source of truth)
   - Generates complete CSS from theme definitions
   - Produces ~18 tokens per color group
   - Generates surface classes for contextual styling

3. **Token Categories** (from `theme-rules.json`):
   - **Color Groups:** `softer`, `soft`, `base`, `strong`, `stronger`, `primary`, `inverted`, `success`, `warning`, `danger`, `info`
   - **Feedback Surfaces:** `feedback-success`, `feedback-warning`, `feedback-danger`, `feedback-info`
   - **Special Tokens:** `focus`, `selection`, `link`, `scrollbar`, `skeleton`, `highlight`
   - **Component Tokens:** `control-height-*`, `button-*`, `input-*`, `card-*`, etc.

4. **Typography Tokens** (`core/src/tokens/typography.ts`)
   - Font families: `--font-sans`, `--font-mono`, `--font-serif`
   - Font sizes: `--text-xs` through `--text-4xl` (8 sizes)
   - Font weights: `--weight-normal` through `--weight-bold` (4 weights)
   - Line heights: `--leading-tight`, `--leading-normal`, `--leading-loose`

### Component Architecture

**Pattern: CSS Modules + Surface Classes**

Components follow a consistent pattern:

1. **Component File Structure:**
```
Component/
├── Component.tsx          # Component logic
├── Component.module.css   # Scoped styles
├── index.ts               # Export
└── Component.stories.tsx  # Storybook
```

2. **Token Usage Pattern:**
```tsx
// Component uses base tokens
<div className={styles.card}>
  {/* bg: var(--base-bg), text: var(--base-fg) */}
</div>

// Surface class remaps tokens contextually
<div className="surface primary">
  <Card /> {/* Now uses primary-bg, primary-fg */}
</div>
```

3. **CSS Module Pattern:**
```css
.card {
  background: var(--base-bg);
  color: var(--base-fg);
  border: 1px solid var(--base-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}
```

### Build System

**Vite + TypeScript:**
- Entry: `src/index.ts` (barrel export)
- Output: ES modules in `dist/`
- Plugins: `vite-plugin-dts` (type definitions), `vite-plugin-lib-inject-css` (CSS injection)
- CSS Modules: Scoped to component, camelCase naming
- External: React, React-DOM (peer dependencies)

**Current Index Pattern:**
- Single index.ts exports all components
- Grouped by category (Actions, Inputs, Layout, etc.)
- Types exported alongside components

## Integration Points for New Features

### 1. New Packages: react-layout, react-cards

**RECOMMENDATION: Do NOT create new packages.**

**Rationale:**
- Existing `react` package already exports `Card`, `Stack`, `Grid`, `Panel`, `Form` (layout components)
- Creating new packages would fragment the API and confuse consumers
- Package boundaries should be based on dependency needs, not feature grouping
- `react-chat` exists because it has unique dependencies (TipTap, Tanstack Virtual)

**Instead: Enhance existing `react` package**

**For "Coworker Layout" components:**
```
packages/ui-kit/react/src/components/
├── AppBar/           # NEW: Top navigation bar
├── SideNav/          # NEW: Side navigation
├── ContentLayout/    # NEW: Main content wrapper
├── ToolWindow/       # NEW: Floating tool panel
└── Stack/            # EXISTS: Already has layout
```

**For "Coworker Cards":**
```
packages/ui-kit/react/src/components/
├── Card/             # EXISTS: Enhance with new variants
├── PersonaCard/      # NEW: Specialized card variant
├── ProjectCard/      # NEW: Specialized card variant
└── StatusCard/       # NEW: Specialized card variant
```

### 2. Copilot Theme Extension

**Integration Point:** `core/src/themes/definitions/copilot.json`

**Required Changes:**

1. **Create Theme Definition:**
```json
{
  "id": "copilot",
  "name": "Copilot",
  "description": "GitHub Copilot-inspired theme",
  "colors": {
    "primary": "#8b5cf6",
    "secondary": "#a855f7",
    "accent": "#c084fc",
    "neutral": "#6b7280"
  },
  "accessibility": {
    "level": "AA"
  }
}
```

2. **No Generator Changes Needed:**
   - Existing generator already handles all themes
   - Theme-rules.json already defines all token derivation
   - Just add JSON file to definitions/

3. **Build Process:**
   - Build script (`core/scripts/build-themes.ts`) automatically processes all JSON files
   - Generates CSS to `dist/themes/copilot.css` and `dist/themes/copilot.dark.css`
   - No changes to build needed

4. **Consumption:**
```typescript
import { applyTheme } from '@ui-kit/core';
applyTheme('copilot', 'light');
```

### 3. Typography Token Expansion

**Current State:**
- 8 size tokens (`--text-xs` through `--text-4xl`)
- 4 weight tokens
- 3 line-height tokens

**Coworker Needs:**
- Display sizes (larger than 4xl)
- Additional weights (black/900)
- Compact line-heights

**Integration Point:** `core/src/tokens/typography.ts`

**Modification Strategy:**

```typescript
// BEFORE (8 sizes)
const fontSizeTokens = {
  '--text-xs': '11px',
  '--text-sm': '13px',
  '--text-base': '15px',
  '--text-lg': '17px',
  '--text-xl': '20px',
  '--text-2xl': '24px',
  '--text-3xl': '30px',
  '--text-4xl': '36px',
};

// AFTER (Add display sizes)
const fontSizeTokens = {
  '--text-xs': '11px',
  '--text-sm': '13px',
  '--text-base': '15px',
  '--text-lg': '17px',
  '--text-xl': '20px',
  '--text-2xl': '24px',
  '--text-3xl': '30px',
  '--text-4xl': '36px',
  '--text-5xl': '48px',   // NEW
  '--text-6xl': '60px',   // NEW
  '--text-7xl': '72px',   // NEW
};

// Add weights
const fontWeightTokens = {
  '--weight-normal': '400',
  '--weight-medium': '500',
  '--weight-semibold': '600',
  '--weight-bold': '700',
  '--weight-black': '900',  // NEW
};

// Add line-heights
const lineHeightTokens = {
  '--leading-none': '1',      // NEW
  '--leading-tight': '1.25',
  '--leading-snug': '1.375',  // NEW
  '--leading-normal': '1.5',
  '--leading-relaxed': '1.625', // NEW
  '--leading-loose': '1.75',
};
```

**Impact:**
- Changes propagate automatically through `generateTypographyTokens()`
- All themes regenerate with new tokens
- No component changes needed (new tokens opt-in)

### 4. Brand Flair Tokens

**Requirement:** Visual personality elements (glows, animations, decorative effects)

**Integration Point:** `core/src/themes/schema/theme-rules.json`

**Strategy: Add to specialTokens section**

```json
"specialTokens": {
  "brandFlair": {
    "description": "Visual personality - glows, highlights, decorative effects",
    "tokens": {
      "glow-color": { "derivation": "theme:primary" },
      "glow-size": { "default": "20px" },
      "glow-opacity": { "default": { "light": "0.3", "dark": "0.5" } },
      "shimmer-color": { "derivation": { "light": "rgba(255, 255, 255, 0.6)", "dark": "rgba(255, 255, 255, 0.1)" } },
      "shimmer-duration": { "default": "2s" },
      "accent-gradient-start": { "derivation": "theme:primary" },
      "accent-gradient-end": { "derivation": "theme:accent" },
      "pulse-duration": { "default": "2s" },
      "pulse-scale": { "default": "1.05" }
    }
  }
}
```

**Usage Pattern:**
```css
.coworkerCard {
  box-shadow: 0 0 var(--glow-size) var(--glow-color);
  opacity: var(--glow-opacity);
}

.shimmerEffect {
  background: linear-gradient(
    90deg,
    transparent,
    var(--shimmer-color),
    transparent
  );
  animation: shimmer var(--shimmer-duration) infinite;
}
```

**Alternative: Theme-specific overrides**

If brand flair is Copilot-specific, use overrides in `copilot.json`:

```json
{
  "id": "copilot",
  "overrides": {
    "light": {
      "--brand-glow-color": "#8b5cf6",
      "--brand-glow-size": "20px"
    },
    "dark": {
      "--brand-glow-color": "#a855f7",
      "--brand-glow-size": "24px"
    }
  }
}
```

### 5. Component Composition Patterns

**For Layout Components:**

Coworker-style layouts use composition of existing primitives:

```tsx
// AppShell = Stack + positioning
export function AppShell({ children }) {
  return (
    <Stack direction="vertical" gap="none" className="appShell">
      {children}
    </Stack>
  );
}

// AppBar = Panel with specific styling
export function AppBar({ children }) {
  return (
    <Panel variant="strong" padding="sm" className="appBar">
      <Stack direction="horizontal" align="center" gap="md">
        {children}
      </Stack>
    </Panel>
  );
}

// SideNav = Panel + List
export function SideNav({ items }) {
  return (
    <Panel variant="soft" padding="md" className="sideNav">
      <List variant="navigation" density="compact">
        {items.map(item => (
          <ListItem key={item.id}>{item.label}</ListItem>
        ))}
      </List>
    </Panel>
  );
}
```

**For Card Components:**

Specialized cards extend base Card with surface classes:

```tsx
// PersonaCard = Card + Avatar + surface primary
export function PersonaCard({ name, role, active }) {
  return (
    <Card
      padding="md"
      selected={active}
      className="personaCard"
    >
      <Stack direction="horizontal" gap="md" align="center">
        <Avatar fallback={name} />
        <Stack direction="vertical" gap="xs">
          <Text weight="semibold">{name}</Text>
          <Text size="sm" color="soft">{role}</Text>
        </Stack>
      </Stack>
    </Card>
  );
}

// Card automatically applies:
// - selected ? 'surface primary' : 'surface soft'
// - This remaps all --base-* tokens inside
```

**Chat Enhancements:**

Already in `react-chat`, enhance existing components:

```tsx
// ChatMessage already supports:
// - parts: ChatMessagePart[] (text + tool calls + components)
// - isStreaming: boolean
// - toolCalls: ChatMessageToolCall[]
// - chatMode: '1on1' | 'group'

// Enhancement: Add thinking states
export interface ChatMessageProps {
  // ... existing props
  thinkingState?: 'idle' | 'searching' | 'analyzing' | 'generating';
  metadata?: Record<string, unknown>;
}
```

## Component Dependencies

### Dependency Layers

**Layer 1: Primitives (No dependencies on other components)**
- `Button`, `IconButton`, `Input`, `Textarea`, `Checkbox`, etc.
- Depend only on: `@ui-kit/core` tokens, `@ui-kit/icons`

**Layer 2: Compositions (Depend on primitives)**
- `Card`, `Panel`, `Form`, `Toolbar`
- Depend on: Layer 1 components

**Layer 3: Specialized (Depend on compositions)**
- `ChatMessage`, `PersonaCard`, `AppBar`
- Depend on: Layer 1 + Layer 2 components

**New Components Classification:**

| Component | Layer | Dependencies |
|-----------|-------|--------------|
| AppBar | 2 | Stack, Panel (existing) |
| SideNav | 2 | Panel, List (existing) |
| ContentLayout | 2 | Stack (existing) |
| ToolWindow | 2 | Panel, Modal (existing) |
| PersonaCard | 3 | Card, Avatar, Stack, Text |
| ProjectCard | 3 | Card, Stack, Text, Progress |
| StatusCard | 3 | Card, Stack, Text, Chip |

**Build Order Implication:**
- No circular dependencies
- Can build in any order within a layer
- Higher layers built after lower layers complete

## Data Flow Patterns

### Theme Application Flow

```
1. User Code
   applyTheme('copilot', 'light')

2. Core Runtime (bootstrap.js)
   - Loads /themes/copilot.css
   - Sets data-theme="copilot"
   - Sets data-mode="light"

3. CSS Cascade
   [data-theme="copilot"][data-mode="light"] {
     --primary-bg: #8b5cf6;
     --base-bg: #fafafa;
     /* ... all tokens */
   }

4. Components
   .button { background: var(--primary-bg); }

5. Surface Overrides
   .surface.primary {
     --base-bg: var(--primary-bg);
     --base-fg: var(--primary-fg);
   }
```

### Token Resolution

```
Component CSS references token
    ↓
Check surface class overrides (.surface.primary)
    ↓
Fallback to theme-level token ([data-theme])
    ↓
Fallback to default (in CSS var() function)
```

### Component State → Style

```tsx
// State determines surface class
<Card selected={isActive}>
  // className includes: 'surface', selected ? 'primary' : 'soft'

  // Child Text component reads --base-fg
  <Text>Hello</Text>

  // If selected: --base-fg = --primary-fg (white on primary)
  // If not: --base-fg = --soft-fg (dark on soft)
</Card>
```

## Build Order Recommendations

### Phase 1: Foundation (Core)
**Goal:** Enable new tokens and theme

1. **Typography Expansion**
   - Modify `core/src/tokens/typography.ts`
   - Add display sizes (5xl, 6xl, 7xl)
   - Add black weight, additional line-heights
   - Regenerate all themes

2. **Brand Flair Tokens**
   - Modify `core/src/themes/schema/theme-rules.json`
   - Add `brandFlair` section to `specialTokens`
   - Define glow, shimmer, gradient tokens
   - Regenerate all themes

3. **Copilot Theme**
   - Create `core/src/themes/definitions/copilot.json`
   - Define primary color (#8b5cf6)
   - Run build script
   - Verify generated CSS

**Dependencies:** None (core is foundation)
**Validation:** Build core, test token availability in browser

### Phase 2: Layout Components (React)
**Goal:** Coworker shell structure

4. **AppBar Component**
   - Create `react/src/components/AppBar/`
   - Uses Stack, Panel (existing)
   - Export from index.ts

5. **SideNav Component**
   - Create `react/src/components/SideNav/`
   - Uses Panel, List (existing)
   - Export from index.ts

6. **ContentLayout Component**
   - Create `react/src/components/ContentLayout/`
   - Uses Stack (existing)
   - Export from index.ts

7. **ToolWindow Component**
   - Create `react/src/components/ToolWindow/`
   - Uses Panel, Modal (existing)
   - Export from index.ts

**Dependencies:** Phase 1 complete (needs tokens)
**Validation:** Storybook stories for each component

### Phase 3: Card Components (React)
**Goal:** Specialized card variants

8. **Enhance Card Component**
   - Modify `react/src/components/Card/`
   - Add flair prop for brand effects
   - Add variants for persona, project, status

9. **PersonaCard Component**
   - Create `react/src/components/PersonaCard/`
   - Uses Card, Avatar, Stack, Text
   - Export from index.ts

10. **ProjectCard Component**
    - Create `react/src/components/ProjectCard/`
    - Uses Card, Stack, Text, Progress
    - Export from index.ts

11. **StatusCard Component**
    - Create `react/src/components/StatusCard/`
    - Uses Card, Stack, Text, Chip
    - Export from index.ts

**Dependencies:** Phase 2 complete (uses layout components)
**Validation:** Storybook stories with Copilot theme

### Phase 4: Chat Enhancements (React-Chat)
**Goal:** Thinking states, metadata

12. **Enhance ChatMessage**
    - Modify `react-chat/src/components/ChatMessage/`
    - Add thinkingState prop
    - Add metadata prop
    - Conditional rendering for thinking indicator

13. **ThinkingIndicator Variants**
    - Enhance `react-chat/src/components/ThinkingIndicator/`
    - Add state-specific animations
    - Use brand flair tokens

14. **ChatPanel Enhancements**
    - Modify `react-chat/src/components/ChatPanel/`
    - Support new message metadata
    - Virtualization with thinking states

**Dependencies:** Phase 1, 3 complete (needs tokens + cards)
**Validation:** Test chat scenarios with thinking states

### Build Parallelization

**Can Build in Parallel:**
- Phase 2 (Layout) + Phase 3 (Cards) — both depend only on Phase 1
- Within Phase 2: All components independent
- Within Phase 3: All components independent

**Must Build Sequentially:**
- Phase 1 → Phase 2/3 → Phase 4
- Phase 4 depends on all previous (uses tokens + cards)

**Critical Path:**
1. Typography + Brand Flair tokens (1-2 hours)
2. Copilot theme (30 min)
3. Layout OR Cards (2-3 hours each, can parallelize)
4. Chat enhancements (2-3 hours)

## Patterns to Follow

### 1. Single Export Per File
```
Component/
├── Component.tsx         # Default export: Component
├── Component.module.css  # CSS modules
├── index.ts              # Re-export: export { Component } from './Component'
└── Component.stories.tsx # Storybook
```

### 2. Props Pattern
```tsx
export interface ComponentProps extends HTMLAttributes<HTMLDivElement> {
  // Visual variants
  variant?: 'default' | 'primary' | 'subtle';
  size?: 'sm' | 'md' | 'lg';

  // State
  disabled?: boolean;
  active?: boolean;

  // Content
  children: ReactNode;

  // Behavior
  onAction?: (value: string) => void;
}
```

### 3. Surface Class Pattern
```tsx
const classNames = [
  styles.component,
  styles[variant],
  // Apply surface system
  'surface',
  variant === 'primary' ? 'primary' : 'soft',
  className,
]
  .filter(Boolean)
  .join(' ');
```

### 4. Token Usage
```css
/* Use semantic tokens from current surface */
.component {
  background: var(--base-bg);
  color: var(--base-fg);
  border: 1px solid var(--base-border);

  /* Use scale tokens for sizing */
  padding: var(--space-4);
  border-radius: var(--radius-md);

  /* Use typography tokens */
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
  line-height: var(--leading-normal);
}
```

### 5. Composition Over Configuration
```tsx
// BAD: Too many props
<Card
  title="Hello"
  description="World"
  footer="Actions"
  headerIcon={<Icon />}
/>

// GOOD: Composition
<Card>
  <CardTitle>Hello</CardTitle>
  <CardDescription>World</CardDescription>
  <CardFooter>Actions</CardFooter>
</Card>
```

## Anti-Patterns to Avoid

### 1. Hardcoded Colors
```css
/* BAD */
.component {
  background: #8b5cf6;
  color: white;
}

/* GOOD */
.component {
  background: var(--primary-bg);
  color: var(--primary-fg);
}
```

### 2. Inline Styles for Theming
```tsx
// BAD
<div style={{ color: theme.primary }}>

// GOOD
<div className="surface primary">
```

### 3. Creating New Packages Unnecessarily
```
// BAD
packages/ui-kit/react-layout/
packages/ui-kit/react-cards/

// GOOD
packages/ui-kit/react/src/components/AppBar/
packages/ui-kit/react/src/components/PersonaCard/
```

### 4. Bypassing Surface System
```css
/* BAD: Direct token reference breaks surface isolation */
.childComponent {
  color: var(--primary-fg);
}

/* GOOD: Use base tokens (surface remaps them) */
.childComponent {
  color: var(--base-fg);
}
```

### 5. Theme-Specific Logic
```tsx
// BAD
{theme === 'copilot' && <GlowEffect />}

// GOOD
<div className={styles.glowEffect}>
  {/* CSS uses brand flair tokens */}
</div>
```

## Integration Checklist

**Before starting:**
- [ ] Core package builds successfully
- [ ] Existing react components render
- [ ] Theme switching works in Storybook

**Phase 1 (Core):**
- [ ] Typography tokens expanded
- [ ] Brand flair tokens defined
- [ ] Copilot theme JSON created
- [ ] All themes regenerate without errors
- [ ] New tokens visible in browser devtools

**Phase 2 (Layout):**
- [ ] AppBar renders with correct tokens
- [ ] SideNav renders with correct tokens
- [ ] ContentLayout composes correctly
- [ ] ToolWindow behaves as modal
- [ ] All components in Storybook

**Phase 3 (Cards):**
- [ ] Card accepts flair prop
- [ ] PersonaCard renders persona data
- [ ] ProjectCard shows progress
- [ ] StatusCard shows status chip
- [ ] Surface classes applied correctly

**Phase 4 (Chat):**
- [ ] ChatMessage accepts thinkingState
- [ ] ThinkingIndicator shows state variants
- [ ] ChatPanel handles metadata
- [ ] All chat features work with enhancements

**Integration:**
- [ ] No TypeScript errors
- [ ] No console warnings
- [ ] All exports in index.ts
- [ ] Storybook loads all new components
- [ ] Theme switching updates all components

## Sources

**Internal Codebase Analysis:**
- `/Users/dzearing/git/ai-experiments/packages/ui-kit/core/src/themes/generator.ts` - Theme generation system
- `/Users/dzearing/git/ai-experiments/packages/ui-kit/core/src/themes/schema/theme-rules.json` - Token rules and derivation
- `/Users/dzearing/git/ai-experiments/packages/ui-kit/core/src/tokens/typography.ts` - Typography token system
- `/Users/dzearing/git/ai-experiments/packages/ui-kit/react/src/index.ts` - Component export structure
- `/Users/dzearing/git/ai-experiments/packages/ui-kit/react/src/components/Button/Button.tsx` - Component pattern example
- `/Users/dzearing/git/ai-experiments/packages/ui-kit/react/src/components/Card/Card.tsx` - Surface class usage
- `/Users/dzearing/git/ai-experiments/packages/ui-kit/react/src/components/Stack/Stack.tsx` - Layout pattern
- `/Users/dzearing/git/ai-experiments/packages/ui-kit/react-chat/src/components/ChatMessage/ChatMessage.tsx` - Chat component architecture
- `/Users/dzearing/git/ai-experiments/packages/ui-kit/react/vite.config.ts` - Build configuration

**Confidence:** HIGH - Based on direct code inspection of existing architecture, build system, and component patterns. Recommendations follow established patterns in the codebase.
