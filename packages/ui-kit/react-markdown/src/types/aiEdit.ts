/**
 * AI Edit types for programmatic document modifications
 *
 * Used for AI co-authoring features where edits are applied
 * programmatically with optional animation.
 */

export type AIEditType = 'insert' | 'replace' | 'delete' | 'format';

export interface AIEditTarget {
  /** Line-based targeting */
  lineStart?: number;
  lineEnd?: number;
  /** Position-based targeting */
  position?: {
    from: number;
    to: number;
  };
  /** Selector-based targeting */
  selector?: {
    type: 'heading' | 'paragraph' | 'codeBlock';
    text?: string;
    index?: number;
  };
}

export interface AIEdit {
  /** Type of edit operation */
  type: AIEditType;
  /** Target location for the edit */
  target: AIEditTarget;
  /** Content for insert/replace operations */
  content?: string;
  /** Marks to apply for format operations */
  marks?: string[];
  /** Optional metadata */
  metadata?: {
    /** Confidence score 0-1 */
    confidence?: number;
    /** Source identifier */
    source?: string;
    /** Timestamp */
    timestamp?: number;
  };
}

export interface EditBatch {
  /** Array of edits to apply */
  edits: AIEdit[];
  /** Whether to animate the edits */
  animate?: boolean;
  /** Animation duration per edit in ms */
  animationDuration?: number;
}

export interface EditConflict {
  /** First conflicting edit */
  editA: AIEdit;
  /** Second conflicting edit */
  editB: AIEdit;
  /** Type of conflict */
  type: 'overlap' | 'containment';
}

export interface ConflictReport {
  /** Whether conflicts were detected */
  hasConflicts: boolean;
  /** List of conflicts */
  conflicts: EditConflict[];
  /** Suggested resolution strategy */
  resolution: 'merge' | 'sequential' | 'abort';
}

export interface AIEditState {
  /** Whether edits are being applied */
  isApplying: boolean;
  /** Currently applying edit */
  currentEdit: AIEdit | null;
  /** Progress 0-1 for batch operations */
  progress: number;
}
