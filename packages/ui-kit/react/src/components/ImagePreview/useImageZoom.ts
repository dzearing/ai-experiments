import { useState, useCallback, useRef, type RefObject } from 'react';

/**
 * Zoom and pan state for image preview.
 */
export interface ZoomState {
  /** Current scale (1 = 100%) */
  scale: number;
  /** Horizontal translation in pixels */
  translateX: number;
  /** Vertical translation in pixels */
  translateY: number;
}

/**
 * Options for the useImageZoom hook.
 */
export interface UseImageZoomOptions {
  /** Minimum zoom level (default: 0.5) */
  minZoom?: number;
  /** Maximum zoom level (default: 10) */
  maxZoom?: number;
  /** Zoom step per wheel tick (default: 0.15) */
  zoomStep?: number;
  /** Initial scale (default: 1) */
  initialScale?: number;
}

/**
 * Return value from useImageZoom hook.
 */
export interface UseImageZoomReturn {
  /** Current zoom/pan state */
  state: ZoomState;
  /** Whether the image is zoomed in (scale > 1) */
  isZoomedIn: boolean;
  /** Event handlers to attach to the container */
  handlers: {
    onWheel: (e: React.WheelEvent) => void;
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseUp: () => void;
    onMouseLeave: () => void;
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
  };
  /** Reset to initial state (with optional animation) */
  reset: () => void;
  /** Zoom to a specific scale */
  zoomTo: (scale: number, centerX?: number, centerY?: number) => void;
  /** Whether currently dragging */
  isDragging: boolean;
  /** Whether currently animating (e.g., reset transition) */
  isAnimating: boolean;
}

/**
 * Clamp a value between min and max.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Normalize wheel delta across different input devices.
 *
 * Mouse wheels typically send larger, discrete deltas (~100-120 per tick).
 * Trackpads send smaller, continuous deltas (can be 1-50 per event).
 *
 * This function normalizes both to a consistent zoom factor.
 */
function normalizeWheelDelta(e: React.WheelEvent): number {
  let delta = e.deltaY;

  // Handle different delta modes
  // 0 = pixels (most common, especially for trackpads)
  // 1 = lines (some mice)
  // 2 = pages (rare)
  if (e.deltaMode === 1) {
    // Line mode - multiply to approximate pixel value
    delta *= 20;
  } else if (e.deltaMode === 2) {
    // Page mode - multiply to approximate pixel value
    delta *= 400;
  }

  // Normalize the delta to a reasonable zoom factor
  // - Mouse wheels: ~100-120 per tick -> ~0.25-0.30 zoom factor
  // - Trackpads: ~10-50 per event -> ~0.025-0.125 zoom factor
  //
  // Divisor of 400 for snappier response
  const normalizedDelta = delta / 400;

  // Clamp to prevent extreme zoom jumps from fast scrolling
  return clamp(normalizedDelta, -0.25, 0.25);
}

/**
 * Calculate distance between two touch points.
 */
