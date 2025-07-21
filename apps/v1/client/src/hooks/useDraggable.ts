import { useRef, useEffect, useState } from 'react';

interface UseDraggableOptions {
  initialX?: number;
  initialY?: number;
  onDrag?: (x: number, y: number) => void;
  onDragEnd?: (x: number, y: number) => void;
}

export function useDraggable(options: UseDraggableOptions = {}) {
  const [position, setPosition] = useState({ x: options.initialX || 0, y: options.initialY || 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const elementStartPos = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (!handleRef.current?.contains(e.target as Node)) return;

      e.preventDefault();
      setIsDragging(true);
      isDraggingRef.current = true;

      // Store initial positions
      dragStartPos.current = { x: e.clientX, y: e.clientY };
      elementStartPos.current = { ...position };

      // Add listeners to document to capture mouse movement outside element
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      const deltaX = e.clientX - dragStartPos.current.x;
      const deltaY = e.clientY - dragStartPos.current.y;

      const newX = elementStartPos.current.x + deltaX;
      const newY = elementStartPos.current.y + deltaY;

      setPosition({ x: newX, y: newY });
      options.onDrag?.(newX, newY);
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      setIsDragging(false);
      isDraggingRef.current = false;

      const deltaX = e.clientX - dragStartPos.current.x;
      const deltaY = e.clientY - dragStartPos.current.y;

      const finalX = elementStartPos.current.x + deltaX;
      const finalY = elementStartPos.current.y + deltaY;

      options.onDragEnd?.(finalX, finalY);

      // Remove document listeners
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    // Add mousedown listener to handle
    const handle = handleRef.current;
    if (handle) {
      handle.addEventListener('mousedown', handleMouseDown);
    }

    // Cleanup
    return () => {
      if (handle) {
        handle.removeEventListener('mousedown', handleMouseDown);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [position, options]);

  return {
    dragRef,
    handleRef,
    position,
    isDragging,
    style: {
      transform: `translate(${position.x}px, ${position.y}px)`,
      transition: isDragging ? 'none' : 'transform 0.2s ease-out',
    },
  };
}
