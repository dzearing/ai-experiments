import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useId,
  useCallback,
  type ReactNode,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import styles from './Tabs.module.css';

/**
 * Tabs component - tabbed content navigation with animated indicator
 *
 * Surfaces used:
 * - controlSubtle (tab buttons)
 * - controlPrimary (active tab indicator)
 *
 * Tokens used:
 * - --controlSubtle-bg, --controlSubtle-bg-hover
 * - --controlPrimary-bg
 * - --panel-border
 * - --duration-normal, --ease-default
 *
 * Accessibility (WAI-ARIA Tabs pattern):
 * - role="tablist" on container
 * - role="tab" on tab buttons with aria-selected
 * - role="tabpanel" on content panel
 * - aria-controls linking tabs to panels
 * - Roving tabIndex for keyboard navigation
 * - Arrow key navigation (Left/Right)
 * - Home/End keys for first/last tab
 */

export type TabsVariant = 'default' | 'pills' | 'underline';

export interface TabItem {
  /** Tab identifier */
  value: string;
  /** Tab label */
  label: ReactNode;
  /** Tab content */
  content: ReactNode;
  /** Tab is disabled */
  disabled?: boolean;
  /** Icon to display before the label */
  icon?: ReactNode;
}

export interface TabsProps {
  /** Tab items */
  items: TabItem[];
  /** Default active tab */
  defaultValue?: string;
  /** Controlled active tab */
  value?: string;
  /** Callback when active tab changes */
  onChange?: (value: string) => void;
  /** Tabs variant */
  variant?: TabsVariant;
  /** Whether to animate the indicator (default: true) */
  animated?: boolean;
  /** Full width tabs that stretch to fill container */
  fullWidth?: boolean;
  /** Additional class name for the tabs container */
  className?: string;
}

interface IndicatorStyle {
  left: number;
  width: number;
}

export function Tabs({
  items,
  defaultValue,
  value: controlledValue,
  onChange,
  variant = 'default',
  animated = true,
  fullWidth = false,
  className,
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue || items[0]?.value);
  const [indicatorStyle, setIndicatorStyle] = useState<IndicatorStyle | null>(null);
  const [isInitialRender, setIsInitialRender] = useState(true);

  const tabListRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const baseId = useId();

  const isControlled = controlledValue !== undefined;
  const activeValue = isControlled ? controlledValue : internalValue;

  // Get focusable (non-disabled) items
  const focusableItems = items.filter((item) => !item.disabled);

  // Update indicator position
  const updateIndicator = () => {
    if (!animated || variant === 'pills') return;

    const activeTab = tabRefs.current.get(activeValue);
    const tabList = tabListRef.current;

    if (activeTab && tabList) {
      const tabRect = activeTab.getBoundingClientRect();
      const listRect = tabList.getBoundingClientRect();

      setIndicatorStyle({
        left: tabRect.left - listRect.left,
        width: tabRect.width,
      });
    }
  };

  // Update indicator on mount and when active value changes
  useLayoutEffect(() => {
    updateIndicator();
    // Mark initial render complete after first paint
    if (isInitialRender) {
      requestAnimationFrame(() => {
        setIsInitialRender(false);
      });
    }
  }, [activeValue, animated, variant, items]);

  // Update indicator on window resize
  useEffect(() => {
    if (!animated || variant === 'pills') return;

    const handleResize = () => updateIndicator();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [animated, variant, activeValue]);

  const handleTabClick = (value: string) => {
    if (!isControlled) {
      setInternalValue(value);
    }
    onChange?.(value);
  };

  const setTabRef = (value: string, element: HTMLButtonElement | null) => {
    if (element) {
      tabRefs.current.set(value, element);
    } else {
      tabRefs.current.delete(value);
    }
  };

  // Focus and select a tab by value
  const focusAndSelectTab = useCallback(
    (value: string) => {
      const tab = tabRefs.current.get(value);
      if (tab) {
        tab.focus();
        handleTabClick(value);
      }
    },
    [handleTabClick]
  );

  // Keyboard navigation per WAI-ARIA Tabs pattern
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const currentIndex = focusableItems.findIndex((item) => item.value === activeValue);
      if (currentIndex === -1) return;

      let newIndex: number | null = null;

      switch (event.key) {
        case 'ArrowRight':
          event.preventDefault();
          newIndex = currentIndex + 1;
          if (newIndex >= focusableItems.length) {
            newIndex = 0; // Wrap to first
          }
          break;
        case 'ArrowLeft':
          event.preventDefault();
          newIndex = currentIndex - 1;
          if (newIndex < 0) {
            newIndex = focusableItems.length - 1; // Wrap to last
          }
          break;
        case 'Home':
          event.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          event.preventDefault();
          newIndex = focusableItems.length - 1;
          break;
      }

      if (newIndex !== null && focusableItems[newIndex]) {
        focusAndSelectTab(focusableItems[newIndex].value);
      }
    },
    [activeValue, focusableItems, focusAndSelectTab]
  );

  // Generate IDs for tabs and panels
  const getTabId = (value: string) => `${baseId}-tab-${value}`;
  const getPanelId = (value: string) => `${baseId}-panel-${value}`;

  const activeItem = items.find((item) => item.value === activeValue);

  // Check if any items have content (for navigation-only mode)
  const hasContent = items.some((item) => item.content != null);

  const containerClassNames = [
    styles.tabs,
    hasContent && styles.hasPanel,
    className,
  ].filter(Boolean).join(' ');

  const tabListClassNames = [
    styles.tabList,
    styles[variant],
    fullWidth && styles.fullWidth,
    animated && styles.animated,
  ]
    .filter(Boolean)
    .join(' ');

  // Indicator style with transition (skip transition on initial render)
  const indicatorCSSStyle: CSSProperties | undefined =
    indicatorStyle && (variant === 'default' || variant === 'underline')
      ? {
          transform: `translateX(${indicatorStyle.left}px)`,
          width: `${indicatorStyle.width}px`,
          transition: isInitialRender ? 'none' : undefined,
        }
      : undefined;

  return (
    <div className={containerClassNames}>
      <div
        className={tabListClassNames}
        role="tablist"
        ref={tabListRef}
        onKeyDown={handleKeyDown}
      >
        {items.map((item) => {
          const isActive = item.value === activeValue;
          return (
            <button
              key={item.value}
              id={getTabId(item.value)}
              ref={(el) => setTabRef(item.value, el)}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={hasContent ? getPanelId(item.value) : undefined}
              tabIndex={isActive ? 0 : -1}
              className={`${styles.tab} ${isActive ? styles.active : ''} ${item.disabled ? styles.disabled : ''}`}
              onClick={() => !item.disabled && handleTabClick(item.value)}
              disabled={item.disabled}
            >
              {item.icon && <span className={styles.tabIcon}>{item.icon}</span>}
              {item.label}
            </button>
          );
        })}
        {/* Animated indicator for default and underline variants */}
        {animated && indicatorStyle && (variant === 'default' || variant === 'underline') && (
          <div
            className={styles.indicator}
            style={indicatorCSSStyle}
            aria-hidden="true"
          />
        )}
      </div>
      {hasContent && (
        <div
          id={getPanelId(activeValue)}
          className={styles.tabPanel}
          role="tabpanel"
          aria-labelledby={getTabId(activeValue)}
          tabIndex={0}
        >
          {activeItem?.content}
        </div>
      )}
    </div>
  );
}

Tabs.displayName = 'Tabs';
