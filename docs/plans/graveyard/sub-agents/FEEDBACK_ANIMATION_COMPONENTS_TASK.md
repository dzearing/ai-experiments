# Sub-Agent Task: Feedback & Animation Specialist

## Objective
Design comprehensive feedback and animation components that provide clear user communication, smooth transitions, and delightful micro-interactions. Focus on performance, accessibility (reduced motion support), and consistent animation language.

## Assigned Components (High Priority: 7, Medium Priority: 13)

### High Priority Components
1. Alert (inline alerts)
2. ProgressBar
3. LoadingOverlay
4. LoadingButton
5. ErrorMessage
6. SuccessMessage
7. ValidationMessage

### Medium Priority Components
1. PageTransition
2. SlideTransition
3. FadeTransition
4. AnimatedCounter
5. DurationCounter
6. ProgressRing
7. SkeletonLoader
8. PulseLoader
9. ProgressSteps
10. StatusIndicator
11. WarningMessage
12. InfoMessage
13. HelpTooltip

## Animation System Architecture

### 1. Core Animation Tokens
```typescript
// Animation duration tokens
const duration = {
  instant: '0ms',
  fast: '150ms',
  normal: '250ms',
  slow: '400ms',
  slower: '600ms',
  lazy: '1000ms'
};

// Easing function tokens
const easing = {
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
};

// Motion tokens
const motion = {
  subtle: '2px',
  small: '4px',
  medium: '8px',
  large: '16px',
  extreme: '32px'
};
```

### 2. Reduced Motion Support
```typescript
// Global motion preference hook
const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const listener = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);
  
  return prefersReducedMotion;
};

// Animation wrapper component
interface AnimationProps {
  children: React.ReactNode;
  animation: string;
  duration?: number;
  reducedMotionFallback?: string;
}
```

## Component Specifications

### 1. Alert Component
```typescript
interface AlertProps {
  // Content
  title?: string;
  description?: string;
  children?: React.ReactNode;
  
  // Type
  variant: 'info' | 'success' | 'warning' | 'error';
  
  // Actions
  action?: React.ReactNode;
  onClose?: () => void;
  closable?: boolean;
  
  // Display
  icon?: React.ReactNode | boolean;
  banner?: boolean; // full-width style
  
  // Animation
  animate?: boolean;
  animateIn?: 'fade' | 'slide' | 'scale';
  
  // Accessibility
  role?: 'alert' | 'status';
  live?: 'polite' | 'assertive';
}
```

### Alert HTML Mockup
```html
<!-- Alert - Error Variant with Actions -->
<div 
  class="alert alert--error"
  role="alert"
  aria-live="assertive"
  data-animate="slide"
>
  <div class="alert__icon">
    <svg class="icon icon--error">
      <!-- error icon -->
    </svg>
  </div>
  
  <div class="alert__content">
    <div class="alert__title">Payment Failed</div>
    <div class="alert__description">
      Your payment could not be processed. Please check your card details and try again.
    </div>
  </div>
  
  <div class="alert__actions">
    <button class="button button--sm button--primary">
      Retry Payment
    </button>
    <button class="button button--sm button--ghost">
      Use Different Card
    </button>
  </div>
  
  <button class="alert__close" aria-label="Dismiss alert">
    <svg><!-- close icon --></svg>
  </button>
</div>

<style>
.alert {
  --alert-bg: var(--color-surface-secondary);
  --alert-border: var(--color-border-primary);
  --alert-color: var(--color-text-primary);
  
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--alert-bg);
  border: 1px solid var(--alert-border);
  border-radius: var(--radius-md);
  position: relative;
  
  animation: slideIn var(--duration-normal) var(--easing-easeOut);
}

.alert--error {
  --alert-bg: var(--color-danger-subtle);
  --alert-border: var(--color-danger-muted);
  --alert-color: var(--color-danger);
}

@keyframes slideIn {
  from {
    transform: translateY(-8px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .alert {
    animation: none;
  }
}
</style>
```

### 2. ProgressBar Specification
```typescript
interface ProgressBarProps {
  // Value
  value: number; // 0-100
  max?: number;
  
  // Display
  label?: string;
  showValue?: boolean;
  
  // Variants
  variant?: 'default' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  
  // States
  indeterminate?: boolean;
  striped?: boolean;
  animated?: boolean;
  
  // Accessibility
  ariaLabel?: string;
  ariaValueText?: string;
}
```

### ProgressBar HTML Mockup
```html
<!-- ProgressBar - Animated with Label -->
<div class="progress-container">
  <div class="progress-header">
    <span class="progress-label">Uploading files...</span>
    <span class="progress-value">67%</span>
  </div>
  
  <div 
    class="progress-bar"
    role="progressbar"
    aria-valuenow="67"
    aria-valuemin="0"
    aria-valuemax="100"
    aria-label="Upload progress"
  >
    <div 
      class="progress-bar__fill progress-bar__fill--animated"
      style="--progress: 67%"
    >
      <div class="progress-bar__stripes"></div>
    </div>
  </div>
  
  <div class="progress-footer">
    <span class="progress-time">2 minutes remaining</span>
  </div>
</div>

<style>
.progress-bar {
  --progress-height: 8px;
  --progress-bg: var(--color-surface-tertiary);
  --progress-fill: var(--color-primary);
  
  width: 100%;
  height: var(--progress-height);
  background: var(--progress-bg);
  border-radius: var(--radius-full);
  overflow: hidden;
  position: relative;
}

.progress-bar__fill {
  height: 100%;
  width: var(--progress);
  background: var(--progress-fill);
  transition: width var(--duration-normal) var(--easing-easeOut);
  position: relative;
  overflow: hidden;
}

.progress-bar__fill--animated {
  animation: progress-pulse 1.5s ease-in-out infinite;
}

.progress-bar__stripes {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.15) 25%,
    transparent 25%,
    transparent 50%,
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0.15) 75%,
    transparent 75%,
    transparent
  );
  background-size: 1rem 1rem;
  animation: progress-stripes 1s linear infinite;
}

@keyframes progress-stripes {
  from { background-position: 0 0; }
  to { background-position: 1rem 0; }
}

@keyframes progress-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}
</style>
```

