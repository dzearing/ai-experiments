# Spinner Component

A loading indicator component that shows a rotating animation during async operations.

## Overview

The Spinner component provides a simple and effective way to indicate loading states. It features smooth rotation animations and supports various sizes and colors to fit different contexts.

## Features

- Smooth rotation animation
- Size variants (small, medium, large)
- Color customization
- Inline and overlay modes
- Reduced motion support
- Accessibility labels
- CSS-based animation

## Usage

```tsx
import { Spinner } from '@claude-flow/ui-kit-react';

// Basic usage
<Spinner />

// Different sizes
<Spinner size="small" />
<Spinner size="large" />

// Custom color
<Spinner color="primary" />

// With label
<Spinner label="Loading data..." />

// Inline with text
<span>
  Loading <Spinner size="small" inline />
</span>
```

## Relationships

### Depended on by

- **Button** - Uses Spinner for loading state display
- **LoadingButton** - Dedicated button variant with Spinner
- **LoadingOverlay** - Uses Spinner as the main loading indicator
- **DataTable** - Shows Spinner during data fetching
- **InfiniteList** - Shows Spinner while loading more items
- **ListLoadingState** - May use Spinner in loading skeletons
- **Card** - Can show Spinner during content loading
- **FileUpload** - Shows Spinner during upload processing
- **SearchResults** - Shows Spinner while searching
- **LazyComponent** - Shows Spinner while loading component

### Depends on

- **React** - Core React dependencies
- **CSS Modules** - For component styling isolation