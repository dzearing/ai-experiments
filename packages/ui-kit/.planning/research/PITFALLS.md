# Domain Pitfalls: Adding Components to Existing Design System

**Domain:** Design System Extension (Layout, Cards, Chat Enhancements, Theme)
**Researched:** 2026-02-01
**Project:** UI-Kit Coworker Design System Parity

This document catalogs common mistakes when adding new packages and components to an existing design system in a monorepo, with focus on layout components, card components, chat enhancements, and theme system extensions.

---

## Critical Pitfalls

Mistakes that cause rewrites, major refactoring, or system-wide breakage.

### Pitfall 1: Phantom Dependencies in New Packages

**What goes wrong:**
When adding new packages to a pnpm workspace, developers may accidentally import dependencies that aren't explicitly declared in package.json but are available due to hoisting from other packages. This passes tests locally but breaks when the package is built or when the hoisting structure changes.

**Why it happens:**
- pnpm uses content-addressable storage with symlinks
- Workspace root node_modules contains dependencies from all packages
- Developers test imports without checking explicit dependencies
- Build tooling may not catch undeclared imports during development

**Consequences:**
- Build failures when dependencies are removed from other packages
- Runtime errors in production when packages are published
- Breaking changes when upgrading unrelated dependencies
- Difficult-to-debug import errors

**Prevention:**
```json
// In each new package's package.json
{
  "dependencies": {
    // ALWAYS explicitly declare every direct import
    "@ui-kit/core": "workspace:*",
    "@ui-kit/react": "workspace:*"
  }
}
```

Use strict mode checks:
```bash
# Test builds in isolation
pnpm --filter @ui-kit/react-layout build

# Verify no phantom dependencies
pnpm list --depth 0
```

**Detection:**
- Import fails during isolated package build
- CI/CD pipeline failures when building individual packages
- Errors when other developers sync dependencies
- Build succeeds locally but fails in Docker/clean environment

