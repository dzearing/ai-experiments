import { Dialog, Button } from '@ui-kit/react';

export interface ConfirmDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Dialog title */
  title: string;
  /** Confirmation message */
  message: string;
  /** Text for the confirm button */
  confirmText?: string;
  /** Text for the cancel button */
  cancelText?: string;
  /** Visual variant - affects confirm button styling */
  variant?: 'danger' | 'primary';
  /** Called when user confirms */
  onConfirm: () => void;
  /** Called when user cancels or closes dialog */
  onCancel: () => void;
}

/**
 * Reusable confirmation dialog component.
 * Use this for delete confirmations, destructive actions, etc.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const buttonVariant = variant === 'danger' ? 'danger' : 'primary';

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button variant={buttonVariant} onClick={onConfirm} data-autofocus>
            {confirmText}
          </Button>
        </div>
      }
    >
      <p>{message}</p>
    </Dialog>
  );
}
