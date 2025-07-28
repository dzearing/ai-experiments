# Coding Conventions

This guide defines the coding standards and conventions for the Claude Flow monorepo. Following these conventions ensures consistency, maintainability, and readability across the codebase.

## General Principles

- **Clarity over cleverness** - Write code that is easy to understand
- **Consistency** - Follow existing patterns in the codebase
- **Type safety** - Leverage TypeScript to catch errors early
- **Testability** - Write code that is easy to test
- **Performance** - Consider performance implications, but don't optimize prematurely

## File Organization

### File Naming

- **Components**: PascalCase - `Button.tsx`, `UserProfile.tsx`
- **Utilities/Hooks**: camelCase - `formatDate.ts`, `useAuth.ts`
- **Constants**: camelCase - `constants.ts`, `config.ts`
- **Types/Interfaces**: PascalCase - `User.ts`, `ApiResponse.ts`
- **Test files**: Same name with `.test.ts` - `Button.test.tsx`
- **Stories**: Same name with `.stories.ts` - `Button.stories.tsx`

### Directory Structure

```typescript
// ❌ Avoid: Deeply nested structures
src / components / forms / inputs / text / validated / EmailInput.tsx;

// ✅ Prefer: Flatter structure
src / components / EmailInput / EmailInput.tsx;
```

### File Length

- **Hard limit**: Files must be under 500 lines
- **Target**: Keep files under 300 lines when possible
- If a file approaches 500 lines, refactor into:
  - Separate components
  - Utility functions
  - Custom hooks
  - Type definitions
  - Smaller modules

```typescript
// ❌ Avoid: Files over 500 lines
// ✅ Good: Split into smaller, focused files
```

### Module Exports

- **One primary export per file** (plus related type exports)
- **No default exports** - Always use named exports
- **Colocate types** with their implementations

```typescript
// ❌ Avoid: Default exports
export default function Button() {}

// ❌ Avoid: Multiple unrelated exports
export function Button() {}
export function Card() {}

// ✅ Good: Single named export with related types
export interface ButtonProps {}
export function Button(props: ButtonProps) {}

// ✅ Good: Re-export pattern
export { Button } from './Button';
export type { ButtonProps } from './Button';
```

### Why No Default Exports?

1. **Consistency**: Named exports enforce consistent naming across imports
2. **Refactoring**: Easier to refactor with IDE tools
3. **Tree shaking**: Better support for dead code elimination
4. **Clarity**: Import statements clearly show what's being imported

## TypeScript Conventions

**Core Principle: Always prefer specific types. Fall back to `unknown` only when the type is truly unknown.**

### Type Definitions

```typescript
// ✅ Interfaces for objects, types for unions/aliases
interface User {
  id: string;
  name: string;
}
type Status = 'pending' | 'active' | 'completed';

// ❌ NEVER use 'any'
const data: any = getData();

// ✅ Use specific types first, 'unknown' as fallback
const user: User = getUser();
const parsed: unknown = JSON.parse(input); // External data
```

### The 'any' Type is Forbidden

**Type Priority**: Specific types → Union types → Generics → `unknown` (never `any`)

```typescript
// Examples of proper typing
function updateUser(user: User): Promise<User> {}
type ApiResponse = SuccessResponse | ErrorResponse;
function identity<T>(value: T): T {
  return value;
}

// Use unknown for truly unknown data (with validation)
const parsed: unknown = JSON.parse(input);
if (isUser(parsed)) return parsed;
```

### Type Imports

Always use type imports for type-only imports, following these rules:

```typescript
// Type-only imports: use `import type`
import type { User, Role } from './types';

// Mixed imports: use inline `type`
import { type User, type Config, getUser, loadConfig } from './module';

// ❌ Never import types without 'type' modifier
import { User } from './types'; // Wrong!
```

### Generics

```typescript
// ✅ Use descriptive names for complex generics
interface ApiResponse<TData, TError = Error> {}

// ✅ Single letters OK for simple cases
function identity<T>(value: T): T {
  return value;
}
```

### Enums vs Object Maps

```typescript
// ❌ Avoid enums (increase bundle size)
enum Status {
  Pending = 'pending',
}

// ✅ Use object maps
const Status = { Pending: 'pending', Active: 'active' } as const;
type Status = (typeof Status)[keyof typeof Status];
```

## React Conventions

### Component Structure

```typescript
// ✅ Functional components only
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

export function Button({ variant = 'primary', children }: ButtonProps) {
  return <button className={variant}>{children}</button>;
}
```

