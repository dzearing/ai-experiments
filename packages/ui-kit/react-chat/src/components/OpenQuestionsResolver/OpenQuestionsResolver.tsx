import { useState, type HTMLAttributes } from 'react';
import { Button, Heading, IconButton, Progress, ProgressDots, Text } from '@ui-kit/react';
import { ArrowLeftIcon } from '@ui-kit/icons/ArrowLeftIcon';
import { ArrowRightIcon } from '@ui-kit/icons/ArrowRightIcon';
import { CheckCircleIcon } from '@ui-kit/icons/CheckCircleIcon';
import { CloseIcon } from '@ui-kit/icons/CloseIcon';
import { QuestionOptions } from './QuestionOptions';
import type { OpenQuestion, OpenQuestionsResult, QuestionAnswer, ThingPickerData } from './types';
import styles from './OpenQuestionsResolver.module.css';

/**
 * Labels for customizing button text
 */
export interface OpenQuestionsResolverLabels {
  next?: string;
  previous?: string;
  done?: string;
  dismiss?: string;
}

export interface OpenQuestionsResolverProps extends HTMLAttributes<HTMLDivElement> {
  /** Array of questions to present */
  questions: OpenQuestion[];
  /** Called when user completes or dismisses the resolver */
  onComplete: (result: OpenQuestionsResult) => void;
  /** Called when user dismisses without completing (optional) */
  onDismiss?: () => void;
  /** Initial question index (default: 0) */
  initialIndex?: number;
  /** Layout variant */
  variant?: 'centered' | 'fullscreen';
  /** Custom labels for buttons */
  labels?: OpenQuestionsResolverLabels;
}

/**
 * OpenQuestionsResolver - Present open questions to users and collect answers
 *
 * Surfaces used:
 * - soft (card background)
 * - strong (option cards)
 * - primary (selected option cards)
 *
 * Features:
 * - Single and multiple choice questions
 * - Optional custom "Other" text input
 * - Keyboard navigation (arrows to navigate, space/enter to select)
 * - Focus memory per question
 * - Progress indication
 */
