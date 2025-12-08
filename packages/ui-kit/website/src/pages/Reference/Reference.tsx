import styles from './Reference.module.css';

export function Reference() {
  return (
    <div className={styles.reference}>
      <h1>Reference</h1>
      <p className={styles.intro}>
        Complete documentation for all UI-Kit tokens and APIs.
      </p>

      <div className={styles.sections}>
        <section className={styles.section}>
          <h2>Surfaces</h2>
          <p>Container, control, and feedback surfaces</p>
        </section>

        <section className={styles.section}>
          <h2>Spacing</h2>
          <p>4px-based spacing scale from space-1 to space-24</p>
        </section>

        <section className={styles.section}>
          <h2>Typography</h2>
          <p>Font families, sizes, weights, and line heights</p>
        </section>

        <section className={styles.section}>
          <h2>Animation</h2>
          <p>Duration and easing tokens for smooth transitions</p>
        </section>

        <section className={styles.section}>
          <h2>API</h2>
          <p>JavaScript API for runtime theme switching</p>
        </section>
      </div>
    </div>
  );
}
