import {
  useEffect,
  useLayoutEffect,
  useState,
  useRef,
  useCallback,
  type RefObject,
  type HTMLAttributes,
  type CSSProperties,
} from 'react';
import styles from './TableOfContents.module.css';

/**
 * TableOfContents - Sticky navigation for long-form content
 *
 * Automatically extracts headings from a container and highlights
 * the currently visible section as the user scrolls.
 *
 * Surfaces used:
 * - card (container background)
 * - controlSubtle (item hover)
 * - controlPrimary (active indicator)
 *
 * Tokens used:
 * - --card-bg, --card-border
 * - --controlSubtle-bg-hover
 * - --controlPrimary-bg
 * - --page-text, --page-text-soft
 * - --space-2, --space-3, --space-4
 * - --radius-lg
 * - --duration-fast, --ease-default
 *
 * Accessibility:
 * - role="navigation" with aria-label
 * - Keyboard navigable (Tab through items)
 * - Focus visible on items
 */

export interface TOCItem {
  /** Unique identifier (usually the heading's id attribute) */
  id: string;
  /** Display text for the TOC item */
  text: string;
  /** Heading level (2-6), used for indentation */
  level: number;
}

export interface TableOfContentsProps extends HTMLAttributes<HTMLElement> {
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
  /**
   * Manually provided items. When provided, automatic extraction is skipped.
   */
  items?: TOCItem[];
  /**
   * Callback when active item changes.
   */
  onActiveChange?: (id: string) => void;
  /**
   * Offset from the top of the viewport for scroll detection (in pixels).
   * Useful when there's a sticky header. Defaults to 80.
   */
  scrollOffset?: number;
  /**
   * Whether to hide the TOC on smaller screens (< 1100px).
   * Defaults to false. Set to true for production contexts where
   * the TOC should be hidden on mobile.
   */
  hideOnSmallScreens?: boolean;
}

interface IndicatorStyle {
  top: number;
  height: number;
}