function getTouchDistance(touches: React.TouchList): number {
  if (touches.length < 2) return 0;
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Get center point between two touches.
 */
function getTouchCenter(touches: React.TouchList): { x: number; y: number } {
  if (touches.length < 2) {
    return { x: touches[0].clientX, y: touches[0].clientY };
  }
  return {
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2,
  };
}

/**
 * Hook for managing image zoom and pan state.
 *
 * @param containerRef - Ref to the container element
 * @param options - Zoom configuration options
 * @returns Zoom state and handlers
 *
 * @example
 * const containerRef = useRef<HTMLDivElement>(null);
 * const { state, handlers, isZoomedIn, reset } = useImageZoom(containerRef);
 *
 * return (
 *   <div ref={containerRef} {...handlers}>
 *     <img style={{ transform: `translate(${state.translateX}px, ${state.translateY}px) scale(${state.scale})` }} />
 *   </div>
 * );
 */
export function useImageZoom(
  containerRef: RefObject<HTMLElement | null>,
  options: UseImageZoomOptions = {}
): UseImageZoomReturn {
  const {
    minZoom = 0.5,
    maxZoom = 10,
    // zoomStep is no longer used - we use normalized wheel delta instead
    initialScale = 1,
  } = options;

  const [state, setState] = useState<ZoomState>({
    scale: initialScale,
    translateX: 0,
    translateY: 0,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Track drag start position
  const dragStart = useRef({ x: 0, y: 0 });

  // Track pinch zoom start state
  const pinchStart = useRef({ distance: 0, scale: 1 });

  const isZoomedIn = state.scale > 1;

  /**
   * Handle wheel zoom (Ctrl+wheel).
   */
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      // Only zoom when Ctrl is pressed
      if (!e.ctrlKey && !e.metaKey) return;

      // Always prevent default to stop browser optical zoom
      e.preventDefault();

      const container = containerRef.current;
      if (!container) return;

      // Normalize the wheel delta for consistent behavior across devices
      // Negative delta = zoom in, positive = zoom out
      const normalizedDelta = normalizeWheelDelta(e);

      // Apply zoom - use exponential scaling for smoother feel
      const zoomFactor = 1 - normalizedDelta;
      const newScale = clamp(state.scale * zoomFactor, minZoom, maxZoom);

      // Skip state update if scale hasn't changed (at limits)
      // but still prevent default above to block browser zoom
      if (newScale === state.scale) return;

      // Get mouse position relative to container
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Calculate new translate to keep mouse position stable
      // The point under the mouse should stay in the same place
      const scaleRatio = newScale / state.scale;
      const newTranslateX = mouseX - (mouseX - state.translateX) * scaleRatio;
      const newTranslateY = mouseY - (mouseY - state.translateY) * scaleRatio;

      setState({
        scale: newScale,
        translateX: newTranslateX,
        translateY: newTranslateY,
      });
    },
    [containerRef, state, minZoom, maxZoom]
  );

  /**
   * Handle mouse down to start dragging.
   */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only pan when zoomed in
      if (!isZoomedIn) return;

      e.preventDefault();
      setIsDragging(true);
      dragStart.current = {
        x: e.clientX - state.translateX,
        y: e.clientY - state.translateY,
      };
    },
    [isZoomedIn, state.translateX, state.translateY]
  );

  /**
   * Handle mouse move for panning.
   */
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;

      setState((prev) => ({
        ...prev,
        translateX: e.clientX - dragStart.current.x,
        translateY: e.clientY - dragStart.current.y,
      }));
    },
    [isDragging]
  );

  /**
   * Handle mouse up to stop dragging.
   */
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  /**
   * Handle mouse leave to stop dragging.
   */
  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  /**
   * Handle touch start for pan/pinch.
   */
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        // Start pinch zoom
        const distance = getTouchDistance(e.touches);
        pinchStart.current = { distance, scale: state.scale };
      } else if (e.touches.length === 1 && isZoomedIn) {
        // Start pan
        setIsDragging(true);
        dragStart.current = {
          x: e.touches[0].clientX - state.translateX,
          y: e.touches[0].clientY - state.translateY,
        };
      }
    },
    [state.scale, state.translateX, state.translateY, isZoomedIn]
  );

  /**
   * Handle touch move for pan/pinch.
   */
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        // Pinch zoom
        e.preventDefault();
        const distance = getTouchDistance(e.touches);
        const scaleChange = distance / pinchStart.current.distance;
        const newScale = clamp(
          pinchStart.current.scale * scaleChange,
          minZoom,
          maxZoom
        );

        // Get pinch center
        const center = getTouchCenter(e.touches);
        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const centerX = center.x - rect.left;
        const centerY = center.y - rect.top;

        // Calculate new translate to zoom toward center
        const scaleRatio = newScale / state.scale;
        const newTranslateX = centerX - (centerX - state.translateX) * scaleRatio;
        const newTranslateY = centerY - (centerY - state.translateY) * scaleRatio;

        setState({
          scale: newScale,
          translateX: newTranslateX,
          translateY: newTranslateY,
        });
      } else if (e.touches.length === 1 && isDragging) {
        // Pan
        setState((prev) => ({
          ...prev,
          translateX: e.touches[0].clientX - dragStart.current.x,
          translateY: e.touches[0].clientY - dragStart.current.y,
        }));
      }
    },
    [containerRef, state, isDragging, minZoom, maxZoom]
  );

  /**
   * Handle touch end.
   */
  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  /**
   * Reset to initial state with smooth animation.
   */
  const reset = useCallback(() => {
    // Enable animation for the transition
    setIsAnimating(true);
    setState({
      scale: initialScale,
      translateX: 0,
      translateY: 0,
    });
    setIsDragging(false);

    // Disable animation after transition completes
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 300); // Match CSS transition duration

    return () => clearTimeout(timer);
  }, [initialScale]);

  /**
   * Zoom to a specific scale, optionally centered on a point.
   */
  const zoomTo = useCallback(
    (scale: number, centerX?: number, centerY?: number) => {
      const newScale = clamp(scale, minZoom, maxZoom);
      const container = containerRef.current;

      if (centerX !== undefined && centerY !== undefined && container) {
        const rect = container.getBoundingClientRect();
        const localX = centerX - rect.left;
        const localY = centerY - rect.top;

        const scaleRatio = newScale / state.scale;
        const newTranslateX = localX - (localX - state.translateX) * scaleRatio;
        const newTranslateY = localY - (localY - state.translateY) * scaleRatio;

        setState({
          scale: newScale,
          translateX: newTranslateX,
          translateY: newTranslateY,
        });
      } else {
        setState((prev) => ({
          ...prev,
          scale: newScale,
        }));
      }
    },
    [containerRef, state, minZoom, maxZoom]
  );

  return {
    state,
    isZoomedIn,
    handlers: {
      onWheel: handleWheel,
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseLeave,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    reset,
    zoomTo,
    isDragging,
    isAnimating,
  };
}
