/**
 * Heading renderer component
 *
 * Renders markdown headings with slug-based anchors for deep linking.
 */

import { useMemo, type ReactNode, type MouseEvent } from 'react';
import { slugify } from '../../../utils/deepLinkParser';
import type { DeepLink } from '../../../types/deepLink';
import styles from '../MarkdownRenderer.module.css';

export interface HeadingProps {
  /** Heading level 1-6 */
  level: 1 | 2 | 3 | 4 | 5 | 6;
  /** Heading content */
  children: ReactNode;
  /** Active deep link for highlighting */
  activeDeepLink?: DeepLink | null;
  /** Callback when heading is clicked */
  onHeadingClick?: (slug: string) => void;
}

export function Heading({
  level,
  children,
  activeDeepLink,
  onHeadingClick,
}: HeadingProps) {
  // Extract text content for slug generation
  const textContent = useMemo(() => {
    const extractText = (node: ReactNode): string => {
      if (typeof node === 'string') return node;
      if (typeof node === 'number') return String(node);
      if (!node) return '';
      if (Array.isArray(node)) return node.map(extractText).join('');
      if (typeof node === 'object' && 'props' in node) {
        const nodeWithProps = node as { props?: { children?: ReactNode } };
        if (nodeWithProps.props?.children) {
          return extractText(nodeWithProps.props.children);
        }
      }
      return '';
    };
    return extractText(children);
  }, [children]);

  const slug = useMemo(() => slugify(textContent), [textContent]);

  const isHighlighted = activeDeepLink?.type === 'heading' && activeDeepLink.slug === slug;

  const Tag = `h${level}` as const;

  const handleClick = (e: MouseEvent) => {
    // Prevent default anchor navigation which can interfere with overlays/dialogs
    e.preventDefault();
    onHeadingClick?.(slug);
  };

  const handleAnchorClick = (e: MouseEvent) => {
    // Prevent default anchor navigation
    e.preventDefault();
    e.stopPropagation();
    // Update URL hash without triggering navigation
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', `#${slug}`);
    }
    onHeadingClick?.(slug);
  };

  return (
    <Tag
      id={slug}
      className={`${styles[`h${level}`]} ${isHighlighted ? styles.highlighted : ''}`}
      onClick={handleClick}
    >
      <a
        href={`#${slug}`}
        className={styles.headingAnchor}
        aria-hidden="true"
        onClick={handleAnchorClick}
      >
        #
      </a>
      {children}
    </Tag>
  );
}

export default Heading;