### Hooks

```typescript
// ✅ Type your custom hooks
interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
}

export function useAuth(): UseAuthReturn {
  // Implementation
}
```

### Event Handlers & Props

```typescript
// ✅ Type event handlers
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => { };

// ✅ Destructure props with defaults
function Card({ title, description = 'No description' }: CardProps) { }

// ✅ Simple inline handlers are OK
<button onClick={() => setCount(count + 1)}>+</button>
```

## State Management

```typescript
// ✅ Colocate state, derive when possible
const [todos, setTodos] = useState<Todo[]>([]);
const completedTodos = todos.filter((t) => t.completed);

// ✅ Type contexts properly
const ThemeContext = createContext<Theme | null>(null);
```

## Async Patterns

```typescript
// ✅ Always use async/await, handle errors
async function fetchUser(id: string): Promise<User> {
  try {
    const { data } = await api.get(`/users/${id}`);
    return data;
  } catch (error) {
    logger.error('Failed to fetch user', { id, error });
    throw error;
  }
}

// ✅ Centralize API calls
export const userService = {
  getUser: (id: string) => api.get<User>(`/users/${id}`),
  updateUser: (id: string, data: Partial<User>) => api.patch(`/users/${id}`, data),
};
```

## Error Handling

```typescript
// ✅ Custom error classes
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
  }
}

// ✅ Type guards
function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
```

## Testing Conventions

```typescript
// ✅ Descriptive test names
describe('Button', () => {
  it('renders with primary variant by default', () => { });
  it('calls onClick handler when clicked', () => { });
});

// ✅ Arrange-Act-Assert pattern
it('updates user name', async () => {
  const user = { id: '1', name: 'John' };         // Arrange
  const updated = await updateName(user.id, 'Jane'); // Act
  expect(updated.name).toBe('Jane');               // Assert
});

// ✅ Use data-testid
<button data-testid="submit">Submit</button>
```

## Performance Guidelines

```typescript
// ✅ Memoize only expensive operations
const result = useMemo(() => expensiveCalc(data), [data]);

// ✅ Dynamic imports for code splitting
const Heavy = lazy(() => import('./HeavyComponent'));

// ✅ Tree-shakeable imports
import { debounce } from 'lodash-es';
```

## CSS and Styling

- use css modules
- scope things within a @layer "base" or "overrides"
- use classnames alias "cx" to conditionalize classnames.

```typescript
// ✅ Use CSS modules and scope things within base layer or overrides layer.
import styles from './Button.module.css';
import cx from 'classnames'
<button className={cx(styles.root, isCircular && styles.circular)}>Click</button>
```

```css
/* css modules only. */
@layer base {
  .root {
  }
  .circular {
  }
}
```

## Documentation

```typescript
// ✅ Explain WHY, not WHAT
// Debounce to avoid excessive API calls
const search = useMemo(() => debounce(searchUsers, 300), [searchUsers]);

/**
 * Formats a date string according to user's locale
 * @example formatDate(new Date(), { style: 'short' }) // "1/1/24"
 */
export function formatDate(date: Date, options?: FormatOptions): string {}
```

## Git Conventions

**Branch naming**: `feature/description`, `fix/description`, `chore/description`

**Commit messages**: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`

## Security

```typescript
// ❌ Never hardcode secrets
const API_KEY = 'sk-1234567890';

// ✅ Use environment variables
const API_KEY = process.env.VITE_API_KEY;

// ✅ Validate all user input
const validated = userSchema.parse(data);
```

## Accessibility

```typescript
// ✅ Use semantic HTML and ARIA labels
<button aria-label="Close dialog"><CloseIcon /></button>
<nav aria-label="Main navigation">{/* items */}</nav>

// ✅ Handle keyboard navigation
useEffect(() => {
  const handleEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
  document.addEventListener('keydown', handleEsc);
  return () => document.removeEventListener('keydown', handleEsc);
}, [onClose]);
```

## Final Checklist

Before submitting code:

- [ ] Code follows TypeScript conventions
- [ ] **No `any` types** (use `unknown` or proper types)
- [ ] No files exceed 500 lines
- [ ] One primary export per file (no default exports)
- [ ] Tests are included for new functionality
- [ ] Error cases are handled
- [ ] Code is accessible
- [ ] No hardcoded secrets
- [ ] Documentation is updated if needed
- [ ] Linting passes (`pnpm lint`)
- [ ] Type checking passes (`pnpm typecheck`)
- [ ] Tests pass (`pnpm test`)
