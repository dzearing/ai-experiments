import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContextV2';
import { Button } from './ui/Button';
import type { WorkItem } from '../types';

interface WorkItemDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workItem: WorkItem | null;
  onConfirm: (permanentDelete: boolean) => void;
}

export function WorkItemDeleteDialog({
  isOpen,
  onClose,
  workItem,
  onConfirm,
}: WorkItemDeleteDialogProps) {
  const { currentStyles } = useTheme();
  const styles = currentStyles;
  const [permanentDelete, setPermanentDelete] = useState(false);

  if (!isOpen || !workItem) return null;

  const handleConfirm = () => {
    onConfirm(permanentDelete);
    setPermanentDelete(false); // Reset for next time
    onClose();
  };

  const handleCancel = () => {
    setPermanentDelete(false); // Reset
    onClose();
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
        <div
          className={`
          relative w-full max-w-md
          bg-white dark:bg-neutral-800 ${styles.cardBorder} border ${styles.borderRadius}
          ${styles.cardShadow} 
        `}
        >
          <div className={`px-6 py-4 border-b ${styles.contentBorder}`}>
            <h2 className={`text-lg font-semibold ${styles.headingColor}`}>Delete Work Item</h2>
          </div>

          <div className="p-6">
            <p className={`${styles.textColor} mb-6`}>
              Are you sure you want to delete "{workItem.title}"?
            </p>

            <div
              className={`bg-gray-50 dark:bg-neutral-900/50 ${styles.contentBorder} border rounded-lg p-4`}
            >
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permanentDelete}
                  onChange={(e) => setPermanentDelete(e.target.checked)}
                  className={`mt-1 w-4 h-4 rounded border-gray-300 dark:border-neutral-600 text-blue-600 focus:ring-2 focus:ring-blue-500`}
                />
                <div className="flex-1">
                  <span className={`${styles.textColor} font-medium`}>
                    Permanently delete markdown file
                  </span>
                  <p className={`${styles.mutedText} text-sm mt-1`}>
                    {permanentDelete
                      ? 'The markdown file will be permanently deleted and cannot be recovered.'
                      : "The markdown file will be moved to the 'discarded' folder and can be restored later."}
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div
            className={`flex items-center justify-end gap-3 px-6 py-4 border-t ${styles.contentBorder}`}
          >
            <Button onClick={handleCancel} variant="secondary">
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              variant="primary"
              className={permanentDelete ? '!bg-red-600 hover:!bg-red-700' : ''}
            >
              {permanentDelete ? 'Delete Permanently' : 'Move to Discarded'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
