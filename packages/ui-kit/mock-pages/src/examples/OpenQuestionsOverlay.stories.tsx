import type { Meta, StoryObj } from '@storybook/react';
import { useState, useEffect, useRef } from 'react';
import {
  Button,
  Checkbox,
  Chip,
  FocusZone,
  Heading,
  IconButton,
  Input,
  Progress,
  ProgressDots,
  Radio,
  Text,
  Textarea,
} from '@ui-kit/react';
import { ArrowLeftIcon } from '@ui-kit/icons/ArrowLeftIcon';
import { ArrowRightIcon } from '@ui-kit/icons/ArrowRightIcon';
import { ChatIcon } from '@ui-kit/icons/ChatIcon';
import { CheckCircleIcon } from '@ui-kit/icons/CheckCircleIcon';
import { ChevronDownIcon } from '@ui-kit/icons/ChevronDownIcon';
import { ChevronUpIcon } from '@ui-kit/icons/ChevronUpIcon';
import { CloseIcon } from '@ui-kit/icons/CloseIcon';
import { SendIcon } from '@ui-kit/icons/SendIcon';
import styles from './OpenQuestionsOverlay.module.css';

/**
 * # Open Questions Overlay
 *
 * When the Idea Agent generates open questions that need user input to resolve
 * ambiguity, this overlay presents each question in a focused, distraction-free
 * interface. Users can choose from options (single or multiple choice) or provide
 * custom text responses.
 *
 * ## Design Exploration
 *
 * This mock explores several UI patterns:
 *
 * 1. **CenteredCard** - Modal-like card centered over dimmed chat
 * 2. **FullOverlay** - Full-screen takeover with progress stepper
 * 3. **SlideUpPanel** - Bottom sheet that slides up over chat
 * 4. **InlineExpanded** - Expands within the chat area itself
 *
 * ## Component Gap Analysis
 *
 * Components that would improve this implementation:
 *
 * 1. **QuestionCard** - Standardized question display with option variants
 * 2. **OptionGroup** - Unified single/multi-select with custom input option
 * 3. **ProgressStepper** - Step indicator with labels and completion state
 * 4. **OverlayContainer** - Consistent overlay with backdrop, focus trap, escape handling
 * 5. **BottomSheet** - Mobile-friendly slide-up panel with drag-to-dismiss
 * 6. **QuickReply** - Chat-style quick reply buttons/chips
 */

// ============================================
// DATA TYPES
// ============================================

type SelectionType = 'single' | 'multiple';

interface QuestionOption {
  id: string;
  label: string;
  description?: string;
}

interface OpenQuestion {
  id: string;
  question: string;
  context?: string;
  selectionType: SelectionType;
  options: QuestionOption[];
  allowCustom: boolean;
}

// ============================================
// SAMPLE DATA
// ============================================

const sampleQuestions: OpenQuestion[] = [
  {
    id: 'q1',
    question: 'What notification/reminder system would be most helpful?',
    context: 'This will help determine the complexity of the notification feature and what integrations are needed.',
    selectionType: 'single',
    options: [
      { id: 'push', label: 'Push notifications', description: 'Native mobile and browser notifications' },
      { id: 'email', label: 'Email reminders', description: 'Daily or weekly digest emails' },
      { id: 'in-app', label: 'In-app notifications only', description: 'Bell icon with notification center' },
      { id: 'sms', label: 'SMS alerts', description: 'Text messages for urgent items' },
    ],
    allowCustom: true,
  },
  {
    id: 'q2',
    question: 'Should there be any gamification elements?',
    context: 'Gamification can increase engagement but adds complexity. Select all that appeal to you.',
    selectionType: 'multiple',
    options: [
      { id: 'streaks', label: 'Streaks', description: 'Track consecutive days of activity' },
      { id: 'points', label: 'Points system', description: 'Earn points for completing tasks' },
      { id: 'achievements', label: 'Achievements/badges', description: 'Unlock badges for milestones' },
      { id: 'leaderboard', label: 'Leaderboards', description: 'Compare with team members' },
    ],
    allowCustom: true,
  },
  {
    id: 'q3',
    question: 'What level of task hierarchy do you need?',
    context: 'This affects how tasks can be organized and broken down.',
    selectionType: 'single',
    options: [
      { id: 'flat', label: 'Flat list', description: 'Simple list with no nesting' },
      { id: 'single', label: 'Single level subtasks', description: 'Tasks can have one level of subtasks' },
      { id: 'unlimited', label: 'Unlimited nesting', description: 'Tasks can be nested to any depth' },
    ],
    allowCustom: false,
  },
];

