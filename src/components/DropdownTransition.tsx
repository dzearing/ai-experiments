import { useEffect, useState, useRef } from 'react';
import type { ReactNode } from 'react';
import { useTheme } from '../contexts/ThemeContextV2';

interface DropdownTransitionProps {
  children: ReactNode;
  isOpen: boolean;
  className?: string;
  animationEnabled?: boolean;
}

export function DropdownTransition({ 
  children, 
  isOpen,
  className = '',
  animationEnabled = true
}: DropdownTransitionProps) {
  const { animationsEnabled } = useTheme();
  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  
  const shouldAnimate = animationEnabled && animationsEnabled;

  useEffect(() => {
    if (isOpen && !shouldRender) {
      setShouldRender(true);
      // Ensure the element is rendered with initial styles before animating
      if (shouldAnimate) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setIsAnimating(true);
          });
        });
      } else {
        setIsAnimating(true);
      }
    } else if (!isOpen && shouldRender) {
      setIsAnimating(false);
      if (shouldAnimate) {
        // Wait for animation to complete before unmounting
        timeoutRef.current = setTimeout(() => {
          setShouldRender(false);
        }, 150);
      } else {
        setShouldRender(false);
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isOpen, shouldRender, shouldAnimate]);

  if (!shouldRender) return null;

  const animationStyles = shouldAnimate ? {
    opacity: isAnimating ? 1 : 0,
    transform: isAnimating ? 'translateY(0)' : 'translateY(-8px)',
    transition: 'opacity 150ms ease-out, transform 150ms ease-out',
  } : {};

  // Merge animation styles with any height-related styles from className
  const finalStyles = {
    ...animationStyles,
    // Preserve height properties if className includes flex or height classes
    ...(className.includes('flex-1') || className.includes('h-full') ? { height: '100%' } : {})
  };

  return (
    <div 
      className={className}
      style={finalStyles}
    >
      {children}
    </div>
  );
}