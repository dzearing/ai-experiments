import { useState, type ReactNode } from 'react';
import styles from './Tabs.module.css';

/**
 * Tabs component - tabbed content navigation
 *
 * Surfaces used:
 * - controlSubtle (tab buttons)
 * - controlPrimary (active tab)
 *
 * Tokens used:
 * - --controlSubtle-bg, --controlSubtle-bg-hover
 * - --controlPrimary-bg
 * - --panel-border
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
}

export function Tabs({
  items,
  defaultValue,
  value: controlledValue,
  onChange,
  variant = 'default',
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue || items[0]?.value);

  const isControlled = controlledValue !== undefined;
  const activeValue = isControlled ? controlledValue : internalValue;

  const handleTabClick = (value: string) => {
    if (!isControlled) {
      setInternalValue(value);
    }
    onChange?.(value);
  };

  const activeItem = items.find((item) => item.value === activeValue);

  return (
    <div className={styles.tabs}>
      <div className={`${styles.tabList} ${styles[variant]}`} role="tablist">
        {items.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={item.value === activeValue}
            className={`${styles.tab} ${item.value === activeValue ? styles.active : ''} ${item.disabled ? styles.disabled : ''}`}
            onClick={() => !item.disabled && handleTabClick(item.value)}
            disabled={item.disabled}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className={styles.tabPanel} role="tabpanel">
        {activeItem?.content}
      </div>
    </div>
  );
}
