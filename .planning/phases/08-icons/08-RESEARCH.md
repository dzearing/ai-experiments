# Phase 8: Icons - Research

**Researched:** 2026-02-01
**Domain:** React icon libraries, SVG icon components, Microsoft product icons
**Confidence:** HIGH

## Summary

This phase involves two distinct workstreams: (1) adding new UI icons to the existing `@ui-kit/icons` package, and (2) creating a new `@ui-kit/react-product-icons` package for multi-color Microsoft product icons and custom agent icons.

The existing `@ui-kit/icons` package has a well-established build pipeline that generates React components from SVG source files with accompanying JSON metadata. New UI icons (SparkleIcon, MicrophoneIcon/MicrophoneOffIcon, ShieldIcon/ShieldLockIcon, PinIcon, BookmarkIcon, BriefcaseIcon) can follow the exact same pattern - create SVG + JSON in `src/svgs/`, run build.

For product icons, a separate package is required because: (1) product icons are multi-color (not stroke-based with currentColor), (2) they have different sizing requirements (16, 20, 24, 32, 48, 96px), (3) they include branded assets that may have different licensing considerations. The `@fluentui/react-file-type-icons` approach provides a reference pattern, though we will use direct SVG components rather than CDN-based font icons.

**Primary recommendation:** Extend `@ui-kit/icons` with 8 new UI icons using existing build process; create new `@ui-kit/react-product-icons` package with multi-size SVG components for Microsoft product icons and custom agent icons.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already in Use)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | ^18.0.0 or ^19.0.0 | Peer dependency | Project standard |
| svgo | ^3.3.2 | SVG optimization | Industry standard, already in build |
| esbuild | ^0.20.0 | Bundle icon components | Fast, tree-shakable output |
| vite + vite-plugin-dts | ^6.3.5 / ^4.5.4 | Build + type generation | Project standard |
| tsx | ^4.20.3 | Run TypeScript build scripts | Already in place |

### Supporting (Reference Sources)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @fluentui/react-icons | 2.x | Reference for Sparkle, Shield, Mic, etc | Source SVG paths (MIT license) |
| lucide-react | latest | Reference for icon patterns | Source SVG paths (ISC license) |
| office365-icons (GitHub) | N/A | Microsoft 365 product logo SVGs | Source for Word, Excel, etc (MIT license) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom SVG creation | Copy from Fluent UI | Fluent icons are MIT licensed, saves design time |
| SVG sprite approach | Individual components | Components enable tree-shaking, sprite doesn't |
| CDN font icons | Direct SVG components | Components work offline, no CDN dependency |

**Installation (no new dependencies needed):**
```bash
# Existing dependencies are sufficient for UI icons
# New package will use same dev dependencies
```

## Architecture Patterns

### Existing UI Icons Structure (Keep As-Is)
```
packages/ui-kit/icons/
├── src/
│   ├── svgs/           # Source SVGs + JSON metadata (single source of truth)
│   │   ├── sparkle.svg
│   │   ├── sparkle.json
│   │   └── ...
│   ├── components/     # Generated (gitignored)
│   └── utils/
│       ├── createIcon.tsx
│       └── types.ts
├── scripts/            # Build scripts
├── dist/               # Build output
└── package.json        # Explicit exports for each icon
```

### New Product Icons Package Structure
```
packages/ui-kit/react-product-icons/
├── src/
│   ├── svgs/                    # Multi-color SVG sources
│   │   ├── microsoft/           # Microsoft product icons
│   │   │   ├── word.svg
│   │   │   ├── word.json
│   │   │   ├── excel.svg
│   │   │   └── ...
│   │   └── agents/              # Custom agent icons
│   │       ├── analyst.svg
│   │       ├── analyst.json
│   │       └── ...
│   ├── components/              # Generated (gitignored)
│   └── utils/
│       ├── createProductIcon.tsx
│       └── types.ts
├── scripts/
│   └── build.ts
├── dist/
└── package.json
```

