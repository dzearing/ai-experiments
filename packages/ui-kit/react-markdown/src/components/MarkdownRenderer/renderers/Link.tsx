/**
 * Link renderer component
 *
 * Renders markdown links with proper handling for:
 * - External links (opens in new tab)
 * - Internal hash links (deep links)
 * - File path links (VS Code integration)
 */

import type { ReactNode } from 'react';
import styles from '../MarkdownRenderer.module.css';

export interface LinkProps {
  /** Link URL */
  href: string;
  /** Link content */
  children: ReactNode;
  /** Link title */
  title?: string;
  /** Callback for internal link clicks */
  onInternalLinkClick?: (href: string) => void;
}

// Regex to detect file paths with optional line numbers
const FILE_PATH_REGEX = /^(\/[\w\-.\/]+)+\.\w+(:\d+)?$/;

export function Link({
  href,
  children,
  title,
  onInternalLinkClick,
}: LinkProps) {
  // Determine link type
  const isExternal = href.startsWith('http://') || href.startsWith('https://');
  const isHashLink = href.startsWith('#');
  const isFilePath = FILE_PATH_REGEX.test(href);

  // Handle file path links (convert to VS Code URL)
  if (isFilePath) {
    const vscodeHref = `vscode://file${href}`;
    return (
      <a
        href={vscodeHref}
        className={`${styles.link} ${styles.fileLink}`}
        title={title || 'Open in VS Code'}
      >
        {children}
      </a>
    );
  }

  // Handle internal hash links
  if (isHashLink) {
    const handleClick = (e: React.MouseEvent) => {
      if (onInternalLinkClick) {
        e.preventDefault();
        onInternalLinkClick(href);
      }
    };

    return (
      <a
        href={href}
        className={styles.link}
        title={title}
        onClick={handleClick}
      >
        {children}
      </a>
    );
  }

  // External links open in new tab
  if (isExternal) {
    return (
      <a
        href={href}
        className={styles.link}
        title={title}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  }

  // Default link behavior
  return (
    <a href={href} className={styles.link} title={title}>
      {children}
    </a>
  );
}

export default Link;
