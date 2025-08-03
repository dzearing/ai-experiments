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

Build tasks in `tools/repo-scripts/src/tasks/`:
```
tools/repo-scripts/src/tasks/
├── optimize-icons.ts      # SVG optimization task
├── generate-icons.ts      # Generate React components from SVGs
└── build-icons.ts         # Build icon package (calls other tasks)
```

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

#### Color Token Updates for ui-kit
```css
/* Add to ui-kit color tokens */
:root {
  /* Icon-specific color contexts */
  --color-icon-primary: var(--color-text);
  --color-icon-secondary: var(--color-text-secondary);
  --color-icon-disabled: var(--color-text-disabled);
  --color-icon-success: var(--color-success);
  --color-icon-warning: var(--color-warning);
  --color-icon-error: var(--color-error);
  --color-icon-info: var(--color-info);
  --color-icon-interactive: var(--color-primary);
  --color-icon-interactive-hover: var(--color-primary-hover);
}
```

#### Usage in Components
```tsx
// Example usage in ui-kit-react
import { SaveIcon } from '@claude-flow/ui-kit-icons';

// Simple usage
<SaveIcon />

// With custom size and styling
<SaveIcon 
  size={20} 
  className="text-icon-primary hover:text-icon-interactive-hover"
/>

// With accessibility title
<SaveIcon title="Save document" />
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

### 1. Storybook Stories

- Icon gallery showing all available icons
- Interactive size and color controls
- Theme switching demonstration
- Copy-to-clipboard for import statements

### 2. README Documentation

- Installation instructions
- Usage examples (SVG and React)
- Contribution guidelines
- Icon design principles

## Timeline and Phases

### Phase 1: Foundation (Week 1)
- [ ] Set up package structure
- [ ] Create build scripts
- [ ] Implement base Icon component
- [ ] Add 10-15 essential icons

### Phase 2: Core Icons (Week 2)
- [ ] Add all Priority 1 icons
- [ ] Set up Storybook
- [ ] Implement theme integration
- [ ] Create documentation

### Phase 3: Integration (Week 3)
- [ ] Update ui-kit color tokens
- [ ] Integrate with ui-kit-react components
- [ ] Add IconButton component
- [ ] Migration guide for existing icons

### Phase 4: Polish (Week 4)
- [ ] Complete icon set
- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] Release preparation

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