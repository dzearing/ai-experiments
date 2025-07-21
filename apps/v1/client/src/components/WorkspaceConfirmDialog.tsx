import { useTheme } from '../contexts/ThemeContextV2';
import { Button } from './ui/Button';

interface WorkspaceConfirmDialogProps {
  isOpen: boolean;
  path: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function WorkspaceConfirmDialog({
  isOpen,
  path,
  onConfirm,
  onCancel,
}: WorkspaceConfirmDialogProps) {
  const { currentStyles } = useTheme();
  const styles = currentStyles;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-gray-900/50 dark:bg-black/50 transition-opacity" />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`
          relative w-full max-w-md
          bg-white dark:bg-neutral-800 ${styles.cardBorder} border ${styles.borderRadius}
          ${styles.cardShadow} 
        `}
        >
          {/* Header */}
          <div className={`px-6 py-4 border-b ${styles.contentBorder}`}>
            <h2 className={`text-xl font-semibold ${styles.headingColor}`}>
              Folder does not exist
            </h2>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className={`${styles.textColor}`}>
              <p className="mb-4">The folder you specified does not exist:</p>
              <div
                className={`p-3 mb-4 ${styles.contentBg} ${styles.borderRadius} border ${styles.contentBorder} font-mono text-sm break-all`}
              >
                {path}
              </div>
              <p>Would you like to create this folder and set up your workspace there?</p>
            </div>
          </div>

          {/* Footer */}
          <div
            className={`flex items-center justify-end gap-3 px-6 py-4 border-t ${styles.contentBorder}`}
          >
            <Button onClick={onCancel} variant="secondary">
              Cancel
            </Button>
            <Button onClick={onConfirm} variant="primary">
              Create folder
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
