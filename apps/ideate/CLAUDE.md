# Ideate App Guidelines

## Client-Side Logging

**Always use the `createLogger` utility instead of `console.log/warn/error` for client-side code.**

The logging system sends client logs to the server, enabling merged client/server log traces for debugging full request flows.

### Usage

```typescript
import { createLogger } from '../utils/clientLogger';

const log = createLogger('ComponentName');

// Simple message
log.log('Something happened');

// Message with data (pass as object in second argument)
log.log('User action', { userId, action, details });

// Warnings and errors
log.warn('Potential issue', { context });
log.error('Operation failed', { error, context });
```

### Important Notes

- The second argument must be an object (not multiple positional args like console.log)
- Logs are batched and sent to `/api/log` endpoint every 500ms
- Logs are also printed locally for immediate visibility
- Use `sendBeacon` on page unload for reliable delivery

### Tag Naming Convention

Use the component or hook name as the tag:
- Components: `'IdeaDialog'`, `'ThingIdeas'`, `'IdeaCard'`
- Hooks: `'IdeaAgent'`, `'Facilitator'`, `'WorkspaceSocket'`
- Services/Providers: `'WorkspaceDataProvider'`

## Server-Side Logging

Server logs should include contextual information like `ideaId`, `userId`, `sessionId` to enable correlation with client logs.

## Confirmation Dialogs

**Always use the `ConfirmDialog` component for confirmation actions (delete, destructive operations, etc.).**

```typescript
import { ConfirmDialog } from '../components/ConfirmDialog';

<ConfirmDialog
  open={showConfirm}
  title="Delete Item?"
  message="Are you sure you want to delete this item? This action cannot be undone."
  confirmText="Delete"
  cancelText="Cancel"
  variant="danger"  // or "primary" for non-destructive actions
  onConfirm={handleConfirm}
  onCancel={handleCancel}
/>
```

### When to Use

- Delete confirmations
- Destructive/irreversible actions
- Actions that discard user data
- Switching away from unsaved changes

### Props

- `open`: Whether the dialog is visible
- `title`: Dialog title
- `message`: Confirmation message (string only)
- `confirmText`: Text for confirm button (default: "Confirm")
- `cancelText`: Text for cancel button (default: "Cancel")
- `variant`: "danger" for destructive actions, "primary" for normal actions
- `onConfirm`: Called when user confirms
- `onCancel`: Called when user cancels or closes
