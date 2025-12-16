import { Dropdown, Segmented, useTheme } from '@ui-kit/react';
import { SunIcon, MoonIcon, SunMoonIcon } from '@ui-kit/icons';
import styles from './ThemeSwitcher.module.css';

const themeOptions = [
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
  { value: 'lavender', label: 'Lavender' },
];

const modeOptions = [
  { value: 'light', label: 'Light', icon: <SunIcon size={16} />, 'aria-label': 'Light mode' },
  { value: 'dark', label: 'Dark', icon: <MoonIcon size={16} />, 'aria-label': 'Dark mode' },
  { value: 'auto', label: 'Auto', icon: <SunMoonIcon size={16} />, 'aria-label': 'Auto mode' },
];

export function ThemeSwitcher() {
  const { theme, mode, setTheme, setMode } = useTheme();

  const handleModeChange = (newMode: string) => {
    setMode(newMode as 'light' | 'dark' | 'auto');
  };

  const handleThemeChange = (value: string | string[]) => {
    const newTheme = Array.isArray(value) ? value[0] : value;
    if (newTheme) {
      setTheme(newTheme);
    }
  };

  return (
    <div className={styles.switcher}>
      <Dropdown
        options={themeOptions}
        value={theme}
        onChange={handleThemeChange}
        placeholder="Theme"
        position="bottom-end"
        size="sm"
      />

      <Segmented
        options={modeOptions}
        value={mode}
        onChange={handleModeChange}
        iconOnly
        aria-label="Color mode"
      />
    </div>
  );
}
