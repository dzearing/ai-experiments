# UI Kit Icons Package Plan

## Overview

This document outlines the plan for creating the `@claude-flow/ui-kit-icons` package, which will provide a comprehensive set of SVG icons for use across the Claude Flow ecosystem. The package will offer both raw SVG files and React components, with full theme integration support.

## Goals

1. **Centralized Icon Library**: Single source of truth for all icons used in Claude Flow applications
2. **Theme Integration**: Icons that automatically adapt to the current theme's color scheme
3. **Flexible Usage**: Support both direct SVG imports and React component usage
4. **Tree-Shaking Friendly**: Optimized exports map for minimal bundle size
5. **TypeScript Support**: Full type safety for all icon components and utilities
6. **Accessibility**: ARIA attributes and proper semantic markup

## Package Structure

```
packages/ui-kit-icons/
├── src/
│   ├── svgs/                    # Raw SVG files
│   │   ├── actions/            # Action icons (save, delete, edit, etc.)
│   │   ├── navigation/         # Navigation icons (arrows, menu, etc.)
│   │   ├── status/            # Status icons (check, error, warning, etc.)
│   │   ├── editor/             # Markdown editor icons
│   │   ├── social/            # Social/brand icons (github, etc.)
│   │   └── misc/              # Miscellaneous icons
│   ├── components/            # Auto-generated React components
│   │   └── [IconName].tsx    # Individual icon components
│   ├── types/               # TypeScript definitions
│   │   └── index.ts        # Icon types and interfaces
│   ├── utils/              # Utility functions
│   │   └── createIcon.tsx  # Minimal helper for creating icon components
│   └── index.ts           # Main entry point with all exports
├── .storybook/               # Storybook configuration
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Development Experience

### Local Development with Storybook

Running `pnpm dev` in the ui-kit-icons package will start Storybook, providing:

1. **Icon Catalog**: Browse all icons with search and filtering
2. **Interactive Controls**: Adjust size, colors, and view different states
3. **Copy Import**: Click any icon to copy its import statement
4. **Category Views**: Browse icons organized by their categories
5. **Theme Testing**: See how icons adapt to light/dark themes
6. **Documentation**: Usage examples and guidelines

### Hot Reload Workflow

During development, the package supports hot reloading:
- Adding new SVGs triggers automatic component generation
- Changes to SVGs are reflected immediately in Storybook
- Component updates happen without manual rebuilds

## Icon Categories and Initial Set

### Actions (Priority 1)
- save, edit, delete, add, remove
- copy, paste, cut
- undo, redo
- search, filter
- refresh, sync
- download, upload
- share, export

### Navigation (Priority 1)
- arrow-up, arrow-down, arrow-left, arrow-right
- chevron-up, chevron-down, chevron-left, chevron-right
- menu, close
- home, back, forward
- expand, collapse

### Status (Priority 1)
- check, check-circle
- x, x-circle
- warning, warning-triangle
- info, info-circle
- error, error-circle
- loading, spinner

### UI Elements (Priority 2)
- settings, gear
- user, users
- folder, file
- calendar, clock
- bell, notification
- star, heart
- comment, chat

### Editor/Markdown (Priority 1)
- bold, italic, underline, strikethrough
- heading-1, heading-2, heading-3
- list-bullet, list-ordered, list-task
- quote, code, code-block
- link, image, table
- indent, outdent
- undo, redo (if not in actions)

### Social/Brand (Priority 3)
- github
- claude
- anthropic

## Technical Implementation

### 1. SVG Management

#### Raw SVG Structure
```xml
<!-- Example: src/svgs/actions/save.svg -->
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="..." stroke="currentColor" stroke-width="2"/>
</svg>
```

Key principles:
- Use `currentColor` for stroke/fill to inherit from parent
- Consistent 24x24 viewBox
- No hardcoded colors (except for brand icons)
- Optimized paths using SVGO

### 2. React Component Generation

#### Icon Props Interface
```tsx
// src/types/index.ts
export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  title?: string;
}
```

#### Minimal Helper Function
```tsx
// src/utils/createIcon.tsx
import React from 'react';
import type { IconProps } from '../types';

