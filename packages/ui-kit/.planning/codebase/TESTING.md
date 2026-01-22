# Testing Patterns

**Analysis Date:** 2026-01-17

## Test Framework

**Runner:**
- Vitest 3.2.4
- Each subpackage has its own test configuration or uses defaults
- Config example: `router/vitest.config.ts`

**Assertion Library:**
- Vitest built-in assertions (`expect`)
- `@testing-library/jest-dom` for DOM assertions

**Run Commands:**
```bash
# Run tests in specific package
cd packages/ui-kit/react && pnpm test       # Run all tests
cd packages/ui-kit/react && pnpm test:watch # Watch mode

# Run tests for all ui-kit packages (from monorepo root)
pnpm test
```

## Test File Organization

**Location:**
- Co-located with source files
- Tests live in same directory as component

**Naming:**
- `ComponentName.test.tsx` for component tests
- `hookName.test.ts` for hook tests
- `utilityName.test.ts` for utility tests

**Structure:**
```
react/src/components/CopyButton/
├── CopyButton.tsx
├── CopyButton.test.tsx
├── CopyButton.stories.tsx
├── CopyButton.module.css
└── index.ts
```

**Multiple test files allowed:**
```
react-chat/src/components/ChatInput/
├── ChatInput.tsx
├── ChatInput.test.tsx          # Main component tests
├── ChatInput.focus.test.tsx    # Focus-specific tests
├── useChatEditor.test.ts       # Hook tests
└── useMessageHistory.test.ts   # Hook tests
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CopyButton } from './CopyButton';

describe('CopyButton', () => {
  describe('rendering', () => {
    it('renders as icon-only button when no children', () => {
      render(<CopyButton content="test" aria-label="Copy text" />);
      expect(screen.getByRole('button', { name: 'Copy text' })).toBeInTheDocument();
    });
  });

  describe('copy functionality', () => {
    it('copies static content to clipboard', async () => {
      // test implementation
    });
  });

  describe('disabled state', () => {
    // tests
  });
});
```

**Patterns:**
- Group tests by feature/behavior in nested `describe` blocks
- Use descriptive test names starting with action verb
- Setup in `beforeEach`, cleanup in `afterEach`
- One assertion focus per test (multiple related assertions OK)

## Mocking

**Framework:** Vitest `vi` module

**Patterns:**
```typescript
// Mock external APIs
const mockClipboard = {
  writeText: vi.fn(),
};

beforeEach(() => {
  Object.assign(navigator, {
    clipboard: mockClipboard,
  });
  mockClipboard.writeText.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.clearAllMocks();
});
```

**Mock callbacks:**
```typescript
const onSubmit = vi.fn();
render(<ChatInput onSubmit={onSubmit} />);

// Assert callback was called
expect(onSubmit).toHaveBeenCalledWith({
  content: 'Hello world',
  images: [],
});

// Mock return values
const getContent = vi.fn().mockReturnValue('Dynamic content');
const getContentAsync = vi.fn().mockResolvedValue('Async content');
```

**Timer mocking:**
```typescript
it('shows copied state after successful copy', async () => {
  vi.useFakeTimers();

  render(<CopyButton content="test" aria-label="Copy" />);
  fireEvent.click(screen.getByRole('button'));

  await waitFor(() => {
    expect(mockClipboard.writeText).toHaveBeenCalled();
  });

  vi.useRealTimers();
});
```

**What to Mock:**
- Browser APIs (clipboard, history, localStorage)
- External dependencies
- Callbacks/handlers passed as props
- Time-based operations

**What NOT to Mock:**
- Internal component logic
- CSS modules (they work automatically)
- Child components (test integration)

## Fixtures and Factories

**Test Data:**
```typescript
// Inline test data
const file = new File(['test'], 'test.png', { type: 'image/png' });

// Helper functions for complex data
function createImagePasteEvent(file: File) {
  const clipboardData = {
    items: [{ type: 'image/png', getAsFile: () => file }],
  };
  return new ClipboardEvent('paste', {
    clipboardData: clipboardData as unknown as DataTransfer,
    bubbles: true,
  });
}

// Test components
function Home() {
  return <div data-testid="home">Home Page</div>;
}

function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  return <div data-testid="user-profile">User: {userId}</div>;
}
```

**Location:**
- Helper functions defined at top of test file
- Test components defined within test file
- No separate fixtures directory (inline preferred)

## Coverage

**Requirements:** None enforced (uses `--passWithNoTests` flag)

**View Coverage:**
```bash
cd packages/ui-kit/react && pnpm test -- --coverage
```

## Test Types

**Unit Tests:**
- Test individual components in isolation
- Focus on props, user interactions, and rendered output
- Use React Testing Library for component rendering

