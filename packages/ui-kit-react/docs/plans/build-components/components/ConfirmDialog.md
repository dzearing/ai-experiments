# ConfirmDialog Component

## Overview
A modal dialog component that asks users to confirm or cancel an action before proceeding, preventing accidental operations.

## Component Specification

### Props
```typescript
interface ConfirmDialogProps extends Omit<DialogProps, 'children'> {
  // Visibility
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  
  // Content
  title?: string;
  description?: ReactNode;
  children?: ReactNode; // Custom content
  
  // Confirmation behavior
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  
  // Button customization
  confirmText?: string; // Default: "Confirm"
  cancelText?: string; // Default: "Cancel"
  confirmVariant?: 'primary' | 'destructive' | 'warning';
  confirmDisabled?: boolean;
  
  // Visual styling
  variant?: 'default' | 'destructive' | 'warning' | 'info';
  icon?: ReactNode;
  showIcon?: boolean;
  
  // Behavior
  closeOnConfirm?: boolean; // Auto-close after confirm (default: true)
  closeOnCancel?: boolean; // Auto-close after cancel (default: true)
  preventClose?: boolean; // Prevent closing during async operations
  
  // Loading state
  loading?: boolean;
  loadingText?: string;
  
  // Styling
  className?: string;
  contentClassName?: string;
}
```

### Usage Examples
```tsx
// Basic confirmation
<ConfirmDialog
  open={showDeleteConfirm}
  onOpenChange={setShowDeleteConfirm}
  title="Delete Item"
  description="Are you sure you want to delete this item? This action cannot be undone."
  onConfirm={handleDelete}
  onCancel={() => setShowDeleteConfirm(false)}
/>

// Destructive action
<ConfirmDialog
  open={showDeleteUser}
  onOpenChange={setShowDeleteUser}
  variant="destructive"
  title="Delete User Account"
  description="This will permanently delete the user account and all associated data."
  confirmText="Delete Account"
  confirmVariant="destructive"
  onConfirm={deleteUserAccount}
/>

// With custom icon
<ConfirmDialog
  open={showWarning}
  onOpenChange={setShowWarning}
  variant="warning"
  icon={<AlertTriangle />}
  title="Unsaved Changes"
  description="You have unsaved changes. Do you want to save before leaving?"
  confirmText="Save Changes"
  cancelText="Discard"
  onConfirm={saveAndLeave}
  onCancel={discardAndLeave}
/>

// Async operation with loading
<ConfirmDialog
  open={showSaveConfirm}
  onOpenChange={setShowSaveConfirm}
  title="Save Changes"
  description="This will save your changes to the server."
  loading={isSaving}
  loadingText="Saving..."
  onConfirm={async () => {
    await saveChanges();
  }}
/>

// Custom content
<ConfirmDialog
  open={showCustomConfirm}
  onOpenChange={setShowCustomConfirm}
  title="Confirm Action"
>
  <div className="space-y-4">
    <p>This action will affect the following items:</p>
    <ul className="list-disc pl-5">
      <li>Item 1</li>
      <li>Item 2</li>
      <li>Item 3</li>
    </ul>
    <p>Are you sure you want to continue?</p>
  </div>
</ConfirmDialog>

// Info confirmation
<ConfirmDialog
  open={showInfoConfirm}
  onOpenChange={setShowInfoConfirm}
  variant="info"
  title="Feature Update"
  description="This feature has been updated. Would you like to see what's new?"
  confirmText="Show Updates"
  cancelText="Maybe Later"
  onConfirm={showFeatureUpdate}
/>

// Prevent closing during operation
<ConfirmDialog
  open={showProcessConfirm}
  onOpenChange={setShowProcessConfirm}
  title="Start Process"
  description="This process cannot be stopped once started."
  preventClose={isProcessing}
  loading={isProcessing}
  onConfirm={startProcess}
/>
```

## Visual Design

### Variants
- **default**: Standard confirmation styling
- **destructive**: Red color scheme for dangerous actions
- **warning**: Yellow/orange for warning actions
- **info**: Blue for informational confirmations

