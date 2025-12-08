import { useEffect, useState } from 'react';
import { getThemes, setTheme } from '@ui-kit/core';
import styles from './Themes.module.css';

export function Themes() {
  const [themes, setThemesData] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    getThemes().then(setThemesData);
  }, []);

  const handleSelectTheme = (themeId: string) => {
    setTheme({ theme: themeId });
  };

  return (
    <div className={styles.themes}>
      <h1>Themes</h1>
      <p className={styles.intro}>
        Choose from 20+ built-in themes or create your own.
      </p>

      <div className={styles.grid}>
        {themes.map((theme) => (
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