### Pattern 1: UI Icon Component (Single Color, Stroke-Based)
**What:** Standard UI icons using `stroke="currentColor"` for theme integration
**When to use:** UI action icons, navigation icons, status indicators
**Example:**
```typescript
// Source: existing @ui-kit/icons pattern
// src/svgs/sparkle.svg
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 3v3m0 12v3m9-9h-3M6 12H3m15.364-6.364l-2.121 2.121M8.757 15.243l-2.121 2.121m12.728 0l-2.121-2.121M8.757 8.757L6.636 6.636"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

### Pattern 2: Product Icon Component (Multi-Color, Fill-Based)
**What:** Brand icons with specific colors, multiple sizes
**When to use:** Microsoft product branding, agent avatars
**Example:**
```typescript
// New pattern for product icons
import { forwardRef } from 'react';
import type { ProductIconProps } from './types';

const WordIcon16 = `<rect fill="#185ABD" .../><text fill="white">W</text>`;
const WordIcon24 = `<rect fill="#185ABD" .../><text fill="white">W</text>`;
const WordIcon32 = `<rect fill="#185ABD" .../><text fill="white">W</text>`;
// ... etc for 48, 96

export const WordIcon = forwardRef<SVGSVGElement, ProductIconProps>(
  ({ size = 24, title, className, ...props }, ref) => {
    // Select appropriate SVG content based on size
    const svgContent = size <= 16 ? WordIcon16
                     : size <= 24 ? WordIcon24
                     : size <= 32 ? WordIcon32
                     : size <= 48 ? WordIcon48
                     : WordIcon96;
    // ... render
  }
);
```

### Anti-Patterns to Avoid
- **Barrel exports for icons:** Each icon must be individually importable for tree-shaking
- **Using currentColor for brand icons:** Product icons have specific brand colors (Word=blue, Excel=green)
- **Scaling product icons arbitrarily:** Use discrete sizes (16, 24, 32, 48, 96) for pixel-perfect rendering
- **Copying trademarked logos directly:** Use official design guidelines or open-source alternatives

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sparkle icon SVG | Design from scratch | Fluent UI or Lucide source | MIT/ISC licensed, well-designed |
| Microphone icon SVG | Design from scratch | Fluent UI `mic` icons | Consistent with ecosystem |
| Shield/Lock icons | Design from scratch | Fluent UI shield variants | Multiple variants available |
| Package.json exports | Manual maintenance | Build script auto-generation | Existing pattern handles this |
| SVG optimization | Manual cleanup | SVGO with existing config | Consistent optimization |

**Key insight:** The existing build pipeline handles component generation, exports, sprites, and fonts. Focus on creating proper SVG + JSON source files only.

## Common Pitfalls

### Pitfall 1: Hardcoding Colors in UI Icons
**What goes wrong:** Icons don't adapt to light/dark themes
**Why it happens:** Copying SVGs that use `fill="#000"` instead of `stroke="currentColor"`
**How to avoid:** All UI icons must use `stroke="currentColor"` with `fill="none"`
**Warning signs:** Icons look wrong when theme changes

### Pitfall 2: Missing JSON Metadata
**What goes wrong:** Build fails or icon not included in sprite/search
**Why it happens:** Creating SVG without corresponding `.json` file
**How to avoid:** Always create both `{name}.svg` and `{name}.json`
**Warning signs:** Build warnings about missing metadata

### Pitfall 3: Incorrect ViewBox
**What goes wrong:** Icons render at wrong size or get clipped
**Why it happens:** Using viewBox other than `0 0 24 24` for UI icons
**How to avoid:** All UI icons use `viewBox="0 0 24 24"`
**Warning signs:** Icons appear too small or cut off

### Pitfall 4: Product Icon Size Interpolation
**What goes wrong:** Blurry or malformed icons at non-standard sizes
**Why it happens:** Scaling a single SVG instead of using size-specific versions
**How to avoid:** Product icons should have discrete SVG variants for each size
**Warning signs:** Icons look bad at certain sizes, loss of detail

### Pitfall 5: Trademark/Licensing Issues
**What goes wrong:** Legal concerns with branded icons
**Why it happens:** Using official Microsoft logos without proper licensing
**How to avoid:** Use MIT-licensed alternatives or official approved stencils
**Warning signs:** Icons that look exactly like official product logos

## Code Examples

Verified patterns from official sources:

### Adding a New UI Icon (Complete Process)
```bash
# 1. Create SVG file
# packages/ui-kit/icons/src/svgs/sparkle.svg
```
```xml
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5L12 3Z"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M19 17L19.5 19L21 19.5L19.5 20L19 22L18.5 20L17 19.5L18.5 19L19 17Z"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```
```bash
# 2. Create JSON metadata
# packages/ui-kit/icons/src/svgs/sparkle.json
```
```json
{
  "name": "sparkle",
  "category": "misc",
  "keywords": ["ai", "magic", "sparkle", "star", "enhance", "generate"]
}
```
```bash
# 3. Build
cd packages/ui-kit/icons && pnpm build
```

### Product Icon Types Definition
```typescript
// packages/ui-kit/react-product-icons/src/utils/types.ts
import type { SVGProps } from 'react';

