# Animation & Transition Components

This file documents all the Animation & Transition components for the Claude Flow UI Kit React package.

## Overview

Animation & Transition components provide smooth visual effects and motion to enhance user experience and provide feedback during state changes.

## Components

### PageTransition

**Priority**: High

**Description**: Orchestrates smooth transitions between route changes in single-page applications.

**Features**:
- Multiple transition types (fade, slide, scale)
- Direction awareness
- Transition duration control
- Page state preservation
- Gesture support
- Hardware acceleration
- Reduced motion respect
- Custom easing functions
- Transition callbacks
- Memory management

**Use Cases**:
- Route changes
- Wizard steps
- Tab switching
- Mobile app navigation
- Onboarding flows

### SlideTransition

**Priority**: Medium

**Description**: Sliding animation component for panels, modals, and page changes.

**Features**:
- Four directions (up, down, left, right)
- Customizable distance
- Spring physics option
- Touch gesture support
- Interrupt handling
- Performance optimized
- RTL support
- Nested transitions
- State callbacks

**Use Cases**:
- Side panels
- Mobile menus
- Image carousels
- Page transitions
- Modal entries

### FadeTransition

**Priority**: Medium

**Description**: Smooth opacity transitions for content appearance and disappearance.

**Features**:
- Fade in/out
- Cross-fade between
- Duration control
- Delay support
- Easing functions
- Mount/unmount handling
- Interrupt safe
- CSS variable based
- Performance mode

**Use Cases**:
- Content switching
- Loading states
- Image transitions
- Modal overlays
- Hover effects

### ScaleTransition

**Priority**: Low

**Description**: Scale-based animations for zoom effects and attention-grabbing entries.

**Features**:
- Scale from center
- Custom origin points
- Combined with fade
- Bounce effects
- Hardware accelerated
- Gesture triggers
- Responsive scaling
- State preservation
- Exit animations

**Use Cases**:
- Modal appearance
- Button feedback
- Card expansion
- Zoom effects
- Attention UI

### CrossfadeTransition

**Priority**: Low

**Description**: Smoothly transitions between two elements by cross-fading opacity.

**Features**:
- Automatic height handling
- Position preservation
- Loading state support
- Error state handling
- Custom timing
- Preload support
- Memory efficient
- SEO friendly
- A11y compliant

**Use Cases**:
- Image galleries
- Content updates
- Tab panels
- Loading transitions
- State changes

### StaggeredList

**Priority**: Low

**Description**: Animates list items appearing in sequence with customizable delays.

**Features**:
- Item delay control
- Animation customization
- Reverse stagger
- On scroll trigger
- Dynamic items
- Pause/play control
- Batch rendering
- Performance mode
- Exit stagger

**Use Cases**:
- List reveals
- Grid animations
- Menu items
- Card layouts
- Dashboard widgets

### AnimatedCounter

**Priority**: Medium

**Description**: Smoothly animates number changes with rolling or counting effects.

**Features**:
- Count up/down
- Duration control
- Easing functions
- Format support
- Decimal places
- Thousands separator
- Prefix/suffix
- Start on visible
- Pause/resume

**Use Cases**:
- Statistics display
- Score changes
- Progress numbers
- Dashboard metrics
- Loading percentages

### DurationCounter

**Priority**: High

**Description**: Live duration display showing elapsed time in MM:SS or HH:MM:SS format.

**Features**:
- Real-time updates
- Multiple formats
- Start/stop/pause
- Reset functionality
- Countdown mode
- Overtime indication
- Custom formatting
- Performance optimized
- Background tracking

**Use Cases**:
- Chat session timers
- Call duration
- Task tracking
- Video playback
- Meeting timers

### ProgressRing

**Priority**: Medium

**Description**: Circular progress indicator with customizable appearance.

**Features**:
- Percentage display
- Custom colors
- Multiple sizes
- Thickness control
- Animation speed
- Counter-clockwise option
- Gradient support
- Icon center
- Indeterminate mode

