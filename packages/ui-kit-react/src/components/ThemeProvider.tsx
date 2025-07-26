import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback,
  useMemo,
  type ReactNode,
  type FC,
  type ComponentType
} from 'react';
import type { Theme, ThemeMode, ThemeChangeEvent } from '@claude-flow/ui-kit';

// Import the theme manager from ui-kit
const getThemeManager = async () => {
  const { themeManager } = await import('@claude-flow/ui-kit');
  return themeManager;
};

export interface ThemeContextValue {
  theme: string;
  mode: ThemeMode;
  resolvedMode: 'light' | 'dark';
  themes: Theme[];
  isLoading: boolean;
  setTheme: (themeId: string) => void;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  reset: () => void;
}

export interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: string;
  defaultMode?: ThemeMode;
  detectSystemPreference?: boolean;
  onThemeChange?: (theme: string, mode: ThemeMode) => void;
  storageKey?: string;
  enablePersistence?: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'claude-flow-theme';

export const ThemeProvider: FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'default',
  defaultMode = 'auto',
  detectSystemPreference = true,
  onThemeChange,
  storageKey = 'preferences',
  enablePersistence = true,
}) => {
  const [theme, setThemeState] = useState<string>(defaultTheme);
  const [mode, setModeState] = useState<ThemeMode>(defaultMode);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [manager, setManager] = useState<any>(null);

  // Resolve the actual mode (light or dark) based on mode setting
  const resolvedMode = useMemo((): 'light' | 'dark' => {
    if (mode === 'auto' && detectSystemPreference) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return mode === 'dark' ? 'dark' : 'light';
  }, [mode, detectSystemPreference]);

  // Load saved preferences
  useEffect(() => {
    if (!enablePersistence) return;

    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}-${storageKey}`);
      if (stored) {
        const { theme: savedTheme, mode: savedMode } = JSON.parse(stored);
        if (savedTheme) setThemeState(savedTheme);
        if (savedMode) setModeState(savedMode);
      }
    } catch (error) {
      console.error('Failed to load theme preferences:', error);
    }
  }, [storageKey, enablePersistence]);

  // Initialize theme manager
  useEffect(() => {
    let mounted = true;

    const initializeTheme = async () => {
      try {
        const themeManager = await getThemeManager();
        if (!mounted) return;

        setManager(themeManager);
        
        // Get available themes
        const availableThemes = await themeManager.getThemes();
        setThemes(availableThemes);

        // Apply initial theme
        await themeManager.setTheme(theme, resolvedMode);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize theme:', error);
        setIsLoading(false);
      }
    };

    initializeTheme();

    return () => {
      mounted = false;
    };
  }, []);

  // Apply theme changes
  useEffect(() => {
    if (!manager || isLoading) return;

    const applyTheme = async () => {
      try {
        await manager.setTheme(theme, resolvedMode);
        onThemeChange?.(theme, mode);
      } catch (error) {
        console.error('Failed to apply theme:', error);
      }
    };

    applyTheme();
  }, [theme, resolvedMode, manager, isLoading, mode, onThemeChange]);

  // Save preferences
  useEffect(() => {
    if (!enablePersistence || isLoading) return;

    try {
      localStorage.setItem(
        `${STORAGE_KEY_PREFIX}-${storageKey}`,
        JSON.stringify({ theme, mode })
      );
    } catch (error) {
      console.error('Failed to save theme preferences:', error);
    }
  }, [theme, mode, storageKey, enablePersistence, isLoading]);

  // Listen for system preference changes
  useEffect(() => {
    if (!detectSystemPreference || mode !== 'auto') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      // Force re-render to update resolvedMode
      setModeState('auto');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [detectSystemPreference, mode]);

  // Listen for theme changes from other tabs
  useEffect(() => {
    if (!enablePersistence) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `${STORAGE_KEY_PREFIX}-${storageKey}` && e.newValue) {
        try {
          const { theme: newTheme, mode: newMode } = JSON.parse(e.newValue);
          if (newTheme && newTheme !== theme) setThemeState(newTheme);
          if (newMode && newMode !== mode) setModeState(newMode);
        } catch (error) {
          console.error('Failed to parse theme from storage:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [theme, mode, storageKey, enablePersistence]);

  // Theme control functions
  const setTheme = useCallback((themeId: string) => {
    setThemeState(themeId);
  }, []);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState(current => {
      if (current === 'light') return 'dark';
      if (current === 'dark') return 'auto';
      return 'light';
    });
  }, []);

  const reset = useCallback(() => {
    setThemeState(defaultTheme);
    setModeState(defaultMode);
  }, [defaultTheme, defaultMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      mode,
      resolvedMode,
      themes,
      isLoading,
      setTheme,
      setMode,
      toggleMode,
      reset,
    }),
    [theme, mode, resolvedMode, themes, isLoading, setTheme, setMode, toggleMode, reset]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// HOC for class components
export function withTheme<P extends object>(
  Component: ComponentType<P & { theme: ThemeContextValue }>
): ComponentType<P> {
  return function WithThemeComponent(props: P) {
    const theme = useTheme();
    return <Component {...props} theme={theme} />;
  };
}