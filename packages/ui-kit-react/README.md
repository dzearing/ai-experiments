# ui-kit-react

UI components for React.

## Installation

```bash
pnpm add @claude-flow/ui-kit-react
```

## Usage

```tsx
import { Button } from '@claude-flow/ui-kit-react';
// Optional: import global styles if needed
import '@claude-flow/ui-kit-react/styles.global.css';

function App() {
  return (
    <Button variant="primary" size="md">
      Click me
    </Button>
  );
}
```

## Development

```bash
# Install dependencies
pnpm install

# Build the library
pnpm build

# Watch mode
pnpm dev

# Type checking
pnpm typecheck
```

## Components

### Button

A flexible button component with multiple variants and sizes.

```tsx
<Button variant="primary" size="lg">Primary Button</Button>
<Button variant="secondary">Secondary Button</Button>
<Button variant="danger" size="sm">Danger Button</Button>
```
