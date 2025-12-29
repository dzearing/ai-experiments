import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { ThingMetadata } from '../types/thing';

/**
 * Import request to send to the server
 */
export interface ImportRequest {
  sourceType: 'git' | 'local';
  gitUrl?: string;
  localPath?: string;
  instructions: string;
  targetThingId: string;
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
 * Server message types
 */
interface ServerMessage {
  type: 'step_start' | 'step_update' | 'step_complete' | 'step_error' | 'complete' | 'error';
  step?: { id: string; label: string };
  stepId?: string;
  update?: { status?: ImportStep['status']; detail?: string };
  detail?: string;
  error?: string;
  createdThings?: ThingMetadata[];
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
  /** Things created during the import */
  createdThings: ThingMetadata[];
  /** Reset the state for a new import */
  reset: () => void;
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
  const [createdThings, setCreatedThings] = useState<ThingMetadata[]>([]);

  // Reset state for a new import
  const reset = useCallback(() => {
    setSteps([]);
    setIsRunning(false);
    setError(null);
    setIsComplete(false);
    setCreatedThings([]);
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
          if (message.createdThings) {
            setCreatedThings(message.createdThings);
          }
          break;

        case 'error':
          setIsRunning(false);
          setError(message.error || 'Unknown error');
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
    createdThings,
    reset,
  };
}
