# @claude-flow/ui-kit-react

React components and hooks for the Claude Flow UI Kit design system.

## Overview

This package provides React-specific integrations for the Claude Flow UI Kit design system. It includes components, hooks, and utilities that make it easy to use the design system in React applications.

## Installation

```bash
npm install @claude-flow/ui-kit-react @claude-flow/ui-kit
# or
pnpm add @claude-flow/ui-kit-react @claude-flow/ui-kit
# or
yarn add @claude-flow/ui-kit-react @claude-flow/ui-kit
```

## Quick Start

```tsx
import { ThemeProvider } from '@claude-flow/ui-kit-react';
import '@claude-flow/ui-kit/styles.css';

function App() {
  return (
    <ThemeProvider defaultTheme="default" defaultMode="auto">
      {/* Your app content */}
    </ThemeProvider>
  );
}
```

## Components

### ThemeProvider

Provides theme context to your React application.

```tsx
import { ThemeProvider } from '@claude-flow/ui-kit-react';

<ThemeProvider
  defaultTheme="default"      // Initial theme
  defaultMode="auto"          // 'light' | 'dark' | 'auto'
  detectSystemPreference      // Follow system light/dark mode
  enablePersistence           // Save preferences to localStorage
  storageKey="app-theme"      // localStorage key
  onThemeChange={(theme, mode) => {
    console.log('Theme changed:', theme, mode);
  }}
>
  <App />
</ThemeProvider>
```

## Hooks

### useTheme

Access and control the current theme.

```tsx
import { useTheme } from '@claude-flow/ui-kit-react';

function ThemeControls() {
  const {
    theme,         // Current theme ID
    mode,          // Current mode ('light' | 'dark' | 'auto')
    resolvedMode,  // Resolved mode ('light' | 'dark')
    themes,        // Available themes
    setTheme,      // Change theme
    setMode,       // Change mode
    toggleMode,    // Toggle between light/dark
    reset,         // Reset to defaults
  } = useTheme();

  return (
    <div>
      <select value={theme} onChange={e => setTheme(e.target.value)}>
        {themes.map(t => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
      <button onClick={toggleMode}>
        {resolvedMode === 'light' ? '🌙' : '☀️'}
      </button>
    </div>
  );
}
```

### useDesignToken

Access design token values with TypeScript support.

```tsx
import { useDesignToken } from '@claude-flow/ui-kit-react';

function Component() {
  const primaryColor = useDesignToken('color-buttonPrimary-background');
  const spacing = useDesignToken('spacing-md');
  
  return (
    <div style={{ 
      backgroundColor: primaryColor,
      padding: spacing 
    }}>
      Content
    </div>
  );
}
```

### useMediaQuery

Responsive design with design system breakpoints.

```tsx
import { useMediaQuery } from '@claude-flow/ui-kit-react';

function ResponsiveComponent() {
  const isMobile = useMediaQuery('mobile');    // < 768px
  const isTablet = useMediaQuery('tablet');    // 768px - 1024px
  const isDesktop = useMediaQuery('desktop');  // > 1024px
  
  return (
    <div>
      {isMobile && <MobileLayout />}
      {isTablet && <TabletLayout />}
      {isDesktop && <DesktopLayout />}
    </div>
  );
}
```

### useReducedMotion

Respect user's motion preferences.

```tsx
import { useReducedMotion } from '@claude-flow/ui-kit-react';

function AnimatedComponent() {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <div
      style={{
        transition: prefersReducedMotion 
          ? 'none' 
          : 'transform var(--duration-normal) var(--easing-standard)'
      }}
    >
      Content
    </div>
  );
}
```

## Utilities

### cn (className utility)

Conditionally join classNames together.

```tsx
import { cn } from '@claude-flow/ui-kit-react';

function Button({ variant, disabled, className, ...props }) {
  return (
    <button
      className={cn(
        'btn',
        variant === 'primary' && 'btn-primary',
        disabled && 'btn-disabled',
        className
      )}
      {...props}
    />
  );
}
```

### withTheme (HOC)

Higher-order component for class components.

```tsx
import { withTheme } from '@claude-flow/ui-kit-react';

class ThemedComponent extends React.Component {
  render() {
    const { theme, mode, setTheme } = this.props.theme;
    
    return (
      <div>Current theme: {theme}</div>
    );
  }
}

export default withTheme(ThemedComponent);
```

## TypeScript Support

This package includes full TypeScript support with exported types:

```tsx
import type { 
  Theme,
  ThemeMode,
  ThemeContextValue,
  DesignToken 
} from '@claude-flow/ui-kit-react';
```

## Best Practices

1. **Always wrap your app with ThemeProvider** at the root level
2. **Import the base styles** from `@claude-flow/ui-kit/styles.css`
3. **Use design tokens** instead of hardcoded values
4. **Respect user preferences** for motion and color scheme
5. **Test with multiple themes** to ensure compatibility

## Examples

### Theme Switcher Component

```tsx
import { useTheme } from '@claude-flow/ui-kit-react';

export function ThemeSwitcher() {
  const { theme, mode, themes, setTheme, toggleMode } = useTheme();

  return (
    <div className="theme-switcher">
      <label>
        Theme:
        <select value={theme} onChange={e => setTheme(e.target.value)}>
          {themes.map(t => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
      
      <button onClick={toggleMode} aria-label="Toggle dark mode">
        {mode === 'dark' ? '☀️' : '🌙'}
      </button>
    </div>
  );
}
```

### Responsive Card Component

```tsx
import { useMediaQuery, cn } from '@claude-flow/ui-kit-react';

export function Card({ children, className }) {
  const isMobile = useMediaQuery('mobile');
  
  return (
    <div 
      className={cn(
        'card',
        isMobile && 'card-mobile',
        className
      )}
    >
      {children}
    </div>
  );
}
```

## License

MIT