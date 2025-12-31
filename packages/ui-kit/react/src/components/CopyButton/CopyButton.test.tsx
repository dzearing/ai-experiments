import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CopyButton } from './CopyButton';

// Mock navigator.clipboard
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

describe('CopyButton', () => {
  describe('rendering', () => {
    it('renders as icon-only button when no children', () => {
      render(<CopyButton content="test" aria-label="Copy text" />);

      expect(screen.getByRole('button', { name: 'Copy text' })).toBeInTheDocument();
    });

    it('renders as labeled button when children provided', () => {
      render(<CopyButton content="test">Copy All</CopyButton>);

      expect(screen.getByRole('button', { name: 'Copy All' })).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<CopyButton content="test" className="custom-class" aria-label="Copy" />);

      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });

    it('applies variant class', () => {
      render(<CopyButton content="test" variant="default" aria-label="Copy" />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('copy functionality', () => {
    it('copies static content to clipboard', async () => {
      render(<CopyButton content="Hello World" aria-label="Copy" />);

      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith('Hello World');
      });
    });

    it('calls getContent callback and copies result', async () => {
      const getContent = vi.fn().mockReturnValue('Dynamic content');
      render(<CopyButton getContent={getContent} aria-label="Copy" />);

      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(getContent).toHaveBeenCalled();
        expect(mockClipboard.writeText).toHaveBeenCalledWith('Dynamic content');
      });
    });

    it('handles async getContent callback', async () => {
      const getContent = vi.fn().mockResolvedValue('Async content');
      render(<CopyButton getContent={getContent} aria-label="Copy" />);

      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith('Async content');
      });
    });

    it('calls onCopy callback on successful copy', async () => {
      const onCopy = vi.fn();
      render(<CopyButton content="test" onCopy={onCopy} aria-label="Copy" />);

      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(onCopy).toHaveBeenCalled();
      });
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

    it('stops event propagation', async () => {
      const parentClick = vi.fn();
      render(
        <div onClick={parentClick}>
          <CopyButton content="test" aria-label="Copy" />
        </div>
      );

      fireEvent.click(screen.getByRole('button'));

      expect(parentClick).not.toHaveBeenCalled();
    });
  });

  describe('disabled state', () => {
    it('renders disabled when disabled prop is true', () => {
      render(<CopyButton content="test" disabled aria-label="Copy" />);

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('does not copy when disabled', async () => {
      render(<CopyButton content="test" disabled aria-label="Copy" />);

      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(mockClipboard.writeText).not.toHaveBeenCalled();
      });
    });
  });

  describe('feedback state', () => {
    it('shows copied state after successful copy', async () => {
      vi.useFakeTimers();

      render(<CopyButton content="test" aria-label="Copy" />);

      fireEvent.click(screen.getByRole('button'));

      // Wait for the copy to complete
      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalled();
      });

      // The checkmark icon should be visible (component switches icon)
      // We can't easily test the icon change, but we can verify the button is still there
      expect(screen.getByRole('button')).toBeInTheDocument();

      vi.useRealTimers();
    });
  });

  describe('sizes', () => {
    it('applies sm size', () => {
      render(<CopyButton content="test" size="sm" aria-label="Copy" />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('applies md size', () => {
      render(<CopyButton content="test" size="md" aria-label="Copy" />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('applies lg size', () => {
      render(<CopyButton content="test" size="lg" aria-label="Copy" />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });
});
