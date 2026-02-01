# Phase 9: Layout Components - Research

**Researched:** 2026-02-01
**Domain:** React layout components, page structure, z-index management
**Confidence:** HIGH

## Summary

This phase delivers four layout components (PageHeader, TitleBar, SidePanel, ContentLayout) and a centralized z-index scale for the `@ui-kit/react` package. These components provide the structural foundation for page layouts in the coworker application.

The existing `@ui-kit/react` package already contains foundational components (Panel, Drawer, Breadcrumb, Tabs) that provide patterns and building blocks for these layout components. The key addition is a coherent z-index management system and purpose-built layout containers that compose well together.

Research into the coworker-demo.lovable.app reference and standard React layout patterns confirms that: (1) layout components should use semantic slots (header/content/footer) rather than rigid structures, (2) SidePanel needs both "overlay" (modal-like) and "push" (inline) modes, (3) TitleBar is a specialized navigation component distinct from PageHeader, and (4) a centralized z-index scale prevents layering conflicts across the component library.

**Primary recommendation:** Build layout components following existing @ui-kit/react patterns (CSS modules, design tokens, accessibility), adding a centralized z-index token system. All components go in the existing `packages/ui-kit/react` package per prior decisions.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already in Use)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | ^18.0.0 or ^19.0.0 | Component framework | Project standard |
| CSS Modules | - | Scoped styling | Existing pattern in @ui-kit/react |
| Design Tokens | - | CSS custom properties | Existing token system |

### Supporting (Already Available)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Breadcrumb | internal | Navigation path | PageHeader breadcrumb slot |
| Tabs | internal | Tab navigation | TitleBar Work/Web tabs |
| Panel | internal | Container styling | Base for layout surfaces |
| Drawer | internal | Slide-out panel | Reference for SidePanel overlay mode |
| useFocusTrap | internal | Focus management | SidePanel overlay mode |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS custom z-index | JS z-index manager | CSS variables simpler, no runtime |
| Render props slots | Children composition | Children simpler for most cases |
| Portal for SidePanel | Inline rendering | Inline works for push mode, portal needed for overlay |

**Installation (no new dependencies needed):**
```bash
# All dependencies already in @ui-kit/react
```

## Architecture Patterns

### Recommended Project Structure
```
packages/ui-kit/react/src/
├── components/
│   ├── PageHeader/
│   │   ├── PageHeader.tsx
│   │   ├── PageHeader.module.css
│   │   └── PageHeader.stories.tsx
│   ├── TitleBar/
│   │   ├── TitleBar.tsx
│   │   ├── TitleBar.module.css
│   │   └── TitleBar.stories.tsx
│   ├── SidePanel/
│   │   ├── SidePanel.tsx
│   │   ├── SidePanel.module.css
│   │   └── SidePanel.stories.tsx
│   └── ContentLayout/
│       ├── ContentLayout.tsx
│       ├── ContentLayout.module.css
│       └── ContentLayout.stories.tsx
├── styles/
│   └── z-index.css          # Centralized z-index scale
└── index.ts                  # Add exports
```

### Pattern 1: Slot-Based Layout Components
**What:** Components accept children/slots rather than rendering fixed content
**When to use:** All layout components - they provide structure, consumers provide content
**Example:**
```typescript
// Source: React layout component pattern
interface PageHeaderProps {
  /** Page title */
  title: ReactNode;
  /** Optional breadcrumb items */
  breadcrumbs?: BreadcrumbItem[];
  /** Optional actions slot (buttons, etc.) */
  actions?: ReactNode;
  /** Optional description/subtitle */
  description?: ReactNode;
}

export function PageHeader({ title, breadcrumbs, actions, description }: PageHeaderProps) {
  return (
    <header className={styles.pageHeader}>
      {breadcrumbs && <Breadcrumb items={breadcrumbs} className={styles.breadcrumbs} />}
      <div className={styles.titleRow}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>{title}</h1>
          {description && <p className={styles.description}>{description}</p>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </header>
  );
}
```

### Pattern 2: Mode-Based Component Variants (SidePanel)
**What:** Single component with multiple behavioral modes
**When to use:** SidePanel with overlay vs push modes
**Example:**
```typescript
// Source: Industry pattern for sidebars
type SidePanelMode = 'overlay' | 'push';

interface SidePanelProps {
  /** Whether panel is open */
  open: boolean;
  /** Close callback */
  onClose: () => void;
  /** Display mode */
  mode?: SidePanelMode;
  /** Panel position */
  position?: 'left' | 'right';
  /** Panel content */
  children: ReactNode;
}

export function SidePanel({ open, onClose, mode = 'push', position = 'left', children }: SidePanelProps) {
  // Overlay mode: uses portal, backdrop, focus trap
  // Push mode: inline rendering, affects sibling layout
  if (mode === 'overlay') {
    return <SidePanelOverlay {...props} />;
  }
  return <SidePanelPush {...props} />;
}
```