export interface ProductIconProps extends Omit<SVGProps<SVGSVGElement>, 'viewBox'> {
  /**
   * Icon size in pixels. Product icons support specific sizes:
   * 16, 20, 24, 32, 48, 96
   * @default 24
   */
  size?: 16 | 20 | 24 | 32 | 48 | 96 | number;

  /**
   * Accessible title for the icon
   */
  title?: string;
}

export interface ProductIconMetadata {
  name: string;
  displayName: string;
  category: 'microsoft' | 'agents';
  keywords: string[];
  componentName: string;
  /** Available sizes for this icon */
  sizes: number[];
}
```

### Product Icon Component Pattern
```typescript
// packages/ui-kit/react-product-icons/src/components/WordIcon.tsx
import { forwardRef } from 'react';
import type { ProductIconProps } from '../utils/types';

const sizes = {
  16: `<path fill="#185ABD" d="M0 2a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H2a2 2 0 01-2-2V2z"/><path fill="#fff" d="M4 4l2 8 2-5 2 5 2-8"/>`,
  24: `<path fill="#185ABD" d="M0 4a4 4 0 014-4h16a4 4 0 014 4v16a4 4 0 01-4 4H4a4 4 0 01-4-4V4z"/><path fill="#fff" d="M5 6l3 12 3-8 3 8 3-12"/>`,
  32: `<!-- ... -->`,
  48: `<!-- ... -->`,
  96: `<!-- ... -->`,
};

