import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: React.ReactNode;
  containerId?: string;
}

export function Portal({ children, containerId = 'portal-root' }: PortalProps) {
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Find or create the container element
    let container = document.getElementById(containerId);
    
    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      document.body.appendChild(container);
    }
    
    containerRef.current = container;
    
    // Cleanup: only remove if we created it and it's empty
    return () => {
      if (container && container.childNodes.length === 0) {
        container.remove();
      }
    };
  }, [containerId]);

  if (!containerRef.current) {
    return null;
  }

  return createPortal(children, containerRef.current);
}