**Sources:**
- [Why Your Code Breaks After Switching to pnpm: The Phantom Dependencies](https://medium.com/@ddylanlinn/why-your-code-breaks-after-switching-to-pnpm-the-phantom-dependencies-36e779c3a4a0)
- [pnpm FAQ - Phantom Dependencies](https://pnpm.io/faq)

### Pitfall 2: Circular Dependencies Between New Packages

**What goes wrong:**
When creating `@ui-kit/react-layout` and `@ui-kit/react-cards`, circular imports emerge where layout components import card components AND card components import layout utilities. TypeScript project references explicitly forbid circular dependencies, causing build failures.

**Why it happens:**
- Layout components need card components for examples/demos
- Card components need layout primitives (Stack, Grid)
- Shared utilities get split across both packages
- Convenience imports create hidden circular paths

**Consequences:**
- TypeScript build fails with "Circular project reference" errors
- Cannot use TypeScript project references for incremental builds
- LSP/IDE type checking breaks or becomes extremely slow
- Requires complete rebuild for any change

**Prevention:**

**Strategy 1: Extract Shared Primitives**
```
@ui-kit/react              ← Shared primitives (Stack, Grid, Box)
├── @ui-kit/react-layout   ← Uses primitives (no card imports)
└── @ui-kit/react-cards    ← Uses primitives AND layout
```

**Strategy 2: One-Way Dependency**
```
@ui-kit/react-cards imports from @ui-kit/react-layout ✓
@ui-kit/react-layout NEVER imports from @ui-kit/react-cards ✓
```

**Strategy 3: Dependency Graph Verification**
```bash
# Use madge to detect cycles
npx madge --circular --extensions ts,tsx packages/ui-kit/
```

**Detection:**
- TypeScript error: "Project references may not form a circular graph"
- Build hangs or times out during type checking
- IDE shows incorrect type errors or missing autocomplete
- `tsc --build` fails with reference errors

**Warning Signs:**
- Two packages importing from each other
- Shared utilities duplicated across packages
- Import paths with `../../` crossing package boundaries

**Sources:**
- [TypeScript Issue #33685 - Circular Project References](https://github.com/microsoft/TypeScript/issues/33685)
- [Managing TypeScript Packages in Monorepos - Nx](https://nx.dev/blog/managing-ts-packages-in-monorepos)
- [How to Detect and Fix Circular Dependencies in TypeScript](https://www.danywalls.com/how-to-detect-and-fix-circular-dependencies-in-typescript)

### Pitfall 3: Z-Index Wars from Multiple Component Layers

**What goes wrong:**
Layout components (modals, panels, headers), card overlays (tooltips, menus), and chat components (floating actions, notifications) each define their own z-index scales. These scales conflict, causing dropdowns to appear under modals or tooltips to be hidden by side panels.

**Why it happens:**
- Each package defines z-index values independently
- Stacking contexts created by `position: relative` on flex/grid containers
- Layout components create parent stacking contexts that trap child z-index
- No centralized z-index registry or coordination

**Consequences:**
- Dropdowns/menus appear behind panels or modals
- Tooltips hidden by adjacent cards
- Chat notifications covered by side panels
- Cannot predict layering without inspecting all components
- Debugging requires understanding nested stacking contexts

**Prevention:**

**Centralized Z-Index Scale in @ui-kit/core**
```css
/* tokens/layers.ts */
:root {
  --layer-base: 0;
  --layer-sticky: 100;        /* Sticky headers */
  --layer-dropdown: 200;      /* Dropdowns, menus */
  --layer-overlay: 300;       /* Side panels, drawers */
  --layer-modal: 400;         /* Modals, dialogs */
  --layer-popover: 500;       /* Tooltips, popovers */
  --layer-notification: 600;  /* Toasts, notifications */
}
```

**Coordinate in React Context**
```typescript
// Use portal system with predictable layering
<Portal layer="dropdown">
  <Menu />
</Portal>
```

**Avoid Creating Stacking Contexts**
```css
/* ❌ WRONG - Creates stacking context in layout */
.layout-container {
  position: relative; /* Creates stacking context! */
  z-index: 1;
}

/* ✓ CORRECT - Avoid position on layout containers */
.layout-container {
  display: flex;
  /* No position, no z-index */
}
```

**Detection:**
- Visual regression: dropdown hidden behind panel
- Tooltip not visible when hovering card in panel
- Inspector shows z-index values competing (both 999, 9999)
- Changing z-index on one component breaks another

**Warning Signs:**
- Components use z-index values like 999, 9999, 99999
- Multiple components use the same z-index range (1-10)
- Layout containers use `position: relative` with z-index
- No documented layering system in design tokens

**Sources:**
- [Mastering z-index in CSS - Stacking Contexts](https://www.joshwcomeau.com/css/stacking-contexts/)
- [Stacking Context - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Positioned_layout/Stacking_context)
- [Flex Layout Breaks Z-Index - GitHub Issue](https://github.com/Rich-Harris/stacking-order/issues/3)

### Pitfall 4: Chat Performance Degradation Without Virtualization

**What goes wrong:**
Chat message list performance degrades catastrophically once 200+ messages load. Scrolling becomes janky (< 30fps), typing lags by 500ms+, and browser tab becomes unresponsive. This isn't caught during development because test data only has 10-20 messages.

**Why it happens:**
- Every message renders as a DOM node (200 messages = 200+ nodes)
- React rerenders entire message list on new message
- Expensive markdown parsing happens for every visible/invisible message
- Animation and hover effects compound reflow/repaint costs
- No windowing or virtualization strategy

**Consequences:**
- Typing lag makes chat unusable in long threads
- Scrolling stutters and drops frames
- Browser tab freezes or crashes with 500+ messages
- Memory usage grows unbounded (memory leak)
- Mobile devices become completely unusable

**Prevention:**

**Use Virtual Scrolling from Day One**
```typescript
// @ui-kit/react-chat already has @tanstack/react-virtual
import { useVirtualizer } from '@tanstack/react-virtual';

function MessageList({ messages }) {
  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Estimate message height
    overscan: 5, // Render 5 extra items for smooth scroll
  });

  return (
    <div ref={parentRef} style={{ height: '100%', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <Message key={virtualItem.key} message={messages[virtualItem.index]} />
        ))}
      </div>
    </div>
  );
}
```

**Performance Budget**
- First render: < 100ms for 200 messages
- Scroll frame rate: 60fps minimum
- Typing latency: < 16ms input to screen
- Memory: < 50MB for 1000 messages

**Test with Realistic Data**
```typescript
// Create test with 500 messages
const LARGE_MESSAGE_SET = Array.from({ length: 500 }, (_, i) => ({
  id: i,
  text: 'Test message...',
  timestamp: Date.now() - i * 60000,
}));
```

**Detection:**
- Performance tab shows > 50ms scripting time per scroll frame
- React DevTools Profiler shows expensive rerenders
- Scrolling FPS drops below 60 (check with performance.now())
- Browser's memory usage grows linearly with message count
- Lighthouse performance score < 80

**Warning Signs:**
- MessageList component rerenders on every message
- No virtualization library in dependencies
- No overscan/buffer strategy for smooth scrolling
- Markdown rendering not memoized
- DOM node count > 500 for message container

**Sources:**
- [Chat Virtualization and Performance Optimization - Kissflow](https://culture.kissflow.com/chat-virtualization-and-performance-optimization-enhancing-the-user-experience-80b35678a25)
- [Speed Up Long Lists with TanStack Virtual - LogRocket](https://blog.logrocket.com/speed-up-long-lists-tanstack-virtual/)
- [Open WebUI Issue #13787 - Performance with Large History](https://github.com/open-webui/open-webui/discussions/13787)
- [ChatGPT Typing Lag Discussion - OpenAI](https://community.openai.com/t/chatgpt-typing-lag-in-long-chats-needs-virtual-scroll-like-yesterday/1273495)

### Pitfall 5: Broken High Contrast / Forced Colors Mode

**What goes wrong:**
New layout and card components render completely invisible or have unreadable text in Windows High Contrast Mode because they use hardcoded colors or background images that get overridden by forced-colors mode. This breaks WCAG accessibility compliance.

**Why it happens:**
- Components use hardcoded colors instead of design tokens
- Background images/gradients are removed in forced-colors mode
- Borders and outlines defined as `none` become invisible
- SVG icons lose colors and disappear
- Developers don't test with forced-colors enabled

**Consequences:**
- Components invisible to users with high contrast settings
- Text unreadable due to missing color contrast
- Fails WCAG 2.1 AA accessibility requirements
- Cannot be used by government/enterprise customers
- Lawsuits or accessibility complaints

**Prevention:**

**Use System Colors in Forced Colors Mode**
```css
@media (forced-colors: active) {
  .card {
    /* Browser provides system colors */
    background-color: Canvas;
    color: CanvasText;
    border: 1px solid CanvasText;
  }

  .button-primary {
    background-color: ButtonFace;
    color: ButtonText;
    border: 1px solid ButtonText;
  }
}
```

**Respect forced-color-adjust**
```css
.card {
  /* Let browser adjust colors automatically */
  forced-color-adjust: auto;
}

.brand-logo {
  /* Preserve brand colors in forced-colors mode */
  forced-color-adjust: preserve-parent-color;
}
```

**Test with Forced Colors Enabled**
```bash
# Windows: Settings > Accessibility > Contrast Themes
# Or use browser DevTools to emulate

# Chrome DevTools: Rendering > Emulate CSS media feature forced-colors
```

**Surface-Based Tokens Help**
```css
/* ✓ CORRECT - Uses design tokens that adapt */
.card {
  background: var(--color-panel-background);
  color: var(--color-panel-text);
  border: 1px solid var(--color-panel-border);
}

/* ❌ WRONG - Hardcoded colors break in forced-colors */
.card {
  background: #ffffff;
  color: #333333;
  border: 1px solid #e0e0e0;
}
```

**Detection:**
- Component invisible in Windows High Contrast Mode
- Text color same as background color
- Borders/outlines disappear
- Icons lose all color and become invisible
- Browser DevTools forced-colors emulation shows issues

**Warning Signs:**
- Components use hardcoded hex colors
- Background images or gradients for UI elements
- `border: none` used for card boundaries
- SVG icons without currentColor
- No @media (forced-colors: active) queries

**Sources:**
- [Windows High Contrast Mode - Microsoft Learn](https://learn.microsoft.com/en-us/fluent-ui/web-components/design-system/high-contrast)
- [The Guide To Windows High Contrast Mode - Smashing Magazine](https://www.smashingmagazine.com/2022/06/guide-windows-high-contrast-mode/)
- [WebAIM: 2026 Predictions - Web Accessibility](https://webaim.org/blog/2026-predictions/)
- [Boost Accessibility for High-Contrast Users with CSS - LogRocket](https://blog.logrocket.com/boost-accessibility-high-contrast-users-css/)

---

## Moderate Pitfalls

Mistakes that cause delays, technical debt, or painful refactoring.

### Pitfall 6: Typography Token Expansion Breaking Specificity

**What goes wrong:**
Adding new typography tokens (body-1, body-2, caption-1, caption-2) to match Coworker's 14-level scale conflicts with existing --text-base, --text-sm tokens. Components using --text-base suddenly render at the wrong size because new semantic tokens override the old scale tokens.

**Why it happens:**
- Two naming systems in parallel (scale-based vs semantic)
- CSS cascade order depends on source order, not specificity
- Components inconsistently use old vs new tokens
- No migration strategy for existing components
- Token generation creates conflicting definitions

**Consequences:**
- Existing components change size unexpectedly
- Inconsistent typography across old and new components
- Cannot remove old tokens without breaking components
- Documentation describes two different systems
- Design-dev handoff confusion

**Prevention:**

**Semantic Tokens Map to Scale Tokens**
```typescript
// tokens/typography.ts
export const typographySemanticTokens = {
  // Semantic tokens map to existing scale
  '--text-body-1': 'var(--text-lg)',      // 17px
  '--text-body-2': 'var(--text-base)',    // 15px
  '--text-body-3': 'var(--text-sm)',      // 13px
  '--text-caption-1': 'var(--text-sm)',   // 13px
  '--text-caption-2': 'var(--text-xs)',   // 11px

  // Display tokens (new)
  '--text-display': '68px',
  '--text-5xl': '40px',
  '--text-title-1': '28px',
};
```

**Document Token Hierarchy**
```markdown
# Typography Token Usage

## Scale Tokens (Foundational)
Use for custom/utility classes: --text-xs, --text-sm, --text-base

## Semantic Tokens (Preferred)
Use in components: --text-body-1, --text-caption-1

Semantic tokens reference scale tokens internally.
```

**Gradual Migration Path**
```css
/* Phase 1: Both systems work (backward compatible) */
.legacy-component {
  font-size: var(--text-base); /* Still works */
}

.new-component {
  font-size: var(--text-body-2); /* Maps to --text-base */
}
```

**Detection:**
- Component text size changes after token update
- Two components using different tokens render at same size
- Token documentation contradicts component examples
- Designers ask "which token should I use?"

**Warning Signs:**
- Multiple token systems with overlapping purposes
- No clear guidance on which tokens to use
- Token names don't align with design tool names
- Existing components would break if old tokens removed

**Sources:**
- [Mastering Typography in Design Systems with Semantic Tokens - UX Collective](https://uxdesign.cc/mastering-typography-in-design-systems-with-semantic-tokens-and-responsive-scaling-6ccd598d9f21)
- [Material Design 3 - Typography Type Scale Tokens](https://m3.material.io/styles/typography/type-scale-tokens)

### Pitfall 7: Card Component Truncation Without Accessibility

**What goes wrong:**
Card components use `line-clamp` for multi-line truncation, showing "..." for long titles/descriptions. However, screen readers still read the full hidden text, creating mismatched expectations. Users see truncated text but hear the full content, or vice versa.

**Why it happens:**
- line-clamp hides content visually but leaves it in DOM
- No aria-label to match truncated visual content
- "Show more" button not keyboard accessible
- Truncated content not announced to screen readers
- Developers test visually but not with screen readers

**Consequences:**
- Screen reader users hear truncated "..." in content flow
- Visual users see "..." but can't access full content
- Keyboard users cannot expand truncated content
- Fails WCAG 2.1 AA (1.3.1 Info and Relationships)
- Confusing UX for assistive tech users

**Prevention:**

**Accessible Truncation Pattern**
```typescript
function Card({ title, description }) {
  const [expanded, setExpanded] = useState(false);
  const isTruncated = description.length > 150;

  return (
    <div className="card">
      <h3>{title}</h3>
      <p
        className={expanded ? '' : 'line-clamp-3'}
        aria-label={isTruncated && !expanded ? `${description.slice(0, 150)}...` : undefined}
      >
        {description}
      </p>
      {isTruncated && (
        <button
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          aria-label={expanded ? 'Show less' : 'Show more'}
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}
```

**CSS with Accessible Fallback**
```css
.line-clamp-3 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}

/* Ensure show more button is visible */
.line-clamp-3 + button {
  margin-top: var(--space-2);
}
```

**Test with Screen Readers**
```bash
# macOS: VoiceOver (Cmd+F5)
# Windows: NVDA or JAWS
# Verify:
# - Reads correct truncated content
# - Announces "Show more" button
# - Reads full content when expanded
```

**Detection:**
- Screen reader reads more than visual content shows
- No "Show more" button for truncated content
- "Show more" button not keyboard accessible (Tab doesn't reach it)
- aria-expanded attribute missing on expansion button
- Line clamp without corresponding aria-label

**Warning Signs:**
- line-clamp CSS without expansion mechanism
- No aria-label on truncated elements
- Show more button is div/span instead of button
- No keyboard event handlers on expansion controls
- Truncation not tested with screen readers

**Sources:**
- [Truncating Text and Making it Accessible - SiteLint](https://www.sitelint.com/blog/truncating-text-and-making-it-accessible)
- [Clickable Cards, Multi-line Text Truncation - GitHub Gist](https://gist.github.com/jdanyow/525e77464067ef344fdc41b49de2bfe7)
- [Multiline Text Truncation With CSS line-clamp](https://www.chakshunyu.com/blog/multiline-text-truncation-with-css-line-clamp/)

### Pitfall 8: Aspect Ratio Issues Without Container Queries

**What goes wrong:**
Card components with images use fixed aspect-ratio (16/9), but this breaks when cards are placed in narrow sidebars or wide grids. Images become stretched or cropped awkwardly because aspect ratio doesn't adapt to container size.

**Why it happens:**
- aspect-ratio uses fixed values (16/9, 4/3)
- Media queries respond to viewport, not container
- Cards in sidebar use same ratio as cards in main content
- No container query support for adaptive aspect ratios
- Designers assume cards always render at similar widths

**Consequences:**
- Images stretched/squished in narrow containers
- Inconsistent image proportions across layouts
- Excessive whitespace or cropping in different contexts
- Cannot reuse card component in different layout contexts
- Requires multiple card variants for different sizes

**Prevention:**

**Use Container Queries for Adaptive Aspect Ratio**
```css
.card {
  container-type: inline-size;
  container-name: card;
}

.card-image {
  aspect-ratio: 16 / 9; /* Default */
  object-fit: cover;
}

/* Narrow containers use taller ratio */
@container card (max-width: 300px) {
  .card-image {
    aspect-ratio: 4 / 5; /* Portrait */
  }
}

/* Wide containers use wider ratio */
@container card (min-width: 600px) {
  .card-image {
    aspect-ratio: 21 / 9; /* Ultra-wide */
  }
}
```

**Configurable Aspect Ratio Prop**
```typescript
interface CardProps {
  /** Aspect ratio (auto-adapts based on container size if omitted) */
  aspectRatio?: 'auto' | '1/1' | '4/3' | '16/9' | '21/9';
}

function Card({ aspectRatio = 'auto', ...props }: CardProps) {
  return (
    <div
      className="card"
      data-aspect={aspectRatio}
    >
      <img className="card-image" />
    </div>
  );
}
```

**Browser Support Check**
```typescript
// Provide fallback for browsers without container query support
const supportsContainerQueries = CSS.supports('container-type: inline-size');

if (!supportsContainerQueries) {
  // Use ResizeObserver fallback
}
```

**Detection:**
- Images stretched/squished in sidebar cards
- Same card looks good in one layout, bad in another
- Designers create multiple card variants for different sizes
- Cannot reuse card component across layouts
- Users report "images look wrong"

**Warning Signs:**
- Fixed aspect-ratio values without container queries
- Media queries used instead of container queries
- Multiple card component variants for different widths
- Images use object-fit: cover without aspect-ratio
- No container-type declaration on card container

**Sources:**
- [Container Queries in CSS: Complete Guide - DEV Community](https://dev.to/satyam_gupta_0d1ff2152dcc/-container-queries-in-css-a-complete-guide-to-the-future-of-responsive-design-24om)
- [Component-Level Art Direction with Container Queries](https://www.sarasoueidan.com/blog/component-level-art-direction-with-container-queries-and-picture/)
- [Understanding and Setting Aspect Ratios - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Box_sizing/Aspect_ratios)

### Pitfall 9: Animation Jank from Layout Thrashing

**What goes wrong:**
New chat message animations (slide in, fade in) cause visible stuttering and frame drops because they animate properties that trigger reflow (height, margin-top, top). Typing feels laggy and scrolling is janky during animations.

**Why it happens:**
- Animating layout properties (height, margin, padding, top)
- Multiple animations trigger reflows simultaneously
- No use of transform/opacity for GPU acceleration
- Animations compound with virtual scrolling logic
- No will-change hints for browser optimization

**Consequences:**
- Visible stuttering when new messages appear
- Typing latency increases during animations
- Scrolling frame rate drops below 30fps
- Battery drain on mobile devices
- Users disable animations entirely

**Prevention:**

**Use Transform and Opacity Only**
```css
/* ❌ WRONG - Triggers reflow on every frame */
@keyframes slideIn {
  from {
    margin-top: -50px;
    height: 0;
  }
  to {
    margin-top: 0;
    height: auto;
  }
}

/* ✓ CORRECT - GPU-accelerated, no reflow */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-enter {
  animation: slideIn var(--duration-normal) ease-out;
  will-change: transform, opacity;
}

.message-enter-done {
  will-change: auto; /* Remove after animation */
}
```

**Position Absolutely for Layout Animations**
```css
/* If height animation required, position absolutely */
.message-expanding {
  position: absolute; /* Doesn't affect sibling layout */
  animation: expand 200ms ease-out;
}
```

**Batch Animations**
```typescript
// Delay animations slightly to avoid simultaneous reflows
function MessageList({ messages }) {
  return messages.map((msg, i) => (
    <Message
      key={msg.id}
      style={{
        animationDelay: `${i * 50}ms`, // Stagger by 50ms
      }}
    />
  ));
}
```

**Performance Budget**
```typescript
// Measure animation performance
const startTime = performance.now();
element.addEventListener('animationend', () => {
  const duration = performance.now() - startTime;
  if (duration > 300) {
    console.warn('Animation too slow:', duration);
  }
});
```

**Detection:**
- Chrome DevTools Performance tab shows long "Recalculate Style" bars
- Frame rate drops below 60fps during animations
- Purple bars in Performance timeline (layout/reflow)
- Animations feel choppy on mobile devices
- will-change warnings in console

**Warning Signs:**
- Animating width, height, margin, padding, top, left
- Multiple animations running simultaneously
- No will-change declarations
- Animations not using transform/opacity
- Layout thrashing visible in Performance timeline

**Sources:**
- [Performance Optimization - Thoroughly Understanding Reflow, Repaint, and Compositing - Medium](https://medium.com/@weijunext/performance-optimization-thoroughly-understanding-and-deconstructing-reflow-repaint-and-d5d9118f2cdf)
- [CSS and JavaScript Animation Performance - MDN](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/CSS_JavaScript_animation_performance)
- [Optimizing Performance in CSS Animations - DEV Community](https://dev.to/nasehbadalov/optimizing-performance-in-css-animations-what-to-avoid-and-how-to-improve-it-bfa)

### Pitfall 10: Theme Token Collision from Copilot Theme

**What goes wrong:**
Adding the Copilot theme with brand flair tokens (--brand-flair-1, --brand-flair-2) collides with existing --brand tokens or --accent tokens. Components using --accent suddenly render with gradient colors instead of solid colors, breaking visual consistency.

**Why it happens:**
- Multiple themes define overlapping token names
- No namespace/prefix for theme-specific tokens
- Token precedence unclear (which theme wins?)
- Components assume tokens are always solid colors
- Copilot theme uses gradients where others use solid colors

**Consequences:**
- Buttons render with gradients instead of solid colors
- Theme switching breaks component appearance
- Cannot predict which token value will be used
- Components need theme-specific overrides
- Design system inconsistency across themes

**Prevention:**

**Namespace Theme-Specific Tokens**
```typescript
interface ThemeDefinition {
  id: string;
  name: string;
  colors: ThemeColors;

  // Theme-specific tokens with namespace
  customTokens?: {
    '--copilot-flair-1'?: string;
    '--copilot-flair-2'?: string;
    '--copilot-flair-3'?: string;
    '--copilot-gradient'?: string;
  };
}
```

**Use Intentional Collisions for Theming**
```css
/* Base theme */
:root {
  --accent: #0078d4; /* Solid blue */
}

/* Copilot theme overrides (intentional collision) */
[data-theme="copilot"] {
  --accent: linear-gradient(90deg, #464FEB, #47CFFA); /* Gradient */
}

/* Components adapt automatically */
.button-accent {
  background: var(--accent); /* Solid or gradient depending on theme */
}
```

**Document Token Overrides**
```typescript
const copilotTheme: ThemeDefinition = {
  id: 'copilot',
  name: 'Copilot',
  overrides: {
    light: {
      '--accent': 'linear-gradient(90deg, #464FEB, #47CFFA)',
    },
  },
};
```

**Component Safeguards**
```css
/* Ensure gradient works for both solid and gradient values */
.button-accent {
  background: var(--accent);
  background-origin: border-box;
  background-clip: padding-box;
}

/* If component requires solid color, use fallback */
.border-accent {
  border-color: var(--accent-solid, var(--accent));
}
```

**Detection:**
- Component appearance changes unexpectedly on theme switch
- Console warnings about gradient being used as border-color
- Buttons look wrong in Copilot theme
- Token names conflict between themes
- Components need theme-specific overrides

**Warning Signs:**
- Multiple themes define same token with different value types
- No documentation of token overrides per theme
- Components assume token value type (solid vs gradient)
- No namespace for theme-specific tokens
- Token collision not intentional (accidental overlap)

**Sources:**
- [Naming Tokens in Design Systems - EightShapes](https://medium.com/eightshapes-llc/naming-tokens-in-design-systems-9e86c7444676)
- [Design Token Naming Best Practices - Netguru](https://www.netguru.com/blog/design-token-naming-best-practices)
- [A New Approach to Naming Design Tokens](https://samiamdesigns.substack.com/p/a-new-approach-to-naming-design-tokens)

---

## Minor Pitfalls

Mistakes that cause annoyance but are fixable without major refactoring.

### Pitfall 11: Inconsistent Responsive Breakpoint Usage

**What goes wrong:**
Layout components use breakpoints at 768px/1024px, but card components use 640px/960px. Components behave inconsistently at intermediate viewport sizes, creating jarring layout shifts.

**Why it happens:**
- Each package defines its own breakpoint values
- No centralized breakpoint token system
- Developers eyeball breakpoints per-component
- Design handoff doesn't specify exact breakpoint values
- Media queries hardcoded in component CSS

**Consequences:**
- Layout and cards resize at different viewport widths
- Inconsistent responsive behavior across components
- Cannot predict when components will adapt
- Difficult to test all breakpoint combinations
- Users see layout "jumping" during resize

**Prevention:**

**Centralize Breakpoints in @ui-kit/core**
```typescript
// tokens/breakpoints.ts
export const breakpoints = {
  '--breakpoint-sm': '640px',   // Mobile
  '--breakpoint-md': '768px',   // Tablet
  '--breakpoint-lg': '1024px',  // Desktop
  '--breakpoint-xl': '1280px',  // Wide
} as const;

export const breakpointValues = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};
```

**Use Consistent Media Queries**
```css
@import '@ui-kit/core/tokens/breakpoints.css';

/* ✓ CORRECT - Uses centralized breakpoint */
@media (min-width: var(--breakpoint-md)) {
  .layout-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* ❌ WRONG - Hardcoded value */
@media (min-width: 760px) {
  .card-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

**React Hook for Breakpoints**
```typescript
import { breakpointValues } from '@ui-kit/core';

function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState('lg');

  useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth;
      if (width < breakpointValues.md) setBreakpoint('sm');
      else if (width < breakpointValues.lg) setBreakpoint('md');
      else if (width < breakpointValues.xl) setBreakpoint('lg');
      else setBreakpoint('xl');
    };

    checkBreakpoint();
    window.addEventListener('resize', checkBreakpoint);
    return () => window.removeEventListener('resize', checkBreakpoint);
  }, []);

  return breakpoint;
}
```

**Detection:**
- Components resize at different viewport widths
- Layout shifts occur at non-standard breakpoints
- Grep shows multiple breakpoint values (768, 760, 780)
- Designers report inconsistent responsive behavior

**Warning Signs:**
- Hardcoded media query values in component CSS
- Different packages use different breakpoint values
- No breakpoint tokens exported from @ui-kit/core
- Components calculate breakpoints independently

**Sources:**
- [Responsive Design Breakpoints - BrowserStack](https://www.browserstack.com/guide/responsive-design-breakpoints)
- [Breakpoints in Responsive Design - Nielsen Norman Group](https://www.nngroup.com/articles/breakpoints-in-responsive-design/)
- [Material UI - Breakpoints](https://mui.com/material-ui/customization/breakpoints/)

### Pitfall 12: CSS Module Specificity When Overriding

**What goes wrong:**
Layout components need to override card component styles (e.g., card padding in sidebar should be smaller), but CSS Modules make this difficult. Parent component styles don't override child component styles even with higher specificity.

**Why it happens:**
- CSS Modules generate unique class names per component
- Parent cannot reference child's generated class name
- CSS cascade doesn't work across component boundaries
- No global class names to target
- Developers resort to !important or inline styles

**Consequences:**
- Cannot customize child component appearance from parent
- Need to expose props for every possible override
- Developers add !important everywhere
- Inline styles bypass design tokens
- Component composition becomes inflexible

**Prevention:**

**Expose Data Attributes for Styling**
```typescript
// Card component
export function Card({ variant = 'default', ...props }: CardProps) {
  return (
    <div
      className={styles.card}
      data-variant={variant}
      {...props}
    />
  );
}

// Layout component can target via attribute
// sidebar.module.css
.sidebar [data-variant="compact"] {
  padding: var(--space-2);
}
```

**Use CSS Custom Properties for Overrides**
```css
/* card.module.css */
.card {
  padding: var(--card-padding, var(--space-4));
  gap: var(--card-gap, var(--space-3));
}

/* sidebar.module.css */
.sidebar {
  --card-padding: var(--space-2);
  --card-gap: var(--space-2);
}
```

**Provide Style Prop with Type Safety**
```typescript
interface CardProps {
  /** Override styles (use sparingly, prefer props) */
  style?: Pick<CSSProperties, 'padding' | 'gap' | 'borderRadius'>;
}
```

**Composition Over Overrides**
```typescript
// Provide specialized variants instead of overrides
export function CompactCard(props: CardProps) {
  return <Card {...props} variant="compact" />;
}
```

**Detection:**
- Developers add !important to override styles
- Inline styles used instead of CSS classes
- Parent component cannot customize child appearance
- Need separate component variant for every use case
- Styles not reusable across contexts

**Warning Signs:**
- Multiple !important declarations
- Inline styles bypassing design tokens
- Parent trying to reference child's class name
- Excessive prop API for style customization
- Duplicated component code for styling variations

**Sources:**
- [Overriding Styles with CSS Modules - Liefery Tech Blog](https://liefery-it-legacy.github.io/blog/2018/06/27/overriding-styles-with-CSS-modules.html)
- [Writing Maintainable Styles with CSS Modules - Medium](https://medium.com/@skovy/writing-maintainable-styles-and-components-with-css-modules-308a9216a6c2)

---

## Phase-Specific Warnings

Guidance on which phases need deeper research or caution.

| Phase | Focus | Pitfalls to Watch | Research Needs |
|-------|-------|-------------------|----------------|
| **Phase 1: Package Setup** | Create @ui-kit/react-layout, @ui-kit/react-cards | Pitfall 2 (Circular deps), Pitfall 1 (Phantom deps) | HIGH - Use madge to detect cycles, test isolated builds |
| **Phase 2: Layout Components** | PageHeader, SidePanel, TitleBar | Pitfall 3 (Z-index wars), Pitfall 11 (Breakpoints) | MEDIUM - Define centralized z-index scale first |
| **Phase 3: Card Components** | FileCard, PersonCard, EventCard | Pitfall 7 (Truncation a11y), Pitfall 8 (Aspect ratio) | MEDIUM - Test with screen readers, use container queries |
| **Phase 4: Chat Enhancements** | Virtual scrolling, attachments, citations | Pitfall 4 (Performance), Pitfall 9 (Animation jank) | HIGH - Test with 500+ messages, measure frame rates |
| **Phase 5: Theme Extensions** | Copilot theme, typography tokens, brand flair | Pitfall 10 (Token collision), Pitfall 6 (Typography conflicts) | MEDIUM - Document token overrides, test theme switching |
| **Phase 6: Accessibility Pass** | High contrast, forced colors, keyboard nav | Pitfall 5 (High contrast), Pitfall 7 (Truncation) | HIGH - Test with Windows High Contrast Mode, screen readers |

---

## Quick Reference: Prevention Checklist

Use this checklist when adding new components or packages.

### Before Adding New Package

- [ ] Check for phantom dependencies (pnpm list --depth 0)
- [ ] Verify no circular imports (npx madge --circular)
- [ ] Test isolated build (pnpm --filter [package] build)
- [ ] Add to TypeScript project references (tsconfig.json)
- [ ] Document package purpose and dependencies

### When Adding Layout Components

- [ ] Use centralized z-index scale from @ui-kit/core
- [ ] Avoid creating stacking contexts on containers
- [ ] Use consistent breakpoints from tokens
- [ ] Test with screen readers for semantic HTML
- [ ] Test in Windows High Contrast Mode

### When Adding Card Components

- [ ] Use container queries for responsive aspect ratios
- [ ] Implement accessible truncation with "Show more"
- [ ] Use CSS custom properties for customization
- [ ] Expose data-attributes for parent overrides
- [ ] Test with screen readers

### When Enhancing Chat Components

- [ ] Implement virtual scrolling from start
- [ ] Test with 500+ messages
- [ ] Animate only transform and opacity
- [ ] Use will-change for animations
- [ ] Measure performance (60fps target)

### When Extending Theme System

- [ ] Namespace theme-specific tokens
- [ ] Document token overrides per theme
- [ ] Use semantic tokens (body-1) not just scale (text-base)
- [ ] Test theme switching doesn't break components
- [ ] Ensure gradients work as background values

### Accessibility Testing

- [ ] Test with Windows High Contrast Mode
- [ ] Test with screen reader (VoiceOver, NVDA)
- [ ] Test keyboard navigation (Tab, Enter, Space, Escape)
- [ ] Verify WCAG 2.1 AA color contrast
- [ ] Check forced-colors media query support

---

## Confidence Assessment

| Pitfall Category | Confidence | Source Quality |
|------------------|------------|----------------|
| Phantom Dependencies | HIGH | Official pnpm docs, Medium articles (2025-2026) |
| Circular Dependencies | HIGH | TypeScript GitHub issue, Nx official blog, dev articles |
| Z-Index Wars | HIGH | Josh Comeau blog, MDN docs, GitHub issues |
| Chat Performance | HIGH | Open WebUI discussion, LogRocket tutorial, TanStack docs |
| High Contrast Mode | HIGH | Microsoft Learn, Smashing Magazine, WebAIM predictions |
| Typography Conflicts | MEDIUM | UX Collective article, Material Design 3 docs |
| Truncation Accessibility | MEDIUM | SiteLint blog, GitHub gist, community articles |
| Aspect Ratio Issues | MEDIUM | DEV Community, Sara Soueidan blog, MDN docs |
| Animation Performance | HIGH | MDN docs, Medium articles, DEV Community posts |
| Token Collision | MEDIUM | EightShapes blog, Netguru, design system articles |
| Breakpoint Consistency | MEDIUM | BrowserStack guide, Nielsen Norman Group, Material UI docs |
| CSS Module Overrides | MEDIUM | Liefery tech blog, Medium articles, community posts |

**Overall Confidence: MEDIUM-HIGH**

Most pitfalls are well-documented in recent articles (2025-2026) and official documentation. Some areas (token collision, truncation accessibility) rely more on community best practices than official specifications.

---

## Gaps and Uncertainties

### Areas Needing Phase-Specific Research

1. **pnpm Hoisting Configuration**: Need to determine if shamefully-hoist required for specific packages or if strict isolation sufficient. Test with actual build.

2. **Container Query Browser Support**: Need to verify browser support in target environments and whether polyfill required for Safari < 16.

3. **Forced Colors Testing Strategy**: Need to establish automated testing approach for forced-colors mode. Manual testing only or Playwright integration?

4. **Virtual Scrolling with Markdown**: Need to test if @tanstack/react-virtual works well with markdown rendering (@ui-kit/react-markdown). Potential complexity with dynamic heights.

5. **TypeScript Project References Structure**: Need to determine optimal tsconfig.json structure for new packages. Composite projects or regular references?

---

## Tools for Detection

| Tool | Purpose | Command |
|------|---------|---------|
| **madge** | Detect circular dependencies | `npx madge --circular --extensions ts,tsx packages/ui-kit/` |
| **pnpm list** | Check for phantom deps | `pnpm list --depth 0` (per package) |
| **Chrome DevTools** | Performance profiling, forced-colors | Performance tab, Rendering > Emulate forced-colors |
| **React DevTools** | Component rerender analysis | Profiler tab |
| **VoiceOver / NVDA** | Screen reader testing | Cmd+F5 (macOS), NVDA (Windows) |
| **Lighthouse** | Accessibility audit | Chrome DevTools > Lighthouse |
| **TypeScript** | Detect circular references | `tsc --build` |

---

## Sources Summary

This research draws from 30+ sources published 2024-2026:

**Official Documentation:**
- Microsoft Learn (High Contrast Mode)
- MDN Web Docs (Stacking Context, Container Queries, Animation Performance)
- pnpm Official Docs (Phantom Dependencies, Hoisting)
- Material Design 3 (Typography Tokens)

**Technical Blogs:**
- Josh Comeau (Z-Index and Stacking Contexts)
- Sara Soueidan (Container Queries)
- LogRocket (Virtual Scrolling, CSS Performance)
- Smashing Magazine (High Contrast Mode)

**Community Articles:**
- DEV Community (Container Queries, Performance)
- Medium (Phantom Dependencies, Typography, Performance)
- UX Collective (Typography Tokens)

**GitHub Discussions:**
- TypeScript Issue #33685 (Circular References)
- Open WebUI Issue #13787 (Chat Performance)
- pnpm Discussions (Hoisting, Phantom Dependencies)

All sources reviewed and cited with working URLs where available.
