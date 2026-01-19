# Testing Patterns

**Analysis Date:** 2026-01-19

**Scope:** `/apps/ideate/` and `/packages/ui-kit/`

## Test Framework

**Runner:**
- Vitest 3.2.x (unit/integration tests)
- Playwright 1.53.x (e2e tests)

**Config Files:**
- Unit tests: `vite.config.ts` (test section) at `/apps/ideate/client/vite.config.ts`
- E2E tests: `playwright.config.ts` at `/apps/ideate/client/playwright.config.ts`
- Test setup: `/apps/ideate/client/test-setup.ts`

**Assertion Libraries:**
- Vitest built-in `expect`
- `@testing-library/jest-dom` for DOM assertions
- Playwright assertions for e2e

**Run Commands:**
```bash
# Run all unit tests
pnpm test

# Watch mode
pnpm test:watch

# E2E tests (requires dev server running)
pnpm test:e2e

# E2E tests with UI
pnpm test:e2e:ui
```

## Test File Organization

**Location:**
- Unit/integration tests: Colocated with source files
- E2E tests: `/apps/ideate/client/e2e/`

**Naming:**
- Unit tests: `{ComponentName}.test.tsx` or `{hookName}.test.ts`
- E2E tests: `{feature-name}.spec.ts`

**Structure:**
```
apps/ideate/client/
├── src/
│   ├── components/
│   │   └── FacilitatorOverlay/
│   │       ├── FacilitatorOverlay.tsx
│   │       ├── FacilitatorOverlay.test.tsx  # Unit test
│   │       └── FacilitatorOverlay.module.css
│   ├── contexts/
│   │   ├── FacilitatorContext.tsx
│   │   └── FacilitatorContext.test.tsx      # Context test
│   └── hooks/
│       ├── useExecutionAgent.ts
│       └── useExecutionAgent.test.ts        # Hook test
└── e2e/
    ├── chat-lifecycle.spec.ts               # E2E test
    ├── document-lifecycle.spec.ts
    └── workspace-sync.spec.ts
```

## Test Structure

**Unit Test Organization:**
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Component } from './Component';

describe('Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('renders with default props', () => {
      render(<Component />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onClick when clicked', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<Component onClick={onClick} />);

      await user.click(screen.getByRole('button'));

      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });
});
```

**Hook Test Organization:**
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMyHook } from './useMyHook';

describe('useMyHook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('returns correct initial state', () => {
      const { result } = renderHook(() => useMyHook(options));

      expect(result.current.value).toBe(null);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('actions', () => {
    it('updates state when action is called', () => {
      const { result } = renderHook(() => useMyHook(options));

      act(() => {
        result.current.doSomething();
      });

      expect(result.current.value).toBe('updated');
    });
  });
});
```

**E2E Test Organization:**
```typescript
import { test, expect, type Page } from '@playwright/test';

// Helper functions at top
async function signIn(page: Page, user: User) {
  await page.addInitScript((userData) => {
    localStorage.setItem('ideate-user', JSON.stringify(userData));
  }, user);
}

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await clearIndexedDB(page);
    await signIn(page);
  });

  test('performs expected action', async ({ page }) => {
    await page.goto('/route');
    await expect(page.locator('selector')).toBeVisible();
  });
});
```

## Mocking

**Framework:** Vitest's built-in mocking (`vi.mock`, `vi.fn`, `vi.spyOn`)

**Module Mocking Pattern:**
```typescript
// Mock an entire module
vi.mock('../../hooks/useFacilitatorSocket', () => ({
  useFacilitatorSocket: () => ({
    sendMessage: vi.fn(),
    isConnected: true,
  }),
}));

// Mock a config module
vi.mock('../config', () => ({
  EXECUTION_AGENT_WS_URL: 'ws://localhost:3002/execution-agent',
}));
```

**WebSocket Mocking Pattern:**
```typescript
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  static instances: MockWebSocket[] = [];

  readyState = MockWebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;

  send = vi.fn();
  close = vi.fn(() => {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  });

  constructor() {
    MockWebSocket.instances.push(this);
  }

  simulateOpen() {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.();
  }

  simulateMessage(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) } as MessageEvent);
  }

  static clearInstances() {
    MockWebSocket.instances = [];
  }

  static getLatest(): MockWebSocket | undefined {
    return MockWebSocket.instances[MockWebSocket.instances.length - 1];
  }
}

// Replace global WebSocket in tests
const OriginalWebSocket = global.WebSocket;
beforeEach(() => {
  global.WebSocket = MockWebSocket as unknown as typeof WebSocket;
});
afterEach(() => {
  global.WebSocket = OriginalWebSocket;
});
```

**What to Mock:**
- WebSocket connections
- External API calls
- Browser APIs not available in jsdom (matchMedia, ResizeObserver, IntersectionObserver)
- localStorage/sessionStorage for isolation
- Timers with `vi.useFakeTimers()`

**What NOT to Mock:**
- React components being tested
- Internal utility functions (test them directly)
- CSS Module imports (let them work naturally)

## Test Setup (Global Mocks)

**Location:** `/apps/ideate/client/test-setup.ts`

