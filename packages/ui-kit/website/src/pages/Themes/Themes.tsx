import { setTheme } from '@ui-kit/core/bootstrap.js';
import styles from './Themes.module.css';

// Available themes - matches the generated manifest
const THEMES = [
  { id: 'default', name: 'Default' },
  { id: 'minimal', name: 'Minimal' },
  { id: 'high-contrast', name: 'High Contrast' },
  { id: 'github', name: 'GitHub' },
  { id: 'linkedin', name: 'LinkedIn' },
  { id: 'teams', name: 'Teams' },
  { id: 'onedrive', name: 'OneDrive' },
  { id: 'fluent', name: 'Fluent' },
  { id: 'terminal', name: 'Terminal' },
  { id: 'matrix', name: 'Matrix' },
  { id: 'cyberpunk', name: 'Cyberpunk' },
  { id: 'sketchy', name: 'Sketchy' },
  { id: 'art-deco', name: 'Art Deco' },
  { id: 'retro', name: 'Retro' },
  { id: 'ocean', name: 'Ocean' },
  { id: 'forest', name: 'Forest' },
  { id: 'sunset', name: 'Sunset' },
  { id: 'midnight', name: 'Midnight' },
  { id: 'arctic', name: 'Arctic' },
  { id: 'lavender', name: 'Lavender' },
];

export function Themes() {
  const handleSelectTheme = (themeId: string) => {
    setTheme(themeId);
  };

  return (
    <div className={styles.themes}>
      <h1>Themes</h1>
      <p className={styles.intro}>
        Choose from 20+ built-in themes or create your own.
      </p>

      <div className={styles.grid}>
        {THEMES.map((theme) => (
          <button
            key={theme.id}
            className={styles.themeCard}
            onClick={() => handleSelectTheme(theme.id)}
          >
            <div className={styles.preview}>
              <div className={styles.previewHeader} />
              <div className={styles.previewContent}>
                <div className={styles.previewCard} />
                <div className={styles.previewCard} />
              </div>
            </div>
            <div className={styles.themeName}>{theme.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
