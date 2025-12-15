import { Link } from 'react-router-dom';
import styles from './LearnPage.module.css';

const lessons = [
  {
    number: 1,
    title: 'Getting Started',
    description: 'Installation, setup, and introduction to color groups.',
    path: '/learn/getting-started',
    duration: '5 min',
  },
  {
    number: 2,
    title: 'Color Groups',
    description: 'The accessibility-first token system that guarantees WCAG compliance.',
    path: '/learn/color-groups',
    duration: '10 min',
  },
  {
    number: 3,
    title: 'Understanding Surfaces',
    description: 'UI sections that redefine color group tokens for specific contexts.',
    path: '/learn/surfaces',
    duration: '10 min',
  },
  {
    number: 4,
    title: 'Styling Components',
    description: 'Practical usage: which tokens to use for buttons, inputs, cards, and more.',
    path: '/learn/styling-components',
    duration: '15 min',
  },
  {
    number: 5,
    title: 'Theming',
    description: 'Creating themes, customizing colors, and using the theme API.',
    path: '/learn/theming',
    duration: '10 min',
  },
  {
    number: 6,
    title: 'Advanced Topics',
    description: 'Custom color groups, performance optimization, and accessibility best practices.',
    path: '/learn/advanced',
    duration: '10 min',
  },
];

export function LearnPage() {
  return (
    <div className={styles.learn}>
      <div className={styles.header}>
        <h1 className={styles.title}>Learn UI-Kit</h1>
        <p className={styles.subtitle}>
          Master the surface-based design token system in under 30 minutes.
          Follow the lessons in order for the best learning experience.
        </p>
      </div>

      <div className={styles.lessons}>
        {lessons.map((lesson) => (
          <Link key={lesson.number} to={lesson.path} className={styles.lessonCard}>
            <div className={styles.lessonNumber}>{lesson.number}</div>
            <div className={styles.lessonContent}>
              <h3 className={styles.lessonTitle}>{lesson.title}</h3>
              <p className={styles.lessonDesc}>{lesson.description}</p>
            </div>
            <div className={styles.lessonMeta}>
              <span className={styles.duration}>{lesson.duration}</span>
              <span className={styles.arrow}>&rarr;</span>
            </div>
          </Link>
        ))}
      </div>

      <div className={styles.quickLinks}>
        <h3 className={styles.quickLinksTitle}>Quick Links</h3>
        <div className={styles.quickLinksGrid}>
          <Link to="/reference" className={styles.quickLink}>
            <span className={styles.quickLinkIcon}>&#128209;</span>
            Token Reference
          </Link>
          <Link to="/themes" className={styles.quickLink}>
            <span className={styles.quickLinkIcon}>&#127912;</span>
            Theme Gallery
          </Link>
          <Link to="/themes/designer" className={styles.quickLink}>
            <span className={styles.quickLinkIcon}>&#9881;</span>
            Theme Designer
          </Link>
        </div>
      </div>
    </div>
  );
}
