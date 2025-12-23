import {
  useEffect,
  useCallback,
  useState,
  useRef,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '../../hooks';
import { SurfaceAnimation } from '../Animation';
import { RelativeTime } from '../RelativeTime';
import { useImageZoom } from './useImageZoom';
import styles from './ImagePreview.module.css';

/**
 * ImagePreview component - fullscreen image viewer with zoom/pan
 *
 * Features:
 * - Fullscreen display with dimmed backdrop
 * - Ctrl+wheel zoom centered on mouse position
 * - Drag to pan when zoomed in
 * - Pinch-to-zoom and touch pan for mobile
 * - Escape: reset zoom if zoomed, close if not
 * - X button and backdrop click to close
 * - Caption with optional author and timestamp
 *
 * @example
 * <ImagePreview
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   src={imageUrl}
 *   name="Photo"
 *   username="John Doe"
 *   timestamp={createdAt}
 * />
 */

export interface ImagePreviewProps {
  /** Whether the preview is open */
  open: boolean;
  /** Callback when preview should close */
  onClose: () => void;
  /** Image source URL */
  src: string;
  /** Alt text for the image */
  alt?: string;
  /** Image name/title for caption */
  name?: string;
  /** Username who created/uploaded the image */
  username?: string;
  /** Timestamp for the image (shown in caption as relative time) */
  timestamp?: Date | number | string;
  /** Minimum zoom level (default: 0.5) */
  minZoom?: number;
  /** Maximum zoom level (default: 10) */
  maxZoom?: number;
  /** Zoom step per wheel tick (default: 0.15) */
  zoomStep?: number;
  /** Custom caption renderer (overrides default caption) */
  renderCaption?: () => ReactNode;
  /** Additional class name */
  className?: string;
}

export function ImagePreview({
  open,
  onClose,
  src,
  alt,
  name,
  username,
  timestamp,
  minZoom = 0.5,
  maxZoom = 10,
  zoomStep = 0.15,
  renderCaption,
  className,
}: ImagePreviewProps) {
  const [visible, setVisible] = useState(open);
  const [exiting, setExiting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Zoom/pan state
  const { state, isZoomedIn, handlers, reset, isDragging, isAnimating } = useImageZoom(
    imageContainerRef,
    { minZoom, maxZoom, zoomStep }
  );

  // Focus trap when visible
  useFocusTrap(containerRef, visible && !exiting);

  // Handle escape key - context-aware
  const handleKeyDown = useCallback(
    (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();

        if (isZoomedIn) {
          // First escape resets zoom
          reset();
        } else {
          // Escape when not zoomed closes the preview
          onClose();
        }
      }
    },
    [isZoomedIn, reset, onClose]
  );

  // Handle exit animation complete
  const handleExitComplete = useCallback(() => {
    setVisible(false);
    setExiting(false);
    reset(); // Reset zoom on close
  }, [reset]);

  // Handle open/close state changes
  useEffect(() => {
    if (open) {
      setVisible(true);
      setExiting(false);
    } else if (visible) {
      setExiting(true);
    }
  }, [open, visible]);

  // Add/remove event listeners
  useEffect(() => {
    if (visible) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [visible, handleKeyDown]);

  // Prevent browser zoom on Ctrl+wheel with passive: false
  // React's synthetic events can't reliably prevent default on wheel
  useEffect(() => {
    const container = imageContainerRef.current;
    if (!container || !visible) return;

    const handleNativeWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };

    container.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleNativeWheel);
    };
  }, [visible]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if clicking directly on backdrop, not on the image
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!visible) return null;

  // Default caption
  const showCaption = !isZoomedIn && (name || renderCaption);
  const defaultCaption = name && (
    <div className={styles.caption}>
      <span className={styles.captionName}>{name}</span>
      {username && (
        <>
          <span className={styles.captionSeparator}> - </span>
          <span className={styles.captionAuthor}>created by {username}</span>
        </>
      )}
      {timestamp && (
        <>
          <span className={styles.captionSeparator}> (</span>
          <RelativeTime timestamp={timestamp} format="short" size="sm" color="inherit" />
          <span className={styles.captionSeparator}>)</span>
        </>
      )}
    </div>
  );

  const preview = (
    <div
      ref={containerRef}
      className={`${styles.backdrop} ${exiting ? styles.exiting : ''}`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={`Image preview: ${alt || name || 'Image'}`}
    >
      {/* Close button */}
      <button
        type="button"
        className={styles.closeButton}
        onClick={onClose}
        aria-label="Close image preview"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Image container with zoom/pan */}
      <SurfaceAnimation
        isVisible={open && !exiting}
        direction="center"
        duration={200}
        scale={0.9}
        onExitComplete={handleExitComplete}
      >
        <div
          ref={imageContainerRef}
          className={`${styles.imageContainer} ${className || ''}`}
          style={{
            cursor: isZoomedIn ? (isDragging ? 'grabbing' : 'grab') : 'default',
          }}
          {...handlers}
        >
          <img
            src={src}
            alt={alt || name || 'Preview image'}
            className={styles.image}
            style={{
              transform: `translate(${state.translateX}px, ${state.translateY}px) scale(${state.scale})`,
              transition: isAnimating ? 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
            }}
            draggable={false}
          />
        </div>
      </SurfaceAnimation>

      {/* Caption - only visible when not zoomed in */}
      {showCaption && (
        <div className={styles.captionContainer}>
          {renderCaption ? renderCaption() : defaultCaption}
        </div>
      )}

      {/* Zoom hint */}
      {!isZoomedIn && (
        <div className={styles.hint}>
          Ctrl+scroll to zoom
        </div>
      )}
    </div>
  );

  return createPortal(preview, document.body);
}

ImagePreview.displayName = 'ImagePreview';