**Hook Tests:**
```typescript
import { renderHook, act, waitFor } from '@testing-library/react';

describe('useChatEditor', () => {
  it('returns a TipTap editor instance', async () => {
    const { result } = renderHook(() => useChatEditor());

    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });

    expect(result.current?.isEditable).toBe(true);
  });

  it('can set content', async () => {
    const { result } = renderHook(() => useChatEditor());

    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });

    act(() => {
      result.current?.commands.setContent('Hello world');
    });

    expect(result.current?.getText()).toBe('Hello world');
  });
});
```

**Integration Tests:**
- Test component interactions (Router with Routes, Link navigation)
- Test composition of multiple components

**E2E Tests:**
- Not present in ui-kit packages
- Main app uses Playwright (see `apps/v1/client`)

## Setup Files

**Router package setup (`router/src/test-setup.ts`):**
```typescript
import '@testing-library/jest-dom';

// Mock window.history methods
const originalPushState = window.history.pushState;
const originalReplaceState = window.history.replaceState;

beforeEach(() => {
  // Reset URL to root before each test
  window.history.pushState({}, '', '/');
});

afterEach(() => {
  // Restore original methods
  window.history.pushState = originalPushState;
  window.history.replaceState = originalReplaceState;
});
```

**Vitest config with setup:**
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
});
```

## Common Patterns

**Async Testing:**
```typescript
it('calls onSubmit when Enter is pressed', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  render(<ChatInput onSubmit={onSubmit} />);

  const editor = screen.getByRole('textbox');
  await user.click(editor);
  await user.type(editor, 'Hello world');
  await user.keyboard('{Enter}');

  expect(onSubmit).toHaveBeenCalledWith({
    content: 'Hello world',
    images: [],
  });
});

// With waitFor for async state updates
await waitFor(() => {
  expect(onSubmit).toHaveBeenCalled();
});
```

**User Events:**
```typescript
const user = userEvent.setup();

// Click
await user.click(element);

// Type text
await user.type(editor, 'Hello world');

// Keyboard shortcuts
await user.keyboard('{Enter}');
await user.keyboard('{Control>}{Enter}{/Control}');
await user.keyboard('{Escape}');

// Hover (for tooltips)
await user.hover(element);
```

**DOM Assertions:**
```typescript
// Element presence
expect(screen.getByRole('button')).toBeInTheDocument();
expect(screen.queryByTestId('home')).not.toBeInTheDocument();

// Attributes
expect(element).toHaveAttribute('href', '/about');
expect(element).toHaveAttribute('contenteditable', 'false');

// Classes
expect(element).toHaveClass(styles.active);
expect(element).not.toHaveClass(styles.disabled);

// Text content
expect(element).toHaveTextContent('User: 123');
expect(editor.textContent).toContain('First line');

// Disabled state
expect(screen.getByRole('button')).toBeDisabled();
```

**Error Testing:**
```typescript
it('throws when used outside Router', () => {
  function BadComponent() {
    useNavigate();
    return null;
  }

  expect(() => render(<BadComponent />)).toThrow('useNavigate must be used within a Router');
});

it('calls onError callback when copy fails', async () => {
  const onError = vi.fn();
  mockClipboard.writeText.mockRejectedValue(new Error('Copy failed'));

  render(<CopyButton content="test" onError={onError} aria-label="Copy" />);
  fireEvent.click(screen.getByRole('button'));

  await waitFor(() => {
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });
});
```

**Conditional Tests:**
```typescript
// Skip tests based on environment
const hasDom = typeof document !== 'undefined';

it.skipIf(!hasDom)('injects style element into document head', () => {
  injectSurfaceStyles();
  const style = document.getElementById('dynamic-surface-styles');
  expect(style).not.toBeNull();
});
```

**Testing Rerender:**
```typescript
it('updates onEnterKey ref when callback changes', async () => {
  const onEnterKey1 = vi.fn().mockReturnValue(true);
  const onEnterKey2 = vi.fn().mockReturnValue(false);

  const { result, rerender } = renderHook(
    (props: UseChatEditorOptions) => useChatEditor(props),
    { initialProps: { onEnterKey: onEnterKey1 } }
  );

  await waitFor(() => {
    expect(result.current).not.toBeNull();
  });

  rerender({ onEnterKey: onEnterKey2 });
  expect(result.current).toBeDefined();
});
```

## Test Data IDs

**Pattern:** Use `data-testid` for test-only selectors
```tsx
<div data-testid="home">Home Page</div>
<span data-testid="pathname">{location.pathname}</span>
```

**Query by testid:**
```typescript
expect(screen.getByTestId('home')).toBeInTheDocument();
expect(screen.getByTestId('user-profile')).toHaveTextContent('User: 123');
```

---

*Testing analysis: 2026-01-17*