export function createIcon(
  svgContent: string,
  displayName: string
): React.ForwardRefExoticComponent<IconProps & React.RefAttributes<SVGSVGElement>> {
  const Component = React.forwardRef<SVGSVGElement, IconProps>(
    ({ size = 24, title, width, height, ...props }, ref) => {
      const sizeProps = {
        width: width ?? size,
        height: height ?? size,
      };

      return (
        <svg
          ref={ref}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden={title ? undefined : true}
          role={title ? 'img' : undefined}
          {...sizeProps}
          {...props}
          dangerouslySetInnerHTML={{ __html: svgContent }}
        >
          {title && <title>{title}</title>}
        </svg>
      );
    }
  );

  Component.displayName = displayName;
  return Component;
}
```

#### Generated Component Example
```tsx
// src/components/SaveIcon.tsx (auto-generated)
import { createIcon } from '../utils/createIcon';

const svgContent = `<path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="currentColor" stroke-width="2"/>`;

export const SaveIcon = createIcon(svgContent, 'SaveIcon');
```

### 3. Theme Integration

#### Surface-Based Color Approach
Icons inherit their color from the surface they're placed on, using existing color tokens:

```css
/* Icons use existing surface-specific tokens */
:root {
  /* Body surface */
  --color-body-text: ...;
  --color-body-text-secondary: ...;
  --color-body-icon: var(--color-body-text);
  --color-body-icon-secondary: var(--color-body-text-secondary);
  
  /* Card surface */
  --color-card-text: ...;
  --color-card-icon: var(--color-card-text);
  
  /* Panel surface */
  --color-panel-text: ...;
  --color-panel-icon: var(--color-panel-text);
  
  /* Interactive states (shared across surfaces) */
  --color-interactive: var(--color-primary);
  --color-interactive-hover: var(--color-primary-hover);
  
  /* Semantic colors (shared across surfaces) */
  --color-success: ...;
  --color-warning: ...;
  --color-error: ...;
  --color-info: ...;
}
```

#### Usage in Components
```tsx
// Example usage in ui-kit-react
import { SaveIcon } from '@claude-flow/ui-kit-icons';

// Icons automatically adapt to their surface
<div className="surface-body">
  <SaveIcon className="text-body-icon" />
</div>

<div className="surface-card">
  <SaveIcon className="text-card-icon" />
</div>

// Interactive states
<button className="text-body-icon hover:text-interactive-hover">
  <SaveIcon size={20} />
</button>

// Semantic colors work across all surfaces
<SaveIcon className="text-success" /> // Success state
<SaveIcon className="text-error" />   // Error state
```

### 4. Build Process

#### Integration with Existing Build System

The icon package will use the existing `repo-scripts build` command by adding support for a new `packageType: "icon-library"` in package.json.

**Updates to tools/repo-scripts/src/utilities/detectPackageType.ts:**
```typescript
export type PackageType = 'react-app' | 'component-library' | 'node-app' | 'icon-library' | 'unknown';
```

**Updates to tools/repo-scripts/src/tasks/build.ts:**
```typescript
// Add icon-library case in the post-build switch
case 'icon-library':
  // Run icon optimization
  await runOptimizeIcons();
  // Generate React components from SVGs
  await runGenerateIcons();
  break;
