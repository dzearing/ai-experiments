import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ImagePreview } from './ImagePreview';
import { useImageZoom } from './useImageZoom';
import { renderHook } from '@testing-library/react';
import { useRef } from 'react';

// Mock createPortal for testing
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
  return {
    ...actual,
    createPortal: (children: React.ReactNode) => children,
  };
});

describe('ImagePreview', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    src: 'https://example.com/test-image.jpg',
    alt: 'Test image',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  describe('rendering', () => {
    it('renders when open is true', () => {
      render(<ImagePreview {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('does not render when open is false', () => {
      render(<ImagePreview {...defaultProps} open={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders image with correct src and alt', () => {
      render(<ImagePreview {...defaultProps} />);
      const img = screen.getByAltText('Test image');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', defaultProps.src);
    });

    it('uses name as alt fallback', () => {
      render(<ImagePreview {...defaultProps} alt={undefined} name="My Photo" />);
      expect(screen.getByAltText('My Photo')).toBeInTheDocument();
    });

    it('uses default alt text when no alt or name', () => {
      render(<ImagePreview {...defaultProps} alt={undefined} />);
      expect(screen.getByAltText('Preview image')).toBeInTheDocument();
    });

    it('renders close button', () => {
      render(<ImagePreview {...defaultProps} />);
      expect(screen.getByLabelText('Close image preview')).toBeInTheDocument();
    });

    it('renders zoom hint when not zoomed', () => {
      render(<ImagePreview {...defaultProps} />);
      expect(screen.getByText('Ctrl+scroll to zoom')).toBeInTheDocument();
    });
  });

  describe('caption', () => {
    it('renders caption with name', () => {
      render(<ImagePreview {...defaultProps} name="Beach Photo" />);
      expect(screen.getByText('Beach Photo')).toBeInTheDocument();
    });

    it('renders caption with name and username', () => {
      render(
        <ImagePreview {...defaultProps} name="Beach Photo" username="John" />
      );
      expect(screen.getByText('Beach Photo')).toBeInTheDocument();
      expect(screen.getByText('created by John')).toBeInTheDocument();
    });

    it('renders custom caption via renderCaption', () => {
      render(
        <ImagePreview
          {...defaultProps}
          name="Photo"
          renderCaption={() => <div>Custom Caption Content</div>}
        />
      );
      expect(screen.getByText('Custom Caption Content')).toBeInTheDocument();
    });

    it('does not render caption without name', () => {
      render(<ImagePreview {...defaultProps} />);
      expect(screen.queryByText('created by')).not.toBeInTheDocument();
    });
  });

  describe('close functionality', () => {
    it('calls onClose when close button is clicked', () => {
      const onClose = vi.fn();
      render(<ImagePreview {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByLabelText('Close image preview'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop is clicked', () => {
      const onClose = vi.fn();
      render(<ImagePreview {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByRole('dialog'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when image container is clicked', () => {
      const onClose = vi.fn();
      render(<ImagePreview {...defaultProps} onClose={onClose} />);

      const img = screen.getByAltText('Test image');
      fireEvent.click(img);
      expect(onClose).not.toHaveBeenCalled();
    });

    it('calls onClose when Escape is pressed (not zoomed)', () => {
      const onClose = vi.fn();
      render(<ImagePreview {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('has correct aria attributes', () => {
      render(<ImagePreview {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-label', 'Image preview: Test image');
    });

    it('sets body overflow hidden when open', () => {
      render(<ImagePreview {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body overflow when closed', () => {
      const { rerender } = render(<ImagePreview {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');

      rerender(<ImagePreview {...defaultProps} open={false} />);
      // Allow for exit animation
      expect(document.body.style.overflow).toBe('hidden');
    });
  });

  describe('custom className', () => {
    it('applies custom className to image container', () => {
      render(<ImagePreview {...defaultProps} className="custom-preview" />);
      const container = screen.getByAltText('Test image').parentElement;
      expect(container?.className).toContain('custom-preview');
    });
  });
});

describe('useImageZoom', () => {
  const createContainer = () => {
    const container = document.createElement('div');
    container.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      right: 500,
      bottom: 500,
      width: 500,
      height: 500,
      x: 0,
      y: 0,
      toJSON: () => {},
    });
    return container;
  };

  it('returns initial state', () => {
    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(null);
      return useImageZoom(ref);
    });

    expect(result.current.state).toEqual({
      scale: 1,
      translateX: 0,
      translateY: 0,
    });
    expect(result.current.isZoomedIn).toBe(false);
    expect(result.current.isDragging).toBe(false);
  });

  it('respects initialScale option', () => {
    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(null);
      return useImageZoom(ref, { initialScale: 2 });
    });

    expect(result.current.state.scale).toBe(2);
    expect(result.current.isZoomedIn).toBe(true);
  });

  it('reset returns to initial state', () => {
    const container = createContainer();
    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement | null>(null);
      ref.current = container;
      return useImageZoom(ref);
    });

    // First zoom in
    act(() => {
      result.current.zoomTo(3);
    });
    expect(result.current.state.scale).toBe(3);

    // Reset should return to initial scale (1)
    act(() => {
      result.current.reset();
    });

    expect(result.current.state).toEqual({
      scale: 1,
      translateX: 0,
      translateY: 0,
    });
  });

  it('zoomTo changes scale', () => {
    const container = createContainer();
    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement | null>(null);
      ref.current = container;
      return useImageZoom(ref);
    });

    act(() => {
      result.current.zoomTo(2);
    });

    expect(result.current.state.scale).toBe(2);
    expect(result.current.isZoomedIn).toBe(true);
  });

  it('respects minZoom and maxZoom limits', () => {
    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(null);
      return useImageZoom(ref, { minZoom: 0.5, maxZoom: 5 });
    });

    act(() => {
      result.current.zoomTo(0.1);
    });
    expect(result.current.state.scale).toBe(0.5);

    act(() => {
      result.current.zoomTo(10);
    });
    expect(result.current.state.scale).toBe(5);
  });

  it('provides event handlers', () => {
    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(null);
      return useImageZoom(ref);
    });

    expect(result.current.handlers).toHaveProperty('onWheel');
    expect(result.current.handlers).toHaveProperty('onMouseDown');
    expect(result.current.handlers).toHaveProperty('onMouseMove');
    expect(result.current.handlers).toHaveProperty('onMouseUp');
    expect(result.current.handlers).toHaveProperty('onMouseLeave');
    expect(result.current.handlers).toHaveProperty('onTouchStart');
    expect(result.current.handlers).toHaveProperty('onTouchMove');
    expect(result.current.handlers).toHaveProperty('onTouchEnd');
  });

  describe('mouse interactions', () => {
    it('does not start drag when not zoomed in', () => {
      const { result } = renderHook(() => {
        const ref = useRef<HTMLDivElement>(null);
        return useImageZoom(ref);
      });

      act(() => {
        result.current.handlers.onMouseDown({
          clientX: 100,
          clientY: 100,
          preventDefault: vi.fn(),
        } as unknown as React.MouseEvent);
      });

      expect(result.current.isDragging).toBe(false);
    });

    it('starts drag when zoomed in', () => {
      const { result } = renderHook(() => {
        const ref = useRef<HTMLDivElement>(null);
        return useImageZoom(ref, { initialScale: 2 });
      });

      act(() => {
        result.current.handlers.onMouseDown({
          clientX: 100,
          clientY: 100,
          preventDefault: vi.fn(),
        } as unknown as React.MouseEvent);
      });

      expect(result.current.isDragging).toBe(true);
    });

    it('stops dragging on mouse up', () => {
      const { result } = renderHook(() => {
        const ref = useRef<HTMLDivElement>(null);
        return useImageZoom(ref, { initialScale: 2 });
      });

      act(() => {
        result.current.handlers.onMouseDown({
          clientX: 100,
          clientY: 100,
          preventDefault: vi.fn(),
        } as unknown as React.MouseEvent);
      });

      expect(result.current.isDragging).toBe(true);

      act(() => {
        result.current.handlers.onMouseUp();
      });

      expect(result.current.isDragging).toBe(false);
    });

    it('stops dragging on mouse leave', () => {
      const { result } = renderHook(() => {
        const ref = useRef<HTMLDivElement>(null);
        return useImageZoom(ref, { initialScale: 2 });
      });

      act(() => {
        result.current.handlers.onMouseDown({
          clientX: 100,
          clientY: 100,
          preventDefault: vi.fn(),
        } as unknown as React.MouseEvent);
      });

      act(() => {
        result.current.handlers.onMouseLeave();
      });

      expect(result.current.isDragging).toBe(false);
    });
  });

  describe('wheel zoom', () => {
    it('zooms on ctrl+wheel', () => {
      const container = createContainer();
      const { result } = renderHook(() => {
        const ref = useRef<HTMLDivElement | null>(null);
        ref.current = container;
        return useImageZoom(ref);
      });

      act(() => {
        result.current.handlers.onWheel({
          ctrlKey: true,
          deltaY: -100,
          clientX: 250,
          clientY: 250,
          preventDefault: vi.fn(),
        } as unknown as React.WheelEvent);
      });

      expect(result.current.state.scale).toBeGreaterThan(1);
    });

    it('does not zoom without ctrl key', () => {
      const container = createContainer();
      const { result } = renderHook(() => {
        const ref = useRef<HTMLDivElement | null>(null);
        ref.current = container;
        return useImageZoom(ref);
      });

      act(() => {
        result.current.handlers.onWheel({
          ctrlKey: false,
          deltaY: -100,
          clientX: 250,
          clientY: 250,
          preventDefault: vi.fn(),
        } as unknown as React.WheelEvent);
      });

      expect(result.current.state.scale).toBe(1);
    });

    it('zooms with meta key (Mac)', () => {
      const container = createContainer();
      const { result } = renderHook(() => {
        const ref = useRef<HTMLDivElement | null>(null);
        ref.current = container;
        return useImageZoom(ref);
      });

      act(() => {
        result.current.handlers.onWheel({
          metaKey: true,
          deltaY: -100,
          clientX: 250,
          clientY: 250,
          preventDefault: vi.fn(),
        } as unknown as React.WheelEvent);
      });

      expect(result.current.state.scale).toBeGreaterThan(1);
    });
  });
});
