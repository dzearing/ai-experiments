# Pulse Component

An animated component that creates a pulsing effect for drawing attention to elements.

## Overview

The Pulse component adds a subtle pulsing animation to highlight important elements or indicate live/active states. It can wrap any content or be used as a standalone indicator.

## Features

- Smooth pulse animation
- Customizable pulse radius
- Color variants
- Animation speed control
- Overlay or standalone modes
- Size options
- Pause on hover
- Multiple pulse rings
- Reduced motion support

## Usage

```tsx
import { Pulse } from '@claude-flow/ui-kit-react';

// Standalone pulse indicator
<Pulse />

// Wrapping content
<Pulse>
  <Avatar status="online" />
</Pulse>

// Custom configuration
<Pulse
  color="success"
  size="large"
  speed="slow"
  rings={2}
/>

// As a badge
<div className="relative">
  <Icon />
  <Pulse className="absolute top-0 right-0" size="small" />
</div>
```

## Relationships

### Depended on by

- **PulseLoader** - Uses multiple Pulse components for loading
- **LiveIndicator** - Uses Pulse to show live status
- **ActiveStatus** - Uses Pulse for active state indication
- **NotificationBadge** - Uses Pulse for new notifications
- **OnlineIndicator** - Uses Pulse for online status
- **RecordingIndicator** - Uses Pulse to show recording state
- **BroadcastIndicator** - Uses Pulse for live broadcast
- **AlertIndicator** - Uses Pulse to draw attention
- **HotspotIndicator** - Uses Pulse for interactive hints

### Depends on

- **React** - Core React dependencies
- **CSS Modules** - For component styling and animations