```

#### New Icon-Specific Utilities

1. **tools/repo-scripts/src/utilities/runOptimizeIcons.ts**
   ```typescript
   import { glob } from 'glob';
   import { optimize } from 'svgo';
   import fs from 'fs/promises';
   
   export async function runOptimizeIcons() {
     const svgFiles = await glob('src/svgs/**/*.svg');
     
     for (const file of svgFiles) {
       const content = await fs.readFile(file, 'utf-8');
       const result = optimize(content, {
         plugins: [
           'preset-default',
           'removeXMLNS',
           { name: 'convertColors', params: { currentColor: true } }
         ]
       });
       await fs.writeFile(file, result.data);
     }
   }
   ```

2. **tools/repo-scripts/src/utilities/runGenerateIcons.ts**
   ```typescript
   import { glob } from 'glob';
   import fs from 'fs/promises';
   import path from 'path';
   
   export async function runGenerateIcons() {
     const svgFiles = await glob('src/svgs/**/*.svg');
     const iconExports: string[] = [];
     
     for (const file of svgFiles) {
       const svgContent = await fs.readFile(file, 'utf-8');
       const iconName = pascalCase(path.basename(file, '.svg')) + 'Icon';
       
       // Generate component
       const component = `import { createIcon } from '../utils/createIcon';
   
   const svgContent = \`${svgContent.replace(/`/g, '\\`')}\`;
   
   export const ${iconName} = createIcon(svgContent, '${iconName}');
   `;
       
       await fs.writeFile(`src/components/${iconName}.tsx`, component);
       iconExports.push(`export { ${iconName} } from './components/${iconName}';`);
     }
     
     // Update index.ts
     await fs.writeFile('src/index.ts', iconExports.join('\n') + '\nexport type { IconProps } from \'./types\';');
   }
   ```

### 5. Package Configuration

#### package.json
```json
{
  "name": "@claude-flow/ui-kit-icons",
  "version": "0.0.0",
  "type": "module",
  "packageType": "icon-library",
  "scripts": {
    "build": "pnpm repo-scripts build",
    "dev": "pnpm repo-scripts build --watch"
  },
  "exports": {
    ".": {
      "import": "./lib/index.js",
      "types": "./lib/index.d.ts"
    },
    "./svgs/*": "./src/svgs/*.svg",
    "./package.json": "./package.json"
  },
  "sideEffects": false,
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0"
  }
}
```

Example index.ts:
```tsx
// src/index.ts
export { SaveIcon } from './components/SaveIcon';
export { EditIcon } from './components/EditIcon';
export { DeleteIcon } from './components/DeleteIcon';
// ... all other icons
export type { IconProps } from './types';
```

## Development Workflow

### 1. Adding New Icons

```bash
# 1. Add SVG to appropriate category
cp new-icon.svg packages/ui-kit-icons/src/svgs/actions/

# 2. Run build (which handles optimization and generation)
pnpm --filter @claude-flow/ui-kit-icons build

# Or watch mode during development
pnpm --filter @claude-flow/ui-kit-icons dev
```

### 2. Icon Guidelines

- **Naming**: Use kebab-case for files, PascalCase for components
- **Size**: Design at 24x24, but ensure scalability
- **Style**: 2px stroke width, rounded line caps
- **Color**: Always use currentColor unless brand-specific

### 3. Testing

- Visual regression tests with Storybook
- Unit tests for component props and accessibility
- Bundle size monitoring
- Theme compatibility checks

## Integration with ui-kit-react

### 1. Icon Button Component
```tsx
// ui-kit-react/src/components/IconButton/IconButton.tsx
import { Button, type ButtonProps } from '../Button';

export interface IconButtonProps extends Omit<ButtonProps, 'children'> {
  icon: React.ReactNode;
  label: string; // For accessibility
}

export const IconButton = ({ icon, label, ...props }: IconButtonProps) => (
  <Button {...props} aria-label={label}>
    {icon}
  </Button>
);
```

### 2. Icon Usage in Components
```tsx
// Example: ui-kit-react components using icons
import { ChevronDownIcon, BoldIcon, ItalicIcon } from '@claude-flow/ui-kit-icons';

// In a dropdown
export const Dropdown = () => (
  <button>
    Options <ChevronDownIcon size={16} className="ml-1" />
  </button>
);

// In a markdown editor toolbar
export const EditorToolbar = () => (
  <div className="flex gap-1">
    <IconButton icon={<BoldIcon size={20} />} label="Bold" />
    <IconButton icon={<ItalicIcon size={20} />} label="Italic" />
  </div>
);
```

## Documentation

### 1. Storybook Configuration

#### Package Scripts
```json
{
  "scripts": {
    "build": "pnpm repo-scripts build",
    "dev": "pnpm storybook",
    "storybook": "storybook dev -p 6007",
    "build-storybook": "storybook build"
  }
}
```

#### Icon Catalog Story
```tsx
// src/stories/IconCatalog.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import * as Icons from '../index';
import { useState } from 'react';

