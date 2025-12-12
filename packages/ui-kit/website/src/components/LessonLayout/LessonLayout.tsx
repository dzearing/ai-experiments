import { ReactNode, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { TableOfContents } from '../TableOfContents';
import styles from './LessonLayout.module.css';

export interface LessonLayoutProps {
  children: ReactNode;
}

/**
 * Layout wrapper for lesson pages that provides a sticky table of contents.
 * The TOC is automatically generated from h2 headings in the article.
 */
export function LessonLayout({ children }: LessonLayoutProps) {
  const location = useLocation();
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div className={styles.lessonLayout}>
      <div className={styles.content} ref={contentRef}>{children}</div>
      <aside className={styles.sidebar}>
        <TableOfContents
          key={location.pathname}
          containerRef={contentRef}
          headingSelector="h2"
          title="On this page"
        />
      </aside>
    </div>
  );
}
