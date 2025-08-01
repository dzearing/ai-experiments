import type { Meta, StoryObj } from '@storybook/react';
import React, { useState, useEffect } from 'react';
import './Animation.stories.css';

const meta: Meta = {
  title: 'Foundations/Animation',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Animation System

Our animation system provides consistent timing, easing, and motion patterns throughout the design system. All animations respect user preferences for reduced motion.

## Key Principles

1. **Purpose-driven**: Every animation should have a clear purpose
2. **Performance**: Animations should be smooth and not impact performance
3. **Accessibility**: All animations respect \\\`prefers-reduced-motion\\\`
4. **Consistency**: Use predefined tokens for timing and easing
5. **Subtlety**: Less is more - animations should enhance, not distract

## Token Structure

- **Duration tokens**: Control animation timing (\`--duration-*\`)
- **Easing tokens**: Define acceleration curves (\`--easing-*\`)
- **Delay tokens**: Control animation sequencing (\`--delay-*\`)
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Duration Scale Demo
const DurationDemo: React.FC = () => {
  const [animatingItems, setAnimatingItems] = useState<Set<string>>(new Set());
  const durations = [
    { name: 'instant', value: '100ms', use: 'Hover states, focus rings' },
    { name: 'fast', value: '200ms', use: 'Closing, collapsing, fading out' },
    { name: 'normal', value: '300ms', use: 'Opening, expanding, sliding in' },
    { name: 'slow', value: '500ms', use: 'Page transitions, complex animations' },
    { name: 'deliberate', value: '700ms', use: 'Emphasis animations' },
    { name: 'sluggish', value: '1000ms', use: 'Loading states, background animations' },
  ];

  const triggerAnimation = () => {
    // Trigger all animations
    const allNames = new Set(durations.map(d => d.name));
    setAnimatingItems(allNames);
    setTimeout(() => setAnimatingItems(new Set()), 1500);
  };

  const triggerSingleAnimation = (name: string, durationMs: string) => {
    // Trigger individual animation
    setAnimatingItems(prev => new Set(prev).add(name));
    // Parse duration value and add buffer time
    const duration = parseInt(durationMs);
    setTimeout(() => {
      setAnimatingItems(prev => {
        const next = new Set(prev);
        next.delete(name);
        return next;
      });
    }, duration + 100); // Add 100ms buffer
  };

  return (
    <div className="animation-duration-demo">
      <button onClick={triggerAnimation} className="trigger-button">
        Trigger All Animations
      </button>
      <div className="duration-list">
        {durations.map((duration) => (
          <div key={duration.name} className="duration-item">
            <div className="duration-info">
              <h4>--duration-{duration.name}</h4>
              <span className="duration-value">{duration.value}</span>
              <p className="duration-use">{duration.use}</p>
            </div>
            <div 
              className={`duration-box ${animatingItems.has(duration.name) ? 'animating' : ''}`} 
              style={{ '--duration': `var(--duration-${duration.name})` } as React.CSSProperties}
              onClick={() => triggerSingleAnimation(duration.name, duration.value)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  triggerSingleAnimation(duration.name, duration.value);
                }
              }}
            >
              <div className="duration-indicator" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Easing Functions Demo
const EasingDemo: React.FC = () => {
  const [animatingItems, setAnimatingItems] = useState<Set<string>>(new Set());
  const easings = [
    { name: 'linear', description: 'Constant speed' },
    { name: 'ease', description: 'Default easing' },
    { name: 'ease-in', description: 'Accelerate from rest' },
    { name: 'ease-out', description: 'Decelerate to rest' },
    { name: 'ease-in-out', description: 'Accelerate then decelerate' },
    { name: 'bounce', description: 'Playful overshoot' },
    { name: 'sharp', description: 'Quick and responsive' },
    { name: 'smooth', description: 'Gentle and fluid' },
  ];

  const triggerAnimation = () => {
    // Trigger all animations
    const allNames = new Set(easings.map(e => e.name));
    setAnimatingItems(allNames);
    setTimeout(() => setAnimatingItems(new Set()), 1500);
  };

  const triggerSingleAnimation = (name: string) => {
    // Trigger individual animation
    setAnimatingItems(prev => new Set(prev).add(name));
    setTimeout(() => {
      setAnimatingItems(prev => {
        const next = new Set(prev);
        next.delete(name);
        return next;
      });
    }, 1500);
  };

  return (
    <div className="animation-easing-demo">
      <button onClick={triggerAnimation} className="trigger-button">
        Trigger All Easings
      </button>
      <div className="easing-list">
        {easings.map((easing) => (
          <div 
            key={easing.name} 
            className="easing-item"
            onClick={() => triggerSingleAnimation(easing.name)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                triggerSingleAnimation(easing.name);
              }
            }}
          >
            <div className="easing-info">
              <h4>--easing-{easing.name}</h4>
              <p>{easing.description}</p>
            </div>
            <div className="easing-track">
              <div 
                className={`easing-ball ${animatingItems.has(easing.name) ? 'animating' : ''}`} 
                style={{ '--easing': `var(--easing-${easing.name})` } as React.CSSProperties}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Common Animations Demo
const CommonAnimationsDemo: React.FC = () => {
  const [activeAnimation, setActiveAnimation] = useState<string | null>(null);

  const animations = [
    { name: 'fade-in', label: 'Fade In' },
    { name: 'fade-out', label: 'Fade Out' },
    { name: 'slide-in-up', label: 'Slide In Up' },
    { name: 'slide-in-down', label: 'Slide In Down' },
    { name: 'slide-in-left', label: 'Slide In Left' },
    { name: 'slide-in-right', label: 'Slide In Right' },
    { name: 'scale-in', label: 'Scale In' },
    { name: 'scale-out', label: 'Scale Out' },
    { name: 'spin', label: 'Spin' },
    { name: 'pulse', label: 'Pulse' },
    { name: 'bounce', label: 'Bounce' },
  ];

  const triggerAnimation = (name: string) => {
    setActiveAnimation(name);
    setTimeout(() => setActiveAnimation(null), 1500);
  };

  return (
    <div className="common-animations-demo">
      <div className="animation-grid">
        {animations.map((animation) => (
          <div key={animation.name} className="animation-card">
            <h4>{animation.label}</h4>
            <div className="animation-stage">
              <div 
                className={`animation-element ${activeAnimation === animation.name ? animation.name : ''}`}
              />
            </div>
            <button 
              onClick={() => triggerAnimation(animation.name)}
              className="animation-trigger"
            >
              Play
            </button>
            <code className="animation-code">@keyframes {animation.name}</code>
          </div>
        ))}
      </div>
    </div>
  );
};

// Accessibility Demo
const AccessibilityDemo: React.FC = () => {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const triggerAnimation = () => {
    setAnimating(true);
    setTimeout(() => setAnimating(false), 1500);
  };

  return (
    <div className="accessibility-demo">
      <div className="accessibility-info">
        <h3>Reduced Motion Support</h3>
        <p>Current preference: <strong>{reducedMotion ? 'Reduced Motion' : 'Normal Motion'}</strong></p>
        <p className="accessibility-note">
          When reduced motion is enabled, all animations become near-instant (1ms) with linear easing.
          Try changing your system preferences to see the difference.
        </p>
      </div>
      <div className="accessibility-example">
        <button onClick={triggerAnimation} className="trigger-button">
          Test Animation
        </button>
        <div className={`motion-test-box ${animating ? 'animating' : ''}`}>
          {reducedMotion ? 'Instant' : 'Animated'}
        </div>
      </div>
    </div>
  );
};

// Stagger Animation Demo
const StaggerDemo: React.FC = () => {
  const [animating, setAnimating] = useState(false);
  const items = Array.from({ length: 6 }, (_, i) => i + 1);

  const triggerAnimation = () => {
    setAnimating(true);
    setTimeout(() => setAnimating(false), 2000);
  };

  return (
    <div className="stagger-demo">
      <button onClick={triggerAnimation} className="trigger-button">
        Trigger Stagger Animation
      </button>
      <div className="stagger-grid">
        {items.map((item, index) => (
          <div 
            key={item}
            className={`stagger-item ${animating ? 'animating' : ''}`}
            style={{ '--index': index } as React.CSSProperties}
          >
            {item}
          </div>
        ))}
      </div>
      <p className="stagger-info">
        Using <code>--delay-stagger: 50ms</code> with CSS custom properties for sequencing
      </p>
    </div>
  );
};

export const DurationScale: Story = {
  render: () => <DurationDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Duration tokens provide consistent timing across all animations. Choose the appropriate duration based on the animation purpose.',
      },
    },
  },
};

export const EasingFunctions: Story = {
  render: () => <EasingDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Easing functions control the acceleration and deceleration of animations, making them feel more natural.',
      },
    },
  },
};

export const CommonAnimations: Story = {
  render: () => <CommonAnimationsDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Pre-defined keyframe animations for common UI patterns. These can be applied using CSS animation property.',
      },
    },
  },
};

export const ReducedMotionSupport: Story = {
  render: () => <AccessibilityDemo />,
  parameters: {
    docs: {
      description: {
        story: 'All animations automatically respect the user\'s motion preferences. When reduced motion is enabled, animations become near-instant.',
      },
    },
  },
};

export const StaggeredAnimations: Story = {
  render: () => <StaggerDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Use delay tokens to create staggered animations for lists and grids. Combine with CSS custom properties for dynamic sequencing.',
      },
    },
  },
};