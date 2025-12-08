import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  getTheme,
  setTheme,
  toggleMode,
  subscribe,
  initTheme,
  type ThemeState,
  type ThemeMode,
} from '@ui-kit/core';

interface ThemeContextValue {
  theme: string;
  mode: ThemeMode;
  setTheme: (theme: string) => void;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: string;
  defaultMode?: ThemeMode;
}

export function ThemeProvider({
  children,
  defaultTheme = 'default',
  defaultMode = 'auto',
}: ThemeProviderProps) {
  const [state, setState] = useState<ThemeState>(() => ({
    theme: defaultTheme,
    mode: defaultMode,
  }));

  useEffect(() => {
    // Initialize theme system
    initTheme();

    // Get current state
    setState(getTheme());

    // Subscribe to changes
    const unsubscribe = subscribe((newState) => {
      setState(newState);
    });

    return unsubscribe;
  }, []);

  const value: ThemeContextValue = {
    theme: state.theme,
    mode: state.mode,
    setTheme: (theme: string) => setTheme({ theme }),
    setMode: (mode: ThemeMode) => setTheme({ mode }),
    toggleMode,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