### Pattern 3: Centralized Z-Index Scale
**What:** CSS custom properties defining z-index layers
**When to use:** Any component that needs z-index coordination
**Example:**
```css
/* Source: Bootstrap z-index scale pattern + Smashing Magazine best practices */
:root {
  /* Base layers (within normal flow) */
  --z-base: 0;
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-fixed: 300;

  /* Overlay layers (above page content) */
  --z-sidebar: 400;
  --z-modal-backdrop: 500;
  --z-modal: 600;
  --z-popover: 700;
  --z-tooltip: 800;
  --z-toast: 900;

  /* Maximum layer (critical system UI) */
  --z-max: 9999;
}
```

### Pattern 4: ContentLayout with Named Slots
**What:** Page wrapper providing header/content/footer structure
**When to use:** Standard page layouts throughout the app
**Example:**
```typescript
interface ContentLayoutProps {
  /** Page header (PageHeader component or custom) */
  header?: ReactNode;
  /** Main content */
  children: ReactNode;
  /** Footer content */
  footer?: ReactNode;
  /** Maximum content width */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function ContentLayout({ header, children, footer, maxWidth = 'lg', padding = 'md' }: ContentLayoutProps) {
  return (
    <div className={styles.layout}>
      {header && <div className={styles.header}>{header}</div>}
      <main className={`${styles.content} ${styles[`maxWidth-${maxWidth}`]} ${styles[`padding-${padding}`]}`}>
        {children}
      </main>
      {footer && <footer className={styles.footer}>{footer}</footer>}
    </div>
  );
}
```

### Anti-Patterns to Avoid
- **Hardcoded z-index values:** Always use the centralized scale tokens
- **Magic number spacing:** Use spacing tokens (--space-*) not px values
- **Fixed breakpoints in components:** Use CSS container queries or let consumer handle responsiveness
- **Tightly coupled components:** Layout components should work independently
- **Implicit stacking contexts:** Document when components create new stacking contexts

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Breadcrumb navigation | Custom implementation | Existing Breadcrumb component | Already accessible, styled |
| Tab navigation | Custom tabs | Existing Tabs component | Keyboard nav, animations |
| Focus trapping | Manual focus logic | Existing useFocusTrap hook | Edge cases handled |
| Portal rendering | Manual DOM manipulation | createPortal | React's standard approach |
| Backdrop styling | Custom backdrop | Existing Drawer/Modal patterns | Consistent overlay appearance |

**Key insight:** The existing component library has building blocks (Breadcrumb, Tabs, Panel, Drawer, useFocusTrap) that layout components should compose rather than recreate.

## Common Pitfalls

### Pitfall 1: Z-Index Wars
**What goes wrong:** Components compete with arbitrary z-index values, modals appear behind dropdowns
**Why it happens:** No centralized z-index system, developers use random high numbers
**How to avoid:** Use centralized z-index scale tokens; document which layer each component occupies
**Warning signs:** Using z-index values > 1000 without clear reasoning

### Pitfall 2: SidePanel Mode Confusion
**What goes wrong:** Overlay mode doesn't trap focus; push mode doesn't resize siblings
**Why it happens:** Same component trying to do both with minimal code differences
**How to avoid:** Clear separation of overlay (portal + backdrop + focus trap) vs push (CSS flex/grid)
**Warning signs:** SidePanel requires different DOM structure for different modes

### Pitfall 3: PageHeader Overflow
**What goes wrong:** Long titles or many actions break layout
**Why it happens:** Fixed layouts without overflow handling
**How to avoid:** Use CSS truncation for titles; responsive design for actions (overflow menu on mobile)
**Warning signs:** Horizontal scrolling on narrow viewports

### Pitfall 4: Missing Responsive Behavior
**What goes wrong:** Layouts break on mobile
**Why it happens:** Only testing desktop viewports
**How to avoid:** Design mobile-first; use container queries where appropriate; test at all breakpoints
**Warning signs:** Fixed pixel widths, no media queries

### Pitfall 5: Accessibility Gaps
**What goes wrong:** Screen readers can't navigate layouts; keyboard users get stuck
**Why it happens:** Missing landmarks, roles, and focus management
**How to avoid:** PageHeader uses proper heading hierarchy; ContentLayout uses main landmark; SidePanel manages focus
**Warning signs:** No ARIA roles, no keyboard handling

