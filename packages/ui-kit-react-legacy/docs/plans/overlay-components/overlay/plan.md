# Overlay Component

## Overview
A foundational component that renders content above the main application layer, providing backdrop and portal functionality for modals, dialogs, and popups.

## Component Specification

### Props
```typescript
interface OverlayProps extends HTMLAttributes<HTMLDivElement> {
  // Content
  children: ReactNode;
  
  // Visibility
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  
  // Backdrop behavior
  backdrop?: boolean | 'static'; // true = closable, 'static' = not closable, false = no backdrop
  backdropClassName?: string;
  
  // Portal behavior
  container?: Element | (() => Element); // Portal container
  disablePortal?: boolean; // Render in place instead of portal
  
  // Focus management
  trapFocus?: boolean; // Trap focus within overlay
  autoFocus?: boolean; // Auto-focus first focusable element
  restoreFocus?: boolean; // Restore focus when closed
  
  // Scroll behavior
  disableScrollLock?: boolean; // Prevent body scroll when open
  
  // Animation
  animationType?: 'fade' | 'slide' | 'zoom' | 'none';
  animationDuration?: number; // Animation duration in ms
  
  // Z-index management
  zIndex?: number;
  
  // Styling
  className?: string;
}
```

### Usage Examples
```tsx
// Basic overlay
<Overlay open={isOpen} onOpenChange={setIsOpen}>
  <div className="modal-content">
    <h2>Modal Title</h2>
    <p>Modal content goes here.</p>
    <button onClick={() => setIsOpen(false)}>Close</button>
  </div>
</Overlay>

// With backdrop that closes on click
<Overlay 
  open={showDialog} 
  onOpenChange={setShowDialog}
  backdrop={true}
>
  <DialogContent />
</Overlay>

// Static backdrop (no close on backdrop click)
<Overlay 
  open={showCriticalDialog} 
  backdrop="static"
>
  <CriticalDialog />
</Overlay>

// No backdrop
<Overlay 
  open={showTooltip} 
  backdrop={false}
  disableScrollLock
>
  <TooltipContent />
</Overlay>

// Custom animation
<Overlay 
  open={isVisible}
  animationType="slide"
  animationDuration={300}
>
  <SlideInContent />
</Overlay>

// Custom portal container
<Overlay 
  open={isModalOpen}
  container={() => document.getElementById('modal-root')}
>
  <ModalContent />
</Overlay>

// Focus management disabled
<Overlay 
  open={isOpen}
  trapFocus={false}
  autoFocus={false}
  restoreFocus={false}
>
  <CustomContent />
</Overlay>
```

## Visual Design

### Animation Types
- **fade**: Opacity transition
- **slide**: Slide in from specified direction
- **zoom**: Scale animation
- **none**: No animation

### Backdrop Styles
- Overlay background with appropriate opacity
- Blur effect (optional)
- Click-to-close indication

### Z-index Management
- Default high z-index (1000)
- Stacking context for nested overlays
- Portal rendering for proper layering

## Technical Implementation

