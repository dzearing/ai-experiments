import { useEffect, useRef } from 'react';
import { Checkbox, FocusZone, Radio, Text, Textarea } from '@ui-kit/react';
import { MarkdownRenderer } from '@ui-kit/react-markdown';
import type { OpenQuestion } from './types';
import styles from './OpenQuestionsResolver.module.css';

export interface QuestionOptionsProps {
  /** The question being displayed */
  question: OpenQuestion;
  /** IDs of currently selected options */
  selectedIds: string[];
  /** Custom text for the "Other" option */
  customText: string;
  /** Called when an option is selected/deselected */
  onSelect: (optionId: string) => void;
  /** Called when custom text changes */
  onCustomChange: (text: string) => void;
  /** Called to navigate to previous question */
  onPrevious?: () => void;
  /** Called to navigate to next question */
  onNext?: () => void;
  /** Index of the option to auto-focus */
  autoFocusIndex?: number;
  /** Called when focus index changes */
  onFocusIndexChange?: (index: number) => void;
}

/**
 * Internal component for rendering question options with keyboard navigation
 */
export function QuestionOptions({
  question,
  selectedIds,
  customText,
  onSelect,
  onCustomChange,
  onPrevious,
  onNext,
  autoFocusIndex = 0,
  onFocusIndexChange,
}: QuestionOptionsProps) {
  const isCustomSelected = selectedIds.includes('custom');
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus the correct item when question changes
  useEffect(() => {
    if (containerRef.current) {
      const options = containerRef.current.querySelectorAll<HTMLElement>("[role='option']");
      const targetIndex = Math.min(autoFocusIndex, options.length - 1);
      if (options[targetIndex]) {
        options[targetIndex].focus();
      }
    }
  }, [question.id, autoFocusIndex]);

  // Focus textarea when "Other" is selected
  useEffect(() => {
    if (isCustomSelected && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isCustomSelected]);

  const handleKeyDown = (e: React.KeyboardEvent, optionId: string, index: number) => {
    // Don't handle keys when focus is in a text input (textarea handles its own navigation)
    const target = e.target as HTMLElement;
    const isTextInput = target.tagName === 'TEXTAREA' || target.tagName === 'INPUT';

    if (e.key === ' ' || e.key === 'Enter') {
      // Only toggle selection if not in a text input (allow typing space/enter)
      if (!isTextInput) {
        e.preventDefault();
        onSelect(optionId);
      }
    } else if (e.key === 'ArrowLeft' && onPrevious && !isTextInput) {
      e.preventDefault();
      onFocusIndexChange?.(index);
      onPrevious();
    } else if (e.key === 'ArrowRight' && onNext && !isTextInput) {
      e.preventDefault();
      onFocusIndexChange?.(index);
      onNext();
    }
  };

  const handleFocusChange = (_element: HTMLElement, index: number) => {
    onFocusIndexChange?.(index);
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl/Cmd+Enter exits textarea and focuses the option card
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      const optionCard = (e.target as HTMLElement).closest("[role='option']") as HTMLElement;
      optionCard?.focus();
      return;
    }
    // Stop propagation for navigation keys to keep focus in textarea
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
      e.stopPropagation();
    }
  };

  return (
    <FocusZone
      ref={containerRef}
      direction="vertical"
      wrap
      className={styles.optionsList}
      selector="[role='option']"
      onFocusChange={handleFocusChange}
    >
      {question.options.map((option, index) => {
        const isSelected = selectedIds.includes(option.id);
        return (
          <div
            key={option.id}
            className={`${styles.optionCard} ${isSelected ? `${styles.optionCardSelected} surface primary` : ''}`}
            onClick={() => onSelect(option.id)}
            onKeyDown={(e) => handleKeyDown(e, option.id, index)}
            tabIndex={0}
            role="option"
            aria-selected={isSelected}
          >
            <div className={styles.optionSelector}>
              {question.selectionType === 'single' ? (
                <Radio checked={isSelected} onChange={() => onSelect(option.id)} tabIndex={-1} />
              ) : (
                <Checkbox checked={isSelected} onChange={() => onSelect(option.id)} tabIndex={-1} />
              )}
            </div>
            <div className={styles.optionContent}>
              <MarkdownRenderer content={option.label} className={styles.optionLabel} />
              {option.description && (
                <Text size="sm" color="soft">{option.description}</Text>
              )}
            </div>
          </div>
        );
      })}

      {question.allowCustom && (
        <div
          className={`${styles.optionCard} ${isCustomSelected ? `${styles.optionCardSelected} surface primary` : ''}`}
          onClick={() => onSelect('custom')}
          onKeyDown={(e) => handleKeyDown(e, 'custom', question.options.length)}
          tabIndex={0}
          role="option"
          aria-selected={isCustomSelected}
        >
          <div className={styles.optionSelector}>
            {question.selectionType === 'single' ? (
              <Radio checked={isCustomSelected} onChange={() => onSelect('custom')} tabIndex={-1} />
            ) : (
              <Checkbox checked={isCustomSelected} onChange={() => onSelect('custom')} tabIndex={-1} />
            )}
          </div>
          <div className={styles.optionContent}>
            <Text weight="medium">Other</Text>
            {isCustomSelected && (
              <Textarea
                ref={textareaRef}
                placeholder="Type your answer..."
                value={customText}
                onChange={(e) => onCustomChange(e.target.value)}
                className={styles.customInput}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={handleTextareaKeyDown}
                aria-label="Custom answer"
              />
            )}
          </div>
        </div>
      )}
    </FocusZone>
  );
}

QuestionOptions.displayName = 'QuestionOptions';
