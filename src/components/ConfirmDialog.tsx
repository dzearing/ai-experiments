import { useTheme } from '../contexts/ThemeContextV2';
import { Button } from './ui/Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger'
}: ConfirmDialogProps) {
  const { currentStyles } = useTheme();
  const styles = currentStyles;

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-gray-900/50 dark:bg-black/50 transition-opacity" 
        onClick={handleCancel}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className={`
          relative w-full max-w-md
          bg-white dark:bg-neutral-800 ${styles.cardBorder} border ${styles.borderRadius}
          ${styles.cardShadow} 
        `}>
          <div className={`px-6 py-4 border-b ${styles.contentBorder}`}>
            <h2 className={`text-lg font-semibold ${styles.headingColor}`}>
              {title}
            </h2>
          </div>

          <div className="p-6">
            <p className={`${styles.textColor}`}>
              {message}
            </p>
          </div>

          <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t ${styles.contentBorder}`}>
            <Button
              onClick={handleCancel}
              variant="secondary"
            >
              {cancelText}
            </Button>
            <Button
              onClick={handleConfirm}
              variant={variant === 'danger' ? 'primary' : 'primary'}
              className={variant === 'danger' ? '!bg-red-600 hover:!bg-red-700' : ''}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}