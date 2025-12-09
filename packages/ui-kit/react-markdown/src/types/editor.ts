/**
 * Editor types for MarkdownEditor component
 */

import type { Editor } from '@tiptap/react';

export interface SelectionRange {
  /** Start position in document */
  from: number;
  /** End position in document */
  to: number;
  /** Start line number */
  lineStart: number;
  /** End line number */
  lineEnd: number;
  /** Selected text content */
  text: string;
}

export interface LineNumberState {
  /** Map of document position to line number */
  lineNumbers: Map<number, number>;
  /** Total number of lines */
  totalLines: number;
}

export interface EditorState {
  /** TipTap editor instance */
  editor: Editor | null;
  /** Current markdown content */
  markdown: string;
  /** Whether editor is focused */
  isFocused: boolean;
  /** Current selection range */
  selection: SelectionRange | null;
}

export type ToolbarItem =
  | 'bold'
  | 'italic'
  | 'strikethrough'
  | 'code'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bulletList'
  | 'orderedList'
  | 'taskList'
  | 'blockquote'
  | 'codeBlock'
  | 'divider'
  | 'link'
  | 'image'
  | 'table'
  | 'undo'
  | 'redo';

export interface ToolbarConfig {
  /** Items to show in toolbar */
  items?: ToolbarItem[];
  /** Toolbar position */
  position?: 'top' | 'bottom' | 'floating';
  /** Show dividers between groups */
  showDividers?: boolean;
}

export interface ToolbarButton {
  /** Button icon */
  icon: React.ReactNode;
  /** Click handler */
  onClick: () => void;
  /** Tooltip text */
  tooltip?: string;
  /** Whether button is active */
  isActive?: boolean;
  /** Whether button is disabled */
  disabled?: boolean;
}
