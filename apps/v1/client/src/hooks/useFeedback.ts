import { useState, useCallback } from 'react';
import { feedbackService, type FeedbackData } from '../services/feedbackService';
import { useClaudeCode } from '../contexts/ClaudeCodeContext';
import { useToast } from '../contexts/ToastContext';

interface UseFeedbackOptions {
  sessionId: string;
  repoName: string;
  projectId: string;
  messageId?: string;
}

interface UseFeedbackReturn {
  showDialog: boolean;
  showSuccess: boolean;
  isSubmitting: boolean;
  error: string | null;
  feedbackId: string | null;
  openFeedback: () => void;
  closeFeedback: () => void;
  submitFeedback: (expectedBehavior: string, actualBehavior: string) => Promise<void>;
  closeSuccess: () => void;
}

export function useFeedback({
  sessionId,
  repoName,
  projectId,
  messageId,
}: UseFeedbackOptions): UseFeedbackReturn {
  const { messages, mode, isConnected } = useClaudeCode();
  const { showToast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedbackId, setFeedbackId] = useState<string | null>(null);
  const [capturedScreenshot, setCapturedScreenshot] = useState<string | null>(null);

  const openFeedback = useCallback(async () => {
    // Capture screenshot before opening dialog
    try {
      console.log('Capturing screenshot before opening feedback dialog...');
      const screenshot = await feedbackService.captureScreenshot();
      setCapturedScreenshot(screenshot);
    } catch (err) {
      console.error('Failed to capture screenshot:', err);
      setCapturedScreenshot(null);
    }

    // Now open the dialog
    setShowDialog(true);
    setError(null);
  }, []);

  const closeFeedback = useCallback(() => {
    setShowDialog(false);
    setError(null);
    setCapturedScreenshot(null); // Clear captured screenshot
  }, []);

  const closeSuccess = useCallback(() => {
    setShowSuccess(false);
    setFeedbackId(null);
  }, []);

  const submitFeedback = useCallback(
    async (expectedBehavior: string, actualBehavior: string) => {
      setIsSubmitting(true);
      setError(null);

      try {
        // Prepare feedback data
        const feedbackData: Omit<FeedbackData, 'screenshotPath' | 'timestamp'> = {
          expectedBehavior,
          actualBehavior,
          sessionId,
          repoName,
          projectId,
          messageId,
          messages: messages.map((msg) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
            isGreeting: msg.isGreeting,
            toolExecutions: msg.toolExecutions,
          })),
          mode,
          isConnected,
        };

        // Upload the pre-captured screenshot if available
        let screenshotPath: string | null = null;
        if (capturedScreenshot) {
          try {
            screenshotPath = await feedbackService.uploadScreenshot(
              capturedScreenshot,
              sessionId,
              repoName
            );
          } catch (err) {
            console.warn('Failed to upload screenshot:', err);
          }
        }

        // Submit feedback with screenshot path
        const completeData: FeedbackData = {
          ...feedbackData,
          screenshotPath: screenshotPath || undefined,
          timestamp: new Date().toISOString(),
        };

        const id = await feedbackService.submitFeedback(completeData);

        // Success!
        setFeedbackId(id);
        setShowDialog(false);
        // Show toast notification instead of success dialog
        showToast('Feedback submitted successfully!', 'success', 5000);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to submit feedback';
        setError(errorMessage);
        console.error('Feedback submission failed:', err);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      sessionId,
      repoName,
      projectId,
      messageId,
      messages,
      mode,
      isConnected,
      capturedScreenshot,
      showToast,
    ]
  );

  return {
    showDialog,
    showSuccess,
    isSubmitting,
    error,
    feedbackId,
    openFeedback,
    closeFeedback,
    submitFeedback,
    closeSuccess,
  };
}
