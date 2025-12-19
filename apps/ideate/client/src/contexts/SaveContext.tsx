import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';

export type SaveState = 'idle' | 'saving' | 'saved';

interface PendingSave {
  id: string;
  promise: Promise<void>;
}

interface SaveContextValue {
  saveState: SaveState;
  /** @deprecated Use executeSave instead for proper navigation handling */
  setSaveState: (state: SaveState) => void;
  /** Whether a save is currently in progress */
  isSaving: boolean;
  /**
   * Execute a save operation that will complete even if the component unmounts.
   * This is the preferred way to save - it handles navigation blocking automatically.
   *
   * @param saveFunction - The async function that performs the actual save
   * @param debounceMs - Optional debounce time in ms (default: 1000)
   * @returns The save operation ID (can be used to cancel)
   */
  executeSave: (saveFunction: () => Promise<void>, debounceMs?: number) => string;
  /**
   * Cancel a pending debounced save (useful when unmounting intentionally)
   */
  cancelSave: (saveId: string) => void;
  /**
   * Check if user should be warned about leaving (for custom UI)
   */
  shouldBlockNavigation: boolean;
}

const SaveContext = createContext<SaveContextValue | null>(null);

interface SaveProviderProps {
  children: ReactNode;
}

export function SaveProvider({ children }: SaveProviderProps) {
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [pendingSaves, setPendingSaves] = useState<PendingSave[]>([]);

  // Refs for debouncing and cleanup
  const debounceTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const savedIndicatorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveIdCounterRef = useRef(0);

  const isSaving = saveState === 'saving' || pendingSaves.length > 0;
  const shouldBlockNavigation = isSaving;

  // Handle beforeunload - warn user if they try to close/refresh during save
  useEffect(() => {
    if (!isSaving) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isSaving]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all debounce timers
      debounceTimersRef.current.forEach((timer) => clearTimeout(timer));
      debounceTimersRef.current.clear();

      if (savedIndicatorTimeoutRef.current) {
        clearTimeout(savedIndicatorTimeoutRef.current);
      }
    };
  }, []);

  const executeSave = useCallback((saveFunction: () => Promise<void>, debounceMs = 1000): string => {
    const saveId = `save-${Date.now()}-${++saveIdCounterRef.current}`;

    // Clear existing debounce timer for this logical save operation
    // (We use a single timer slot for simplicity - last write wins)
    const existingTimer = debounceTimersRef.current.get('default');
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Show saving state immediately so user knows changes are being tracked
    setSaveState('saving');

    // Debounce the actual save
    const timer = setTimeout(async () => {
      debounceTimersRef.current.delete('default');

      // Create a promise that we track globally
      const savePromise = (async () => {
        try {
          await saveFunction();

          // Save succeeded - show saved indicator
          setSaveState('saved');

          // Clear any existing saved indicator timeout
          if (savedIndicatorTimeoutRef.current) {
            clearTimeout(savedIndicatorTimeoutRef.current);
          }

          // Return to idle after showing "saved" briefly
          savedIndicatorTimeoutRef.current = setTimeout(() => {
            setSaveState('idle');
          }, 2000);

        } catch (error) {
          console.error('Save failed:', error);
          // On error, return to idle (could add error state if needed)
          setSaveState('idle');
          throw error;
        }
      })();

      // Track the pending save
      const pendingSave: PendingSave = { id: saveId, promise: savePromise };
      setPendingSaves((prev) => [...prev, pendingSave]);

      // Remove from pending when done (success or failure)
      savePromise.finally(() => {
        setPendingSaves((prev) => prev.filter((s) => s.id !== saveId));
      });

    }, debounceMs);

    debounceTimersRef.current.set('default', timer);

    return saveId;
  }, []);

  const cancelSave = useCallback((saveId: string) => {
    // Cancel debounce timer if pending
    const timer = debounceTimersRef.current.get('default');
    if (timer) {
      clearTimeout(timer);
      debounceTimersRef.current.delete('default');
    }

    // If already saving, we can't cancel the actual save, but we can remove it from tracking
    setPendingSaves((prev) => prev.filter((s) => s.id !== saveId));

    // Reset state if no more pending saves
    setSaveState((current) => {
      if (current === 'saving') {
        return 'idle';
      }
      return current;
    });
  }, []);

  const value: SaveContextValue = {
    saveState,
    setSaveState: useCallback((state: SaveState) => setSaveState(state), []),
    isSaving,
    executeSave,
    cancelSave,
    shouldBlockNavigation,
  };

  return (
    <SaveContext.Provider value={value}>
      {children}
    </SaveContext.Provider>
  );
}

export function useSave(): SaveContextValue {
  const context = useContext(SaveContext);
  if (!context) {
    throw new Error('useSave must be used within a SaveProvider');
  }
  return context;
}
