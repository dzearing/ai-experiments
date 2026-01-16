import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useId,
  useCallback,
  type ReactNode,
  type CSSProperties,
} from 'react';
import { FocusZone } from '../FocusZone';
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
 * - All non-disabled tabs are focusable
 * - Arrow key navigation (Left/Right)
 * - Home/End keys for first/last tab
 */

export type TabsVariant = 'default' | 'pills' | 'underline';
export type TabsSize = 'sm' | 'md' | 'lg';

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
  /** Tab size (default: 'sm') */
  size?: TabsSize;
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
  size = 'sm',
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

  // Calculate indicator position for a given tab element
  const getIndicatorPosition = useCallback((tabElement: HTMLElement | null): IndicatorStyle | null => {
    const tabList = tabListRef.current;
    if (!tabElement || !tabList) return null;

    const tabRect = tabElement.getBoundingClientRect();
    const listRect = tabList.getBoundingClientRect();

    return {
      left: tabRect.left - listRect.left,
      width: tabRect.width,
    };
  }, []);

  // Update indicator position
  const updateIndicator = useCallback(() => {
    if (!animated || variant === 'pills') return;

    const activeTab = activeValue ? tabRefs.current.get(activeValue) ?? null : null;
    const position = getIndicatorPosition(activeTab);
    setIndicatorStyle(position);
  }, [animated, variant, activeValue, getIndicatorPosition]);

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

  // Handle focus changes from FocusZone - select tab on keyboard navigation
  const handleFocusChange = useCallback(
    (element: HTMLElement) => {
      // Find the tab value from the focused element
      const value = element.getAttribute('data-value');
      if (value) {
        handleTabClick(value);
      }
    },
    [handleTabClick]
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
    styles[`size-${size}`],
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
      <FocusZone
        direction="horizontal"
        wrap
        className={tabListClassNames}
        role="tablist"
        ref={tabListRef}
        onFocusChange={handleFocusChange}
        selector="button:not([disabled])"
      >
        {items.map((item) => {
          const isActive = item.value === activeValue;
          return (
            <button
              key={item.value}
              id={getTabId(item.value)}
              data-value={item.value}
              ref={(el) => setTabRef(item.value, el)}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={hasContent ? getPanelId(item.value) : undefined}
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
      </FocusZone>
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