const meta: Meta = {
  title: 'Icons/Catalog',
  parameters: {
    layout: 'padded',
  },
};

export default meta;

export const AllIcons: StoryObj = {
  render: () => {
    const [size, setSize] = useState(24);
    const [search, setSearch] = useState('');
    const [copied, setCopied] = useState<string | null>(null);
    
    const iconEntries = Object.entries(Icons)
      .filter(([name]) => name !== 'IconProps')
      .filter(([name]) => name.toLowerCase().includes(search.toLowerCase()));
    
    const copyImport = (name: string) => {
      navigator.clipboard.writeText(`import { ${name} } from '@claude-flow/ui-kit-icons';`);
      setCopied(name);
      setTimeout(() => setCopied(null), 2000);
    };
    
    return (
      <div>
        <div className="sticky top-0 bg-background p-4 border-b">
          <div className="flex gap-4 items-center">
            <input
              type="text"
              placeholder="Search icons..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-2 border rounded"
            />
            <label className="flex items-center gap-2">
              Size:
              <input
                type="range"
                min="16"
                max="48"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
              />
              <span>{size}px</span>
            </label>
          </div>
        </div>
        
        <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-4 p-4">
          {iconEntries.map(([name, Icon]) => (
            <button
              key={name}
              onClick={() => copyImport(name)}
              className="flex flex-col items-center gap-2 p-4 rounded hover:bg-muted transition-colors"
            >
              <Icon size={size} />
              <span className="text-xs text-muted-foreground">
                {name.replace('Icon', '')}
              </span>
              {copied === name && (
                <span className="text-xs text-success">Copied!</span>
              )}
            </button>
          ))}
        </div>
        
        <div className="p-4 text-sm text-muted-foreground">
          {iconEntries.length} icons • Click to copy import
        </div>
      </div>
    );
  },
};