### 3. LoadingOverlay Specification
```typescript
interface LoadingOverlayProps {
  // Control
  visible: boolean;
  
  // Content
  message?: string;
  description?: string;
  progress?: number;
  
  // Appearance
  fullScreen?: boolean;
  blur?: boolean;
  opacity?: number;
  
  // Spinner
  spinnerSize?: 'sm' | 'md' | 'lg';
  spinnerType?: 'spinner' | 'dots' | 'pulse';
  
  // Behavior
  blockInteraction?: boolean;
  showAfter?: number; // delay before showing
  minDisplayTime?: number; // minimum time to show
}
```

### 4. AnimatedCounter Mockup
```html
<!-- AnimatedCounter - Counting Up -->
<div class="counter" data-target="1234">
  <span class="counter__value">
    <span class="counter__digit counter__digit--changing">1</span>
    <span class="counter__digit counter__digit--changing">0</span>
    <span class="counter__digit counter__digit--changing">8</span>
    <span class="counter__digit">4</span>
  </span>
  <span class="counter__label">items processed</span>
</div>

<style>
.counter__digit {
  display: inline-block;
  font-variant-numeric: tabular-nums;
  transition: transform var(--duration-fast) var(--easing-spring);
}

.counter__digit--changing {
  animation: digit-flip var(--duration-normal) var(--easing-easeOut);
}

@keyframes digit-flip {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-50%);
    opacity: 0;
  }
  51% {
    transform: translateY(50%);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
```

### 5. PageTransition System
```typescript
interface PageTransitionProps {
  children: React.ReactNode;
  transitionKey: string;
  
  // Animation type
  type?: 'fade' | 'slide' | 'scale' | 'crossfade';
  direction?: 'left' | 'right' | 'up' | 'down';
  
  // Timing
  duration?: number;
  delay?: number;
  
  // Behavior
  exitBeforeEnter?: boolean;
  preserveHeight?: boolean;
  
  // Callbacks
  onTransitionStart?: () => void;
  onTransitionEnd?: () => void;
}
```

### 6. SkeletonLoader Mockup
```html
<!-- SkeletonLoader - Card Loading State -->
<div class="skeleton-card">
  <div class="skeleton skeleton--circle" style="width: 40px; height: 40px;"></div>
  
  <div class="skeleton-content">
    <div class="skeleton skeleton--text" style="width: 60%;"></div>
    <div class="skeleton skeleton--text" style="width: 100%;"></div>
    <div class="skeleton skeleton--text" style="width: 80%;"></div>
  </div>
  
  <div class="skeleton skeleton--rect" style="width: 100%; height: 200px;"></div>
  
  <div class="skeleton-actions">
    <div class="skeleton skeleton--button"></div>
    <div class="skeleton skeleton--button"></div>
  </div>
</div>

<style>
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-surface-tertiary) 25%,
    var(--color-surface-secondary) 50%,
    var(--color-surface-tertiary) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
  border-radius: var(--radius-sm);
}

.skeleton--text {
  height: 1em;
  margin-bottom: var(--spacing-xs);
}

.skeleton--circle {
  border-radius: var(--radius-full);
}

.skeleton--button {
  height: 36px;
  width: 80px;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
    background: var(--color-surface-tertiary);
  }
}
</style>
```

### 7. Toast Enhancement Specification
```typescript
interface ToastProps {
  // Existing props...
  
  // New positioning system
  position?: 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  offset?: { x?: number; y?: number };
  
  // Stacking
  stackSpacing?: number;
  reverseOrder?: boolean;
  
  // Animation
  animation?: 'slide' | 'fade' | 'pop';
  swipeToDismiss?: boolean;
  
  // Progress
  showProgress?: boolean;
  pauseOnHover?: boolean;
}

// Toast manager
interface ToastManager {
  show: (options: ToastOptions) => string;
  update: (id: string, options: Partial<ToastOptions>) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}
```

## Animation Patterns

### 1. Stagger Animation System
```typescript
interface StaggerConfig {
  delay: number;
  duration: number;
  easing: string;
  from: 'first' | 'last' | 'center';
}

const useStaggerAnimation = (
  items: any[],
  config: StaggerConfig
) => {
  return items.map((item, index) => ({
    ...item,
    style: {
      animationDelay: `${index * config.delay}ms`,
      animationDuration: `${config.duration}ms`,
      animationTimingFunction: config.easing
    }
  }));
};
```

### 2. Spring Physics Animation
```typescript
interface SpringConfig {
  tension: number; // 170
  friction: number; // 26
  mass: number; // 1
  initialVelocity: number; // 0
}

const spring = (config: SpringConfig) => {
  // Implementation of spring physics
  // Returns CSS animation keyframes
};
```

## Success Criteria
1. All animations respect prefers-reduced-motion
2. Loading states are smooth and non-jarring
3. Feedback is immediate and clear
4. Progress indicators are accurate
5. Transitions enhance rather than distract
6. Performance targets: 60fps for all animations
7. Skeleton loaders match actual content layout
8. Toast system supports multiple concurrent toasts