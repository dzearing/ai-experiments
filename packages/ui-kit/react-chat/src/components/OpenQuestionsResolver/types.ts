/**
 * Selection type for questions
 * - 'single': Only one option can be selected (radio buttons)
 * - 'multiple': Multiple options can be selected (checkboxes)
 * - 'thing-picker': Select an existing thing or create a new one
 * - 'file-path': Enter a file or folder path
 */
export type SelectionType = 'single' | 'multiple' | 'thing-picker' | 'file-path';

/**
 * Individual option within a question
 */
export interface QuestionOption {
  /** Unique identifier for the option */
  id: string;
  /** Display label for the option */
  label: string;
  /** Optional description providing more context */
  description?: string;
}

/**
 * A question to present to the user
 */
export interface OpenQuestion {
  /** Unique identifier for the question */
  id: string;
  /** The question text */
  question: string;
  /** Optional context/explanation for the question */
  context?: string;
  /** Whether single or multiple options can be selected */
  selectionType: SelectionType;
  /** Available options to choose from */
  options: QuestionOption[];
  /** Whether to show a custom "Other" option with text input (defaults to true) */
  allowCustom?: boolean;
}

/**
 * Thing data for thing-picker selection
 */
export interface ThingPickerData {
  /** ID of the selected thing */
  thingId: string;
  /** Name of the selected thing */
  name: string;
  /** Type of the selected thing */
  type: string;
  /** Resolved key properties (localPath, remoteUrl, etc.) */
  keyProperties?: {
    localPath?: string;
    remoteUrl?: string;
    branch?: string;
  };
}

/**
 * Answer to a single question
 */
export interface QuestionAnswer {
  /** ID of the question being answered */
  questionId: string;
  /** IDs of selected options (includes 'custom' if custom option was selected) */
  selectedOptionIds: string[];
  /** Custom text if the "Other" option was selected */
  customText?: string;
  /** Thing data if selectionType was 'thing-picker' */
  thingData?: ThingPickerData;
  /** File path if selectionType was 'file-path' */
  filePath?: string;
}

/**
 * Result returned when the resolver completes
 */
export interface OpenQuestionsResult {
  /** Array of answers for each question */
  answers: QuestionAnswer[];
  /** Whether all questions were completed */
  completed: boolean;
  /** Whether the user dismissed without completing */
  dismissed: boolean;
}