const sampleChatMessages = [
  { id: '1', sender: 'user', text: 'I want to build a todo app with collaboration features' },
  { id: '2', sender: 'agent', text: "I've created a comprehensive outline for your todo app! I've included essential features like task management, organization, and tracking capabilities." },
  { id: '3', sender: 'user', text: 'we should integrate with their outlook calendar' },
  { id: '4', sender: 'agent', text: "Great idea! I've added calendar integration to the feature list." },
];

// ============================================
// SHARED COMPONENTS
// ============================================

function ChatBackground({ dimmed = false }: { dimmed?: boolean }) {
  return (
    <div className={`${styles.chatBackground} ${dimmed ? styles.chatBackgroundDimmed : ''}`}>
      <div className={styles.chatHeader}>
        <div className={styles.chatHeaderLeft}>
          <div className={styles.agentAvatar}>IA</div>
          <div>
            <Text weight="medium">Idea Agent</Text>
            <Text size="sm" color="soft">Connected</Text>
          </div>
        </div>
      </div>
      <div className={styles.chatMessages}>
        {sampleChatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`${styles.chatMessage} ${msg.sender === 'user' ? styles.chatMessageUser : styles.chatMessageAgent}`}
          >
            <Text size="sm">{msg.text}</Text>
          </div>
        ))}
      </div>
      <div className={styles.chatInput}>
        <Input placeholder="Type a message..." disabled={dimmed} aria-label="Chat input" />
        <IconButton variant="primary" icon={<SendIcon />} aria-label="Send" disabled={dimmed} />
      </div>
    </div>
  );
}

function QuestionOptions({
  question,
  selectedIds,
  customText,
  onSelect,
  onCustomChange,
  onPrevious,
  onNext,
  autoFocusIndex = 0,
  onFocusIndexChange,
}: {
  question: OpenQuestion;
  selectedIds: string[];
  customText: string;
  onSelect: (id: string) => void;
  onCustomChange: (text: string) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  autoFocusIndex?: number;
  onFocusIndexChange?: (index: number) => void;
}) {
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
              <Text weight="medium">{option.label}</Text>
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
                onKeyDown={(e) => {
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
                }}
                aria-label="Custom answer"
              />
            )}
          </div>
        </div>
      )}
    </FocusZone>
  );
}

// ============================================
// VARIANT 1: CENTERED CARD OVERLAY
// ============================================

interface CenteredCardProps {
  questions?: OpenQuestion[];
  currentIndex?: number;
}

