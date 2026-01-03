/**
 * Shared hook for tracking agent progress events.
 * Used by all agent hooks (usePlanAgent, useIdeaAgent, useFacilitatorSocket)
 * for consistent progress feedback UX.
 */

import { useState, useCallback } from 'react';

/**
 * Progress event types
 */
export type AgentProgressType = 'tool_start' | 'tool_complete' | 'thinking' | 'status';

/**
 * Agent progress event from the server
 */
export interface AgentProgressEvent {
  type: AgentProgressType;
  timestamp: number;
  toolName?: string;
  displayText: string;

  // File operations
  filePath?: string;
  lineRange?: { start: number; end: number };
  linesAdded?: number;
  linesRemoved?: number;
  codePreview?: string;

  // Search operations
  searchQuery?: string;
  searchPath?: string;
  resultCount?: number;
  matchedFiles?: string[];

  // Command execution
  command?: string;
  exitCode?: number;
  stdout?: string;

  // Completion info
  success?: boolean;
}

/**
 * Progress state managed by the hook
 */
export interface AgentProgressState {
  /** Currently active event (tool in progress, thinking, etc.) */
  currentEvent: AgentProgressEvent | null;
  /** Recent completed events for context */
  recentEvents: AgentProgressEvent[];
  /** Whether there's an active operation */
  isProcessing: boolean;
}

/**
 * Hook for tracking agent progress events.
 * Returns state and handlers for managing progress display.
 */
export function useAgentProgress() {
  const [state, setState] = useState<AgentProgressState>({
    currentEvent: null,
    recentEvents: [],
    isProcessing: false,
  });

  /**
   * Handle an incoming progress event from WebSocket
   */
  const handleProgressEvent = useCallback((event: AgentProgressEvent) => {
    setState((prev) => {
      if (event.type === 'tool_start' || event.type === 'thinking' || event.type === 'status') {
        // New active operation
        return {
          currentEvent: event,
          recentEvents: prev.recentEvents,
          isProcessing: true,
        };
      } else if (event.type === 'tool_complete') {
        // Operation completed - move to recent
        return {
          currentEvent: null,
          recentEvents: [event, ...prev.recentEvents].slice(0, 5),
          isProcessing: false,
        };
      }
      return prev;
    });
  }, []);

  /**
   * Clear all progress state (call when operation completes or resets)
   */
  const clearProgress = useCallback(() => {
    setState({
      currentEvent: null,
      recentEvents: [],
      isProcessing: false,
    });
  }, []);

  /**
   * Set processing state without a specific event
   */
  const setProcessing = useCallback((isProcessing: boolean) => {
    setState((prev) => ({
      ...prev,
      isProcessing,
      currentEvent: isProcessing ? prev.currentEvent : null,
    }));
  }, []);

  return {
    ...state,
    handleProgressEvent,
    clearProgress,
    setProcessing,
  };
}
