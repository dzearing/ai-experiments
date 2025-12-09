/**
 * Collaborator types for real-time co-editing
 */

export interface Collaborator {
  /** Unique identifier for the collaborator */
  id: string;
  /** Display name */
  name: string;
  /** Cursor color (CSS color value) */
  color: string;
  /** Optional avatar URL */
  avatar?: string;
  /** Whether this is an AI agent */
  isAI?: boolean;
  /** Current status */
  status: CollaboratorStatus;
}

export type CollaboratorStatus = 'idle' | 'typing' | 'selecting' | 'disconnected';

export interface CollaboratorCursor {
  /** Collaborator ID */
  collaboratorId: string;
  /** Cursor position in the document (character offset) */
  position: number;
  /** Selection anchor (if selecting) */
  selectionAnchor?: number;
  /** Selection head (if selecting) */
  selectionHead?: number;
}

export interface CollaboratorEdit {
  /** Collaborator ID */
  collaboratorId: string;
  /** Edit type */
  type: 'insert' | 'delete' | 'replace';
  /** Position in document */
  position: number;
  /** Content to insert (for insert/replace) */
  content?: string;
  /** Length to delete (for delete/replace) */
  deleteLength?: number;
  /** Whether to stream the content character by character */
  stream?: boolean;
  /** Streaming speed (ms per character) */
  streamSpeed?: number;
}

export interface StreamingEdit {
  /** The collaborator performing the edit */
  collaborator: Collaborator;
  /** Full content to be inserted */
  fullContent: string;
  /** Currently displayed content */
  displayedContent: string;
  /** Current character index */
  currentIndex: number;
  /** Position where streaming started */
  startPosition: number;
  /** Whether streaming is complete */
  isComplete: boolean;
}

export interface CollaboratorState {
  /** All active collaborators */
  collaborators: Map<string, Collaborator>;
  /** Cursor positions by collaborator ID */
  cursors: Map<string, CollaboratorCursor>;
  /** Active streaming edits */
  streamingEdits: Map<string, StreamingEdit>;
}

export interface UseCollaboratorsOptions {
  /** Initial collaborators */
  initialCollaborators?: Collaborator[];
  /** Called when a collaborator's cursor moves */
  onCursorMove?: (collaboratorId: string, position: number) => void;
  /** Called when a collaborator starts/stops typing */
  onStatusChange?: (collaboratorId: string, status: CollaboratorStatus) => void;
  /** Called when a streaming edit completes */
  onEditComplete?: (collaboratorId: string, content: string) => void;
}

export interface UseCollaboratorsReturn {
  /** Current collaborators */
  collaborators: Collaborator[];
  /** Add a new collaborator */
  addCollaborator: (collaborator: Collaborator) => void;
  /** Remove a collaborator */
  removeCollaborator: (id: string) => void;
  /** Update collaborator cursor position */
  setCursorPosition: (collaboratorId: string, position: number) => void;
  /** Start a streaming edit for a collaborator */
  startStreamingEdit: (edit: CollaboratorEdit) => void;
  /** Get cursor position for a collaborator */
  getCursorPosition: (collaboratorId: string) => number | null;
  /** Get all cursor positions */
  getAllCursors: () => Map<string, CollaboratorCursor>;
  /** Check if a collaborator is currently streaming */
  isStreaming: (collaboratorId: string) => boolean;
  /** Get streaming progress for a collaborator */
  getStreamingProgress: (collaboratorId: string) => StreamingEdit | null;
}

/** Predefined colors for collaborators */
export const COLLABORATOR_COLORS = [
  '#E91E63', // Pink
  '#9C27B0', // Purple
  '#673AB7', // Deep Purple
  '#3F51B5', // Indigo
  '#2196F3', // Blue
  '#00BCD4', // Cyan
  '#009688', // Teal
  '#4CAF50', // Green
  '#FF9800', // Orange
  '#FF5722', // Deep Orange
] as const;

/** Get a color for a collaborator based on their index */
export function getCollaboratorColor(index: number): string {
  return COLLABORATOR_COLORS[index % COLLABORATOR_COLORS.length];
}
