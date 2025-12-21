import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Router, Routes, Route, Outlet, Link } from './index';
import {
  useNavigate,
  useParams,
  useLocation,
  useNavigationType,
  useIsActive,
  useRouterContext,
} from './hooks';

// Test components
function Home() {
  return <div data-testid="home">Home Page</div>;
}

function About() {
  return <div data-testid="about">About Page</div>;
}

function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  return <div data-testid="user-profile">User: {userId}</div>;
}

function WorkspaceDoc() {
  const { workspaceId, docId } = useParams<{ workspaceId: string; docId: string }>();
  return (
    <div data-testid="workspace-doc">
      Workspace: {workspaceId}, Doc: {docId}
    </div>
  );
}

function NotFound() {
  return <div data-testid="not-found">404 Not Found</div>;
}

function Layout() {
  return (
    <div data-testid="layout">
      <nav>Layout Nav</nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

function NavigationTest() {
  const navigate = useNavigate();
  return (
    <div>
      <button data-testid="nav-home" onClick={() => navigate('/')}>
        Home
      </button>
      <button data-testid="nav-about" onClick={() => navigate('/about')}>
        About
      </button>
      <button data-testid="nav-replace" onClick={() => navigate('/about', { replace: true })}>
        About (Replace)
      </button>
      <button data-testid="nav-back" onClick={() => navigate(-1)}>
        Back
      </button>
    </div>
  );
}

function LocationDisplay() {
  const location = useLocation();
  const navigationType = useNavigationType();
  return (
    <div>
      <span data-testid="pathname">{location.pathname}</span>
      <span data-testid="search">{location.search}</span>
      <span data-testid="hash">{location.hash}</span>
      <span data-testid="nav-type">{navigationType}</span>
    </div>
  );
}

function ActiveStateTest() {
  const isHomeActive = useIsActive('/');
  const isDashboardActive = useIsActive('/dashboard');
  const isDashboardExact = useIsActive('/dashboard', true);

  return (
    <div>
      <span data-testid="home-active">{isHomeActive.toString()}</span>
      <span data-testid="dashboard-active">{isDashboardActive.toString()}</span>
      <span data-testid="dashboard-exact">{isDashboardExact.toString()}</span>
    </div>
  );
}

describe('Router', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
  });

  describe('basic routing', () => {
    it('renders the home route', () => {
      render(
        <Router>
          <Routes>
            <Route path="/" component={Home} />
          </Routes>
        </Router>
      );

      expect(screen.getByTestId('home')).toBeInTheDocument();
    });

    it('renders the correct route based on URL', () => {
      window.history.pushState({}, '', '/about');

      render(
        <Router>
          <Routes>
            <Route path="/" component={Home} />
            <Route path="/about" component={About} />
          </Routes>
        </Router>
      );

      expect(screen.getByTestId('about')).toBeInTheDocument();
      expect(screen.queryByTestId('home')).not.toBeInTheDocument();
    });

    it('renders nothing when no route matches', () => {
      window.history.pushState({}, '', '/nonexistent');

      render(
        <Router>
          <Routes>
            <Route path="/" component={Home} />
            <Route path="/about" component={About} />
          </Routes>
        </Router>
      );

      expect(screen.queryByTestId('home')).not.toBeInTheDocument();
      expect(screen.queryByTestId('about')).not.toBeInTheDocument();
    });

    it('renders catch-all route', () => {
      window.history.pushState({}, '', '/nonexistent');

      render(
        <Router>
          <Routes>
            <Route path="/" component={Home} />
            <Route path="*" component={NotFound} />
          </Routes>
        </Router>
      );

      expect(screen.getByTestId('not-found')).toBeInTheDocument();
    });
  });

  describe('route parameters', () => {
    it('extracts single route parameter', () => {
      window.history.pushState({}, '', '/users/123');

      render(
        <Router>
          <Routes>
            <Route path="/users/:userId" component={UserProfile} />
          </Routes>
        </Router>
      );

      expect(screen.getByTestId('user-profile')).toHaveTextContent('User: 123');
    });

    it('extracts multiple route parameters', () => {
      window.history.pushState({}, '', '/workspace/acme/doc/456');

      render(
        <Router>
          <Routes>
            <Route path="/workspace/:workspaceId/doc/:docId" component={WorkspaceDoc} />
          </Routes>
        </Router>
      );

      expect(screen.getByTestId('workspace-doc')).toHaveTextContent('Workspace: acme, Doc: 456');
    });
  });

  describe('nested routes', () => {
    it('renders layout with child routes', () => {
      window.history.pushState({}, '', '/dashboard');

      render(
        <Router>
          <Routes>
            <Route path="/" component={Home} />
            <Route component={Layout}>
              <Route path="/dashboard" component={About} />
            </Route>
          </Routes>
        </Router>
      );

      expect(screen.getByTestId('layout')).toBeInTheDocument();
      expect(screen.getByTestId('about')).toBeInTheDocument();
    });
  });
});

describe('useNavigate', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('navigates to a new path', async () => {
    render(
      <Router>
        <NavigationTest />
        <Routes>
          <Route path="/" component={Home} />
          <Route path="/about" component={About} />
        </Routes>
      </Router>
    );

    expect(screen.getByTestId('home')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByTestId('nav-about'));
    });

    expect(screen.getByTestId('about')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/about');
  });

  it('throws when used outside Router', () => {
    function BadComponent() {
      useNavigate();
      return null;
    }

    expect(() => render(<BadComponent />)).toThrow('useNavigate must be used within a Router');
  });
});