export function OpenQuestionsResolver({
  questions,
  onComplete,
  onDismiss,
  initialIndex = 0,
  variant = 'centered',
  labels,
  className,
  ...props
}: OpenQuestionsResolverProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [customTexts, setCustomTexts] = useState<Record<string, string>>({});
  const [focusIndices, setFocusIndices] = useState<Record<string, number>>({});
  const [thingDataMap, setThingDataMap] = useState<Record<string, ThingPickerData>>({});
  const [filePathMap, setFilePathMap] = useState<Record<string, string>>({});

  const question = questions[currentIndex];
  const selectedIds = selections[question?.id] || [];
  const customText = customTexts[question?.id] || '';
  const focusIndex = focusIndices[question?.id] ?? 0;
  const thingData = thingDataMap[question?.id];
  const filePath = filePathMap[question?.id] || '';

  const handleSelect = (optionId: string) => {
    if (!question) return;

    if (question.selectionType === 'single') {
      setSelections((prev) => ({ ...prev, [question.id]: [optionId] }));
    } else {
      setSelections((prev) => {
        const current = prev[question.id] || [];
        if (current.includes(optionId)) {
          return { ...prev, [question.id]: current.filter((id) => id !== optionId) };
        }
        return { ...prev, [question.id]: [...current, optionId] };
      });
    }
  };

  const handleCustomChange = (text: string) => {
    if (!question) return;
    setCustomTexts((prev) => ({ ...prev, [question.id]: text }));
  };

  const handleThingSelect = (thing: ThingPickerData) => {
    if (!question) return;
    setThingDataMap((prev) => ({ ...prev, [question.id]: thing }));
  };

  const handleFilePathChange = (path: string) => {
    if (!question) return;
    setFilePathMap((prev) => ({ ...prev, [question.id]: path }));
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleComplete = () => {
    const answers: QuestionAnswer[] = questions.map((q) => ({
      questionId: q.id,
      selectedOptionIds: selections[q.id] || [],
      customText: customTexts[q.id],
      thingData: thingDataMap[q.id],
      filePath: filePathMap[q.id],
    }));
    onComplete({ answers, completed: true, dismissed: false });
  };

  const handleDismiss = () => {
    const answers: QuestionAnswer[] = questions.map((q) => ({
      questionId: q.id,
      selectedOptionIds: selections[q.id] || [],
      customText: customTexts[q.id],
      thingData: thingDataMap[q.id],
      filePath: filePathMap[q.id],
    }));
    onComplete({ answers, completed: false, dismissed: true });
    onDismiss?.();
  };

  // Can proceed to next/done based on selection type:
  // - thing-picker: must have thing data with a name (thingId or name as path)
  // - file-path: must have a non-empty file path
  // - single/multiple: at least one option selected, custom text if "custom" is selected
  const canProceed = (() => {
    if (question?.selectionType === 'thing-picker') {
      return Boolean(thingData?.name?.trim());
    }
    if (question?.selectionType === 'file-path') {
      return Boolean(filePath.trim());
    }
    return selectedIds.length > 0 && (!selectedIds.includes('custom') || customText.trim());
  })();

  if (!question) {
    return null;
  }

  const classNames = [
    styles.container,
    variant === 'fullscreen' && styles.fullscreen,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (variant === 'fullscreen') {
    const progress = ((currentIndex + 1) / questions.length) * 100;

    return (
      <div className={classNames} {...props}>
        <div className={styles.fullOverlayProgress}>
          <Progress value={progress} size="sm" />
        </div>

        <div className={styles.fullOverlayHeader}>
          <Button variant="ghost" icon={<ArrowLeftIcon />} onClick={handleDismiss}>
            {labels?.dismiss || 'Return to chat'}
          </Button>
          <div className={styles.stepperContainer}>
            {questions.map((q, i) => (
              <div
                key={q.id}
                className={`${styles.stepperItem} ${i < currentIndex ? styles.stepperItemComplete : ''} ${i === currentIndex ? styles.stepperItemCurrent : ''}`}
              >
                <div className={styles.stepperDot}>
                  {i < currentIndex ? <CheckCircleIcon /> : i + 1}
                </div>
                {i < questions.length - 1 && <div className={styles.stepperLine} />}
              </div>
            ))}
          </div>
          <div style={{ width: 140 }} />
        </div>

        <div className={styles.fullOverlayContent}>
          <div className={styles.fullOverlayQuestion}>
            <Text size="sm" color="soft">
              Question {currentIndex + 1} of {questions.length}
            </Text>

            <Heading level={1} size={2} className={styles.fullOverlayTitle}>
              {question.question}
            </Heading>

            {question.context && (
              <Text color="soft" size="lg" className={styles.fullOverlayContext}>
                {question.context}
              </Text>
            )}

            <div className={styles.fullOverlayOptions}>
              <QuestionOptions
                question={question}
                selectedIds={selectedIds}
                customText={customText}
                onSelect={handleSelect}
                onCustomChange={handleCustomChange}
                onPrevious={currentIndex > 0 ? handlePrevious : undefined}
                onNext={currentIndex < questions.length - 1 ? handleNext : undefined}
                autoFocusIndex={focusIndex}
                onFocusIndexChange={(i) => setFocusIndices((prev) => ({ ...prev, [question.id]: i }))}
                thingData={thingData}
                onThingSelect={handleThingSelect}
                filePath={filePath}
                onFilePathChange={handleFilePathChange}
              />
            </div>
          </div>
        </div>

        <div className={styles.fullOverlayFooter}>
          <div className={styles.footerActions}>
            <Button
              variant="ghost"
              icon={<ArrowLeftIcon />}
              disabled={currentIndex === 0}
              onClick={handlePrevious}
            >
              {labels?.previous || 'Previous'}
            </Button>
            {currentIndex < questions.length - 1 ? (
              <Button variant="primary" onClick={handleNext} iconAfter={<ArrowRightIcon />}>
                {labels?.next || 'Next'}
              </Button>
            ) : (
              <Button variant="primary" disabled={!canProceed} onClick={handleComplete} iconAfter={<CheckCircleIcon />}>
                {labels?.done || 'Done'}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Centered variant (default)
  return (
    <div className={classNames} {...props}>
      <div className={styles.backdrop} onClick={handleDismiss} />

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <Text weight="medium">{questions.length === 1 ? 'Open Question' : 'Open Questions'}</Text>
          <div className={styles.cardHeaderCenter}>
            <ProgressDots current={currentIndex} total={questions.length} />
          </div>
          <div className={styles.cardHeaderRight}>
            <Text size="sm" color="soft">
              {currentIndex + 1} of {questions.length}
            </Text>
            <IconButton
              variant="ghost"
              icon={<CloseIcon />}
              aria-label={labels?.dismiss || 'Return to chat'}
              onClick={handleDismiss}
            />
          </div>
        </div>

        <div className={styles.cardBody}>
          <Heading level={2} size={4}>{question.question}</Heading>
          {question.context && (
            <Text color="soft" className={styles.questionContext}>
              {question.context}
            </Text>
          )}

          <QuestionOptions
            question={question}
            selectedIds={selectedIds}
            customText={customText}
            onSelect={handleSelect}
            onCustomChange={handleCustomChange}
            onPrevious={currentIndex > 0 ? handlePrevious : undefined}
            onNext={currentIndex < questions.length - 1 ? handleNext : undefined}
            autoFocusIndex={focusIndex}
            onFocusIndexChange={(i) => setFocusIndices((prev) => ({ ...prev, [question.id]: i }))}
            thingData={thingData}
            onThingSelect={handleThingSelect}
            filePath={filePath}
            onFilePathChange={handleFilePathChange}
          />
        </div>

        <div className={styles.cardFooter}>
          <div className={styles.footerActions}>
            <Button
              variant="ghost"
              icon={<ArrowLeftIcon />}
              disabled={currentIndex === 0}
              onClick={handlePrevious}
            >
              {labels?.previous || 'Previous'}
            </Button>
            {currentIndex < questions.length - 1 ? (
              <Button variant="primary" onClick={handleNext} iconAfter={<ArrowRightIcon />}>
                {labels?.next || 'Next'}
              </Button>
            ) : (
              <Button variant="primary" disabled={!canProceed} onClick={handleComplete} iconAfter={<CheckCircleIcon />}>
                {labels?.done || 'Done'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

OpenQuestionsResolver.displayName = 'OpenQuestionsResolver';
