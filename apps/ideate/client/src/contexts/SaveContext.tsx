import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

export type SaveState = 'idle' | 'saving' | 'saved';

interface SaveContextValue {
  saveState: SaveState;
  setSaveState: (state: SaveState) => void;
}

const SaveContext = createContext<SaveContextValue | null>(null);

interface SaveProviderProps {
  children: ReactNode;
}

export function SaveProvider({ children }: SaveProviderProps) {
  const [saveState, setSaveState] = useState<SaveState>('idle');

  const value: SaveContextValue = {
    saveState,
    setSaveState: useCallback((state: SaveState) => setSaveState(state), []),
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