export const WordIcon = forwardRef<SVGSVGElement, ProductIconProps>(
  ({ size = 24, title, className, style, ...props }, ref) => {
    const nearestSize = [16, 24, 32, 48, 96].reduce((prev, curr) =>
      Math.abs(curr - size) < Math.abs(prev - size) ? curr : prev
    );
    const svgContent = sizes[nearestSize as keyof typeof sizes];
    const hasTitle = Boolean(title);

    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${nearestSize} ${nearestSize}`}
        width={size}
        height={size}
        className={className}
        style={style}
        aria-hidden={hasTitle ? undefined : true}
        role={hasTitle ? 'img' : undefined}
        aria-label={hasTitle ? title : undefined}
        {...props}
        dangerouslySetInnerHTML={{
          __html: title ? `<title>${title}</title>${svgContent}` : svgContent
        }}
      />
    );
  }
);

WordIcon.displayName = 'WordIcon';
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Icon font sprites | Individual SVG components | 2022+ | Better tree-shaking, no font loading |
| CDN-hosted icons | Bundled components | 2024+ | Works offline, no CDN dependency |
| Single SVG scaled | Multi-size discrete SVGs | Current | Pixel-perfect at all sizes |
| Barrel exports | Individual named exports | Current | Optimal bundle size |

**Deprecated/outdated:**
- `@fluentui/react-file-type-icons` CDN approach: Edgio CDN shutdown Jan 2025
- Icon fonts with Unicode codepoints: Poor tree-shaking, loading delays
- Generic `<Icon name="x" />` components: Poor TypeScript support, no tree-shaking

## Open Questions

Things that couldn't be fully resolved:

1. **Microsoft Product Icon Licensing**
   - What we know: MIT-licensed alternatives exist on GitHub (office365-icons)
   - What's unclear: Whether using these in a commercial product is fully acceptable
   - Recommendation: Use MIT-licensed sources; document attribution; consider designing custom variants

2. **Agent Icon Design**
   - What we know: Need icons for Analyst, Researcher, Planner, CatchUp agents
   - What's unclear: Exact visual design for these custom agents
   - Recommendation: Start with placeholder designs; can iterate on visuals separately

3. **Size Variants for Product Icons**
   - What we know: Microsoft recommends discrete sizes (16, 20, 24, 32, 48, 96)
   - What's unclear: Do we need all sizes, or can we start with subset?
   - Recommendation: Start with 16, 24, 32, 48; add others as needed

## Sources

### Primary (HIGH confidence)
- Existing `@ui-kit/icons` package - direct codebase inspection
- package.json, build scripts, component patterns
- Lucide Icons - https://lucide.dev/icons/ - sparkle, mic, shield, bookmark, briefcase available

### Secondary (MEDIUM confidence)
- @fluentui/react-icons npm package - Sparkle, Shield, Mic variants confirmed
- @fluentui/react-file-type-icons - file type icon approach documented
- office365-icons GitHub repo - MIT licensed SVGs for Word, Excel, PowerPoint, etc
- Microsoft Fluent 2 Design System - https://fluent2.microsoft.design/iconography

### Tertiary (LOW confidence)
- Salesforce AI agent design tips - general design principles
- Various icon aggregator sites - icon availability confirmed

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - using existing proven tooling
- Architecture: HIGH - extending established pattern for UI icons; MEDIUM for product icons (new pattern)
- Pitfalls: HIGH - based on existing codebase patterns

**Research date:** 2026-02-01
**Valid until:** 30 days (stable domain, low churn)

---

## Quick Reference: Required Icons

### UI Icons (add to @ui-kit/icons)
| Icon | Source | Category | Notes |
|------|--------|----------|-------|
| SparkleIcon | Lucide/Fluent | misc | AI/magic indicator |
| MicrophoneIcon | Fluent mic | actions | Voice input |
| MicrophoneOffIcon | Fluent mic-off | actions | Voice input disabled |
| ShieldIcon | Lucide/Fluent shield | status | Security indicator |
| ShieldLockIcon | Fluent shield-lock | status | Secure/locked |
| PinIcon | Lucide pin | actions | Pin/attach |
| BookmarkIcon | Lucide bookmark | actions | Save/favorite |
| BriefcaseIcon | Lucide briefcase | misc | Work/business |

### Microsoft Product Icons (new package)
| Icon | Category | Sizes | Colors |
|------|----------|-------|--------|
| WordIcon | microsoft | 16,24,32,48 | Blue (#185ABD) |
| ExcelIcon | microsoft | 16,24,32,48 | Green (#217346) |
| PowerPointIcon | microsoft | 16,24,32,48 | Orange (#D24726) |
| OutlookIcon | microsoft | 16,24,32,48 | Blue (#0078D4) |
| TeamsIcon | microsoft | 16,24,32,48 | Purple (#6264A7) |
| OneDriveIcon | microsoft | 16,24,32,48 | Blue (#0078D4) |
| SharePointIcon | microsoft | 16,24,32,48 | Teal (#038387) |

### Agent Icons (new package)
| Icon | Category | Notes |
|------|----------|-------|
| AnalystIcon | agents | Data analysis agent |
| ResearcherIcon | agents | Research agent |
| PlannerIcon | agents | Planning agent |
| CatchUpIcon | agents | Summary/catch-up agent |
