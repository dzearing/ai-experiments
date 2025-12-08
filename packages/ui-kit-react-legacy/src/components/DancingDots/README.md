# DancingDots Component

An animated loading indicator showing dots with a dancing/bouncing animation pattern.

## Overview

The DancingDots component provides a playful loading animation with dots that bounce in sequence. It's particularly effective for indicating AI thinking or processing states where the duration is uncertain.

## Features

- Smooth bouncing animation
- Configurable number of dots
- Size variants
- Color customization
- Animation speed control
- Pause on hover option
- Reduced motion support
- Inline display mode

## Usage

```tsx
import { DancingDots } from '@claude-flow/ui-kit-react';

// Basic usage
<DancingDots />

// Custom configuration
<DancingDots 
  count={4}
  size="large"
  color="primary"
/>

// Inline with text
<p>
  AI is thinking<DancingDots inline />
</p>

// Custom speed
<DancingDots speed="slow" />
```

## Relationships

### Depended on by

- **TypingIndicator** - Uses DancingDots as one animation option
- **AIThinking** - Uses DancingDots for AI processing states
- **ChatLoading** - Shows DancingDots while loading messages
- **StreamingText** - May show DancingDots before stream starts
- **ProcessingIndicator** - Uses DancingDots for processing states
- **WaitingState** - Uses DancingDots for waiting animations
- **LoadingMessage** - Includes DancingDots in loading text
- **PendingState** - Shows DancingDots for pending operations

### Depends on

- **React** - Core React dependencies
- **CSS Modules** - For component styling and animations