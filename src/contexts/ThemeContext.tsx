import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { themes } from '../config/themes';
import type { Theme } from '../config/themes';

interface ThemeContextType {
  currentTheme: Theme;
  setTheme: (themeId: string) => void;
  nextTheme: () => void;
  previousTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [currentThemeIndex, setCurrentThemeIndex] = useState(0);
  
  useEffect(() => {
    const savedThemeId = localStorage.getItem('selectedTheme');
    if (savedThemeId) {
      const index = themes.findIndex(t => t.id === savedThemeId);
      if (index !== -1) {
        setCurrentThemeIndex(index);
      }
    }
  }, []);
  
  const currentTheme = themes[currentThemeIndex];
  
  const setTheme = (themeId: string) => {
    const index = themes.findIndex(t => t.id === themeId);
    if (index !== -1) {
      setCurrentThemeIndex(index);
      localStorage.setItem('selectedTheme', themeId);
    }
  };
  
  const nextTheme = () => {
    const nextIndex = (currentThemeIndex + 1) % themes.length;
    setCurrentThemeIndex(nextIndex);
    localStorage.setItem('selectedTheme', themes[nextIndex].id);
  };
  
  const previousTheme = () => {
    const prevIndex = currentThemeIndex === 0 ? themes.length - 1 : currentThemeIndex - 1;
    setCurrentThemeIndex(prevIndex);
    localStorage.setItem('selectedTheme', themes[prevIndex].id);
  };
  
  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, nextTheme, previousTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}