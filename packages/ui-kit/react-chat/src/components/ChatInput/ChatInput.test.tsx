import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInput } from './ChatInput';
import styles from './ChatInput.module.css';

// Helper to create a mock image paste event
function createImagePasteEvent(file: File) {
  const clipboardData = {
    items: [{ type: 'image/png', getAsFile: () => file }],
  };

  return new ClipboardEvent('paste', {
    clipboardData: clipboardData as unknown as DataTransfer,
    bubbles: true,
  });
}

// Helper to paste an image into the editor
async function pasteImage(editor: Element, filename: string = 'test.png') {
  const file = new File(['test'], filename, { type: 'image/png' });
  const pasteEvent = createImagePasteEvent(file);

  await act(async () => {
    editor.dispatchEvent(pasteEvent);
    // Wait for state updates
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  return file;
}

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
      // TipTap uses data-placeholder attribute on the empty paragraph
      const editor = screen.getByRole('textbox');
      const placeholder = editor.querySelector('[data-placeholder]');
      expect(placeholder).toHaveAttribute('data-placeholder', 'Custom placeholder...');
    });

    it('renders disabled state', () => {
      render(<ChatInput disabled />);
      // TipTap uses contenteditable="false" for disabled state
      expect(screen.getByRole('textbox')).toHaveAttribute('contenteditable', 'false');
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

  describe('inline image chips', () => {
    it('shows image well when image is pasted', async () => {
      const user = userEvent.setup();
      const { container } = render(<ChatInput />);

      const editor = screen.getByRole('textbox');
      await user.click(editor);
      await user.type(editor, 'Hello ');

      // Paste an image
      await pasteImage(editor);

      // Check that image well is rendered with the thumbnail
      await waitFor(() => {
        const imageWell = container.querySelector(`.${styles.imageWell}`);
        expect(imageWell).toBeInTheDocument();
      });
    });

    it('includes images in submit data when inline chips are present', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<ChatInput onSubmit={onSubmit} />);

      const editor = screen.getByRole('textbox');
      await user.click(editor);
      await user.type(editor, 'Check this image ');

      // Paste an image
      await pasteImage(editor);

      // Submit
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            images: expect.arrayContaining([
              expect.objectContaining({
                name: 'Image #1',
                file: expect.any(File),
              }),
            ]),
          })
        );
      });
    });

    it('names images based on position in content (Image #1, Image #2)', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      const { container } = render(<ChatInput onSubmit={onSubmit} />);

      const editor = screen.getByRole('textbox');
      await user.click(editor);

      // Paste first image
      await pasteImage(editor, 'first.png');

      // Type more text then paste second image
      await user.type(editor, ' text ');
      await pasteImage(editor, 'second.png');

      // Check well shows both images in order
      await waitFor(() => {
        const thumbnails = container.querySelectorAll(`.${styles.imageThumbnail}`);
        expect(thumbnails).toHaveLength(2);
        expect(thumbnails[0].textContent).toContain('Image #1');
        expect(thumbnails[1].textContent).toContain('Image #2');
      });
    });

    it('well items do not have remove buttons', async () => {
      const user = userEvent.setup();
      const { container } = render(<ChatInput />);

      const editor = screen.getByRole('textbox');
      await user.click(editor);

      // Paste an image
      await pasteImage(editor);

      // Wait for well to appear
      await waitFor(() => {
        const imageWell = container.querySelector(`.${styles.imageWell}`);
        expect(imageWell).toBeInTheDocument();
      });

      // Check that there's no remove button in the well
      const imageWell = container.querySelector(`.${styles.imageWell}`);
      const removeButtons = imageWell?.querySelectorAll('button[aria-label="Remove"]');
      expect(removeButtons?.length || 0).toBe(0);
    });

    it('clicking well item triggers chip selection', async () => {
      const user = userEvent.setup();
      const { container } = render(<ChatInput />);

      const editor = screen.getByRole('textbox');
      await user.click(editor);
      await user.type(editor, 'Hello ');

      // Paste an image
      await pasteImage(editor);

      // Wait for well to appear
      await waitFor(() => {
        const imageWell = container.querySelector(`.${styles.imageWell}`);
        expect(imageWell).toBeInTheDocument();
      });

      // Click on well thumbnail - this should not throw an error
      const thumbnail = container.querySelector(`.${styles.imageThumbnail}`) as HTMLElement;
      expect(thumbnail).toBeInTheDocument();

      // Should be able to click without error
      await user.click(thumbnail);
      // Test passes if no error is thrown
    });

    it('inline chip has remove button that works', async () => {
      const user = userEvent.setup();
      const { container } = render(<ChatInput />);

      const editor = screen.getByRole('textbox');
      await user.click(editor);
      await user.type(editor, 'Hello ');

      // Paste an image
      await pasteImage(editor);

      // Wait for chip to be rendered with remove button
      await waitFor(() => {
        const removeButton = screen.queryByRole('button', { name: /remove/i });
        expect(removeButton).toBeInTheDocument();
      });

      // Click remove button on inline chip
      const removeButton = screen.getByRole('button', { name: /remove/i });
      await user.click(removeButton);

      // Wait for image to be removed - well should disappear
      await waitFor(() => {
        const imageWell = container.querySelector(`.${styles.imageWell}`);
        expect(imageWell).not.toBeInTheDocument();
      });
    });

    it('renumbers chips when one is removed (second becomes first)', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      const { container } = render(<ChatInput onSubmit={onSubmit} />);

      const editor = screen.getByRole('textbox');
      await user.click(editor);

      // Paste first image
      await pasteImage(editor, 'first.png');

      // Paste second image
      await pasteImage(editor, 'second.png');

      // Wait for both to appear
      await waitFor(() => {
        const thumbnails = container.querySelectorAll(`.${styles.imageThumbnail}`);
        expect(thumbnails).toHaveLength(2);
      });

      // Click remove button on first chip (there should be two remove buttons)
      const removeButtons = screen.getAllByRole('button', { name: /remove/i });
      expect(removeButtons.length).toBe(2);
      await user.click(removeButtons[0]);

      // Wait for renumbering
      await waitFor(() => {
        const thumbnails = container.querySelectorAll(`.${styles.imageThumbnail}`);
        expect(thumbnails).toHaveLength(1);
        expect(thumbnails[0].textContent).toContain('Image #1');
      });

      // Type something to ensure we can submit
      await user.type(editor, 'test');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
        const lastCall = onSubmit.mock.calls[onSubmit.mock.calls.length - 1][0];
        expect(lastCall.images).toHaveLength(1);
        expect(lastCall.images[0].name).toBe('Image #1');
      });
    });

    it('images are always ordered by position in content', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      const { container } = render(<ChatInput onSubmit={onSubmit} />);

      const editor = screen.getByRole('textbox');
      await user.click(editor);

      // Paste first image
      await pasteImage(editor, 'first.png');

      // Paste second image
      await pasteImage(editor, 'second.png');

      // Wait for both to appear
      await waitFor(() => {
        const thumbnails = container.querySelectorAll(`.${styles.imageThumbnail}`);
        expect(thumbnails).toHaveLength(2);
      });

      // Verify image well shows images in correct order (first = #1, second = #2)
      const thumbnails = container.querySelectorAll(`.${styles.imageThumbnail}`);
      expect(thumbnails[0].textContent).toContain('Image #1');
      expect(thumbnails[1].textContent).toContain('Image #2');
    });

    it('respects maxImages limit', async () => {
      const user = userEvent.setup();
      const { container } = render(<ChatInput maxImages={2} />);

      const editor = screen.getByRole('textbox');
      await user.click(editor);

      // Paste 3 images
      await pasteImage(editor, 'first.png');
      await pasteImage(editor, 'second.png');
      await pasteImage(editor, 'third.png');

      // Only 2 should be added
      await waitFor(() => {
        const thumbnails = container.querySelectorAll(`.${styles.imageThumbnail}`);
        expect(thumbnails).toHaveLength(2);
      });
    });

    it('clears images on submit', async () => {
      const user = userEvent.setup();
      const { container } = render(<ChatInput onSubmit={vi.fn()} />);

      const editor = screen.getByRole('textbox');
      await user.click(editor);
      await user.type(editor, 'Hello');

      // Paste an image
      await pasteImage(editor);

      // Wait for well
      await waitFor(() => {
        expect(container.querySelector(`.${styles.imageWell}`)).toBeInTheDocument();
      });

      // Submit
      await user.keyboard('{Enter}');

      // Well should be gone
      await waitFor(() => {
        expect(container.querySelector(`.${styles.imageWell}`)).not.toBeInTheDocument();
      });
    });

    it('clears images on Escape', async () => {
      const user = userEvent.setup();
      const { container } = render(<ChatInput />);

      const editor = screen.getByRole('textbox');
      await user.click(editor);
      await user.type(editor, 'Hello');

      // Paste an image
      await pasteImage(editor);

      // Wait for well
      await waitFor(() => {
        expect(container.querySelector(`.${styles.imageWell}`)).toBeInTheDocument();
      });

      // Press Escape twice (requires two consecutive presses to clear)
      await user.keyboard('{Escape}');
      await user.keyboard('{Escape}');

      // Well should be gone
      await waitFor(() => {
        expect(container.querySelector(`.${styles.imageWell}`)).not.toBeInTheDocument();
      });
    });
  });
});