describe('useLocation', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('returns current location', () => {
    window.history.pushState({}, '', '/test?foo=bar#section');

    render(
      <Router>
        <LocationDisplay />
      </Router>
    );

    expect(screen.getByTestId('pathname')).toHaveTextContent('/test');
    expect(screen.getByTestId('search')).toHaveTextContent('?foo=bar');
    expect(screen.getByTestId('hash')).toHaveTextContent('#section');
  });

  it('throws when used outside Router', () => {
    function BadComponent() {
      useLocation();
      return null;
    }

    expect(() => render(<BadComponent />)).toThrow('useLocation must be used within a Router');
  });
});

describe('useNavigationType', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('returns PUSH for initial render', () => {
    render(
      <Router>
        <LocationDisplay />
      </Router>
    );

    expect(screen.getByTestId('nav-type')).toHaveTextContent('PUSH');
  });

  it('throws when used outside Router', () => {
    function BadComponent() {
      useNavigationType();
      return null;
    }

    expect(() => render(<BadComponent />)).toThrow('useNavigationType must be used within a Router');
  });
});

describe('useIsActive', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('detects active paths', () => {
    window.history.pushState({}, '', '/dashboard/settings');

    render(
      <Router>
        <ActiveStateTest />
      </Router>
    );

    expect(screen.getByTestId('home-active')).toHaveTextContent('false');
    expect(screen.getByTestId('dashboard-active')).toHaveTextContent('true');
    expect(screen.getByTestId('dashboard-exact')).toHaveTextContent('false');
  });

  it('handles exact matching', () => {
    window.history.pushState({}, '', '/dashboard');

    render(
      <Router>
        <ActiveStateTest />
      </Router>
    );

    expect(screen.getByTestId('dashboard-active')).toHaveTextContent('true');
    expect(screen.getByTestId('dashboard-exact')).toHaveTextContent('true');
  });

  it('throws when used outside Router', () => {
    function BadComponent() {
      useIsActive('/test');
      return null;
    }

    expect(() => render(<BadComponent />)).toThrow('useIsActive must be used within a Router');
  });
});

describe('useRouterContext', () => {
  it('returns null when outside Router', () => {
    let context: ReturnType<typeof useRouterContext> = {} as any;

    function TestComponent() {
      context = useRouterContext();
      return null;
    }

    render(<TestComponent />);
    expect(context).toBeNull();
  });

  it('returns context when inside Router', () => {
    let context: ReturnType<typeof useRouterContext>;

    function TestComponent() {
      context = useRouterContext();
      return null;
    }

    render(
      <Router>
        <TestComponent />
      </Router>
    );

    expect(context!).not.toBeNull();
    expect(context!.location).toBeDefined();
    expect(context!.navigate).toBeDefined();
  });
});

describe('Link', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('renders an anchor element', () => {
    render(
      <Router>
        <Link href="/about">About</Link>
      </Router>
    );

    const link = screen.getByRole('link', { name: 'About' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/about');
  });

  it('navigates on click', async () => {
    render(
      <Router>
        <Link href="/about">About</Link>
        <Routes>
          <Route path="/" component={Home} />
          <Route path="/about" component={About} />
        </Routes>
      </Router>
    );

    expect(screen.getByTestId('home')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('link', { name: 'About' }));
    });

    expect(screen.getByTestId('about')).toBeInTheDocument();
  });

  it('applies className', () => {
    render(
      <Router>
        <Link href="/about" className="custom-link">
          About
        </Link>
      </Router>
    );

    expect(screen.getByRole('link')).toHaveClass('custom-link');
  });
});

describe('anchor click interception', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('intercepts anchor clicks for client-side navigation', async () => {
    render(
      <Router>
        <a href="/about">About Link</a>
        <Routes>
          <Route path="/" component={Home} />
          <Route path="/about" component={About} />
        </Routes>
      </Router>
    );

    expect(screen.getByTestId('home')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('link', { name: 'About Link' }));
    });

    expect(screen.getByTestId('about')).toBeInTheDocument();
  });

  it('does not intercept external links', async () => {
    render(
      <Router>
        <a href="https://example.com">External</a>
        <Routes>
          <Route path="/" component={Home} />
        </Routes>
      </Router>
    );

    // External links should not trigger navigation (link will work normally)
    // We can't fully test external navigation in jsdom, but we verify the home
    // component is still rendered after clicking
    await act(async () => {
      fireEvent.click(screen.getByRole('link', { name: 'External' }));
    });

    expect(screen.getByTestId('home')).toBeInTheDocument();
  });

  it('respects data-no-router attribute', async () => {
    render(
      <Router>
        <a href="/about" data-no-router>
          No Router
        </a>
        <Routes>
          <Route path="/" component={Home} />
          <Route path="/about" component={About} />
        </Routes>
      </Router>
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('link', { name: 'No Router' }));
    });

    // Should still be on home because data-no-router prevents client-side nav
    // (In real browser it would do full page navigation)
    expect(screen.getByTestId('home')).toBeInTheDocument();
  });

  it('does not intercept clicks with modifier keys', async () => {
    render(
      <Router>
        <a href="/about">About</a>
        <Routes>
          <Route path="/" component={Home} />
          <Route path="/about" component={About} />
        </Routes>
      </Router>
    );

    // Ctrl+click should not trigger client-side navigation
    await act(async () => {
      fireEvent.click(screen.getByRole('link', { name: 'About' }), { ctrlKey: true });
    });

    expect(screen.getByTestId('home')).toBeInTheDocument();
  });
});
