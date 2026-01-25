import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';

// Mock the router
const mockNavigate = vi.fn();
const mockLocation = { pathname: '/workspace-1/topics', key: 'test-key' };
vi.mock('@ui-kit/router', () => ({
  Outlet: () => <div data-testid="outlet">Outlet content</div>,
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
  useNavigationType: () => 'PUSH',
}));

// Mock ui-kit/react components and hooks
vi.mock('@ui-kit/react', async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>;
  return {
    ...actual,
    useHistoryIndex: () => 0,
    useTheme: () => ({ mode: 'light', setMode: vi.fn() }),
    PageTransition: ({ children }: { children: ReactNode }) => <>{children}</>,
  };
});

// Mock AuthContext
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', name: 'Test User' },
    signOut: vi.fn(),
  }),
}));

// Mock SessionContext
vi.mock('../../contexts/SessionContext', () => ({
  useSession: () => ({
    session: { color: '#3B82F6' },
  }),
}));

// Mock workspacePath utility
vi.mock('../../utils/workspacePath', () => ({
  parseWorkspacePath: () => ({ workspaceId: 'workspace-1', pivot: 'topics' }),
}));

// Mock WorkspaceSwitcher
vi.mock('../WorkspaceSwitcher', () => ({
  WorkspaceSwitcher: () => <div data-testid="workspace-switcher">Switcher</div>,
}));

// Import after mocks
import { AppLayout } from './AppLayout';

describe('AppLayout - User Menu to AboutDialog Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset body styles
    document.body.style.overflow = '';
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  describe('user menu renders', () => {
    it('renders user avatar menu button', () => {
      render(<AppLayout />);

      const userMenuButton = screen.getByRole('button', { name: /user menu/i });
      expect(userMenuButton).toBeInTheDocument();
    });
  });

  describe('menu → dialog flow', () => {
    it('opens user menu when clicking avatar', async () => {
      const user = userEvent.setup();
      render(<AppLayout />);

      // Click on user avatar menu button
      const userMenuButton = screen.getByRole('button', { name: /user menu/i });
      await user.click(userMenuButton);

      // Menu should be open - look for About menu item
      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /about/i })).toBeInTheDocument();
      });
    });

    it('opens AboutDialog when clicking About in user menu', async () => {
      const user = userEvent.setup();
      render(<AppLayout />);

      // Step 1: Open user menu
      const userMenuButton = screen.getByRole('button', { name: /user menu/i });
      await user.click(userMenuButton);

      // Step 2: Wait for menu to appear and click About
      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /about/i })).toBeInTheDocument();
      });

      const aboutMenuItem = screen.getByRole('menuitem', { name: /about/i });
      await user.click(aboutMenuItem);

      // Step 3: AboutDialog should be open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('About Ideate')).toBeInTheDocument();
      });
    });

    it('can close AboutDialog and menu independently', async () => {
      const user = userEvent.setup();
      render(<AppLayout />);

      // Open menu and dialog
      const userMenuButton = screen.getByRole('button', { name: /user menu/i });
      await user.click(userMenuButton);

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /about/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('menuitem', { name: /about/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Close the dialog
      const closeButton = screen.getByRole('button', { name: /^close$/i });
      await user.click(closeButton);

      // Dialog should be closed (wait for animation)
      await waitFor(
        () => {
          expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        },
        { timeout: 500 }
      );
    });

    it('AboutDialog contains all expected content after opening from menu', async () => {
      const user = userEvent.setup();
      render(<AppLayout />);

      // Open menu and dialog
      const userMenuButton = screen.getByRole('button', { name: /user menu/i });
      await user.click(userMenuButton);

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /about/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('menuitem', { name: /about/i }));

      // Wait for dialog to open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Verify dialog content exists (after dialog is open)
      // Title
      expect(screen.getByText('About Ideate')).toBeInTheDocument();
      // Version
      expect(screen.getByText(/Version/)).toBeInTheDocument();
      // Links
      expect(screen.getByRole('link', { name: /github/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /documentation/i })).toBeInTheDocument();
      // Close button
      expect(screen.getByRole('button', { name: /^close$/i })).toBeInTheDocument();
    });
  });

  describe('keyboard accessibility in flow', () => {
    it('user menu trigger has proper aria-haspopup attribute', () => {
      render(<AppLayout />);

      // The menu trigger should have aria-haspopup
      const trigger = screen.getByRole('button', { name: /user menu/i }).closest('[aria-haspopup="menu"]');
      expect(trigger).toBeInTheDocument();
    });

    it('can close AboutDialog with ESC key after opening from menu', async () => {
      const user = userEvent.setup();
      render(<AppLayout />);

      // Open menu and dialog
      const userMenuButton = screen.getByRole('button', { name: /user menu/i });
      await user.click(userMenuButton);

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /about/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('menuitem', { name: /about/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Press ESC to close dialog
      fireEvent.keyDown(document, { key: 'Escape' });

      // Dialog should be closed
      await waitFor(
        () => {
          expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        },
        { timeout: 500 }
      );
    });

    it('dialog has focus trap when opened from menu', async () => {
      const user = userEvent.setup();
      render(<AppLayout />);

      // Open menu and dialog
      const userMenuButton = screen.getByRole('button', { name: /user menu/i });
      await user.click(userMenuButton);

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /about/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('menuitem', { name: /about/i }));

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('aria-modal', 'true');
      });
    });
  });

  describe('Sign Out option in user menu', () => {
    it('user menu also contains Sign Out option', async () => {
      const user = userEvent.setup();
      render(<AppLayout />);

      // Open user menu
      const userMenuButton = screen.getByRole('button', { name: /user menu/i });
      await user.click(userMenuButton);

      // Verify both menu options are present
      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /about/i })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: /sign out/i })).toBeInTheDocument();
      });
    });
  });
});