### Pitfall 6: Stacking Context Leakage
**What goes wrong:** Child elements with z-index escape their parent's layer
**Why it happens:** Parent doesn't create stacking context (missing position, transform, opacity < 1)
**How to avoid:** Layout containers should establish stacking contexts using `isolation: isolate`
**Warning signs:** Tooltips inside cards appearing above modals

## Code Examples

Verified patterns from official sources:

### Z-Index Scale Definition
```css
/* packages/ui-kit/react/src/styles/z-index.css */
/* Source: Bootstrap z-index scale + Smashing Magazine recommendations */
:root {
  /*
   * Z-Index Scale
   * Use these tokens instead of arbitrary z-index values.
   * Increments of 100 allow inserting new layers if needed.
   */

  /* Base layers - within normal document flow */
  --z-base: 0;           /* Default, no elevation */
  --z-dropdown: 100;     /* Dropdown menus, select options */
  --z-sticky: 200;       /* Sticky headers, floating elements */
  --z-fixed: 300;        /* Fixed position elements */

  /* Overlay layers - above page content */
  --z-sidebar: 400;      /* SidePanel in overlay mode */
  --z-modal-backdrop: 500;  /* Modal/dialog backdrop */
  --z-modal: 600;        /* Modal/dialog content */
  --z-popover: 700;      /* Popovers, context menus */
  --z-tooltip: 800;      /* Tooltips */
  --z-toast: 900;        /* Toast notifications */

  /* Maximum - critical UI only */
  --z-max: 9999;         /* Dev tools, emergency UI */
}
```

### PageHeader Component
```typescript
// packages/ui-kit/react/src/components/PageHeader/PageHeader.tsx
import { type ReactNode } from 'react';
import { Breadcrumb, type BreadcrumbItem } from '../Breadcrumb';
import styles from './PageHeader.module.css';

export interface PageHeaderProps {
  /** Page title - can be string or custom element */
  title: ReactNode;
  /** Breadcrumb navigation items */
  breadcrumbs?: BreadcrumbItem[];
  /** Actions slot (buttons, menus) */
  actions?: ReactNode;
  /** Optional subtitle/description */
  description?: ReactNode;
  /** Custom link component for breadcrumb routing */
  linkComponent?: React.ComponentType<{ href: string; children: ReactNode }>;
  /** Additional className */
  className?: string;
}

export function PageHeader({
  title,
  breadcrumbs,
  actions,
  description,
  linkComponent,
  className,
}: PageHeaderProps) {
  return (
    <header className={`${styles.pageHeader} ${className || ''}`}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb
          items={breadcrumbs}
          linkComponent={linkComponent}
          className={styles.breadcrumbs}
        />
      )}
      <div className={styles.titleRow}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>{title}</h1>
          {description && <p className={styles.description}>{description}</p>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </header>
  );
}
PageHeader.displayName = 'PageHeader';
```

### TitleBar Component
```typescript
// packages/ui-kit/react/src/components/TitleBar/TitleBar.tsx
import { type ReactNode } from 'react';
import styles from './TitleBar.module.css';

export interface TitleBarTab {
  /** Tab identifier */
  value: string;
  /** Tab label */
  label: ReactNode;
  /** Tab icon */
  icon?: ReactNode;
}

export interface TitleBarProps {
  /** App logo or icon */
  logo?: ReactNode;
  /** App title */
  title?: ReactNode;
  /** Navigation tabs (e.g., Work/Web) */
  tabs?: TitleBarTab[];
  /** Currently active tab */
  activeTab?: string;
  /** Tab change callback */
  onTabChange?: (value: string) => void;
  /** Right-side actions (profile, settings) */
  actions?: ReactNode;
  /** Additional className */
  className?: string;
}

export function TitleBar({
  logo,
  title,
  tabs,
  activeTab,
  onTabChange,
  actions,
  className,
}: TitleBarProps) {
  return (
    <header className={`${styles.titleBar} ${className || ''}`}>
      <div className={styles.leading}>
        {logo && <div className={styles.logo}>{logo}</div>}
        {title && <span className={styles.title}>{title}</span>}
      </div>

      {tabs && tabs.length > 0 && (
        <nav className={styles.tabs} role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              role="tab"
              aria-selected={activeTab === tab.value}
              className={`${styles.tab} ${activeTab === tab.value ? styles.active : ''}`}
              onClick={() => onTabChange?.(tab.value)}
            >
              {tab.icon && <span className={styles.tabIcon}>{tab.icon}</span>}
              {tab.label}
            </button>
          ))}
        </nav>
      )}

      {actions && <div className={styles.trailing}>{actions}</div>}
    </header>
  );
}
TitleBar.displayName = 'TitleBar';
```