function CenteredCardOverlay({ questions = [], currentIndex = 0 }: CenteredCardProps) {
  const [index, setIndex] = useState(currentIndex);
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [customTexts, setCustomTexts] = useState<Record<string, string>>({});
  const [focusIndices, setFocusIndices] = useState<Record<string, number>>({});

  const question = questions[index];
  const selectedIds = selections[question?.id] || [];
  const customText = customTexts[question?.id] || '';
  const focusIndex = focusIndices[question?.id] ?? 0;

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

  const canProceed = selectedIds.length > 0 && (!selectedIds.includes('custom') || customText.trim());

  if (!question) return <ChatBackground />;

  return (
    <div className={styles.container}>
      <ChatBackground dimmed />

      <div className={styles.overlayBackdrop} />

      <div className={styles.centeredCard}>
        <div className={styles.cardHeader}>
          <Text weight="medium">Open Question</Text>
          <div className={styles.cardHeaderCenter}>
            <ProgressDots current={index} total={questions.length} />
          </div>
          <div className={styles.cardHeaderRight}>
            <Text size="sm" color="soft">
              {index + 1} of {questions.length}
            </Text>
            <IconButton
              variant="ghost"
              icon={<CloseIcon />}
              aria-label="Return to chat"
              onClick={() => {}}
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
            onPrevious={index > 0 ? () => setIndex(index - 1) : undefined}
            onNext={index < questions.length - 1 ? () => setIndex(index + 1) : undefined}
            autoFocusIndex={focusIndex}
            onFocusIndexChange={(i) => setFocusIndices((prev) => ({ ...prev, [question.id]: i }))}
          />
        </div>

        <div className={styles.cardFooter}>
          <div className={styles.cardFooterRight}>
            <Button
              variant="ghost"
              icon={<ArrowLeftIcon />}
              disabled={index === 0}
              onClick={() => setIndex(index - 1)}
            >
              Previous
            </Button>
            {index < questions.length - 1 ? (
              <Button
                variant="primary"
                onClick={() => setIndex(index + 1)}
                iconAfter={<ArrowRightIcon />}
              >
                Next
              </Button>
            ) : (
              <Button variant="primary" disabled={!canProceed} iconAfter={<CheckCircleIcon />}>
                Done
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// VARIANT 2: FULL OVERLAY WITH STEPPER
// ============================================

function FullOverlayWithStepper({ questions = [], currentIndex = 0 }: CenteredCardProps) {
  const [index, setIndex] = useState(currentIndex);
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [customTexts, setCustomTexts] = useState<Record<string, string>>({});
  const [focusIndices, setFocusIndices] = useState<Record<string, number>>({});

  const question = questions[index];
  const selectedIds = selections[question?.id] || [];
  const customText = customTexts[question?.id] || '';
  const focusIndex = focusIndices[question?.id] ?? 0;

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

  const canProceed = selectedIds.length > 0 && (!selectedIds.includes('custom') || customText.trim());

  if (!question) return <ChatBackground />;

  const progress = ((index + 1) / questions.length) * 100;

  return (
    <div className={styles.fullOverlay}>
      {/* Progress bar at top */}
      <div className={styles.fullOverlayProgress}>
        <Progress value={progress} size="sm" />
      </div>

      {/* Header */}
      <div className={styles.fullOverlayHeader}>
        <Button variant="ghost" icon={<ArrowLeftIcon />} onClick={() => {}}>
          Return to chat
        </Button>
        <div className={styles.stepperContainer}>
          {questions.map((q, i) => (
            <div
              key={q.id}
              className={`${styles.stepperItem} ${i < index ? styles.stepperItemComplete : ''} ${i === index ? styles.stepperItemCurrent : ''}`}
            >
              <div className={styles.stepperDot}>
                {i < index ? <CheckCircleIcon /> : i + 1}
              </div>
              {i < questions.length - 1 && <div className={styles.stepperLine} />}
            </div>
          ))}
        </div>
        <div style={{ width: 140 }} /> {/* Spacer for balance */}
      </div>

      {/* Content */}
      <div className={styles.fullOverlayContent}>
        <div className={styles.fullOverlayQuestion}>
          <Chip variant="info" size="sm">Question {index + 1} of {questions.length}</Chip>

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
              onPrevious={index > 0 ? () => setIndex(index - 1) : undefined}
              onNext={index < questions.length - 1 ? () => setIndex(index + 1) : undefined}
              autoFocusIndex={focusIndex}
              onFocusIndexChange={(i) => setFocusIndices((prev) => ({ ...prev, [question.id]: i }))}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={styles.fullOverlayFooter}>
        <div className={styles.cardFooterRight}>
          <Button
            variant="ghost"
            icon={<ArrowLeftIcon />}
            disabled={index === 0}
            onClick={() => setIndex(index - 1)}
          >
            Previous
          </Button>
          {index < questions.length - 1 ? (
            <Button variant="primary" onClick={() => setIndex(index + 1)} iconAfter={<ArrowRightIcon />}>
              Next
            </Button>
          ) : (
            <Button variant="primary" disabled={!canProceed} iconAfter={<CheckCircleIcon />}>
              Done
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// VARIANT 3: SLIDE-UP PANEL (Bottom Sheet)
// ============================================

function SlideUpPanel({ questions = [], currentIndex = 0 }: CenteredCardProps) {
  const [index, setIndex] = useState(currentIndex);
  const [expanded, setExpanded] = useState(true);
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [customTexts, setCustomTexts] = useState<Record<string, string>>({});
  const [focusIndices, setFocusIndices] = useState<Record<string, number>>({});

  const question = questions[index];
  const selectedIds = selections[question?.id] || [];
  const customText = customTexts[question?.id] || '';
  const focusIndex = focusIndices[question?.id] ?? 0;

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

  const canProceed = selectedIds.length > 0 && (!selectedIds.includes('custom') || customText.trim());

  if (!question) return <ChatBackground />;

  return (
    <div className={styles.container}>
      <ChatBackground dimmed={expanded} />

      {expanded && <div className={styles.overlayBackdrop} onClick={() => setExpanded(false)} />}

      <div className={`${styles.slideUpPanel} ${expanded ? styles.slideUpPanelExpanded : styles.slideUpPanelCollapsed}`}>
        {/* Drag handle */}
        <div className={styles.slideUpHandle} onClick={() => setExpanded(!expanded)}>
          <div className={styles.slideUpHandleBar} />
        </div>

        {/* Collapsed preview */}
        {!expanded && (
          <div className={styles.slideUpCollapsed} onClick={() => setExpanded(true)}>
            <div className={styles.slideUpCollapsedContent}>
              <Chip variant="warning" size="sm">{questions.length} questions</Chip>
              <Text weight="medium">Resolve open questions to continue</Text>
            </div>
            <IconButton variant="ghost" icon={<ChevronUpIcon />} aria-label="Expand" />
          </div>
        )}

        {/* Expanded content */}
        {expanded && (
          <>
            <div className={styles.slideUpHeader}>
              <div className={styles.slideUpHeaderLeft}>
                <Chip variant="info" size="sm">Question {index + 1}/{questions.length}</Chip>
                <Text weight="medium">{question.question}</Text>
              </div>
              <IconButton
                variant="ghost"
                icon={<ChevronDownIcon />}
                aria-label="Collapse"
                onClick={() => setExpanded(false)}
              />
            </div>

            {question.context && (
              <div className={styles.slideUpContext}>
                <Text size="sm" color="soft">{question.context}</Text>
              </div>
            )}

            <div className={styles.slideUpBody}>
              <QuestionOptions
                question={question}
                selectedIds={selectedIds}
                customText={customText}
                onSelect={handleSelect}
                onCustomChange={handleCustomChange}
                onPrevious={index > 0 ? () => setIndex(index - 1) : undefined}
                onNext={index < questions.length - 1 ? () => setIndex(index + 1) : undefined}
                autoFocusIndex={focusIndex}
                onFocusIndexChange={(i) => setFocusIndices((prev) => ({ ...prev, [question.id]: i }))}
              />
            </div>

            <div className={styles.slideUpFooter}>
              <div className={styles.slideUpFooterProgress}>
                <Progress value={((index + 1) / questions.length) * 100} size="sm" />
              </div>
              <div className={styles.slideUpFooterActions}>
                {index > 0 && (
                  <IconButton
                    variant="ghost"
                    icon={<ArrowLeftIcon />}
                    aria-label="Previous"
                    onClick={() => setIndex(index - 1)}
                  />
                )}
                {index < questions.length - 1 ? (
                  <Button variant="primary" size="sm" onClick={() => setIndex(index + 1)}>
                    Next
                  </Button>
                ) : (
                  <Button variant="primary" size="sm" disabled={!canProceed}>
                    Done
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================
// VARIANT 4: INLINE EXPANDED (In-Chat)
// ============================================

function InlineExpanded({ questions = [], currentIndex = 0 }: CenteredCardProps) {
  const [index, setIndex] = useState(currentIndex);
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [customTexts, setCustomTexts] = useState<Record<string, string>>({});

  const question = questions[index];
  const selectedIds = selections[question?.id] || [];
  const customText = customTexts[question?.id] || '';

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

  const canProceed = selectedIds.length > 0 && (!selectedIds.includes('custom') || customText.trim());

  if (!question) return <ChatBackground />;

  return (
    <div className={styles.inlineContainer}>
      {/* Chat header */}
      <div className={styles.chatHeader}>
        <div className={styles.chatHeaderLeft}>
          <div className={styles.agentAvatar}>IA</div>
          <div>
            <Text weight="medium">Idea Agent</Text>
            <Text size="sm" color="soft">Waiting for input</Text>
          </div>
        </div>
      </div>

      {/* Chat messages with inline question */}
      <div className={styles.inlineChat}>
        {sampleChatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`${styles.chatMessage} ${msg.sender === 'user' ? styles.chatMessageUser : styles.chatMessageAgent}`}
          >
            <Text size="sm">{msg.text}</Text>
          </div>
        ))}

        {/* Inline question card */}
        <div className={styles.inlineQuestionWrapper}>
          <div className={styles.inlineQuestionCard}>
            <div className={styles.inlineQuestionHeader}>
              <div className={styles.inlineQuestionMeta}>
                <div className={styles.agentAvatarSmall}>IA</div>
                <Text size="sm">Idea Agent needs clarification</Text>
              </div>
              <Chip variant="info" size="sm">{questions.length - index} remaining</Chip>
            </div>

            <div className={styles.inlineQuestionBody}>
              <Text weight="medium">{question.question}</Text>
              {question.context && (
                <Text size="sm" color="soft" className={styles.inlineQuestionContext}>
                  {question.context}
                </Text>
              )}
            </div>

            <div className={styles.inlineOptions}>
              {question.options.map((option) => {
                const isSelected = selectedIds.includes(option.id);
                return (
                  <button
                    key={option.id}
                    className={`${styles.inlineOptionChip} ${isSelected ? styles.inlineOptionChipSelected : ''}`}
                    onClick={() => handleSelect(option.id)}
                  >
                    {question.selectionType === 'multiple' && (
                      <span className={styles.inlineOptionCheck}>
                        {isSelected && <CheckCircleIcon />}
                      </span>
                    )}
                    {option.label}
                  </button>
                );
              })}
              {question.allowCustom && (
                <button
                  className={`${styles.inlineOptionChip} ${styles.inlineOptionChipCustom}`}
                  onClick={() => handleSelect('custom')}
                >
                  Other...
                </button>
              )}
            </div>

            {selectedIds.includes('custom') && (
              <div className={styles.inlineCustomInput}>
                <Textarea
                  placeholder="Type your answer..."
                  value={customText}
                  onChange={(e) => handleCustomChange(e.target.value)}
                  aria-label="Custom answer"
                />
              </div>
            )}

            <div className={styles.inlineQuestionFooter}>
              <ProgressDots current={index} total={questions.length} />
              <div className={styles.inlineQuestionActions}>
                {index < questions.length - 1 ? (
                  <Button variant="primary" size="sm" onClick={() => setIndex(index + 1)}>
                    Next
                  </Button>
                ) : (
                  <Button variant="primary" size="sm" disabled={!canProceed}>
                    Apply Changes
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat input - disabled during questions */}
      <div className={styles.chatInput}>
        <Input placeholder="Answer the question above to continue..." disabled aria-label="Chat input" />
        <IconButton variant="primary" icon={<SendIcon />} aria-label="Send" disabled />
      </div>
    </div>
  );
}

// ============================================
// VARIANT 5: SPLIT VIEW
// ============================================

function SplitView({ questions = [], currentIndex = 0 }: CenteredCardProps) {
  const [index, setIndex] = useState(currentIndex);
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [customTexts, setCustomTexts] = useState<Record<string, string>>({});
  const [focusIndices, setFocusIndices] = useState<Record<string, number>>({});

  const question = questions[index];
  const selectedIds = selections[question?.id] || [];
  const customText = customTexts[question?.id] || '';
  const focusIndex = focusIndices[question?.id] ?? 0;

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

  const canProceed = selectedIds.length > 0 && (!selectedIds.includes('custom') || customText.trim());

  if (!question) return <ChatBackground />;

  return (
    <div className={styles.splitView}>
      {/* Left: Chat (dimmed) */}
      <div className={styles.splitViewChat}>
        <ChatBackground dimmed />
      </div>

      {/* Right: Questions panel */}
      <div className={styles.splitViewQuestions}>
        <div className={styles.splitViewHeader}>
          <div>
            <Heading level={2} size={4}>Open Questions</Heading>
            <Text size="sm" color="soft">
              Help refine your idea by answering these questions
            </Text>
          </div>
          <Button variant="ghost" icon={<ChatIcon />}>
            Back to chat
          </Button>
        </div>

        {/* Question list sidebar */}
        <div className={styles.splitViewBody}>
          <div className={styles.questionList}>
            {questions.map((q, i) => (
              <div
                key={q.id}
                className={`${styles.questionListItem} ${i === index ? styles.questionListItemActive : ''} ${selections[q.id]?.length ? styles.questionListItemAnswered : ''}`}
                onClick={() => setIndex(i)}
              >
                <div className={styles.questionListNumber}>
                  {selections[q.id]?.length ? <CheckCircleIcon /> : i + 1}
                </div>
                <Text size="sm" className={styles.questionListText}>{q.question}</Text>
              </div>
            ))}
          </div>

          {/* Active question */}
          <div className={styles.activeQuestion}>
            <div className={styles.activeQuestionHeader}>
              <Chip variant={question.selectionType === 'single' ? 'default' : 'info'} size="sm">
                {question.selectionType === 'single' ? 'Single choice' : 'Multiple choice'}
              </Chip>
            </div>

            <Heading level={3} size={4}>{question.question}</Heading>

            {question.context && (
              <Text color="soft" className={styles.activeQuestionContext}>
                {question.context}
              </Text>
            )}

            <QuestionOptions
              question={question}
              selectedIds={selectedIds}
              customText={customText}
              onSelect={handleSelect}
              onCustomChange={handleCustomChange}
              onPrevious={index > 0 ? () => setIndex(index - 1) : undefined}
              onNext={index < questions.length - 1 ? () => setIndex(index + 1) : undefined}
              autoFocusIndex={focusIndex}
              onFocusIndexChange={(i) => setFocusIndices((prev) => ({ ...prev, [question.id]: i }))}
            />

            <div className={styles.activeQuestionFooter}>
              {index > 0 && (
                <Button variant="ghost" icon={<ArrowLeftIcon />} onClick={() => setIndex(index - 1)}>
                  Previous
                </Button>
              )}
              <div style={{ flex: 1 }} />
              {index < questions.length - 1 ? (
                <Button variant="primary" onClick={() => setIndex(index + 1)} iconAfter={<ArrowRightIcon />}>
                  Next
                </Button>
              ) : (
                <Button variant="primary" disabled={!canProceed} iconAfter={<CheckCircleIcon />}>
                  Apply All
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// STORYBOOK CONFIG
// ============================================

const meta: Meta = {
  title: 'Example Pages/Open Questions Overlay',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

export const CenteredCard: StoryObj = {
  render: () => <CenteredCardOverlay questions={sampleQuestions} currentIndex={0} />,
  parameters: {
    docs: {
      description: {
        story: 'Modal-like card centered over dimmed chat. Clean, focused, familiar pattern. Good for desktop.',
      },
    },
  },
};

export const FullOverlay: StoryObj = {
  render: () => <FullOverlayWithStepper questions={sampleQuestions} currentIndex={0} />,
  parameters: {
    docs: {
      description: {
        story: 'Full-screen takeover with progress stepper. Maximum focus, clear progress. Good for complex question flows.',
      },
    },
  },
};

export const BottomSheet: StoryObj = {
  render: () => <SlideUpPanel questions={sampleQuestions} currentIndex={0} />,
  parameters: {
    docs: {
      description: {
        story: 'Slide-up panel from bottom. Can be collapsed to show chat. Good for mobile and quick interactions.',
      },
    },
  },
};

export const InlineChat: StoryObj = {
  render: () => <InlineExpanded questions={sampleQuestions} currentIndex={0} />,
  parameters: {
    docs: {
      description: {
        story: 'Questions appear inline within the chat flow. Maintains context, conversational feel. Good for simple questions.',
      },
    },
  },
};

export const SplitPanel: StoryObj = {
  render: () => <SplitView questions={sampleQuestions} currentIndex={0} />,
  parameters: {
    docs: {
      description: {
        story: 'Side-by-side view with question list. Good for reviewing/editing multiple questions. Desktop-focused.',
      },
    },
  },
};

export const SecondQuestion: StoryObj = {
  render: () => <CenteredCardOverlay questions={sampleQuestions} currentIndex={1} />,
  parameters: {
    docs: {
      description: {
        story: 'Shows the multiple-choice question variant with "select all that apply".',
      },
    },
  },
};

export const LastQuestion: StoryObj = {
  render: () => <CenteredCardOverlay questions={sampleQuestions} currentIndex={2} />,
  parameters: {
    docs: {
      description: {
        story: 'Final question in the flow, showing "Done" button instead of "Next".',
      },
    },
  },
};
