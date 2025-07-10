import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContextV2';
import { Button } from './ui/Button';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { TextArea } from './ui/Input';

interface FeedbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (expectedBehavior: string, actualBehavior: string) => Promise<void>;
  isSubmitting?: boolean;
  error?: string | null;
}

export function FeedbackDialog({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  error = null
}: FeedbackDialogProps) {
  const { currentStyles } = useTheme();
  const styles = currentStyles;
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [actualBehavior, setActualBehavior] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    // Clear previous errors
    setValidationError(null);

    // Validate inputs
    if (!expectedBehavior.trim()) {
      setValidationError('Please describe what you expected to happen');
      return;
    }
    if (!actualBehavior.trim()) {
      setValidationError('Please describe what actually happened');
      return;
    }

    try {
      await onSubmit(expectedBehavior.trim(), actualBehavior.trim());
      // Clear form on success
      setExpectedBehavior('');
      setActualBehavior('');
    } catch (err) {
      // Error handling is done by parent component
      console.error('Feedback submission error:', err);
    }
  };

  const handleClose = () => {
    setExpectedBehavior('');
    setActualBehavior('');
    setValidationError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-gray-900/50 dark:bg-black/50 transition-opacity" 
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative p-4 w-full max-w-2xl">
        <div className={`
          relative w-full flex flex-col max-h-[90vh]
          bg-white dark:bg-neutral-800 ${styles.cardBorder} border ${styles.borderRadius}
          ${styles.cardShadow} 
        `}>
          <div className={`px-6 py-4 border-b ${styles.contentBorder} flex-shrink-0`}>
            <h2 className={`text-lg font-semibold ${styles.headingColor}`}>
              Leave feedback
            </h2>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            <p className={`${styles.textColor} mb-6`}>
              Help us improve Claude Code by describing what happened.
            </p>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${styles.textColor} mb-2`}>
                  What actually happened? *
                </label>
                <TextArea
                  value={actualBehavior}
                  onChange={(e) => setActualBehavior(e.target.value)}
                  rows={3}
                  placeholder="Describe what actually happened..."
                  disabled={isSubmitting}
                  error={!!validationError && !actualBehavior.trim()}
                  className="resize-none"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${styles.textColor} mb-2`}>
                  What did you expect to happen? *
                </label>
                <TextArea
                  value={expectedBehavior}
                  onChange={(e) => setExpectedBehavior(e.target.value)}
                  rows={3}
                  placeholder="Describe the expected behavior..."
                  disabled={isSubmitting}
                  error={!!validationError && !expectedBehavior.trim()}
                  className="resize-none"
                />
              </div>

              <div className={`flex items-center gap-2 text-sm ${styles.mutedText} bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md`}>
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>A screenshot will be included automatically</span>
              </div>

              {(validationError || error) && (
                <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                  {validationError || error}
                </div>
              )}
            </div>
          </div>

          <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t ${styles.contentBorder} flex-shrink-0`}>
            <Button
              onClick={handleClose}
              variant="secondary"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="primary"
              disabled={isSubmitting || !expectedBehavior.trim() || !actualBehavior.trim()}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="small" className="mr-2" />
                  Submitting...
                </>
              ) : (
                'Submit feedback'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}