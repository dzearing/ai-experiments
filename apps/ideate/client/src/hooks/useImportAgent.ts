import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { TopicMetadata } from '../types/topic';

/**
 * Import request to send to the server
 */
export interface ImportRequest {
  sourceType: 'git' | 'local';
  gitUrl?: string;
  localPath?: string;
  instructions: string;
  targetTopicId: string;
  workspaceId?: string;
}

/**
 * Progress step from the server
 */
export interface ImportStep {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  detail?: string;
}

/**
 * Sub-task progress for decomposed imports
 */
export interface ImportSubTask {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  error?: string;
}

/**
 * Server message types
 */
interface ServerMessage {
  type: 'step_start' | 'step_update' | 'step_complete' | 'step_error' | 'complete' | 'error'
    | 'subtasks_start' | 'subtask_update' | 'subtasks_complete';
  step?: { id: string; label: string };
  stepId?: string;
  update?: { status?: ImportStep['status']; detail?: string };
  detail?: string;
  error?: string;
  createdTopics?: TopicMetadata[];
  // Sub-task fields
  totalTasks?: number;
  taskNames?: string[];
  subTask?: ImportSubTask;
  completed?: number;
  total?: number;
}

/**
 * Return type for the useImportAgent hook
 */
export interface UseImportAgentReturn {
  /** Start an import operation */
  startImport: (request: ImportRequest) => void;
  /** Cancel the current import operation */
  cancelImport: () => void;
  /** Current progress steps */
  steps: ImportStep[];
  /** Whether an import is currently running */
  isRunning: boolean;
  /** Error message if import failed */
  error: string | null;
  /** Whether the import completed successfully */
  isComplete: boolean;
  /** Topics created during the import */
  createdTopics: TopicMetadata[];
  /** Reset the state for a new import */
  reset: () => void;
  /** Sub-tasks for decomposed imports */
  subTasks: ImportSubTask[];
  /** Whether decomposition is active (parallel sub-tasks running) */
  isDecomposed: boolean;
}

/**
 * Hook for managing import agent WebSocket connection and state
 */
export function useImportAgent(): UseImportAgentReturn {
  const { user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);

  const [steps, setSteps] = useState<ImportStep[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [createdTopics, setCreatedTopics] = useState<TopicMetadata[]>([]);
  const [subTasks, setSubTasks] = useState<ImportSubTask[]>([]);
  const [isDecomposed, setIsDecomposed] = useState(false);

  // Reset state for a new import
  const reset = useCallback(() => {
    setSteps([]);
    setIsRunning(false);
    setError(null);
    setIsComplete(false);
    setCreatedTopics([]);
    setSubTasks([]);
    setIsDecomposed(false);
  }, []);

  // Handle incoming WebSocket messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: ServerMessage = JSON.parse(event.data);

      switch (message.type) {
        case 'step_start':
          if (message.step) {
            setSteps(prev => [...prev, {
              id: message.step!.id,
              label: message.step!.label,
              status: 'running',
            }]);
          }
          break;

        case 'step_update':
          if (message.stepId && message.update) {
            setSteps(prev => prev.map(step =>
              step.id === message.stepId
                ? { ...step, ...message.update }
                : step
            ));
          }
          break;

        case 'step_complete':
          if (message.stepId) {
            setSteps(prev => prev.map(step =>
              step.id === message.stepId
                ? { ...step, status: 'complete' as const, detail: message.detail || step.detail }
                : step
            ));
          }
          break;

        case 'step_error':
          if (message.stepId) {
            setSteps(prev => prev.map(step =>
              step.id === message.stepId
                ? { ...step, status: 'error' as const, detail: message.error }
                : step
            ));
          }
          break;

        case 'complete':
          setIsRunning(false);
          setIsComplete(true);
          if (message.createdTopics) {
            setCreatedTopics(message.createdTopics);
          }
          break;

        case 'error':
          setIsRunning(false);
          setError(message.error || 'Unknown error');
          break;

        // Sub-task messages for decomposed imports
        case 'subtasks_start':
          if (message.taskNames) {
            setIsDecomposed(true);
            // Initialize all sub-tasks as pending
            setSubTasks(message.taskNames.map((name, index) => ({
              id: `subtask-${index}`,
              name,
              status: 'pending',
            })));
          }
          break;

        case 'subtask_update':
          if (message.subTask) {
            setSubTasks(prev => prev.map(st =>
              st.name === message.subTask!.name
                ? { ...st, ...message.subTask }
                : st
            ));
          }
          break;

        case 'subtasks_complete':
          // All sub-tasks are done (final notification)
          break;
      }
    } catch (err) {
      console.error('[useImportAgent] Failed to parse message:', err);
    }
  }, []);

  // Start import operation
  const startImport = useCallback((request: ImportRequest) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    // Reset state
    reset();
    setIsRunning(true);

    // Determine WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = import.meta.env.VITE_API_PORT || '3002';
    const wsUrl = `${protocol}//${host}:${port}/import-ws?userId=${encodeURIComponent(user.id)}`;

    // Create WebSocket connection
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      // Send start import request
      ws.send(JSON.stringify({
        type: 'start_import',
        request,
      }));
    };

    ws.onmessage = handleMessage;

    ws.onerror = (event) => {
      console.error('[useImportAgent] WebSocket error:', event);
      setError('Connection error');
      setIsRunning(false);
    };

    ws.onclose = () => {
      wsRef.current = null;
    };
  }, [user, reset, handleMessage]);

  // Cancel import operation
  const cancelImport = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'cancel' }));
    }
    setIsRunning(false);
    setError('Import cancelled');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  return {
    startImport,
    cancelImport,
    steps,
    isRunning,
    error,
    isComplete,
    createdTopics,
    reset,
    subTasks,
    isDecomposed,
  };
}
