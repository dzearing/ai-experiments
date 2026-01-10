import { useState, useRef, useEffect } from 'react';
import { Button } from '@ui-kit/react';
import type { TopicColor } from '../../types/topic';
import styles from './ColorPicker.module.css';

interface ColorPickerProps {
  value?: TopicColor;
  onChange: (color: TopicColor | null) => void;
  size?: 'sm' | 'md';
}

// Color palette with CSS variables for theming
const COLOR_CONFIG: Record<TopicColor, { label: string; cssVar: string }> = {
  default: { label: 'Default', cssVar: 'var(--base-fg-soft)' },
  blue: { label: 'Blue', cssVar: '#3b82f6' },
  green: { label: 'Green', cssVar: '#22c55e' },
  purple: { label: 'Purple', cssVar: '#a855f7' },
  orange: { label: 'Orange', cssVar: '#f97316' },
  red: { label: 'Red', cssVar: '#ef4444' },
  teal: { label: 'Teal', cssVar: '#14b8a6' },
  pink: { label: 'Pink', cssVar: '#ec4899' },
  yellow: { label: 'Yellow', cssVar: '#eab308' },
  gray: { label: 'Gray', cssVar: '#6b7280' },
};

const COLOR_NAMES = Object.keys(COLOR_CONFIG) as TopicColor[];

export function ColorPicker({ value, onChange, size = 'md' }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (color: TopicColor) => {
    onChange(color === value ? null : color);
    setIsOpen(false);
  };

  const currentColor = value ? COLOR_CONFIG[value] : null;

  return (
    <div className={styles.container} ref={containerRef}>
      <Button
        variant="ghost"
        size={size}
        onClick={() => setIsOpen(!isOpen)}
        className={styles.trigger}
        aria-label="Pick color"
        aria-expanded={isOpen}
      >
        {currentColor ? (
          <span
            className={styles.colorDot}
            style={{ backgroundColor: currentColor.cssVar }}
          />
        ) : (
          <span className={styles.placeholder} />
        )}
      </Button>

      {isOpen && (
        <div className={styles.popover}>
          <div className={styles.grid}>
            {COLOR_NAMES.map((colorName) => (
              <button
                key={colorName}
                type="button"
                className={`${styles.colorButton} ${value === colorName ? styles.selected : ''}`}
                onClick={() => handleSelect(colorName)}
                title={COLOR_CONFIG[colorName].label}
              >
                <span
                  className={styles.colorSwatch}
                  style={{ backgroundColor: COLOR_CONFIG[colorName].cssVar }}
                />
              </button>
            ))}
          </div>
          {value && (
            <button
              type="button"
              className={styles.clearButton}
              onClick={() => {
                onChange(null);
                setIsOpen(false);
              }}
            >
              Clear color
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Export color getter for use elsewhere
export function getTopicColor(color: TopicColor): string {
  return COLOR_CONFIG[color]?.cssVar || COLOR_CONFIG.default.cssVar;
}

// Export config for chip styling
export const TOPIC_COLORS = COLOR_CONFIG;
