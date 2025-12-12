import { useState, useRef, useEffect, useLayoutEffect, type ReactNode, type CSSProperties } from 'react';
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

  const isControlled = controlledValue !== undefined;
  const activeValue = isControlled ? controlledValue : internalValue;

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
      <div className={tabListClassNames} role="tablist" ref={tabListRef}>
        {items.map((item) => (
          <button
            key={item.value}
            ref={(el) => setTabRef(item.value, el)}
            type="button"
            role="tab"
            aria-selected={item.value === activeValue}
            className={`${styles.tab} ${item.value === activeValue ? styles.active : ''} ${item.disabled ? styles.disabled : ''}`}
            onClick={() => !item.disabled && handleTabClick(item.value)}
            disabled={item.disabled}
          >
            {item.icon && <span className={styles.tabIcon}>{item.icon}</span>}
            {item.label}
          </button>
        ))}
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
        <div className={styles.tabPanel} role="tabpanel">
          {activeItem?.content}
        </div>
      )}
    </div>
  );
}