### Core Structure
```typescript
const Overlay = forwardRef<HTMLDivElement, OverlayProps>(
  ({ 
    children,
    open,
    onOpenChange,
    backdrop = true,
    backdropClassName,
    container,
    disablePortal = false,
    trapFocus = true,
    autoFocus = true,
    restoreFocus = true,
    disableScrollLock = false,
    animationType = 'fade',
    animationDuration = 200,
    zIndex = 1000,
    className,
    ...props 
  }, ref) => {
    const [mounted, setMounted] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const overlayRef = useRef<HTMLDivElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);
    
    // Handle mount/unmount
    useEffect(() => {
      if (open) {\n        setMounted(true);\n        setIsAnimating(true);\n        \n        // Store previous focus\n        if (restoreFocus) {\n          previousFocusRef.current = document.activeElement as HTMLElement;\n        }\n        \n        const timer = setTimeout(() => setIsAnimating(false), animationDuration);\n        return () => clearTimeout(timer);\n      } else if (mounted) {\n        setIsAnimating(true);\n        \n        const timer = setTimeout(() => {\n          setMounted(false);\n          setIsAnimating(false);\n          \n          // Restore focus\n          if (restoreFocus && previousFocusRef.current) {\n            previousFocusRef.current.focus();\n          }\n        }, animationDuration);\n        \n        return () => clearTimeout(timer);\n      }\n    }, [open, mounted, animationDuration, restoreFocus]);\n    \n    // Scroll lock\n    useEffect(() => {\n      if (open && !disableScrollLock) {\n        const originalStyle = window.getComputedStyle(document.body).overflow;\n        document.body.style.overflow = 'hidden';\n        \n        return () => {\n          document.body.style.overflow = originalStyle;\n        };\n      }\n    }, [open, disableScrollLock]);\n    \n    // Focus trap\n    useEffect(() => {\n      if (open && mounted && trapFocus && overlayRef.current) {\n        const focusableElements = overlayRef.current.querySelectorAll(\n          'button, [href], input, select, textarea, [tabindex]:not([tabindex=\"-1\"])'\n        );\n        \n        if (autoFocus && focusableElements.length > 0) {\n          (focusableElements[0] as HTMLElement).focus();\n        }\n        \n        const handleKeyDown = (e: KeyboardEvent) => {\n          if (e.key === 'Tab') {\n            const firstElement = focusableElements[0] as HTMLElement;\n            const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;\n            \n            if (e.shiftKey) {\n              if (document.activeElement === firstElement) {\n                e.preventDefault();\n                lastElement.focus();\n              }\n            } else {\n              if (document.activeElement === lastElement) {\n                e.preventDefault();\n                firstElement.focus();\n              }\n            }\n          }\n        };\n        \n        document.addEventListener('keydown', handleKeyDown);\n        return () => document.removeEventListener('keydown', handleKeyDown);\n      }\n    }, [open, mounted, trapFocus, autoFocus]);\n    \n    // Handle backdrop click\n    const handleBackdropClick = (e: MouseEvent<HTMLDivElement>) => {\n      if (e.target === e.currentTarget && backdrop === true) {\n        onOpenChange?.(false);\n      }\n    };\n    \n    // Handle escape key\n    useEffect(() => {\n      const handleEscape = (e: KeyboardEvent) => {\n        if (e.key === 'Escape' && open && backdrop !== 'static') {\n          onOpenChange?.(false);\n        }\n      };\n      \n      if (open) {\n        document.addEventListener('keydown', handleEscape);\n        return () => document.removeEventListener('keydown', handleEscape);\n      }\n    }, [open, onOpenChange, backdrop]);\n    \n    if (!mounted) {\n      return null;\n    }\n    \n    const overlayContent = (\n      <div\n        ref={overlayRef}\n        className={cn(\n          overlayStyles.base,\n          overlayStyles.animation[animationType],\n          open && overlayStyles.open,\n          isAnimating && overlayStyles.animating,\n          className\n        )}\n        style={{ zIndex }}\n        {...props}\n      >\n        {/* Backdrop */}\n        {backdrop && (\n          <div\n            className={cn(overlayStyles.backdrop, backdropClassName)}\n            onClick={handleBackdropClick}\n            aria-hidden=\"true\"\n          />\n        )}\n        \n        {/* Content */}\n        <div className={overlayStyles.content}>\n          {children}\n        </div>\n      </div>\n    );\n    \n    // Portal or inline rendering\n    if (disablePortal) {\n      return overlayContent;\n    }\n    \n    return createPortal(\n      overlayContent,\n      container?.() || container || document.body\n    );\n  }\n);\n```\n\n### CSS Module Structure\n```css\n.base {\n  position: fixed;\n  top: 0;\n  left: 0;\n  width: 100%;\n  height: 100%;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  pointer-events: none;\n}\n\n.open {\n  pointer-events: auto;\n}\n\n.backdrop {\n  position: absolute;\n  top: 0;\n  left: 0;\n  width: 100%;\n  height: 100%;\n  background: rgba(0, 0, 0, 0.5);\n  backdrop-filter: blur(2px);\n}\n\n.content {\n  position: relative;\n  z-index: 1;\n  max-width: 90vw;\n  max-height: 90vh;\n  overflow: auto;\n}\n\n/* Animation variants */\n.animation {\n  &.fade {\n    opacity: 0;\n    transition: opacity var(--animation-duration, 200ms) ease;\n  }\n  \n  &.fade.open {\n    opacity: 1;\n  }\n  \n  &.slide {\n    transform: translateY(-20px);\n    opacity: 0;\n    transition: transform var(--animation-duration, 200ms) ease,\n                opacity var(--animation-duration, 200ms) ease;\n  }\n  \n  &.slide.open {\n    transform: translateY(0);\n    opacity: 1;\n  }\n  \n  &.zoom {\n    transform: scale(0.9);\n    opacity: 0;\n    transition: transform var(--animation-duration, 200ms) ease,\n                opacity var(--animation-duration, 200ms) ease;\n  }\n  \n  &.zoom.open {\n    transform: scale(1);\n    opacity: 1;\n  }\n  \n  &.none {\n    /* No animation */\n  }\n}\n\n.animating {\n  pointer-events: none;\n}\n```\n\n## Accessibility Features\n- Focus trap management\n- Keyboard navigation (Escape to close)\n- Screen reader support\n- Focus restoration\n- ARIA attributes for modal content\n\n### Focus Management\n```typescript\n// Focus trap implementation\nconst trapFocus = (container: HTMLElement) => {\n  const focusableElements = container.querySelectorAll(\n    'button, [href], input, select, textarea, [tabindex]:not([tabindex=\"-1\"])'\n  );\n  \n  const firstElement = focusableElements[0] as HTMLElement;\n  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;\n  \n  return { firstElement, lastElement };\n};\n```\n\n## Dependencies\n- React (forwardRef, useState, useEffect, useRef)\n- React DOM (createPortal)\n- CSS modules\n- Utility functions (cn)\n\n## Design Tokens Used\n- **Colors**: backdrop colors\n- **Transitions**: animation timing\n- **Z-index**: layering values\n- **Backdrop Filter**: blur effects\n\n## Testing Considerations\n- Focus management and trapping\n- Scroll lock behavior\n- Portal rendering\n- Animation states\n- Keyboard navigation\n- Screen reader compatibility\n- Backdrop click handling\n- Escape key functionality\n\n## Related Components\n- Modal (builds on Overlay)\n- Dialog (uses Overlay)\n- Drawer (side overlay)\n- Popover (positioned overlay)\n- Tooltip (simple overlay)\n\n## Common Use Cases\n- Modal dialogs\n- Confirmation dialogs\n- Image lightboxes\n- Side drawers\n- Popup menus\n- Loading overlays\n- Toast containers\n- Dropdown menus