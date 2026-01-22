# Coding Conventions

**Analysis Date:** 2026-01-19

**Scope:** `/apps/ideate/` and `/packages/ui-kit/`

## Naming Patterns

**Files:**
- Components: PascalCase (e.g., `IdeaCard.tsx`, `Button.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useChatSocket.ts`, `useGlobalKeyboard.ts`)
- Tests: `{filename}.test.{ts,tsx}` colocated with source
- E2E tests: `{feature}.spec.ts` in `/e2e/` directory
- CSS Modules: `{ComponentName}.module.css`
- Contexts: `{Name}Context.tsx`

**Functions:**
- camelCase for all functions
- Event handlers: `handle{Event}` (e.g., `handleDragStart`, `handleKeyDown`)
- Callbacks: `on{Event}` in props (e.g., `onSelect`, `onOpen`, `onSubmit`)
- Boolean getters: `is{Condition}` or `has{Thing}` (e.g., `isAgentRunning`, `hasMessage`)

**Variables:**
- camelCase for local variables
- Prefix refs with `Ref` suffix (e.g., `wsRef`, `reconnectTimeoutRef`, `prevAgentStatusRef`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_VISIBLE_TAGS`, `STORAGE_KEY`)

**Types:**
- Interfaces: PascalCase with descriptive suffixes
  - Props: `{Component}Props` (e.g., `IdeaCardProps`, `ButtonProps`)
  - Context values: `{Name}ContextValue` (e.g., `AuthContextValue`)
  - Options: `{Hook}Options` (e.g., `UseChatSocketOptions`)
  - Return types: `{Hook}Return` (e.g., `UseChatSocketReturn`)
- Type aliases: PascalCase (e.g., `ButtonVariant`, `ColorMode`)

## Code Style

**Formatting:**
- 2 space indentation
- Single quotes for strings (configured via Vite/ESLint)
- Semicolons required
- CSS modules use camelCase convention via Vite config

**Linting:**
- ESLint v9 with TypeScript-ESLint
- React hooks plugin enabled
- React refresh plugin for development

## Import Organization

**Order:**
1. React imports (`import { useState, useCallback } from 'react';`)
2. Type imports from React (`import type { ReactNode } from 'react';`)
3. Third-party libraries (`import { v4 as uuid } from 'uuid';`)
4. Workspace packages (`import { Card, Chip } from '@ui-kit/react';`)
5. Internal utilities/services (`import { createLogger } from '../../utils/clientLogger';`)
6. Types (`import type { IdeaMetadata } from '../../types/idea';`)
7. Styles (`import styles from './IdeaCard.module.css';`)

**Path Aliases:**
- `@ui-kit/react` - UI component library
- `@ui-kit/icons` - Icon components
- `@ui-kit/react-chat` - Chat components
- `@ui-kit/react-markdown` - Markdown rendering
- `@ui-kit/router` - Client-side router
- `@ui-kit/core` - Design tokens and core utilities
- `@claude-flow/data-bus` - Real-time data synchronization

## Error Handling

**Patterns:**
- Try-catch for async operations with logging
- Optional chaining for nested property access
- Nullish coalescing for default values
- Context hooks throw when used outside provider:
```typescript
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

**WebSocket Error Handling:**
```typescript
ws.onerror = (error) => {
  console.error('[Chat] WebSocket error:', error);
  setIsConnecting(false);
};

ws.onmessage = (event) => {
  try {
    const data: ServerMessage = JSON.parse(event.data);
    // Handle message...
  } catch (error) {
    console.error('[Chat] Failed to parse message:', error);
  }
};
```

## Logging

**Framework:** Custom `createLogger` utility that sends logs to server

**Usage Pattern:**
```typescript
import { createLogger } from '../../utils/clientLogger';

const log = createLogger('ComponentName');

log.log('Something happened', { data });
log.warn('Potential issue', { context });
log.error('Operation failed', { error, context });
```

**Tag Naming Convention:**
- Components: `'IdeaDialog'`, `'IdeaCard'`
- Hooks: `'IdeaAgent'`, `'Facilitator'`
- Services: `'WorkspaceDataProvider'`

**Important:** Do not use raw `console.log` in production code; use `createLogger`.

## Comments

**When to Comment:**
- Complex business logic
- Non-obvious behavior
- TODOs with context
- JSDoc for exported functions/components

**JSDoc Pattern:**
```typescript
/**
 * Button component
 *
 * Surfaces used:
 * - control (default variant)
 * - controlPrimary (variant="primary")
 *
 * Tokens used:
 * - --{surface}-bg, --{surface}-bg-hover, --{surface}-bg-pressed
 * - --{surface}-text
 */
export function Button(props: ButtonProps) { ... }
```

**Inline Comments:**
```typescript
// Filter out placeholder title - show "New Idea" instead
const isPlaceholderTitle = !rawTitle || rawTitle === 'Untitled Idea';

// Agent is running if:
// - agentStatus === 'running' (authoritative real-time source from broadcasts)
// - OR if agentStatus is undefined (no broadcast received yet) AND execution has a currentTaskId
```

## Function Design

**Size:** Keep functions focused; extract helpers for complex logic

**Parameters:**
- Destructure props in function signature
- Use options object pattern for hooks with many parameters:
```typescript
export function useChatSocket({
  roomId,
  userId,
  userName,
  userColor,
  onMessage,
  onUserJoin,
  // ...
}: UseChatSocketOptions): UseChatSocketReturn { ... }
```

**Return Values:**
- Components return JSX
- Hooks return object with named properties
- Use `useCallback` for stable function references
- Use `useMemo` only when necessary for performance

## Module Design

**Exports:**
- One primary export per file (plus types)
- Named exports preferred over default exports
- Export types separately using `export type { ... }`

**Component Structure:**
```typescript
// 1. Imports
import { useState, useCallback } from 'react';
import type { ReactNode } from 'react';
// ...

// 2. Types/Interfaces
interface ComponentProps { ... }

// 3. Constants
const MAX_ITEMS = 10;

// 4. Helper functions (if small, otherwise separate file)
function formatDate(date: Date): string { ... }

// 5. Component
export function Component({ prop1, prop2 }: ComponentProps) {
  // State
  const [value, setValue] = useState(null);

  // Derived state
  const isValid = value !== null;

  // Effects
  useEffect(() => { ... }, []);

  // Handlers
  const handleClick = useCallback(() => { ... }, []);

  // Render
  return ( ... );
}
```

**Barrel Files:**
- Avoid barrel files; import directly from component files
- Exception: hooks/index.ts for convenient hook imports

## CSS Conventions

**CSS Modules:**
- Use CSS Modules for component styles: `styles.className`
- Class names in CSS are camelCase (configured in vite.config.ts)
- Use design tokens exclusively - no hardcoded colors

**Token Usage Pattern:**
```css
.button {
  background: var(--primary-bg);
  color: var(--primary-fg);
  border-color: var(--primary-border);
  padding: 0 var(--space-4);
  border-radius: var(--radius-md);
  transition: background-color var(--duration-fast) var(--ease-default);
}

.button:hover:not(:disabled) {
  background: var(--primary-bg-hover);
  border-color: var(--primary-border-hover);
}
```

**Surface-Based Tokens:**
- `--base-*` for default surface
- `--strong-*` for elevated/emphasized elements
- `--primary-*` for primary actions
- `--danger-*` for destructive actions

## React Patterns

**Context Pattern:**
```typescript
const MyContext = createContext<MyContextValue | null>(null);

export function MyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initial);
  const value = useMemo(() => ({ state, setState }), [state]);
  return <MyContext.Provider value={value}>{children}</MyContext.Provider>;
}

export function useMyContext() {
  const ctx = useContext(MyContext);
  if (!ctx) throw new Error('useMyContext must be used within MyProvider');
  return ctx;
}
```

**WebSocket Hook Pattern:**
```typescript
export function useWebSocket(options: Options) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;
    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => {
      setIsConnected(false);
      // Reconnect logic
    };
  }, [url]);

  useEffect(() => {
    connect();
    return () => wsRef.current?.close();
  }, [connect]);

  const send = useCallback((data: unknown) => {
    wsRef.current?.send(JSON.stringify(data));
  }, []);

  return { isConnected, send };
}
```

**Component Props Pattern:**
```typescript
interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: ReactNode;
}

// Union type for polymorphic component
export type ButtonProps = ButtonAsButtonProps | ButtonAsAnchorProps;
```

## UI Component Guidelines

**Button Component:**
- Use `icon` prop for leading icon: `<Button icon={<MyIcon />}>Label</Button>`
- Use `IconButton` for icon-only buttons (not Button with just icon child)
- Prefer default size; only use `size="sm"` when space is constrained

**Dialogs:**
- Use `ConfirmDialog` component - never use native `alert()`, `confirm()`, or `prompt()`
- Include `variant="danger"` for destructive actions

**Cards:**
- Use `Card` component with `selected` prop for selection state
- Include `data-testid` for testing

---

*Convention analysis: 2026-01-19*