### SidePanel Component
```typescript
// packages/ui-kit/react/src/components/SidePanel/SidePanel.tsx
import { useRef, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '../../hooks';
import styles from './SidePanel.module.css';

export type SidePanelMode = 'overlay' | 'push';
export type SidePanelPosition = 'left' | 'right';
export type SidePanelSize = 'sm' | 'md' | 'lg' | 'auto';

export interface SidePanelProps {
  /** Whether panel is open */
  open: boolean;
  /** Close callback */
  onClose: () => void;
  /** Display mode: overlay (modal-like) or push (inline) */
  mode?: SidePanelMode;
  /** Panel position */
  position?: SidePanelPosition;
  /** Panel width */
  size?: SidePanelSize;
  /** Close on backdrop click (overlay mode only) */
  closeOnBackdrop?: boolean;
  /** Close on Escape key */
  closeOnEscape?: boolean;
  /** Panel header content */
  header?: ReactNode;
  /** Panel content */
  children: ReactNode;
  /** Additional className */
  className?: string;
}

export function SidePanel({
  open,
  onClose,
  mode = 'push',
  position = 'left',
  size = 'md',
  closeOnBackdrop = true,
  closeOnEscape = true,
  header,
  children,
  className,
}: SidePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Focus trap for overlay mode
  useFocusTrap(panelRef, open && mode === 'overlay');

  // Escape key handler
  useEffect(() => {
    if (!open || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, closeOnEscape, onClose]);

  // Push mode - inline rendering
  if (mode === 'push') {
    return (
      <aside
        ref={panelRef}
        className={`${styles.panel} ${styles.push} ${styles[position]} ${styles[`size-${size}`]} ${open ? styles.open : ''} ${className || ''}`}
        data-state={open ? 'open' : 'closed'}
      >
        {header && <div className={styles.header}>{header}</div>}
        <div className={styles.content}>{children}</div>
      </aside>
    );
  }

  // Overlay mode - portal with backdrop
  if (!open) return null;

  return createPortal(
    <div
      className={styles.backdrop}
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <aside
        ref={panelRef}
        className={`${styles.panel} ${styles.overlay} ${styles[position]} ${styles[`size-${size}`]} ${className || ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {header && <div className={styles.header}>{header}</div>}
        <div className={styles.content}>{children}</div>
      </aside>
    </div>,
    document.body
  );
}
SidePanel.displayName = 'SidePanel';
```

### ContentLayout Component
```typescript
// packages/ui-kit/react/src/components/ContentLayout/ContentLayout.tsx
import { type ReactNode } from 'react';
import styles from './ContentLayout.module.css';

export type ContentLayoutMaxWidth = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type ContentLayoutPadding = 'none' | 'sm' | 'md' | 'lg';

export interface ContentLayoutProps {
  /** Header content (typically PageHeader) */
  header?: ReactNode;
  /** Main content */
  children: ReactNode;
  /** Footer content */
  footer?: ReactNode;
  /** Maximum content width */
  maxWidth?: ContentLayoutMaxWidth;
  /** Content padding */
  padding?: ContentLayoutPadding;
  /** Additional className */
  className?: string;
}

export function ContentLayout({
  header,
  children,
  footer,
  maxWidth = 'lg',
  padding = 'md',
  className,
}: ContentLayoutProps) {
  return (
    <div className={`${styles.layout} ${className || ''}`}>
      {header && <div className={styles.header}>{header}</div>}
      <main className={`${styles.content} ${styles[`maxWidth-${maxWidth}`]} ${styles[`padding-${padding}`]}`}>
        {children}
      </main>
      {footer && <footer className={styles.footer}>{footer}</footer>}
    </div>
  );
}
ContentLayout.displayName = 'ContentLayout';
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Fixed sidebar widths | Collapsible with push/overlay modes | 2023+ | Better responsive design |
| Page-level z-index hacking | Centralized z-index scale | 2021+ | Prevents layering bugs |
| Div soup for layouts | Semantic HTML (header/main/footer) | Always | Better accessibility |
| CSS Grid for everything | CSS Grid + Flexbox hybrid | Current | Right tool for each job |

**Deprecated/outdated:**
- Absolute positioning for layouts: Use flex/grid instead
- Table-based layouts: Ancient technique, never use
- !important for z-index: Sign of broken architecture

## Open Questions

Things that couldn't be fully resolved:

