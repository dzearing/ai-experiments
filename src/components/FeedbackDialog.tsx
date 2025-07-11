import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../contexts/ThemeContextV2';
import { Button } from './ui/Button';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { TextArea } from './ui/Input';
import { useDraggable } from '../hooks/useDraggable';

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
  const [feedback, setFeedback] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  
  // Setup draggable functionality
  const { dragRef, handleRef, style: dragStyle } = useDraggable();
  
  // Focus the textarea when dialog opens
  useEffect(() => {
    if (isOpen && textAreaRef.current) {
      // Small delay to ensure the dialog is fully rendered
      setTimeout(() => {
        textAreaRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    // Clear previous errors
    setValidationError(null);

    // Validate input
    if (!feedback.trim()) {
      setValidationError('Please provide your feedback');
      return;
    }

    // Parse feedback to extract expected and actual behavior
    const lines = feedback.trim().split('\n');
    let actualBehavior = '';
    let expectedBehavior = '';
    let isExpectedSection = false;
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes('expected:') || lowerLine.includes('what i expected:')) {
        isExpectedSection = true;
      } else if (lowerLine.includes('actual:') || lowerLine.includes('what happened:')) {
        isExpectedSection = false;
      } else if (isExpectedSection) {
        expectedBehavior += (expectedBehavior ? '\n' : '') + line;
      } else {
        actualBehavior += (actualBehavior ? '\n' : '') + line;
      }
    }

    // If no clear sections found, use the whole text as actual behavior
    if (!actualBehavior && !expectedBehavior) {
      actualBehavior = feedback.trim();
      expectedBehavior = 'Not specified';
    }

    try {
      await onSubmit(expectedBehavior.trim() || 'Not specified', actualBehavior.trim() || feedback.trim());
      // Clear form on success
      setFeedback('');
    } catch (err) {
      // Error handling is done by parent component
      console.error('Feedback submission error:', err);
    }
  };

  const handleClose = () => {
    setFeedback('');
    setValidationError(null);
    onClose();
  };

  const dialogContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-gray-900/50 dark:bg-black/50 transition-opacity" 
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div 
        ref={dragRef}
        className="relative p-4 w-full max-w-2xl"
        style={dragStyle}
      >
        <div className={`
          relative w-full flex flex-col max-h-[90vh]
          bg-white dark:bg-neutral-800 ${styles.cardBorder} border ${styles.borderRadius}
          ${styles.cardShadow} 
        `}>
          <div 
            ref={handleRef}
            className={`px-6 py-4 border-b ${styles.contentBorder} flex-shrink-0 cursor-grab active:cursor-grabbing`}
          >
            <h2 className={`text-lg font-semibold ${styles.headingColor} select-none`}>
              Leave feedback
            </h2>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            <p className={`${styles.textColor} mb-6`}>
              Help us improve Claude Flow by describing what happened.
            </p>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${styles.textColor} mb-2`}>
                  Describe your feedback *
                </label>
                <TextArea
                  ref={textAreaRef}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={6}
                  placeholder=""
                  disabled={isSubmitting}
                  error={!!validationError && !feedback.trim()}
                  className="resize-none font-mono text-sm"
                  autoFocus
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
              disabled={isSubmitting || !feedback.trim()}
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

  // Render using React Portal to ensure it's at document level
  return createPortal(dialogContent, document.body);
}