**Use Cases**:
- Upload progress
- Task completion
- Loading states
- Score displays
- Timer visualization

### SkeletonLoader

**Priority**: High

**Description**: Shows animated placeholder content while data is loading.

**Features**:
- Multiple shapes
- Pulse animation
- Wave animation
- Custom layouts
- Responsive sizing
- Theme integration
- Smooth transitions
- Count control
- Component presets

**Use Cases**:
- Content loading
- Page placeholders
- Lazy loading
- Initial renders
- Async components

### PulseLoader

**Priority**: Medium

**Description**: Simple pulsing animation for subtle loading indication.

**Features**:
- Size variants
- Speed control
- Color options
- Multiple pulses
- Fade variants
- Scale variants
- Custom shapes
- Inline mode
- A11y labels

**Use Cases**:
- Button loading
- Inline indicators
- Status indicators
- Thinking states
- Background activity

### WaveLoader

**Priority**: Low

**Description**: Wave-based loading animation for AI thinking states.

**Features**:
- Multiple waves
- Wave speed
- Amplitude control
- Color gradients
- Direction options
- Particle effects
- Sound visualization
- Custom paths
- Performance mode

**Use Cases**:
- AI processing
- Audio playback
- Loading screens
- Thinking indicators
- Creative loaders

### ParallaxScroll

**Priority**: Low

**Description**: Creates depth effects by moving elements at different speeds during scroll.

**Features**:
- Layer management
- Speed ratios
- Scroll direction
- Boundary handling
- Performance throttling
- Mobile disable option
- Smooth degradation
- Debug mode
- Custom effects

**Use Cases**:
- Landing pages
- Hero sections
- Background effects
- Image galleries
- Storytelling

### AnimatedIcon

**Priority**: Low

**Description**: Icons that animate between states or on interaction.

**Features**:
- Morph transitions
- Rotation effects
- Color changes
- Path animations
- Hover triggers
- Click feedback
- State management
- Icon library
- Custom timing

**Use Cases**:
- Menu toggles
- Favorite buttons
- Play/pause icons
- Navigation icons
- Interactive buttons

### SpringAnimation

**Priority**: Low

**Description**: Physics-based spring animations for natural motion effects.

**Features**:
- Spring configuration
- Damping control
- Mass settings
- Velocity handling
- Gesture integration
- Interrupt handling
- Value interpolation
- Performance mode
- Debug visualization

**Use Cases**:
- Drag interactions
- Elastic effects
- Natural motion
- Gesture feedback
- Physics UI

## Implementation Notes

### Priority Order

1. **High Priority** (3 components): Essential for core functionality
   - PageTransition, DurationCounter, SkeletonLoader

2. **Medium Priority** (4 components): Enhanced user experience
   - SlideTransition, FadeTransition, AnimatedCounter, ProgressRing, PulseLoader

3. **Low Priority** (8 components): Specialized effects
   - ScaleTransition, CrossfadeTransition, StaggeredList, WaveLoader
   - ParallaxScroll, AnimatedIcon, SpringAnimation

### Technical Considerations

- Use CSS transitions and animations for performance
- Respect `prefers-reduced-motion` media query
- Hardware acceleration for smooth animations
- Intersection Observer for scroll-triggered animations
- RequestAnimationFrame for custom animations

### Dependencies

These components will depend on:
- React's `useEffect` and `useState` hooks
- CSS-in-JS or CSS modules for styling
- Intersection Observer API
- RequestAnimationFrame API

### Accessibility

- Respect reduced motion preferences
- Provide alternative static states
- Screen reader announcements for state changes
- Keyboard navigation support
- Focus management during transitions

### Performance

- Use transform and opacity for smooth animations
- Avoid layout thrashing
- Debounce scroll events
- Use will-change CSS property sparingly
- Cleanup animations on unmount