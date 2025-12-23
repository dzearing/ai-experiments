export { useYjsCollaboration } from './useYjsCollaboration';
export type {
  UseYjsCollaborationOptions,
  UseYjsCollaborationResult,
  CoAuthor,
  ConnectionState,
} from './useYjsCollaboration';

export { useChatSocket } from './useChatSocket';

export { useWorkspaceSocket } from './useWorkspaceSocket';
export type {
  ResourcePresence,
  WorkspaceMessage,
  UseWorkspaceSocketOptions,
} from './useWorkspaceSocket';

export { useGlobalKeyboard } from './useGlobalKeyboard';
export type { UseGlobalKeyboardOptions } from './useGlobalKeyboard';

export { useFacilitatorSocket } from './useFacilitatorSocket';
export type {
  UseFacilitatorSocketOptions,
  UseFacilitatorSocketReturn,
} from './useFacilitatorSocket';

// Re-export Extension type for convenience
export type { Extension } from '@codemirror/state';
