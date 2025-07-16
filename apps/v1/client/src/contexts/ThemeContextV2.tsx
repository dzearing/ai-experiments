import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { themesV2 } from '../config/themesV2';
import type { Theme, ThemeStyles } from '../config/themesV2';

interface ThemeContextType {
  currentTheme: Theme;
  currentStyles: ThemeStyles;
  isDarkMode: boolean;
  setTheme: (themeId: string) => void;
  nextTheme: () => void;
  previousTheme: () => void;
  toggleDarkMode: () => void;
  backgroundEffectEnabled: boolean;
  toggleBackgroundEffect: () => void;
  animationsEnabled: boolean;
  toggleAnimations: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [currentThemeIndex, setCurrentThemeIndex] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [backgroundEffectEnabled, setBackgroundEffectEnabled] = useState(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  
  useEffect(() => {
    // Load saved preferences
    const savedThemeId = localStorage.getItem('selectedTheme');
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    const savedBackgroundEffect = localStorage.getItem('backgroundEffect') === 'true';
    const savedAnimations = localStorage.getItem('animationsEnabled') !== 'false';
    
    setIsDarkMode(savedDarkMode);
    setBackgroundEffectEnabled(savedBackgroundEffect);
    setAnimationsEnabled(savedAnimations);
    
    if (savedThemeId) {
      const index = themesV2.findIndex(t => t.id === savedThemeId);
      if (index !== -1) {
        setCurrentThemeIndex(index);
      }
    }
    
    // Apply dark mode class to root element
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);
  
  const currentTheme = themesV2[currentThemeIndex];
  const currentStyles = isDarkMode ? currentTheme.dark : currentTheme.light;
  
  const setTheme = (themeId: string) => {
    const index = themesV2.findIndex(t => t.id === themeId);
    if (index !== -1) {
      setCurrentThemeIndex(index);
      localStorage.setItem('selectedTheme', themeId);
    }
  };
  
  const nextTheme = () => {
    const nextIndex = (currentThemeIndex + 1) % themesV2.length;
    setCurrentThemeIndex(nextIndex);
    localStorage.setItem('selectedTheme', themesV2[nextIndex].id);
  };
  
  const previousTheme = () => {
    const prevIndex = currentThemeIndex === 0 ? themesV2.length - 1 : currentThemeIndex - 1;
    setCurrentThemeIndex(prevIndex);
    localStorage.setItem('selectedTheme', themesV2[prevIndex].id);
  };
  
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };
  
  const toggleBackgroundEffect = () => {
    const newValue = !backgroundEffectEnabled;
    setBackgroundEffectEnabled(newValue);
    localStorage.setItem('backgroundEffect', String(newValue));
  };
  
  const toggleAnimations = () => {
    const newValue = !animationsEnabled;
    setAnimationsEnabled(newValue);
    localStorage.setItem('animationsEnabled', String(newValue));
  };
  
  return (
    <ThemeContext.Provider value={{ 
      currentTheme, 
      currentStyles, 
      isDarkMode, 
      setTheme, 
      nextTheme, 
      previousTheme,
      toggleDarkMode,
      backgroundEffectEnabled,
      toggleBackgroundEffect,
      animationsEnabled,
      toggleAnimations
    }}>
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