```typescript
import '@testing-library/jest-dom/vitest';

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback: FrameRequestCallback) => {
  return setTimeout(() => callback(performance.now()), 0) as unknown as number;
};

global.cancelAnimationFrame = (id: number) => {
  clearTimeout(id);
};

// Mock matchMedia for theme detection
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverMock;

// Mock IntersectionObserver
class IntersectionObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.IntersectionObserver = IntersectionObserverMock as unknown as typeof IntersectionObserver;

// Mock scrollIntoView
Element.prototype.scrollIntoView = function() {};
```

## Fixtures and Factories

**Test Data Patterns:**
```typescript
// Define test data at module level
const TEST_USER = {
  id: 'user-chat-test-12345',
  name: 'Chat Test User',
  avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Chat%20Test',
};

const defaultOptions: UseExecutionAgentOptions = {
  ideaId: 'test-idea-id',
  userId: 'test-user-id',
  userName: 'Test User',
  enabled: true,
};

const mockPlan = {
  phases: [{
    id: 'phase-1',
    title: 'Phase 1',
    tasks: [{ id: 'task-1', title: 'Task 1', completed: false }],
  }],
  workingDirectory: '/tmp/test-workspace',
  createdAt: '2024-01-01T00:00:00.000Z',
};
```

**Test Wrapper Pattern:**
```typescript
const TestWrapper = ({ children }: { children: ReactNode }) => (
  <FacilitatorProvider>{children}</FacilitatorProvider>
);

// Usage
const { result } = renderHook(() => useFacilitator(), { wrapper: TestWrapper });
```

## Coverage

**Requirements:** No enforced threshold currently

**View Coverage:**
```bash
pnpm test -- --coverage
```

## Test Types

**Unit Tests:**
- Test individual components in isolation
- Test hooks with `renderHook`
- Test utility functions directly
- Located: Colocated with source files

**Integration Tests:**
- Test components with their context providers
- Test hook interactions
- Located: Colocated with source files

**E2E Tests:**
- Full user flow testing through the browser
- Multi-user scenarios (chat sync, collaboration)
- Located: `/apps/ideate/client/e2e/`

## Common Testing Patterns

**Async Testing:**
```typescript
it('handles async operation', async () => {
  const user = userEvent.setup();
  render(<Component />);

  await user.click(screen.getByRole('button'));

  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument();
  });
});
```

**Testing State Changes:**
```typescript
it('updates state correctly', () => {
  const { result } = renderHook(() => useFacilitator(), { wrapper });

  act(() => {
    result.current.open();
  });

  expect(result.current.isOpen).toBe(true);
});
```

**Testing Keyboard Events:**
```typescript
it('responds to keyboard shortcut', () => {
  const { result } = renderHook(() => useGlobalKeyboard({ key: 'a', onTrigger }));

  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'a',
      bubbles: true,
      cancelable: true,
    }));
  });

  expect(onTrigger).toHaveBeenCalledTimes(1);
});
```

**Testing Error Scenarios:**
```typescript
it('throws error when used outside provider', () => {
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  expect(() => {
    renderHook(() => useFacilitator());
  }).toThrow('useFacilitator must be used within a FacilitatorProvider');

  consoleSpy.mockRestore();
});
```

**E2E Wait Patterns:**
```typescript
// Wait for element to appear
await expect(page.locator('[data-status="connected"]')).toBeVisible({ timeout: 10000 });

// Wait for navigation
await page.waitForURL(/\/workspace\/.+/, { timeout: 10000 });

// Polling assertion
await expect(async () => {
  const found = await hasMessage(page, testMessage);
  expect(found).toBe(true);
}).toPass({ timeout: 5000 });
```

**Multi-User E2E Testing:**
```typescript
test('two users can chat in real-time', async ({ browser }) => {
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();

  const page1 = await context1.newPage();
  const page2 = await context2.newPage();

  // Set up auth for both contexts
  await context1.addInitScript((user) => {
    localStorage.setItem('ideate-user', JSON.stringify(user));
  }, TEST_USER);

  try {
    // Test interaction between users...
  } finally {
    await context1.close();
    await context2.close();
  }
});
```

## Playwright E2E Configuration

**Key Settings:**
```typescript
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,        // Sequential for collaborative tests
  workers: 1,                   // Single worker for consistency
  timeout: 30000,               // 30s per test
  expect: { timeout: 10000 },   // 10s for assertions

  use: {
    baseURL: 'http://localhost:5190',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [{
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
  }],
});
```

**Note:** Dev server must be running before E2E tests (`pnpm dev`)

## Testing ui-kit Components

**Pattern for ui-kit/react:**
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BusyIndicator } from './BusyIndicator';

describe('BusyIndicator', () => {
  it('renders correctly', () => {
    render(<BusyIndicator />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has correct ARIA attributes', () => {
    render(<BusyIndicator label="AI is thinking" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'AI is thinking');
  });

  it('supports custom className', () => {
    const { container } = render(<BusyIndicator className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
```

**Testing CSS Module Classes:**
```typescript
import styles from './ChatInput.module.css';

it('applies error class', () => {
  const { container } = render(<ChatInput error />);
  expect(container.firstChild).toHaveClass(styles.error);
});
```

---

*Testing analysis: 2026-01-19*
