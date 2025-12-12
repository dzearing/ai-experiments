import { useEffect, useState, useRef, type RefObject } from 'react';
import { useLocation } from 'react-router-dom';
import styles from './TableOfContents.module.css';

export interface TOCItem {
  id: string;
  text: string;
  level: number;
}

export interface TableOfContentsProps {
  /**
   * CSS selector to find the content container that holds the headings.
   * Defaults to 'article' if not provided. Ignored if containerRef is provided.
   */
  containerSelector?: string;
  /**
   * Direct ref to the container element. Takes precedence over containerSelector.
   * Using a ref ensures the TOC finds the correct container even during page transitions.
   */
  containerRef?: RefObject<HTMLElement | null>;
  /**
   * Which heading levels to include (e.g., 'h2' or 'h2, h3').
   * Defaults to 'h2'.
   */
  headingSelector?: string;
  /**
   * Title shown above the TOC list.
   */
  title?: string;
}

/**
 * A sticky table of contents that automatically extracts headings from the page
 * and highlights the currently visible section.
 */
export function TableOfContents({
  containerSelector = 'article',
  containerRef,
  headingSelector = 'h2',
  title = 'On this page',
}: TableOfContentsProps) {
  const [items, setItems] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const observerRef = useRef<IntersectionObserver | null>(null);
  const location = useLocation();

  // Extract headings from the page
  useEffect(() => {
    // Clear items immediately on route change to prevent stale content
    setItems([]);
    setActiveId('');

    // Use requestAnimationFrame + small delay to ensure DOM is fully updated
    let rafId: number;
    let timeoutId: ReturnType<typeof setTimeout>;

    const extractHeadings = () => {
      // Prefer containerRef if provided, otherwise fall back to selector
      const container = containerRef?.current ?? document.querySelector(containerSelector);
      if (!container) return;

      const headings = container.querySelectorAll(headingSelector);
      const tocItems: TOCItem[] = [];

      headings.forEach((heading, index) => {
        // Generate an ID if the heading doesn't have one
        let id = heading.id;
        if (!id) {
          id = `toc-heading-${index}`;
          heading.id = id;
        }

        const level = parseInt(heading.tagName.charAt(1), 10);
        tocItems.push({
          id,
          text: heading.textContent || '',
          level,
        });
      });

      setItems(tocItems);

      // Set initial active item
      if (tocItems.length > 0) {
        setActiveId(tocItems[0].id);
      }
    };

    // Wait for React to finish rendering
    rafId = requestAnimationFrame(() => {
      timeoutId = setTimeout(extractHeadings, 50);
    });

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
    };
  }, [containerSelector, containerRef, headingSelector, location.pathname]);

  // Set up intersection observer to track visible sections
  useEffect(() => {
    if (items.length === 0) return;

    // Disconnect previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const headingElements = items
      .map((item) => document.getElementById(item.id))
      .filter(Boolean) as HTMLElement[];

    if (headingElements.length === 0) return;

    // Track which headings are currently visible
    const visibleHeadings = new Set<string>();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            visibleHeadings.add(entry.target.id);
          } else {
            visibleHeadings.delete(entry.target.id);
          }
        });

        // Find the first visible heading in document order
        for (const item of items) {
          if (visibleHeadings.has(item.id)) {
            setActiveId(item.id);
            break;
          }
        }

        // If no headings are visible, find the last one that was scrolled past
        if (visibleHeadings.size === 0) {
          const scrollTop = window.scrollY;
          let lastPassedId = items[0]?.id;

          for (const item of items) {
            const element = document.getElementById(item.id);
            if (element && element.offsetTop <= scrollTop + 100) {
              lastPassedId = item.id;
            }
          }

          if (lastPassedId) {
            setActiveId(lastPassedId);
          }
        }
      },
      {
        rootMargin: '-80px 0px -70% 0px',
        threshold: 0,
      }
    );

    headingElements.forEach((element) => {
      observerRef.current?.observe(element);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [items]);

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      // Smooth scroll to the heading
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Update active state immediately for better UX
      setActiveId(id);
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <nav className={styles.toc} aria-label="Table of contents">
      <div className={styles.tocInner}>
        <h4 className={styles.title}>{title}</h4>
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.id} className={styles.item}>
              <button
                className={`${styles.link} ${activeId === item.id ? styles.active : ''}`}
                onClick={() => handleClick(item.id)}
                style={{ paddingLeft: `${(item.level - 2) * 12 + 12}px` }}
              >
                {item.text}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
