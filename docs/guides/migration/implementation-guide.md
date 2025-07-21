# Claude Flow Implementation Guide

## Overview

This guide provides practical steps to implement the architectures defined in our specification documents. It focuses on bridging the gap between the current Tailwind-based codebase and the target CSS Modules + @layer architecture.

## Current State vs Target State

### Current Implementation

- **Styling**: Tailwind CSS utilities
- **State**: React Context API (multiple contexts)
- **Real-time**: EventSource (SSE) with manual event handling
- **Components**: JSX with inline Tailwind classes
- **Build**: Vite with single app bundle

### Target Implementation

- **Styling**: CSS Modules + @layer
- **State**: Zustand stores with DataBus pattern
- **Real-time**: uWebSockets.js with automatic store sync
- **Components**: Design system package with Storybook
- **Build**: Lage orchestration with pnpm workspaces

## Implementation Phases

### Phase 1: Foundation Setup (Week 1)

#### 1.1 Create Monorepo Structure

```bash
# From project root
mkdir -p packages/{apps,shared,tools}
mkdir -p packages/shared/design-system
mkdir -p packages/shared/data-bus
mkdir -p packages/shared/stores
mkdir -p packages/tools/scripts

# Move existing app
mv src packages/apps/claude-flow
mv server packages/apps/claude-flow-server
```

#### 1.2 Setup pnpm Workspaces

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/apps/*'
  - 'packages/shared/*'
  - 'packages/tools/*'
```

#### 1.3 Configure Lage

```json
// lage.config.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "lib/**"]
    },
    "test": {
      "dependsOn": ["build"]
    },
    "lint": {
      "dependsOn": []
    },
    "dev": {
      "dependsOn": ["^build"],
      "cache": false
    }
  }
}
```

### Phase 2: Design System Migration (Week 2-3)

#### 2.1 Create Design System Package

```bash
cd packages/shared/design-system
pnpm init
```

```json
// packages/shared/design-system/package.json
{
  "name": "@claude-flow/design-system",
  "version": "0.1.0",
  "main": "./lib/index.js",
  "module": "./lib/index.mjs",
  "types": "./lib/index.d.ts",
  "exports": {
    ".": {
      "import": "./lib/index.mjs",
      "require": "./lib/index.js",
      "types": "./lib/index.d.ts"
    },
    "./styles": "./lib/styles/index.css"
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}
```

#### 2.2 Migrate First Component (Button)

1. **Extract existing Button component**:

```tsx
// Current: src/components/ui/Button.tsx (Tailwind)
// Copy to: packages/shared/design-system/src/components/Button/Button.tsx
```

2. **Create CSS Module**:

```css
/* packages/shared/design-system/src/components/Button/Button.module.css */
@layer base, variants, state, theme;

@layer base {
  .button {
    /* Base styles extracted from Tailwind classes */
    appearance: none;
    border: none;
    font: inherit;
    cursor: pointer;

    /* From Tailwind's px-4 py-2 */
    padding: 0.5rem 1rem;

    /* From Tailwind's rounded-md */
    border-radius: 0.375rem;

    /* From Tailwind's font-medium */
    font-weight: 500;

    /* Transition */
    transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);

    /* Flex layout */
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }
}

@layer variants {
  /* Primary - from bg-blue-600 text-white */
  .primary {
    background-color: #2563eb;
    color: #ffffff;
  }

  .primary:hover {
    background-color: #1d4ed8;
  }

  /* Secondary - from bg-gray-200 text-gray-900 */
  .secondary {
    background-color: #e5e7eb;
    color: #111827;
  }

  .secondary:hover {
    background-color: #d1d5db;
  }

  /* Sizes */
  .sm {
    padding: 0.375rem 0.75rem;
    font-size: 0.875rem;
  }

  .lg {
    padding: 0.625rem 1.5rem;
    font-size: 1.125rem;
  }
}

