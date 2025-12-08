import styles from './ReferencePage.module.css';

const tokenCategories = [
  {
    title: 'Spacing',
    tokens: [
      { name: '--space-1', value: '4px' },
      { name: '--space-2', value: '8px' },
      { name: '--space-3', value: '12px' },
      { name: '--space-4', value: '16px' },
      { name: '--space-5', value: '20px' },
      { name: '--space-6', value: '24px' },
      { name: '--space-8', value: '32px' },
      { name: '--space-10', value: '40px' },
      { name: '--space-12', value: '48px' },
      { name: '--space-16', value: '64px' },
      { name: '--space-20', value: '80px' },
      { name: '--space-24', value: '96px' },
    ],
  },
  {
    title: 'Typography - Sizes',
    tokens: [
      { name: '--text-xs', value: '11px' },
      { name: '--text-sm', value: '13px' },
      { name: '--text-base', value: '15px' },
      { name: '--text-lg', value: '17px' },
      { name: '--text-xl', value: '20px' },
      { name: '--text-2xl', value: '24px' },
      { name: '--text-3xl', value: '30px' },
      { name: '--text-4xl', value: '36px' },
    ],
  },
  {
    title: 'Typography - Weights',
    tokens: [
      { name: '--weight-normal', value: '400' },
      { name: '--weight-medium', value: '500' },
      { name: '--weight-semibold', value: '600' },
      { name: '--weight-bold', value: '700' },
    ],
  },
  {
    title: 'Border Radius',
    tokens: [
      { name: '--radius-sm', value: '2px' },
      { name: '--radius-md', value: '4px' },
      { name: '--radius-lg', value: '8px' },
      { name: '--radius-xl', value: '12px' },
      { name: '--radius-2xl', value: '16px' },
      { name: '--radius-full', value: '9999px' },
    ],
  },
  {
    title: 'Animation',
    tokens: [
      { name: '--duration-fast', value: '100ms' },
      { name: '--duration-normal', value: '200ms' },
      { name: '--duration-slow', value: '300ms' },
      { name: '--ease-default', value: 'ease-out' },
      { name: '--ease-in', value: 'ease-in' },
      { name: '--ease-out', value: 'ease-out' },
      { name: '--ease-in-out', value: 'ease-in-out' },
    ],
  },
];

const surfaceCategories = [
  {
    title: 'Page Surface',
    tokens: ['--page-bg', '--page-text', '--page-text-soft', '--page-text-softer', '--page-text-hard', '--page-border'],
  },
  {
    title: 'Card Surface',
    tokens: ['--card-bg', '--card-text', '--card-text-soft', '--card-text-hard', '--card-border', '--card-shadow'],
  },
  {
    title: 'Inset Surface',
    tokens: ['--inset-bg', '--inset-bg-hover', '--inset-bg-focus', '--inset-text', '--inset-text-soft', '--inset-border', '--inset-border-focus'],
  },
  {
    title: 'Control Surface',
    tokens: ['--control-bg', '--control-bg-hover', '--control-bg-pressed', '--control-text', '--control-border', '--control-border-hover'],
  },
  {
    title: 'Control Primary',
    tokens: ['--controlPrimary-bg', '--controlPrimary-bg-hover', '--controlPrimary-bg-pressed', '--controlPrimary-text', '--controlPrimary-border'],
  },
  {
    title: 'Control Danger',
    tokens: ['--controlDanger-bg', '--controlDanger-bg-hover', '--controlDanger-bg-pressed', '--controlDanger-text', '--controlDanger-border'],
  },
  {
    title: 'Feedback Surfaces',
    tokens: ['--success-bg', '--success-text', '--success-border', '--warning-bg', '--warning-text', '--warning-border', '--danger-bg', '--danger-text', '--danger-border', '--info-bg', '--info-text', '--info-border'],
  },
];

export function ReferencePage() {
  return (
    <div className={styles.reference}>
      <div className={styles.header}>
        <h1 className={styles.title}>Token Reference</h1>
        <p className={styles.subtitle}>
          Complete documentation of all UI-Kit design tokens.
        </p>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Static Tokens</h2>
        <p className={styles.sectionDesc}>
          These tokens have fixed values that do not change with themes.
        </p>
        
        <div className={styles.categories}>
          {tokenCategories.map((category) => (
            <div key={category.title} className={styles.category}>
              <h3 className={styles.categoryTitle}>{category.title}</h3>
              <div className={styles.tokenGrid}>
                {category.tokens.map((token) => (
                  <div key={token.name} className={styles.tokenRow}>
                    <code className={styles.tokenName}>{token.name}</code>
                    <span className={styles.tokenValue}>{token.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Surface Tokens</h2>
        <p className={styles.sectionDesc}>
          These tokens change based on the active theme and mode.
        </p>
        
        <div className={styles.categories}>
          {surfaceCategories.map((category) => (
            <div key={category.title} className={styles.category}>
              <h3 className={styles.categoryTitle}>{category.title}</h3>
              <div className={styles.tokenList}>
                {category.tokens.map((token) => (
                  <code key={token} className={styles.surfaceToken}>{token}</code>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
