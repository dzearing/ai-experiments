import { createPortal } from 'react-dom';
import { useTheme } from '../contexts/ThemeContextV2';
import { Button } from './ui/Button';

interface FeedbackSuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  feedbackId: string;
}

export function FeedbackSuccessDialog({ isOpen, onClose, feedbackId }: FeedbackSuccessDialogProps) {
  const { currentStyles } = useTheme();
  const styles = currentStyles;

  if (!isOpen) return null;

  const dialogContent = (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/50 dark:bg-black/50 transition-opacity"
        onClick={onClose}
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
            <h2 className={`text-lg font-semibold ${styles.headingColor}`}>Feedback Submitted</h2>
          </div>

          <div className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <svg
                className="w-6 h-6 text-green-600 dark:text-green-400 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1">
                <p className={`${styles.textColor} font-medium mb-1`}>
                  Thank you for your feedback!
                </p>
                <p className={`${styles.mutedText} text-sm`}>Your feedback has been saved with:</p>
              </div>
            </div>

            <ul className={`space-y-2 mb-4 ml-9 text-sm ${styles.mutedText}`}>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400">•</span>
                <span>Screenshot of the current state</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400">•</span>
                <span>Complete message history</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400">•</span>
                <span>Relevant server logs</span>
              </li>
            </ul>

            <div
              className={`bg-gray-100 dark:bg-gray-700/50 px-3 py-2 rounded-md ${styles.mutedText} text-sm font-mono`}
            >
              Feedback ID: {feedbackId}
            </div>
          </div>

          <div
            className={`flex items-center justify-end px-6 py-4 border-t ${styles.contentBorder}`}
          >
            <Button onClick={onClose} variant="primary">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(dialogContent, document.body);
}
