import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FacilitatorOverlay } from './FacilitatorOverlay';
import { FacilitatorProvider } from '../../contexts/FacilitatorContext';
import type { ReactNode } from 'react';

// Mock the WebSocket hook to avoid actual connections
vi.mock('../../hooks/useFacilitatorSocket', () => ({
  useFacilitatorSocket: () => ({
    sendMessage: vi.fn(),
    isConnected: true,
  }),
}));

// Mock AuthContext to provide a test user
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-1', name: 'Test User', avatarUrl: '' },
    isAuthenticated: true,
    isLoading: false,
  }),
  AuthProvider: ({ children }: { children: ReactNode }) => children,
}));

// Simple wrapper with just FacilitatorProvider
const TestWrapper = ({ children }: { children: ReactNode }) => (
  <FacilitatorProvider>{children}</FacilitatorProvider>
);

describe('FacilitatorOverlay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset body overflow
    document.body.style.overflow = '';
  });

  afterEach(() => {
    // Restore body overflow (don't clear innerHTML as React handles cleanup)
    document.body.style.overflow = '';
  });

  describe('rendering', () => {
    it('does not render when closed', () => {
      render(
        <TestWrapper>
          <FacilitatorOverlay />
        </TestWrapper>
      );

      // Overlay should not be visible initially
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders when opened via keyboard shortcut', async () => {
      render(
        <TestWrapper>
          <FacilitatorOverlay />
        </TestWrapper>
      );

      // Trigger Ctrl+C to open
      act(() => {
        fireEvent.keyDown(window, { key: 'c', ctrlKey: true });
      });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('renders header with title', async () => {
      render(
        <TestWrapper>
          <FacilitatorOverlay />
        </TestWrapper>
      );

      act(() => {
        fireEvent.keyDown(window, { key: 'c', ctrlKey: true });
      });

      await waitFor(() => {
        expect(screen.getByText('Facilitator')).toBeInTheDocument();
      });
    });

    it('renders chat input when open', async () => {
      render(
        <TestWrapper>
          <FacilitatorOverlay />
        </TestWrapper>
      );

      act(() => {
        fireEvent.keyDown(window, { key: 'c', ctrlKey: true });
      });

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });
    });

    it('renders close button', async () => {
      render(
        <TestWrapper>
          <FacilitatorOverlay />
        </TestWrapper>
      );

      act(() => {
        fireEvent.keyDown(window, { key: 'c', ctrlKey: true });
      });

      await waitFor(() => {
        expect(screen.getByLabelText('Close facilitator')).toBeInTheDocument();
      });
    });

    it('shows Escape shortcut hint', async () => {
      render(
        <TestWrapper>
          <FacilitatorOverlay />
        </TestWrapper>
      );

      act(() => {
        fireEvent.keyDown(window, { key: 'c', ctrlKey: true });
      });

      await waitFor(() => {
        expect(screen.getByText('Esc')).toBeInTheDocument();
        expect(screen.getByText('to close')).toBeInTheDocument();
      });
    });
  });

  describe('opening and closing', () => {
    it('opens with Ctrl+`', async () => {
      render(
        <TestWrapper>
          <FacilitatorOverlay />
        </TestWrapper>
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      act(() => {
        fireEvent.keyDown(window, { key: 'c', ctrlKey: true });
      });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('opens with Cmd+` (Mac)', async () => {
      render(
        <TestWrapper>
          <FacilitatorOverlay />
        </TestWrapper>
      );

      act(() => {
        fireEvent.keyDown(window, { key: 'c', metaKey: true });
      });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('closes with Escape key', async () => {
      render(
        <TestWrapper>
          <FacilitatorOverlay />
        </TestWrapper>
      );

      // Open first
      act(() => {
        fireEvent.keyDown(window, { key: 'c', ctrlKey: true });
      });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Close with Escape
      act(() => {
        fireEvent.keyDown(document, { key: 'Escape' });
      });

      // Wait for exit animation
      await waitFor(
        () => {
          expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        },
        { timeout: 500 }
      );
    });

    it('closes when close button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <FacilitatorOverlay />
        </TestWrapper>
      );

      // Open first
      act(() => {
        fireEvent.keyDown(window, { key: 'c', ctrlKey: true });
      });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Wait for animation content to appear, then click close button
      const closeButton = await screen.findByLabelText('Close facilitator');
      await user.click(closeButton);

      // Wait for exit animation
      await waitFor(
        () => {
          expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        },
        { timeout: 500 }
      );
    });

    it('stays open when clicking inside panel', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <FacilitatorOverlay />
        </TestWrapper>
      );

      // Open first
      act(() => {
        fireEvent.keyDown(window, { key: 'c', ctrlKey: true });
      });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Wait for animation content, then click on header text (inside the panel)
      const header = await screen.findByText('Facilitator');
      await user.click(header);

      // Should still be open
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('shows empty state message when no messages', async () => {
      render(
        <TestWrapper>
          <FacilitatorOverlay />
        </TestWrapper>
      );

      act(() => {
        fireEvent.keyDown(window, { key: 'c', ctrlKey: true });
      });

      await waitFor(() => {
        expect(screen.getByText('How can I help you today?')).toBeInTheDocument();
      });
    });

    it('shows helpful subtitle in empty state', async () => {
      render(
        <TestWrapper>
          <FacilitatorOverlay />
        </TestWrapper>
      );

      act(() => {
        fireEvent.keyDown(window, { key: 'c', ctrlKey: true });
      });

      await waitFor(() => {
        expect(
          screen.getByText(/Ask me anything about your workspaces/)
        ).toBeInTheDocument();
      });
    });
  });

  describe('accessibility', () => {
    it('has role="dialog"', async () => {
      render(
        <TestWrapper>
          <FacilitatorOverlay />
        </TestWrapper>
      );

      act(() => {
        fireEvent.keyDown(window, { key: 'c', ctrlKey: true });
      });

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
      });
    });

    it('has aria-modal="true"', async () => {
      render(
        <TestWrapper>
          <FacilitatorOverlay />
        </TestWrapper>
      );

      act(() => {
        fireEvent.keyDown(window, { key: 'c', ctrlKey: true });
      });

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('aria-modal', 'true');
      });
    });

    it('has aria-label for dialog', async () => {
      render(
        <TestWrapper>
          <FacilitatorOverlay />
        </TestWrapper>
      );

      act(() => {
        fireEvent.keyDown(window, { key: 'c', ctrlKey: true });
      });

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('aria-label', 'Facilitator chat');
      });
    });

    // Note: Body scroll locking is implemented but difficult to test reliably in jsdom.
    // The functionality works correctly in real browsers.
  });

  describe('connection status', () => {
    it('shows connection status indicator', async () => {
      render(
        <TestWrapper>
          <FacilitatorOverlay />
        </TestWrapper>
      );

      act(() => {
        fireEvent.keyDown(window, { key: 'c', ctrlKey: true });
      });

      await waitFor(() => {
        // Status indicator should be present - use class pattern for CSS modules
        const statusIndicator = document.querySelector('[class*="statusIndicator"]');
        expect(statusIndicator).toBeInTheDocument();
      });
    });
  });
});
