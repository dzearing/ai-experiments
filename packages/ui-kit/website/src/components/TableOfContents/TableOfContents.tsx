/**
 * Re-export TableOfContents from @ui-kit/react with website-specific styling.
 *
 * The website uses custom CSS to handle:
 * - Sticky positioning offset for the site header (60px)
 * - Always hidden on small screens via media query
 * - Slightly different token names for hover states
 */
import {
  TableOfContents as BaseTableOfContents,
  type TableOfContentsProps as BaseTableOfContentsProps,
} from '@ui-kit/react';
import styles from './TableOfContents.module.css';

export interface TOCItem {
  id: string;
  text: string;
  level: number;
}

export interface TableOfContentsProps
  extends Omit<BaseTableOfContentsProps, 'hideOnSmallScreens'> {
  // hideOnSmallScreens is always true for website via CSS media query
}

/**
 * A sticky table of contents that automatically extracts headings from the page
 * and highlights the currently visible section.
 *
 * This is a wrapper around @ui-kit/react's TableOfContents with website-specific
 * styling applied via className.
 */
export function TableOfContents(props: TableOfContentsProps) {
  return (
    <BaseTableOfContents
      {...props}
      className={styles.toc}
      // Website always hides TOC on small screens via CSS, but we also
      // set this prop to ensure consistent behavior if the CSS is overridden
      hideOnSmallScreens={false}
      // Website has a 60px header, so use a larger scroll offset
      scrollOffset={props.scrollOffset ?? 100}
    />
  );
}