export function TableOfContents({
  containerSelector = 'article',
  containerRef,
  headingSelector = 'h2',
  title = 'On this page',
  items: providedItems,
  onActiveChange,
  scrollOffset = 80,
  hideOnSmallScreens = false,
  className,
  ...props
}: TableOfContentsProps) {
  const [items, setItems] = useState<TOCItem[]>(providedItems ?? []);
  const [activeId, setActiveId] = useState<string>('');
  // Locked ID is set when user clicks a TOC item - it forces that item to stay selected
  // until scrolling has completed (debounced detection)
  const [lockedId, setLockedId] = useState<string | null>(null);
  const scrollDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animated indicator state
  const [indicatorStyle, setIndicatorStyle] = useState<IndicatorStyle | null>(null);
  const [isInitialRender, setIsInitialRender] = useState(true);
  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // Update active and notify parent
  const updateActiveId = useCallback(
    (id: string) => {
      setActiveId(id);
      onActiveChange?.(id);
    },
    [onActiveChange]
  );

  // Update indicator position
  const updateIndicator = useCallback(() => {
    const activeButton = itemRefs.current.get(activeId);
    const list = listRef.current;

    if (activeButton && list) {
      const buttonRect = activeButton.getBoundingClientRect();
      const listRect = list.getBoundingClientRect();

      setIndicatorStyle({
        top: buttonRect.top - listRect.top,
        height: buttonRect.height,
      });
    }
  }, [activeId]);

  // Update indicator on mount and when active value changes
  useLayoutEffect(() => {
    updateIndicator();
    // Mark initial render complete after first paint
    if (isInitialRender) {
      requestAnimationFrame(() => {
        setIsInitialRender(false);
      });
    }
  }, [activeId, items, updateIndicator, isInitialRender]);

  // Update indicator on window resize
  useEffect(() => {
    const handleResize = () => updateIndicator();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateIndicator]);

  // Set item ref
  const setItemRef = (id: string, element: HTMLButtonElement | null) => {
    if (element) {
      itemRefs.current.set(id, element);
    } else {
      itemRefs.current.delete(id);
    }
  };

  // Extract headings from the page (only if items not provided)
  useEffect(() => {
    if (providedItems) {
      setItems(providedItems);
      return;
    }

    // Use requestAnimationFrame + small delay to ensure DOM is fully updated
    let rafId: number;
    let timeoutId: ReturnType<typeof setTimeout>;

    const extractHeadings = () => {
      // Prefer containerRef if provided, otherwise fall back to selector
      const container =
        containerRef?.current ?? document.querySelector(containerSelector);
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
    };

    // Wait for React to finish rendering
    rafId = requestAnimationFrame(() => {
      timeoutId = setTimeout(extractHeadings, 50);
    });

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
    };
  }, [containerSelector, containerRef, headingSelector, providedItems]);

  // Set initial active item when items change
  useEffect(() => {
    if (items.length > 0 && !activeId) {
      updateActiveId(items[0].id);
    }
  }, [items, activeId, updateActiveId]);

  // Clear locked ID on manual scroll (wheel or touch) - user is taking over
  useEffect(() => {
    const handleManualScroll = () => {
      if (lockedId) {
        setLockedId(null);
      }
    };

    window.addEventListener('wheel', handleManualScroll, { passive: true });
    window.addEventListener('touchmove', handleManualScroll, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleManualScroll);
      window.removeEventListener('touchmove', handleManualScroll);
    };
  }, [lockedId]);

  // Scroll-based active section detection with debounced scroll-end detection
  useEffect(() => {
    if (items.length === 0) return;

    const updateActiveSection = () => {
      // If an item is locked (user clicked it), keep it selected and wait for scroll to end
      if (lockedId) {
        // Debounce: clear previous timeout and set a new one
        if (scrollDebounceRef.current) {
          clearTimeout(scrollDebounceRef.current);
        }
        // After 150ms of no scroll events, consider scrolling complete and unlock
        // This just unlocks - the next scroll event will trigger re-evaluation
        scrollDebounceRef.current = setTimeout(() => {
          setLockedId(null);
        }, 150);
        return;
      }

      // Find the heading that's closest to the top of the viewport (but scrolled past or at the top)
      let activeItem = items[0]?.id;
      const viewportTop = scrollOffset;

      for (const item of items) {
        const element = document.getElementById(item.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          // If this heading is at or above the scroll offset threshold, it's a candidate
          if (rect.top <= viewportTop + 20) {
            activeItem = item.id;
          } else {
            // Once we find a heading below the threshold, stop
            break;
          }
        }
      }

      if (activeItem) {
        updateActiveId(activeItem);
      }
    };

    // Listen for scroll events
    window.addEventListener('scroll', updateActiveSection, { passive: true });

    return () => {
      window.removeEventListener('scroll', updateActiveSection);
      if (scrollDebounceRef.current) {
        clearTimeout(scrollDebounceRef.current);
      }
    };
  }, [items, scrollOffset, updateActiveId, lockedId]);

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      // Lock this item as selected until scrolling completes
      setLockedId(id);

      // Update active state immediately for better UX
      updateActiveId(id);

      // Smooth scroll to the heading
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(id);
    }
  };

  if (items.length === 0) {
    return null;
  }

  const classNames = [
    styles.toc,
    hideOnSmallScreens && styles.hideOnSmall,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // Indicator style with transition (skip transition on initial render)
  const indicatorCSSStyle: CSSProperties | undefined = indicatorStyle
    ? {
        transform: `translateY(${indicatorStyle.top}px)`,
        height: `${indicatorStyle.height}px`,
        transition: isInitialRender ? 'none' : undefined,
      }
    : undefined;

  return (
    <nav className={classNames} aria-label="Table of contents" {...props}>
      <div className={styles.tocInner}>
        <h4 className={styles.title}>{title}</h4>
        <ul className={styles.list} role="list" ref={listRef}>
          {items.map((item) => (
            <li key={item.id} className={styles.item}>
              <button
                ref={(el) => setItemRef(item.id, el)}
                type="button"
                className={`${styles.link} ${activeId === item.id ? styles.active : ''}`}
                onClick={() => handleClick(item.id)}
                onKeyDown={(e) => handleKeyDown(e, item.id)}
                style={{
                  paddingInlineStart: `${(item.level - 2) * 12 + 12}px`,
                }}
                aria-current={activeId === item.id ? 'location' : undefined}
              >
                {item.text}
              </button>
            </li>
          ))}
          {/* Animated indicator */}
          {indicatorStyle && (
            <div
              className={styles.indicator}
              style={indicatorCSSStyle}
              aria-hidden="true"
            />
          )}
        </ul>
      </div>
    </nav>
  );
}

TableOfContents.displayName = 'TableOfContents';
