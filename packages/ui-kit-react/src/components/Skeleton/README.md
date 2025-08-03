# Skeleton Component

A placeholder component that shows animated loading states while content is being fetched.

## Overview

The Skeleton component provides visual placeholders that mimic the structure of content that's loading. This creates a smoother perceived loading experience by showing the layout structure before the actual content arrives.

## Features

- Multiple shape variants (text, circular, rectangular)
- Shimmer animation effect
- Customizable dimensions
- Multiple skeleton composition
- Responsive sizing
- Theme-aware colors
- Reduced motion support
- Easy content replacement

## Usage

```tsx
import { Skeleton } from '@claude-flow/ui-kit-react';

// Text skeleton
<Skeleton variant="text" width="200px" />

// Avatar skeleton
<Skeleton variant="circular" width={40} height={40} />

// Card skeleton
<div>
  <Skeleton variant="rectangular" width="100%" height={200} />
  <Skeleton variant="text" width="80%" />
  <Skeleton variant="text" width="60%" />
</div>

// Multiple lines
<Skeleton variant="text" lines={3} />
```

## Relationships

### Depended on by

- **Card** - Uses Skeleton for loading states
- **ListLoadingState** - Composes multiple Skeletons for list placeholders
- **SkeletonLoader** - Enhanced skeleton with specific layouts
- **UserCard** - Shows Skeleton while loading user data
- **ImageTile** - Shows Skeleton before image loads
- **DataTable** - Uses Skeleton for table row loading
- **ChatBubble** - Shows Skeleton while message loads
- **FilePreview** - Uses Skeleton during preview generation
- **DashboardWidget** - Shows Skeleton for metric loading
- **ProfileSection** - Uses Skeleton for profile data

### Depends on

- **React** - Core React dependencies
- **CSS Modules** - For component styling isolation