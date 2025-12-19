# @ui-kit/router

A lightweight client-side router for React applications. Designed to integrate seamlessly with ui-kit components, enabling Button with `href` to perform client-side navigation automatically.

## Features

- **Lightweight** - Minimal bundle size, no external dependencies
- **Nested Routes** - Support for layout routes with `<Outlet />`
- **Active State Detection** - `useIsActive()` hook for styling active navigation
- **Automatic Link Interception** - Anchor clicks are intercepted for client-side navigation
- **Route Parameters** - Dynamic segments like `/doc/:documentId`
- **History Integration** - Full browser history support with back/forward navigation

## Installation

```bash
pnpm add @ui-kit/router
```

## Usage

### Basic Setup

```tsx
import { Router, Routes, Route } from '@ui-kit/router';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" component={Home} />
        <Route path="/about" component={About} />
        <Route path="/users/:userId" component={UserProfile} />
      </Routes>
    </Router>
  );
}
```

### Nested Routes with Layouts

```tsx
import { Router, Routes, Route, Outlet } from '@ui-kit/router';

function AppLayout() {
  return (
    <div>
      <header>Navigation here</header>
      <main>
        <Outlet /> {/* Child routes render here */}
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" component={Landing} />
        <Route component={AppLayout}>
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/settings" component={Settings} />
        </Route>
      </Routes>
    </Router>
  );
}
```

### Navigation

#### Programmatic Navigation

```tsx
import { useNavigate } from '@ui-kit/router';

function MyComponent() {
  const navigate = useNavigate();

  return (
    <button onClick={() => navigate('/dashboard')}>
      Go to Dashboard
    </button>
  );
}
```

#### Navigation Options

```tsx
// Replace current history entry (no back button)
navigate('/login', { replace: true });

// Pass state data
navigate('/details', { state: { from: 'home' } });

// Go back/forward in history
navigate(-1); // Back
navigate(1);  // Forward
```

#### Declarative Navigation

Any anchor element (`<a>`) inside the Router will automatically use client-side navigation:

```tsx
// These all work for client-side navigation
<a href="/dashboard">Dashboard</a>
<Button href="/settings">Settings</Button>
```

To opt out of client-side navigation:
```tsx
<a href="/external" data-no-router>External Link</a>
<a href="https://example.com">External Site</a> {/* External URLs are ignored */}
```

### Active State Detection

```tsx
import { useIsActive } from '@ui-kit/router';
import { Button } from '@ui-kit/react';

function Navigation() {
  const isDashboardActive = useIsActive('/dashboard');
  const isSettingsActive = useIsActive('/settings');

  return (
    <nav>
      <Button
        href="/dashboard"
        variant={isDashboardActive ? 'primary' : 'ghost'}
      >
        Dashboard
      </Button>
      <Button
        href="/settings"
        variant={isSettingsActive ? 'primary' : 'ghost'}
      >
        Settings
      </Button>
    </nav>
  );
}
```

#### Exact Matching

```tsx
// Matches /users and /users/123
const isUsersActive = useIsActive('/users');

// Only matches exactly /users
const isUsersExact = useIsActive('/users', true);
```

### Route Parameters

```tsx
import { useParams } from '@ui-kit/router';

function UserProfile() {
  const { userId } = useParams<{ userId: string }>();

  return <div>User ID: {userId}</div>;
}
```

### Location Information

```tsx
import { useLocation, useNavigationType } from '@ui-kit/router';

function PageTransition() {
  const location = useLocation();
  const navigationType = useNavigationType();

  // location.pathname - Current path
  // location.search - Query string (e.g., "?foo=bar")
  // location.hash - Hash (e.g., "#section")
  // location.key - Unique key for this history entry

  // navigationType - 'PUSH' | 'POP' | 'REPLACE'
  // Useful for determining animation direction

  return <div>Current path: {location.pathname}</div>;
}
```

### Link Component

For simple anchor links without Button styling:

```tsx
import { Link } from '@ui-kit/router';

<Link href="/about">About Us</Link>
<Link href="/contact" className="custom-link">Contact</Link>
```

## API Reference

### Components

| Component | Description |
|-----------|-------------|
| `<Router>` | Root provider component. Wrap your app with this. |
| `<Routes>` | Container that renders the first matching child Route. |
| `<Route>` | Defines a route. Use `path` for URL matching, `component` for rendering. |
| `<Outlet>` | Renders child routes in layout components. |
| `<Link>` | Anchor element with client-side navigation. |

### Hooks

| Hook | Returns | Description |
|------|---------|-------------|
| `useNavigate()` | `NavigateFunction` | Function to navigate programmatically |
| `useParams<T>()` | `T` | Route parameters from the current URL |
| `useLocation()` | `Location` | Current location object |
| `useNavigationType()` | `NavigationType` | Type of the last navigation ('PUSH', 'POP', 'REPLACE') |
| `useIsActive(path, exact?)` | `boolean` | Whether the given path matches current location |

### Router Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `basePath` | `string` | `''` | Base path for all routes |
| `disableLinkInterception` | `boolean` | `false` | Disable automatic anchor click handling |

### Route Props

| Prop | Type | Description |
|------|------|-------------|
| `path` | `string` | URL pattern to match. Supports `:param` for dynamic segments. |
| `component` | `ComponentType` | Component to render when route matches. |
| `children` | `ReactNode` | Child routes (for nested routing). |

## Path Matching

The router supports these path patterns:

- `/exact` - Matches exactly `/exact`
- `/users/:id` - Matches `/users/123`, extracts `{ id: '123' }`
- `/files/*` - Matches `/files/any/nested/path`
- `*` - Catch-all, matches any path

## Browser Support

Works in all modern browsers that support:
- History API (`pushState`, `replaceState`, `popstate`)
- URL API

## License

MIT
