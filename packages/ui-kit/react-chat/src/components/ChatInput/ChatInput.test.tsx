import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInput } from './ChatInput';
import styles from './ChatInput.module.css';

describe('ChatInput', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('rendering', () => {
    it('renders with default props', () => {
      render(<ChatInput />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
    });

    it('renders with custom placeholder', () => {
      render(<ChatInput placeholder="Custom placeholder..." />);
      expect(screen.getByText('Custom placeholder...')).toBeInTheDocument();
    });

    it('renders disabled state', () => {
      render(<ChatInput disabled />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('submit behavior', () => {
    it('calls onSubmit when Enter is pressed in single-line mode', async () => {
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

    it('does not submit on Enter in multiline mode', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<ChatInput onSubmit={onSubmit} multiline />);

      const editor = screen.getByRole('textbox');
      await user.click(editor);
      await user.type(editor, 'Hello world');
      await user.keyboard('{Enter}');

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('submits on Ctrl+Enter in multiline mode', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<ChatInput onSubmit={onSubmit} multiline />);

      const editor = screen.getByRole('textbox');
      await user.click(editor);
      await user.type(editor, 'Hello world');
      await user.keyboard('{Control>}{Enter}{/Control}');

      expect(onSubmit).toHaveBeenCalledWith({
        content: 'Hello world',
        images: [],
      });
    });

    it('does not submit empty content', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<ChatInput onSubmit={onSubmit} />);

      const editor = screen.getByRole('textbox');
      await user.click(editor);
      await user.keyboard('{Enter}');

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('clears input after submit', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSubmit={vi.fn()} />);

      const editor = screen.getByRole('textbox');
      await user.click(editor);
      await user.type(editor, 'Hello world');
      await user.keyboard('{Enter}');

      expect(editor).toHaveTextContent('');
    });
  });

  describe('multiline toggle', () => {
    it('toggles multiline mode when button is clicked', async () => {
      const user = userEvent.setup();
      render(<ChatInput />);

      const toggleButton = screen.getByRole('button', { name: /multiline/i });

      // Initially single-line mode
      expect(toggleButton).not.toHaveClass(styles.active);

      await user.click(toggleButton);

      // Now multiline mode
      expect(toggleButton).toHaveClass(styles.active);
    });

    it('enters multiline mode on Meta+Enter in single-line mode', async () => {
      const user = userEvent.setup();
      render(<ChatInput />);

      const editor = screen.getByRole('textbox');
      const toggleButton = screen.getByRole('button', { name: /multiline/i });

      await user.click(editor);
      await user.keyboard('{Meta>}{Enter}{/Meta}');

      expect(toggleButton).toHaveClass(styles.active);
    });
  });

  describe('size variants', () => {
    it('applies size class', () => {
      const { container, rerender } = render(<ChatInput size="sm" />);
      expect(container.firstChild).toHaveClass(styles.sm);

      rerender(<ChatInput size="lg" />);
      expect(container.firstChild).toHaveClass(styles.lg);
    });
  });

  describe('fullWidth', () => {
    it('applies fullWidth class', () => {
      const { container } = render(<ChatInput fullWidth />);
      expect(container.firstChild).toHaveClass(styles.fullWidth);
    });
  });

  describe('error state', () => {
    it('applies error class', () => {
      const { container } = render(<ChatInput error />);
      expect(container.firstChild).toHaveClass(styles.error);
    });
  });

  describe('toolbar', () => {
    it('shows toolbar only in multiline mode', async () => {
      const user = userEvent.setup();
      const { container } = render(<ChatInput />);

      // Toolbar should not be visible initially
      expect(container.querySelector(`.${styles.toolbar}`)).not.toBeInTheDocument();

      // Click multiline toggle
      const toggleButton = screen.getByRole('button', { name: /multiline/i });
      await user.click(toggleButton);

      // Toolbar should now be visible
      expect(container.querySelector(`.${styles.toolbar}`)).toBeInTheDocument();
    });
  });
});
