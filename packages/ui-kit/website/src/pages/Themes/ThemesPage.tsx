import { Link } from 'react-router-dom';
import styles from './ThemesPage.module.css';

const themeCategories = [
  {
    name: 'Core',
    themes: [
      { id: 'default', name: 'Default', description: 'Clean, professional blue', primary: '#2563eb' },
      { id: 'minimal', name: 'Minimal', description: 'Understated, neutral grays', primary: '#525252' },
      { id: 'high-contrast', name: 'High Contrast', description: 'Maximum readability (AAA)', primary: '#0052cc' },
    ],
  },
  {
    name: 'Microsoft Family',
    themes: [
      { id: 'github', name: 'GitHub', description: 'GitHub design language', primary: '#2da44e' },
      { id: 'linkedin', name: 'LinkedIn', description: 'LinkedIn blues', primary: '#0a66c2' },
      { id: 'teams', name: 'Teams', description: 'Microsoft Teams purple', primary: '#6264a7' },
      { id: 'onedrive', name: 'OneDrive', description: 'OneDrive blues', primary: '#0078d4' },
      { id: 'fluent', name: 'Fluent', description: 'Microsoft Fluent design', primary: '#0078d4' },
    ],
  },
  {
    name: 'Nature',
    themes: [
      { id: 'ocean', name: 'Ocean', description: 'Cool blues and aquas', primary: '#0ea5e9' },
      { id: 'forest', name: 'Forest', description: 'Natural greens', primary: '#16a34a' },
      { id: 'sunset', name: 'Sunset', description: 'Warm oranges and purples', primary: '#ea580c' },
      { id: 'midnight', name: 'Midnight', description: 'Deep blues and purples', primary: '#6366f1' },
      { id: 'arctic', name: 'Arctic', description: 'Cool, crisp ice-inspired', primary: '#0891b2' },
    ],
  },
  {
    name: 'Creative',
    themes: [
      { id: 'terminal', name: 'Terminal', description: 'Green-on-black hacker', primary: '#22c55e' },
      { id: 'cyberpunk', name: 'Cyberpunk', description: 'Neon pinks and cyans', primary: '#ec4899' },
      { id: 'matrix', name: 'Matrix', description: 'Matrix-inspired glow', primary: '#00ff41' },
      { id: 'retro', name: 'Retro', description: '80s inspired pastels', primary: '#f472b6' },
      { id: 'art-deco', name: 'Art Deco', description: '1920s geometric elegance', primary: '#ca8a04' },
      { id: 'sketchy', name: 'Sketchy', description: 'Hand-drawn, notebook style', primary: '#374151' },
    ],
  },
];

export function ThemesPage() {
  const applyTheme = (themeId: string) => {
    const currentMode = document.documentElement.dataset.mode || 'light';
    document.documentElement.dataset.theme = themeId;
    localStorage.setItem('uikit-theme', JSON.stringify({ theme: themeId, mode: currentMode }));
  };

  return (
    <div className={styles.themes}>
      <div className={styles.header}>
        <h1 className={styles.title}>Theme Gallery</h1>
        <p className={styles.subtitle}>
          19 built-in themes, each with light and dark modes.
          Click any theme to preview it live.
        </p>
        <Link to="/themes/designer" className={styles.designerLink}>
          Create Your Own Theme &rarr;
        </Link>
      </div>

      {themeCategories.map((category) => (
        <section key={category.name} className={styles.category}>
          <h2 className={styles.categoryTitle}>{category.name}</h2>
          <div className={styles.themeGrid}>
            {category.themes.map((theme) => (
              <button
                key={theme.id}
                className={styles.themeCard}
                onClick={() => applyTheme(theme.id)}
              >
                <div
                  className={styles.themePreview}
                  style={{ '--preview-primary': theme.primary } as React.CSSProperties}
                >
                  <div className={styles.previewContent}>
                    <div className={styles.previewHeader} />
                    <div className={styles.previewBody}>
                      <div className={styles.previewSidebar} />
                      <div className={styles.previewMain}>
                        <div className={styles.previewCard} />
                        <div className={styles.previewCard} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className={styles.themeInfo}>
                  <h3 className={styles.themeName}>{theme.name}</h3>
                  <p className={styles.themeDesc}>{theme.description}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
