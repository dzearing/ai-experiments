# LoadingButton Component

## Overview
A button component that shows loading state with spinner and optional progress indication, automatically managing disabled state during async operations.

## Component Specification

### Props
```typescript
interface LoadingButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  // Content
  children: ReactNode;
  
  // Loading state
  loading?: boolean;
  loadingText?: string; // Alternative text during loading
  
  // Progress indication
  progress?: number; // 0-100 for progress bar
  showProgress?: boolean;
  
  // Visual variants (inherited from Button)
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  
  // Icon support
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  
  // Spinner customization
  spinnerSize?: 'xs' | 'sm' | 'md' | 'lg';
  spinnerPosition?: 'left' | 'right' | 'center'; // Where to show spinner
  
  // Behavior
  disableWhileLoading?: boolean; // Default: true
  keepIconsWhileLoading?: boolean; // Default: false
  
  // Styling
  className?: string;
}
```

### Usage Examples
```tsx
// Basic loading button
<LoadingButton 
  loading={isSubmitting}
  onClick={handleSubmit}
>
  Submit Form
</LoadingButton>

// With loading text
<LoadingButton 
  loading={isSaving}
  loadingText="Saving..."
  onClick={handleSave}
>
  Save Changes
</LoadingButton>

// With progress indicator
<LoadingButton 
  loading={isUploading}
  progress={uploadProgress}
  showProgress
  loadingText="Uploading..."
>
  Upload File
</LoadingButton>

// With icons
<LoadingButton 
  loading={isConnecting}
  leftIcon={<Wifi />}
  loadingText="Connecting..."
  spinnerPosition="left"
>
  Connect to Server
</LoadingButton>

// Keep icons while loading
<LoadingButton 
  loading={isRefreshing}
  rightIcon={<RefreshIcon />}
  keepIconsWhileLoading
  spinnerPosition="center"
>
  Refresh Data
</LoadingButton>

// Destructive action with confirmation
<LoadingButton 
  variant="destructive"
  loading={isDeleting}
  loadingText="Deleting..."
  onClick={handleDelete}
>
  Delete Item
</LoadingButton>
```

## Visual Design

### Loading States
1. **Spinner Only**: Replace content with spinner
2. **Spinner + Text**: Show spinner with loading text
3. **Spinner + Icons**: Keep icons, add spinner
4. **Progress Bar**: Show progress indicator below/above text

### Size Considerations
- Maintain button dimensions during loading
- Scale spinner appropriately to button size
- Ensure progress bar fits within button bounds

### Animation Behavior
- Smooth transition to loading state
- Spinner animation consistency
- Progress bar smooth updates
- Fade in/out for text changes

## Technical Implementation

### Core Structure
```typescript
const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ 
    children,
    loading = false,
    loadingText,
    progress,
    showProgress,
    leftIcon,
    rightIcon,
    spinnerSize,
    spinnerPosition = 'left',
    disableWhileLoading = true,
    keepIconsWhileLoading = false,
    className,
    disabled,
    ...props 
  }, ref) => {
    const isDisabled = disabled || (loading && disableWhileLoading);
    const displayText = loading && loadingText ? loadingText : children;
    const showLeftIcon = leftIcon && (!loading || keepIconsWhileLoading);
    const showRightIcon = rightIcon && (!loading || keepIconsWhileLoading);
    
    return (
      <Button
        ref={ref}
        disabled={isDisabled}
        className={cn(loadingButtonStyles.base, className)}
        {...props}
      >
        <div className={loadingButtonStyles.content}>
          {/* Left elements */}
          {loading && spinnerPosition === 'left' && (
            <Spinner size={spinnerSize} className={loadingButtonStyles.spinner} />
          )}
          {showLeftIcon && (
            <span className={loadingButtonStyles.icon}>{leftIcon}</span>
          )}
          
          {/* Main content */}
          <span className={loadingButtonStyles.text}>
            {loading && spinnerPosition === 'center' && (
              <Spinner size={spinnerSize} className={loadingButtonStyles.centerSpinner} />
            )}
            {displayText}
          </span>
          
          {/* Right elements */}
          {showRightIcon && (
            <span className={loadingButtonStyles.icon}>{rightIcon}</span>
          )}
          {loading && spinnerPosition === 'right' && (
            <Spinner size={spinnerSize} className={loadingButtonStyles.spinner} />
          )}
        </div>
        
        {/* Progress bar */}
        {loading && showProgress && typeof progress === 'number' && (
          <div className={loadingButtonStyles.progressContainer}>
            <div 
              className={loadingButtonStyles.progressBar}
              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            />
          </div>
        )}
      </Button>
    );
  }
);
```

### Progress Bar Implementation
```typescript
// Optional: Separate ProgressBar component
const ProgressBar = ({ 
  value, 
  className 
}: { 
  value: number; 
  className?: string; 
}) => (
  <div className={cn(progressStyles.container, className)}>
    <div 
      className={progressStyles.bar}
      style={{ 
        transform: `translateX(${value - 100}%)`,
        transition: 'transform 0.3s ease'
      }}
    />
  </div>
);
```

### CSS Module Structure
```css
.base {
  position: relative;
  overflow: hidden;
}

.content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  z-index: 1;
  position: relative;
}

.text {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.icon {
  display: flex;
  align-items: center;
}

.spinner {
  /* Spinner positioning */
}

.centerSpinner {
  margin-right: var(--spacing-xs);
}

.progressContainer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: rgba(255, 255, 255, 0.3);
  overflow: hidden;
}

.progressBar {
  height: 100%;
  background: currentColor;
  transition: width 0.3s ease;
}
```

## Accessibility Features
- Maintains button semantics during loading
- Announces state changes to screen readers
- Proper disabled state handling
- Loading state communicated via aria-busy
- Progress announced when available

### ARIA Implementation
```typescript
const ariaProps = {
  'aria-busy': loading,
  'aria-disabled': isDisabled,
  'aria-describedby': showProgress ? `progress-${id}` : undefined
};
```

## Dependencies
- React (forwardRef, HTMLAttributes)
- Internal Button component
- Internal Spinner component
- CSS modules
- Utility functions (cn)

## Design Tokens Used
- **Spacing**: gaps between elements
- **Colors**: spinner, progress bar colors
- **Transitions**: loading state animations
- **Typography**: loading text styles

## Testing Considerations
- Loading state transitions
- Progress bar accuracy
- Accessibility announcements
- Keyboard interaction during loading
- Various spinner positions
- Icon visibility logic
- Disabled state behavior

## Related Components
- Button (base component)
- Spinner (loading indicator)
- ProgressBar (progress indication)

## Common Use Cases
- Form submissions with validation
- File uploads with progress
- API calls with feedback
- Long-running operations
- Multi-step processes
- Data synchronization
- Authentication flows