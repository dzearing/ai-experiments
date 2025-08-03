# Progress Component

A visual indicator component for displaying progress of operations and loading states.

## Overview

The Progress component provides visual feedback for ongoing operations through linear or circular progress indicators. It supports determinate and indeterminate states with customizable styling.

## Features

- Linear and circular variants
- Determinate (with percentage) and indeterminate modes
- Size options (small, medium, large)
- Color theming
- Label and value display
- Animated transitions
- Buffer/secondary progress support
- Accessibility attributes

## Usage

```tsx
import { Progress } from '@claude-flow/ui-kit-react';

// Linear progress
<Progress value={60} max={100} />

// Indeterminate
<Progress indeterminate />

// Circular variant
<Progress variant="circular" value={75} />

// With label
<Progress 
  value={45} 
  label="Uploading files..."
  showValue
/>
```

## Relationships

### Depended on by

- **ProgressBar** - Extended version with additional features
- **ProgressRing** - Circular progress variant with enhanced visuals
- **FileProgress** - Shows progress for file operations
- **UploadProgress** - Tracks upload progress
- **LoadingButton** - Shows progress in button during operations
- **StreamProgress** - Shows progress for streaming operations
- **Toast** - Uses Progress for auto-dismiss countdown
- **ProgressSteps** - Shows step-based progress
- **ProjectProgress** - Shows project completion progress
- **TaskProgress** - Displays task completion percentage

### Depends on

- **React** - Core React dependencies
- **CSS Modules** - For component styling isolation