@layer state {
  .button:focus-visible {
    outline: 2px solid #2563eb;
    outline-offset: 2px;
  }

  .button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
```

3. **Update component**:

```tsx
// packages/shared/design-system/src/components/Button/Button.tsx
import { forwardRef } from 'react';
import { cn } from '@claude-flow/utils';
import styles from './Button.module.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      className,
      children,
      disabled,
      loading,
      leftIcon,
      rightIcon,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(styles.button, styles[variant], size !== 'md' && styles[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {leftIcon}
        {children}
        {rightIcon}
        {loading && <Spinner className={styles.spinner} />}
      </button>
    );
  }
);
```

#### 2.3 Setup CSS Token System

```css
/* packages/shared/design-system/src/styles/tokens.css */
@layer design-system.tokens {
  :root {
    /* Colors - matching Tailwind defaults for migration */
    --color-blue-50: #eff6ff;
    --color-blue-100: #dbeafe;
    --color-blue-200: #bfdbfe;
    --color-blue-300: #93c5fd;
    --color-blue-400: #60a5fa;
    --color-blue-500: #3b82f6;
    --color-blue-600: #2563eb;
    --color-blue-700: #1d4ed8;
    --color-blue-800: #1e40af;
    --color-blue-900: #1e3a8a;

    /* Semantic tokens */
    --color-primary: var(--color-blue-600);
    --color-primary-hover: var(--color-blue-700);
    --color-primary-foreground: white;

    /* Spacing */
    --spacing-1: 0.25rem;
    --spacing-2: 0.5rem;
    --spacing-3: 0.75rem;
    --spacing-4: 1rem;
    --spacing-5: 1.25rem;
    --spacing-6: 1.5rem;
    --spacing-8: 2rem;

    /* Radius */
    --radius-sm: 0.125rem;
    --radius-md: 0.375rem;
    --radius-lg: 0.5rem;

    /* Transitions */
    --duration-150: 150ms;
    --duration-300: 300ms;
    --ease-out: cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Dark mode tokens */
  [data-theme='dark'] {
    --color-primary: var(--color-blue-500);
    --color-primary-hover: var(--color-blue-400);
  }
}
```

### Phase 3: State Management Migration (Week 3-4)

#### 3.1 Create Store Package

```bash
cd packages/shared/stores
pnpm init
pnpm add zustand
```

#### 3.2 Migrate AuthContext to Zustand

```typescript
// packages/shared/stores/src/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
          });

          if (!response.ok) throw new Error('Login failed');

          const user = await response.json();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        set({ user: null, isAuthenticated: false });

        // Clear other stores
        useWorkspaceStore.getState().reset();
        useProjectStore.getState().reset();
      },

      checkAuth: async () => {
        try {
          const response = await fetch('/api/auth/check');
          if (response.ok) {
            const user = await response.json();
            set({ user, isAuthenticated: true, isLoading: false });
          } else {
            set({ user: null, isAuthenticated: false, isLoading: false });
          }
        } catch {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      updateUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
```

#### 3.3 Create DataBus Service

```typescript
// packages/shared/data-bus/src/index.ts
import { EventEmitter } from 'events';

interface Subscription {
  unsubscribe: () => void;
}

export class DataBus extends EventEmitter {
  private ws: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private subscriptions = new Map<string, Set<Function>>();

  connect(userId: string) {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${window.location.host}/ws?userId=${userId}`;

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('DataBus connected');
      this.emit('connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('DataBus disconnected');
      this.emit('disconnected');
      this.scheduleReconnect(userId);
    };
  }

  private handleMessage(message: any) {
    const { type, data } = message;

    // Emit to specific subscribers
    const subscribers = this.subscriptions.get(type);
    if (subscribers) {
      subscribers.forEach((callback) => callback(data));
    }

    // Emit global event
    this.emit('message', message);
  }

  subscribe<T>(pattern: string, callback: (data: T) => void): Subscription {
    if (!this.subscriptions.has(pattern)) {
      this.subscriptions.set(pattern, new Set());
    }

    this.subscriptions.get(pattern)!.add(callback);

    return {
      unsubscribe: () => {
        const subs = this.subscriptions.get(pattern);
        if (subs) {
          subs.delete(callback);
          if (subs.size === 0) {
            this.subscriptions.delete(pattern);
          }
        }
      },
    };
  }

  private scheduleReconnect(userId: string) {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);

    this.reconnectTimeout = setTimeout(() => {
      this.connect(userId);
    }, 3000);
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const dataBus = new DataBus();
```

### Phase 4: Component Migration Strategy (Week 4-5)

#### 4.1 Migration Order

1. **Core UI Components** (Week 4)
   - Button ✓
   - Input
   - Toggle
   - Checkbox
   - Select

2. **Layout Components** (Week 4)
   - Layout → AppShell
   - ThemedLayout → Remove (use CSS variables)
   - Portal (keep as-is)

3. **Feedback Components** (Week 5)
   - Toast (create new)
   - ConfirmDialog
   - LoadingSpinner → ProgressSpinner

4. **Complex Components** (Week 5)
   - ChatBubble
   - ClaudeMessage
   - ToolExecution

#### 4.2 Component Migration Pattern

For each component:

1. **Extract Tailwind classes to CSS Module**
2. **Replace dynamic classes with CSS variables**
3. **Add proper TypeScript types**
4. **Create Storybook story**
5. **Update imports in app**

Example migration:

```tsx
// Before (Tailwind)
<div className={`px-4 py-2 rounded-md ${isDark ? 'bg-gray-800' : 'bg-white'}`}>

// After (CSS Module)
<div className={styles.card} data-theme={theme}>
```

```css
.card {
  padding: var(--spacing-4) var(--spacing-2);
  border-radius: var(--radius-md);
  background-color: var(--color-background);
}
```

### Phase 5: Integration & Testing (Week 6)

#### 5.1 Update Build Pipeline

```json
// root package.json
{
  "scripts": {
    "build": "lage build",
    "test": "lage test",
    "dev": "lage dev --to=@claude-flow/app",
    "storybook": "pnpm --filter @claude-flow/design-system storybook"
  }
}
```

#### 5.2 Create Migration Shim

During migration, create a shim to use both systems:

```tsx
// packages/apps/claude-flow/src/components/ButtonShim.tsx
import { Button as NewButton } from '@claude-flow/design-system';
import { Button as OldButton } from './ui/Button';

export function Button(props: any) {
  // Use feature flag or env variable
  if (process.env.VITE_USE_NEW_DESIGN_SYSTEM === 'true') {
    return <NewButton {...props} />;
  }
  return <OldButton {...props} />;
}
```

#### 5.3 Progressive Migration

1. **Start with new features** - Use design system for new components
2. **Migrate page by page** - Convert one page at a time
3. **Run both systems** - Gradually phase out Tailwind
4. **Remove Tailwind** - Once all components migrated

## Quick Start Commands

```bash
# 1. Setup monorepo
mkdir -p packages/{apps,shared,tools}
mv src packages/apps/claude-flow
mv server packages/apps/claude-flow-server

# 2. Install dependencies
pnpm add -D lage tsup @storybook/react vite

# 3. Create design system
cd packages/shared/design-system
pnpm init
pnpm add react react-dom
pnpm add -D @types/react typescript

# 4. Start migrating components
# Copy Button.tsx to design-system
# Create Button.module.css
# Update imports

# 5. Run Storybook
pnpm storybook
```

## Migration Checklist

### Week 1: Foundation

- [ ] Create monorepo structure
- [ ] Setup pnpm workspaces
- [ ] Configure Lage
- [ ] Create base packages

### Week 2: Design System

- [ ] Setup design system package
- [ ] Create token system
- [ ] Migrate Button component
- [ ] Setup Storybook

### Week 3: Core Components

- [ ] Migrate form components
- [ ] Create missing components
- [ ] Document component APIs
- [ ] Add visual tests

### Week 4: State Management

- [ ] Setup Zustand stores
- [ ] Create DataBus service
- [ ] Migrate auth state
- [ ] Connect stores to DataBus

### Week 5: Integration

- [ ] Update app to use new components
- [ ] Migrate page layouts
- [ ] Test real-time updates
- [ ] Performance optimization

### Week 6: Cleanup

- [ ] Remove old components
- [ ] Remove Tailwind
- [ ] Update documentation
- [ ] Final testing

## Common Issues & Solutions

### Issue: CSS Module styles not applying

**Solution**: Ensure Vite is configured for CSS Modules:

```js
// vite.config.js
export default {
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
};
```

### Issue: TypeScript errors with CSS Modules

**Solution**: Create type declarations:

```ts
// src/types/css-modules.d.ts
declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}
```

### Issue: Storybook not loading CSS

**Solution**: Import tokens in preview:

```js
// .storybook/preview.js
import '@claude-flow/design-system/styles';
```

### Issue: Dark mode not working

**Solution**: Ensure data-theme attribute is set:

```tsx
useEffect(() => {
  document.documentElement.setAttribute('data-theme', theme);
}, [theme]);
```

## Resources

- [CSS Modules Docs](https://github.com/css-modules/css-modules)
- [Lage Docs](https://microsoft.github.io/lage/)
- [Zustand Docs](https://github.com/pmndrs/zustand)
- [Storybook Docs](https://storybook.js.org/)

## Next Steps

1. **Review specifications** with team
2. **Create migration branch**
3. **Start with Week 1 tasks**
4. **Set up CI/CD for monorepo**
5. **Plan rollout strategy**