### Visual Elements
- Modal overlay with backdrop
- Centered dialog box
- Optional icon aligned with content
- Clear action buttons
- Loading state indicator

## Technical Implementation

### Core Structure
```typescript
const ConfirmDialog = forwardRef<HTMLDivElement, ConfirmDialogProps>(
  ({ 
    open,
    onOpenChange,
    title,
    description,
    children,
    onConfirm,
    onCancel,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmVariant = 'primary',
    confirmDisabled = false,
    variant = 'default',
    icon,
    showIcon = true,
    closeOnConfirm = true,
    closeOnCancel = true,
    preventClose = false,
    loading = false,
    loadingText = 'Loading...',
    className,
    contentClassName,
    ...props 
  }, ref) => {
    const [isConfirming, setIsConfirming] = useState(false);
    
    // Default icons for variants
    const defaultIcons = {
      default: <HelpCircle />,
      destructive: <AlertTriangle />,
      warning: <AlertTriangle />,
      info: <Info />
    };
    
    const dialogIcon = icon || (showIcon ? defaultIcons[variant] : null);
    
    const handleConfirm = async () => {
      if (confirmDisabled || isConfirming) return;
      
      try {
        setIsConfirming(true);
        await onConfirm?.();
        
        if (closeOnConfirm) {
          onOpenChange?.(false);
        }
      } catch (error) {
        console.error('Confirmation action failed:', error);
        // Don't close on error
      } finally {\n        setIsConfirming(false);\n      }\n    };\n    \n    const handleCancel = () => {\n      if (preventClose || isConfirming) return;\n      \n      onCancel?.();\n      \n      if (closeOnCancel) {\n        onOpenChange?.(false);\n      }\n    };\n    \n    const handleOpenChange = (newOpen: boolean) => {\n      if (!newOpen && (preventClose || isConfirming)) {\n        return; // Prevent closing\n      }\n      \n      if (!newOpen) {\n        handleCancel();\n      } else {\n        onOpenChange?.(newOpen);\n      }\n    };\n    \n    const isLoading = loading || isConfirming;\n    const currentConfirmText = isLoading ? loadingText : confirmText;\n    \n    return (\n      <Dialog\n        ref={ref}\n        open={open}\n        onOpenChange={handleOpenChange}\n        className={cn(confirmDialogStyles.dialog, className)}\n        {...props}\n      >\n        <div className={cn(\n          confirmDialogStyles.content,\n          confirmDialogStyles.variant[variant],\n          contentClassName\n        )}>\n          {/* Header with icon and title */}\n          {(dialogIcon || title) && (\n            <div className={confirmDialogStyles.header}>\n              {dialogIcon && (\n                <div className={confirmDialogStyles.icon}>\n                  {dialogIcon}\n                </div>\n              )}\n              \n              {title && (\n                <h2 className={confirmDialogStyles.title}>\n                  {title}\n                </h2>\n              )}\n            </div>\n          )}\n          \n          {/* Body content */}\n          <div className={confirmDialogStyles.body}>\n            {children || (\n              description && (\n                <p className={confirmDialogStyles.description}>\n                  {description}\n                </p>\n              )\n            )}\n          </div>\n          \n          {/* Actions */}\n          <div className={confirmDialogStyles.actions}>\n            <Button\n              variant=\"outline\"\n              onClick={handleCancel}\n              disabled={preventClose || isConfirming}\n            >\n              {cancelText}\n            </Button>\n            \n            <LoadingButton\n              variant={confirmVariant}\n              onClick={handleConfirm}\n              disabled={confirmDisabled}\n              loading={isLoading}\n              loadingText={loadingText}\n            >\n              {confirmText}\n            </LoadingButton>\n          </div>\n        </div>\n      </Dialog>\n    );\n  }\n);\n```\n\n### CSS Module Structure\n```css\n.dialog {\n  /* Dialog-specific overrides */\n}\n\n.content {\n  max-width: 400px;\n  width: 90vw;\n  background: var(--color-surface);\n  border-radius: var(--border-radius-lg);\n  box-shadow: var(--shadow-xl);\n  overflow: hidden;\n}\n\n.variant {\n  &.default {\n    /* Standard styling */\n  }\n  \n  &.destructive {\n    border-top: 4px solid var(--color-error);\n  }\n  \n  &.warning {\n    border-top: 4px solid var(--color-warning);\n  }\n  \n  &.info {\n    border-top: 4px solid var(--color-info);\n  }\n}\n\n.header {\n  display: flex;\n  align-items: center;\n  gap: var(--spacing-sm);\n  padding: var(--spacing-lg) var(--spacing-lg) var(--spacing-md);\n}\n\n.icon {\n  flex-shrink: 0;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 40px;\n  height: 40px;\n  border-radius: var(--border-radius-full);\n}\n\n.variant.default .icon {\n  background: var(--color-primary-surface);\n  color: var(--color-primary);\n}\n\n.variant.destructive .icon {\n  background: var(--color-error-surface);\n  color: var(--color-error);\n}\n\n.variant.warning .icon {\n  background: var(--color-warning-surface);\n  color: var(--color-warning);\n}\n\n.variant.info .icon {\n  background: var(--color-info-surface);\n  color: var(--color-info);\n}\n\n.title {\n  font-size: var(--font-size-lg);\n  font-weight: var(--font-weight-semibold);\n  color: var(--color-text-primary);\n  margin: 0;\n  line-height: 1.4;\n}\n\n.body {\n  padding: 0 var(--spacing-lg) var(--spacing-md);\n}\n\n.description {\n  color: var(--color-text-secondary);\n  line-height: 1.5;\n  margin: 0;\n}\n\n.actions {\n  display: flex;\n  gap: var(--spacing-sm);\n  justify-content: flex-end;\n  padding: var(--spacing-md) var(--spacing-lg) var(--spacing-lg);\n  border-top: 1px solid var(--color-border);\n  background: var(--color-surface-secondary);\n}\n\n/* Mobile adjustments */\n@media (max-width: 640px) {\n  .content {\n    max-width: none;\n    width: 95vw;\n    margin: var(--spacing-md);\n  }\n  \n  .actions {\n    flex-direction: column-reverse;\n  }\n  \n  .actions > * {\n    flex: 1;\n  }\n}\n```\n\n## Accessibility Features\n- Modal dialog semantics with proper ARIA\n- Focus management and trapping\n- Keyboard navigation (Enter to confirm, Escape to cancel)\n- Screen reader friendly\n- Clear action labeling\n\n### ARIA Implementation\n```typescript\nconst ariaProps = {\n  role: 'alertdialog',\n  'aria-labelledby': title ? 'confirm-dialog-title' : undefined,\n  'aria-describedby': description ? 'confirm-dialog-description' : undefined,\n  'aria-modal': true\n};\n```\n\n### Keyboard Handlers\n```typescript\nconst handleKeyDown = (e: KeyboardEvent) => {\n  if (e.key === 'Enter' && !confirmDisabled && !isConfirming) {\n    e.preventDefault();\n    handleConfirm();\n  }\n};\n```\n\n## Dependencies\n- React (forwardRef, useState)\n- Internal Dialog component\n- Internal Button and LoadingButton components\n- Icon components (HelpCircle, AlertTriangle, Info)\n- CSS modules\n- Utility functions (cn)\n\n## Design Tokens Used\n- **Colors**: variant-specific color schemes\n- **Spacing**: padding, gaps, margins\n- **Border Radius**: dialog and icon rounding\n- **Typography**: font sizes, weights\n- **Shadows**: dialog elevation\n- **Borders**: variant indicators\n\n## Testing Considerations\n- Modal behavior and focus trapping\n- Async confirmation handling\n- Keyboard shortcuts\n- Screen reader announcements\n- Loading state management\n- Prevent close functionality\n- Various content configurations\n- Mobile responsiveness\n\n## Related Components\n- Dialog (base modal component)\n- Alert (inline notifications)\n- Modal (general modal container)\n- LoadingButton (confirm button with loading)\n\n## Common Use Cases\n- Delete confirmations\n- Destructive action warnings\n- Save/discard prompts\n- Form submission confirmations\n- Navigation away warnings\n- Feature acknowledgments\n- Permission requests\n- Data export confirmations