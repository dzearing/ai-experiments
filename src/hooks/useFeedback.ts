import { useState, useCallback } from 'react';
import { feedbackService, type FeedbackData } from '../services/feedbackService';
import { useClaudeCode } from '../contexts/ClaudeCodeContext';

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
  messageId
}: UseFeedbackOptions): UseFeedbackReturn {
  const { messages, mode, isConnected } = useClaudeCode();
  const [showDialog, setShowDialog] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedbackId, setFeedbackId] = useState<string | null>(null);

  const openFeedback = useCallback(() => {
    setShowDialog(true);
    setError(null);
  }, []);

  const closeFeedback = useCallback(() => {
    setShowDialog(false);
    setError(null);
  }, []);

  const closeSuccess = useCallback(() => {
    setShowSuccess(false);
    setFeedbackId(null);
  }, []);

  const submitFeedback = useCallback(async (
    expectedBehavior: string,
    actualBehavior: string
  ) => {
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
        messages: messages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          isGreeting: msg.isGreeting,
          toolExecutions: msg.toolExecutions
        })),
        mode,
        isConnected
      };

      // Submit feedback with screenshot
      const id = await feedbackService.submitFeedbackWithScreenshot(feedbackData);
      
      // Success!
      setFeedbackId(id);
      setShowDialog(false);
      setShowSuccess(true);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit feedback';
      setError(errorMessage);
      console.error('Feedback submission failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [sessionId, repoName, projectId, messageId, messages, mode, isConnected]);

  return {
    showDialog,
    showSuccess,
    isSubmitting,
    error,
    feedbackId,
    openFeedback,
    closeFeedback,
    submitFeedback,
    closeSuccess
  };
}