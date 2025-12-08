import { useState, useEffect } from 'react';
import styles from './ThemeSwitcher.module.css';

const themes = [
  { id: 'default', name: 'Default' },
  { id: 'minimal', name: 'Minimal' },
  { id: 'high-contrast', name: 'High Contrast' },
  { id: 'github', name: 'GitHub' },
  { id: 'linkedin', name: 'LinkedIn' },
  { id: 'teams', name: 'Teams' },
  { id: 'ocean', name: 'Ocean' },
  { id: 'forest', name: 'Forest' },
  { id: 'sunset', name: 'Sunset' },
  { id: 'terminal', name: 'Terminal' },
  { id: 'cyberpunk', name: 'Cyberpunk' },
  { id: 'matrix', name: 'Matrix' },
  { id: 'midnight', name: 'Midnight' },
  { id: 'arctic', name: 'Arctic' },
  { id: 'retro', name: 'Retro' },
  { id: 'art-deco', name: 'Art Deco' },
  { id: 'sketchy', name: 'Sketchy' },
  { id: 'fluent', name: 'Fluent' },
  { id: 'onedrive', name: 'OneDrive' },
];

type Mode = 'light' | 'dark' | 'auto';

export function ThemeSwitcher() {
  const [theme, setThemeState] = useState('default');
  const [mode, setMode] = useState<Mode>('auto');
  const [isOpen, setIsOpen] = useState(false);

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

  const cycleMode = () => {
    const modes: Mode[] = ['light', 'dark', 'auto'];
    const nextIndex = (modes.indexOf(mode) + 1) % modes.length;
    applyTheme(theme, modes[nextIndex]);
  };

  return (
    <div className={styles.switcher}>
      <button className={styles.modeToggle} onClick={cycleMode} title={'Mode: ' + mode}>
        {mode === 'light' && '\u2600\uFE0F'}
        {mode === 'dark' && '\uD83C\uDF19'}
        {mode === 'auto' && '\uD83C\uDF13'}
      </button>

      <div className={styles.themeDropdown}>
        <button
          className={styles.themeButton}
          onClick={() => setIsOpen(!isOpen)}
        >
          {themes.find(t => t.id === theme)?.name || 'Theme'}
          <span className={styles.arrow}>▼</span>
        </button>

        {isOpen && (
          <>
            <div className={styles.backdrop} onClick={() => setIsOpen(false)} />
            <div className={styles.menu}>
              {themes.map(t => (
                <button
                  key={t.id}
                  className={styles.menuItem + (theme === t.id ? ' ' + styles.selected : '')}
                  onClick={() => {
                    applyTheme(t.id, mode);
                    setIsOpen(false);
                  }}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