1. **TitleBar Tab Indicator Animation**
   - What we know: Existing Tabs component has animated indicator
   - What's unclear: Should TitleBar reuse Tabs internally or have simpler static tabs?
   - Recommendation: Keep TitleBar simple with button-based tabs; animation is optional enhancement

2. **SidePanel Width Customization**
   - What we know: Need sm/md/lg sizes; some use cases need custom widths
   - What's unclear: Should we support arbitrary pixel/percentage widths?
   - Recommendation: Start with preset sizes; add `width` prop if needed

3. **ContentLayout Scroll Behavior**
   - What we know: Main content should scroll, header/footer should be sticky
   - What's unclear: Who controls scroll - ContentLayout or parent?
   - Recommendation: ContentLayout provides structure; scroll handled by CSS (flex-grow + overflow)

4. **Coworker Demo Reference Pages**
   - What we know: QS-05 requires mock pages mirroring coworker-demo.lovable.app
   - What's unclear: Exact pages/states to implement in mock-coworker-pages
   - Recommendation: Create representative examples showing each layout component in context

## Sources

### Primary (HIGH confidence)
- Existing @ui-kit/react components (Panel, Drawer, Breadcrumb, Tabs) - direct codebase inspection
- Existing tokens.css z-index usage (z-index: 1000 in Modal/Drawer)
- MDN CSS z-index and stacking context documentation

### Secondary (MEDIUM confidence)
- [Bootstrap z-index scale](https://getbootstrap.com/docs/5.3/layout/z-index/) - established scale pattern
- [Smashing Magazine z-index management](https://www.smashingmagazine.com/2021/02/css-z-index-large-projects/) - best practices
- [React Layout Components Pattern](https://medium.com/@vitorbritto/react-design-patterns-layout-components-pattern-455c98e0bf92) - slot-based pattern
- [Josh Comeau Stacking Contexts](https://www.joshwcomeau.com/css/stacking-contexts/) - isolation property

### Tertiary (LOW confidence)
- coworker-demo.lovable.app - reference app (limited access to actual implementation)
- Various sidebar component libraries - general patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - using existing proven tooling
- Architecture: HIGH - following established @ui-kit/react patterns
- Z-index scale: HIGH - well-documented industry pattern
- Pitfalls: MEDIUM - based on general web development experience

**Research date:** 2026-02-01
**Valid until:** 30 days (stable domain, low churn)

---

## Quick Reference: Components

### PageHeader (LAY-01)
| Slot | Type | Required | Purpose |
|------|------|----------|---------|
| title | ReactNode | Yes | Page title (h1) |
| breadcrumbs | BreadcrumbItem[] | No | Navigation path |
| actions | ReactNode | No | Right-aligned buttons/actions |
| description | ReactNode | No | Subtitle text |

### TitleBar (LAY-02)
| Slot | Type | Required | Purpose |
|------|------|----------|---------|
| logo | ReactNode | No | App logo/icon |
| title | ReactNode | No | App name |
| tabs | TitleBarTab[] | No | Navigation tabs (Work/Web) |
| actions | ReactNode | No | Right-aligned actions (profile) |

### SidePanel (LAY-03)
| Prop | Type | Default | Purpose |
|------|------|---------|---------|
| open | boolean | - | Panel visibility |
| onClose | () => void | - | Close callback |
| mode | 'overlay' \| 'push' | 'push' | Display mode |
| position | 'left' \| 'right' | 'left' | Panel position |
| size | 'sm' \| 'md' \| 'lg' \| 'auto' | 'md' | Panel width |
| header | ReactNode | - | Panel header content |

### ContentLayout (LAY-04)
| Slot | Type | Required | Purpose |
|------|------|----------|---------|
| header | ReactNode | No | Top section (PageHeader) |
| children | ReactNode | Yes | Main content |
| footer | ReactNode | No | Bottom section |
| maxWidth | 'sm' \| 'md' \| 'lg' \| 'xl' \| 'full' | 'lg' | Content width constraint |
| padding | 'none' \| 'sm' \| 'md' \| 'lg' | 'md' | Content padding |

### Z-Index Scale (QS-05)
| Token | Value | Usage |
|-------|-------|-------|
| --z-base | 0 | Default |
| --z-dropdown | 100 | Dropdowns, selects |
| --z-sticky | 200 | Sticky elements |
| --z-fixed | 300 | Fixed position |
| --z-sidebar | 400 | SidePanel overlay |
| --z-modal-backdrop | 500 | Modal backdrop |
| --z-modal | 600 | Modal content |
| --z-popover | 700 | Popovers |
| --z-tooltip | 800 | Tooltips |
| --z-toast | 900 | Toast notifications |
| --z-max | 9999 | Emergency UI |
