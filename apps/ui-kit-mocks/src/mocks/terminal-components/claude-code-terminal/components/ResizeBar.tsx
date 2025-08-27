import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './ResizeBar.module.css';

interface ResizeBarProps {
  minWidth?: number;
  maxWidth?: number;
  defaultWidth?: number;
  onResize?: (width: number) => void;
  containerRef?: React.RefObject<HTMLElement>;
}

export const ResizeBar: React.FC<ResizeBarProps> = ({
  minWidth = 200,
  maxWidth = 500,
  defaultWidth = 280,
  onResize,
  containerRef,
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [width, setWidth] = useState(defaultWidth);
  const barRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      let newWidth: number;
      
      if (containerRef?.current) {
        // If we have a container reference, calculate relative to container
        const containerRect = containerRef.current.getBoundingClientRect();
        newWidth = e.clientX - containerRect.left;
      } else {
        // Otherwise use absolute position (for nav sidebar)
        newWidth = e.clientX;
      }
      
      newWidth = Math.min(maxWidth, Math.max(minWidth, newWidth));
      setWidth(newWidth);
      onResize?.(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isResizing, minWidth, maxWidth, onResize, containerRef]);

  return (
    <div 
      ref={barRef}
      className={`${styles.resizeBar} ${isResizing ? styles.resizing : ''}`}
      onMouseDown={handleMouseDown}
      style={{ cursor: 'col-resize' }}
    />
  );
};