export const IconShowcase: StoryObj = {
  render: () => {
    const [selectedIcon, setSelectedIcon] = useState<string>('SaveIcon');
    const Icon = Icons[selectedIcon as keyof typeof Icons] as React.ComponentType<Icons.IconProps>;
    
    return (
      <div className="space-y-8">
        <select
          value={selectedIcon}
          onChange={(e) => setSelectedIcon(e.target.value)}
          className="px-3 py-2 border rounded"
        >
          {Object.keys(Icons)
            .filter(name => name !== 'IconProps')
            .map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
        </select>
        
        <div className="grid grid-cols-3 gap-8">
          <div>
            <h3 className="font-semibold mb-4">Sizes</h3>
            <div className="space-y-4">
              {[16, 20, 24, 32, 48].map(size => (
                <div key={size} className="flex items-center gap-4">
                  <Icon size={size} />
                  <span className="text-sm text-muted-foreground">{size}px</span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Colors</h3>
            <div className="space-y-4">
              <Icon className="text-primary" />
              <Icon className="text-success" />
              <Icon className="text-warning" />
              <Icon className="text-error" />
              <Icon className="text-muted-foreground" />
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">States</h3>
            <div className="space-y-4">
              <button className="flex items-center gap-2 hover:text-primary transition-colors">
                <Icon size={20} />
                <span>Hover me</span>
              </button>
              <button className="flex items-center gap-2 opacity-50" disabled>
                <Icon size={20} />
                <span>Disabled</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  },
};
```

#### Category Stories
```tsx
// src/stories/IconCategories.stories.tsx
export const ActionIcons: StoryObj = {
  render: () => <IconGrid category="actions" />,
};

export const NavigationIcons: StoryObj = {
  render: () => <IconGrid category="navigation" />,
};

export const EditorIcons: StoryObj = {
  render: () => <IconGrid category="editor" />,
};

// Helper component
const IconGrid = ({ category }: { category: string }) => {
  // Filter icons by category based on naming convention
  // Render grid with category-specific icons
};
```

### 2. README Documentation

- Installation instructions
- Usage examples (SVG and React)
- Contribution guidelines
- Icon design principles

## Implementation Strategy with Parallel Agents

### SVG Creation with Sub-agents

To accelerate icon creation while maintaining consistency, we'll use parallel sub-agents with shared design specifications:

```typescript
// Shared design system for all agents
const ICON_DESIGN_SYSTEM = {
  viewBox: "0 0 24 24",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  fill: "none",
  stroke: "currentColor",
  style: "Modern, minimal, consistent line weights"
};
```

#### Agent Task Distribution

1. **Action Icons Agent**
   ```
   Create SVG icons for: save, edit, delete, add, remove, copy, paste, 
   cut, undo, redo, search, filter, refresh, sync, download, upload, 
   share, export
   ```

2. **Navigation Icons Agent**
   ```
   Create SVG icons for: arrow-up, arrow-down, arrow-left, arrow-right,
   chevron-up, chevron-down, chevron-left, chevron-right, menu, close,
   home, back, forward, expand, collapse
   ```

3. **Editor Icons Agent**
   ```
   Create SVG icons for: bold, italic, underline, strikethrough,
   heading-1, heading-2, heading-3, list-bullet, list-ordered, 
   list-task, quote, code, code-block, link, image, table, 
   indent, outdent
   ```

4. **Status & UI Icons Agent**
   ```
   Create SVG icons for: check, check-circle, x, x-circle, warning,
   warning-triangle, info, info-circle, error, error-circle, loading,
   spinner, settings, gear, user, folder, file, bell, star
   ```

Each agent receives:
- The design system specifications
- Example SVGs for style reference
- Specific icon requirements
- Output format template

### Parallel Implementation Plan

```bash
# Launch all icon creation agents in parallel
pnpm claude-code task "Create action icons following design system" --subagent-type general-purpose &
pnpm claude-code task "Create navigation icons following design system" --subagent-type general-purpose &
pnpm claude-code task "Create editor icons following design system" --subagent-type general-purpose &
pnpm claude-code task "Create status/UI icons following design system" --subagent-type general-purpose &
```

## Timeline and Phases

### Phase 1: Foundation & Parallel Icon Creation (Day 1-2)
- [ ] Set up package structure
- [ ] Implement createIcon helper and TypeScript types
- [ ] Launch parallel agents for SVG creation
- [ ] Set up build system integration

### Phase 2: Component Generation & Storybook (Day 3)
- [ ] Generate React components from SVGs
- [ ] Set up Storybook with icon catalog
- [ ] Implement search and filtering
- [ ] Add copy-to-clipboard functionality

### Phase 3: Integration & Polish (Day 4-5)
- [ ] Update ui-kit color tokens
- [ ] Test theme integration
- [ ] Performance optimization
- [ ] Documentation and examples

## Success Criteria

1. **Developer Experience**
   - Simple import syntax
   - Full TypeScript support
   - Excellent tree-shaking
   - Clear documentation

2. **Performance**
   - < 1KB per icon (gzipped)
   - No runtime overhead
   - Optimal bundle size

3. **Consistency**
   - Unified visual style
   - Consistent naming
   - Theme compliance
   - Accessibility standards

4. **Maintainability**
   - Automated generation
   - Easy icon addition
   - Version control friendly
   - Clear contribution process

## Open Questions

1. Should we support icon fonts as an alternative distribution method?
2. Do we need animated icon variants (loading spinners, etc.)?
3. Should we provide a migration tool for existing icon usage?
4. Do we want to support custom icon colors beyond theme tokens?
5. Should we include icon aliases for common alternatives (e.g., trash/delete)?

## Next Steps

1. Review and approve this plan
2. Set up the basic package structure
3. Create the first set of SVG icons
4. Implement the build pipeline
5. Begin integration with ui-kit-react