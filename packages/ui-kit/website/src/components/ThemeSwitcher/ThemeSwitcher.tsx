import { useState, useEffect } from 'react';
import { Dropdown, Button, Segmented } from '@ui-kit/react';
import styles from './ThemeSwitcher.module.css';

const themes = [
  { value: 'default', label: 'Default' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'high-contrast', label: 'High Contrast' },
  { value: 'github', label: 'GitHub' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'teams', label: 'Teams' },
  { value: 'ocean', label: 'Ocean' },
  { value: 'forest', label: 'Forest' },
  { value: 'sunset', label: 'Sunset' },
  { value: 'terminal', label: 'Terminal' },
  { value: 'cyberpunk', label: 'Cyberpunk' },
  { value: 'matrix', label: 'Matrix' },
  { value: 'midnight', label: 'Midnight' },
  { value: 'arctic', label: 'Arctic' },
  { value: 'retro', label: 'Retro' },
  { value: 'art-deco', label: 'Art Deco' },
  { value: 'sketchy', label: 'Sketchy' },
  { value: 'fluent', label: 'Fluent' },
  { value: 'onedrive', label: 'OneDrive' },
];

type Mode = 'light' | 'dark' | 'auto';

const modeOptions = [
  { value: 'light', label: 'Light', icon: <span>☀️</span>, 'aria-label': 'Light mode' },
  { value: 'dark', label: 'Dark', icon: <span>🌙</span>, 'aria-label': 'Dark mode' },
  { value: 'auto', label: 'Auto', icon: <span>🌓</span>, 'aria-label': 'Auto mode' },
];

export function ThemeSwitcher() {
  const [theme, setThemeState] = useState('default');
  const [mode, setMode] = useState<Mode>('auto');

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('uikit-theme') || '{}');
      if (stored.theme) setThemeState(stored.theme);
      if (stored.mode) setMode(stored.mode);
    } catch {
      // Ignore parse errors
    }
  }, []);

  const applyTheme = (newTheme: string, newMode: Mode) => {
    setThemeState(newTheme);
    setMode(newMode);

    let effectiveMode: string = newMode;
    if (newMode === 'auto') {
      effectiveMode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    document.documentElement.dataset.theme = newTheme;
    document.documentElement.dataset.mode = effectiveMode;
    localStorage.setItem('uikit-theme', JSON.stringify({ theme: newTheme, mode: newMode }));
  };

  const handleModeChange = (newMode: string) => {
    applyTheme(theme, newMode as Mode);
  };

  const handleThemeSelect = (value: string) => {
    applyTheme(value, mode);
  };

  return (
    <div className={styles.switcher}>
      <Segmented
        options={modeOptions}
        value={mode}
        onChange={handleModeChange}
        iconOnly
        aria-label="Color mode"
      />

      <Dropdown
        items={themes}
        onSelect={handleThemeSelect}
        position="bottom-end"
      >
        <Button variant="outline">
          Change theme
        </Button>
      </Dropdown>
    </div>
  );
}
