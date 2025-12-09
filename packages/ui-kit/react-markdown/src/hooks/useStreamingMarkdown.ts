/**
 * useStreamingMarkdown hook
 *
 * Provides character-by-character streaming effect for markdown content,
 * useful for AI response animations.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface StreamingOptions {
  /** Characters to reveal per frame */
  speed?: number;
  /** Delay between frames in ms */
  delay?: number;
  /** Show typing cursor */
  showCursor?: boolean;
  /** Callback when streaming completes */
  onComplete?: () => void;
}

export interface StreamingState {
  /** Currently displayed content */
  displayContent: string;
  /** Whether currently streaming */
  isStreaming: boolean;
  /** Skip to end function */
  skipToEnd: () => void;
  /** Progress 0-1 */
  progress: number;
}

export function useStreamingMarkdown(
  fullContent: string,
  streaming: boolean,
  options: StreamingOptions = {}
): StreamingState {
  const {
    speed = 3,
    delay = 16, // ~60fps
    onComplete,
  } = options;

  const [displayContent, setDisplayContent] = useState(streaming ? '' : fullContent);
  const [isStreaming, setIsStreaming] = useState(false);
  const [progress, setProgress] = useState(streaming ? 0 : 1);

  const contentRef = useRef(fullContent);
  const positionRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);

  // Update content ref when full content changes
  useEffect(() => {
    contentRef.current = fullContent;

    // If not in streaming mode, update immediately
    if (!streaming) {
      setDisplayContent(fullContent);
      setProgress(1);
      setIsStreaming(false);
    }
  }, [fullContent, streaming]);

  // Handle streaming animation
  useEffect(() => {
    if (!streaming) {
      // Cancel any pending animation
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    setIsStreaming(true);
    positionRef.current = 0;
    setDisplayContent('');
    setProgress(0);

    const animate = (timestamp: number) => {
      // Throttle based on delay
      if (timestamp - lastTimeRef.current < delay) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }
      lastTimeRef.current = timestamp;

      const content = contentRef.current;
      const currentPos = positionRef.current;

      if (currentPos >= content.length) {
        // Streaming complete
        setIsStreaming(false);
        setProgress(1);
        onComplete?.();
        return;
      }

      // Advance position by speed characters
      const newPos = Math.min(currentPos + speed, content.length);
      positionRef.current = newPos;

      // Update display content
      setDisplayContent(content.slice(0, newPos));
      setProgress(newPos / content.length);

      // Schedule next frame
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [streaming, speed, delay, onComplete]);

  // Skip to end function
  const skipToEnd = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    setDisplayContent(contentRef.current);
    setProgress(1);
    setIsStreaming(false);
    positionRef.current = contentRef.current.length;
    onComplete?.();
  }, [onComplete]);

  return {
    displayContent,
    isStreaming,
    skipToEnd,
    progress,
  };
}

export default useStreamingMarkdown;
