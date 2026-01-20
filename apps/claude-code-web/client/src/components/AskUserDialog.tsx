import { useCallback } from 'react';

import { OpenQuestionsResolver } from '@ui-kit/react-chat';
import type { OpenQuestion, OpenQuestionsResult } from '@ui-kit/react-chat';

import type { QuestionItem } from '../types/agent';

export interface AskUserDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Questions from the SDK */
  questions: QuestionItem[];
  /** Called when user completes the questions */
  onComplete: (answers: Record<string, string>) => void;
  /** Called when user dismisses without completing */
  onDismiss: () => void;
}

/**
 * Transforms SDK question format to OpenQuestion format for the resolver.
 */
function transformQuestions(questions: QuestionItem[]): OpenQuestion[] {
  return questions.map((q, index) => ({
    id: `q-${index}`,
    question: q.question,
    context: undefined,
    selectionType: q.multiSelect ? 'multiple' : 'single',
    options: q.options.map((opt, optIndex) => ({
      id: `opt-${optIndex}`,
      label: opt.label,
      description: opt.description,
    })),
    allowCustom: true,
  }));
}

/**
 * Transforms OpenQuestionsResult back to SDK answer format.
 */
function transformAnswers(result: OpenQuestionsResult, questions: QuestionItem[]): Record<string, string> {
  const answers: Record<string, string> = {};

  result.answers.forEach((answer, index) => {
    const question = questions[index];

    if (!question) return;

    // Get selected option labels
    const selectedLabels = answer.selectedOptionIds
      .filter(id => id !== 'custom')
      .map(id => {
        const optIndex = parseInt(id.replace('opt-', ''), 10);
        const opt = question.options[optIndex];

        return opt?.label || '';
      })
      .filter(Boolean);

    // Handle custom text
    if (answer.selectedOptionIds.includes('custom') && answer.customText) {
      selectedLabels.push(answer.customText);
    }

    // Join multiple selections with comma
    answers[question.question] = selectedLabels.join(', ');
  });

  return answers;
}

/**
 * AskUserDialog renders the OpenQuestionsResolver for SDK question requests.
 * Transforms between SDK question format and the resolver's expected format.
 */
export function AskUserDialog({
  open,
  questions,
  onComplete,
  onDismiss,
}: AskUserDialogProps) {
  const openQuestions = transformQuestions(questions);

  const handleComplete = useCallback((result: OpenQuestionsResult) => {
    if (result.dismissed) {
      onDismiss();

      return;
    }

    const answers = transformAnswers(result, questions);

    onComplete(answers);
  }, [questions, onComplete, onDismiss]);

  if (!open || questions.length === 0) {
    return null;
  }

  return (
    <OpenQuestionsResolver
      questions={openQuestions}
      onComplete={handleComplete}
      onDismiss={onDismiss}
      variant="centered"
    />
  );
}

AskUserDialog.displayName = 'AskUserDialog';
