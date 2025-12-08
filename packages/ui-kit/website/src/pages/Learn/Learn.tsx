import styles from './Learn.module.css';

export function Learn() {
  return (
    <div className={styles.learn}>
      <h1>Learn UI-Kit</h1>
      <p className={styles.intro}>
        Master the UI-Kit design system in a structured learning path.
      </p>

      <div className={styles.lessons}>
        <div className={styles.lesson}>
          <span className={styles.lessonNumber}>1</span>
          <div className={styles.lessonContent}>
            <h3>Getting Started</h3>
            <p>Installation, first use, and basic setup</p>
          </div>
        </div>

        <div className={styles.lesson}>
          <span className={styles.lessonNumber}>2</span>
          <div className={styles.lessonContent}>
            <h3>Understanding Surfaces</h3>
            <p>The core concept that makes UI-Kit work</p>
          </div>
        </div>

        <div className={styles.lesson}>
          <span className={styles.lessonNumber}>3</span>
          <div className={styles.lessonContent}>
            <h3>Styling Components</h3>
            <p>Practical usage with real components</p>
          </div>
        </div>

        <div className={styles.lesson}>
          <span className={styles.lessonNumber}>4</span>
          <div className={styles.lessonContent}>
            <h3>Theming</h3>
            <p>Creating and customizing themes</p>
          </div>
        </div>

        <div className={styles.lesson}>
          <span className={styles.lessonNumber}>5</span>
          <div className={styles.lessonContent}>
            <h3>Advanced Topics</h3>
            <p>Custom surfaces, optimization, and more</p>
          </div>
        </div>
      </div>
    </div>
  );
}
