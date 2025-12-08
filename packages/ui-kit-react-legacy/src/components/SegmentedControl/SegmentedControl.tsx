import React, { useRef, useCallback, useMemo, useEffect, useState } from 'react';
import styles from './SegmentedControl.module.css';
import cx from 'clsx';

export interface SegmentOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  tooltip?: string;
  ariaLabel?: string;
}

export interface SegmentedControlProps {
  /** Array of options to display */
  options: SegmentOption[];
  /** Currently selected value */
  value: string;
  /** Handler called when selection changes */
  onChange: (value: string) => void;
  /** Size of the control */
  size?: 'small' | 'medium' | 'large';
  /** Whether control should fill container width */
  fullWidth?: boolean;
  /** Disable entire control */
  disabled?: boolean;
  /** Name for form integration */
  name?: string;
  /** Accessible label for the control */
  ariaLabel?: string;
  /** ID of element that labels the control */
  ariaLabelledBy?: string;
  /** Additional CSS classes */
  className?: string;
  /** Visual style variant */
  variant?: 'pills' | 'square' | 'underline';
  /** Color scheme */
  color?: 'primary' | 'secondary' | 'neutral';
  /** Show dividers between segments */
  showDividers?: boolean;
  /** Focus event handler */
  onFocus?: (event: React.FocusEvent) => void;
  /** Blur event handler */
  onBlur?: (event: React.FocusEvent) => void;
}

export const SegmentedControl = React.forwardRef<HTMLDivElement, SegmentedControlProps>(
  (
    {
      options,
      value,
      onChange,
      size = 'medium',
      fullWidth = false,
      disabled = false,
      name,
      ariaLabel,
      ariaLabelledBy,
      className,
      variant = 'pills',
      color = 'primary',
      showDividers = false,
      onFocus,
      onBlur,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const optionRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
    const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({});
    const [focusedValue, setFocusedValue] = useState<string | null>(null);

    // Get enabled options for keyboard navigation
    const enabledOptions = useMemo(
      () => options.filter(opt => !opt.disabled && !disabled),
      [options, disabled]
    );

    // Update indicator position when value changes
    useEffect(() => {
      const selectedButton = optionRefs.current.get(value);
      const firstButton = options.length > 0 && options[0] ? optionRefs.current.get(options[0].value) : null;
      
      if (selectedButton && firstButton) {
        const firstRect = firstButton.getBoundingClientRect();
        const selectedRect = selectedButton.getBoundingClientRect();
        
        // Calculate position relative to the first button
        const left = selectedRect.left - firstRect.left;
        const width = selectedRect.width;
        
        setIndicatorStyle({
          transform: `translateX(${left}px)`,
          width: `${width}px`,
        });
      }
    }, [value, options]);

    // Handle option click
    const handleOptionClick = useCallback(
      (optionValue: string) => {
        if (!disabled && optionValue !== value) {
          onChange(optionValue);
        }
      },
      [disabled, value, onChange]
    );

    // Handle keyboard navigation
    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent) => {
        if (disabled || enabledOptions.length === 0) return;

        const currentIndex = enabledOptions.findIndex(opt => opt.value === value);
        let newIndex = currentIndex;

        switch (event.key) {
          case 'ArrowLeft':
          case 'ArrowUp':
            event.preventDefault();
            newIndex = currentIndex > 0 ? currentIndex - 1 : enabledOptions.length - 1;
            break;
          case 'ArrowRight':
          case 'ArrowDown':
            event.preventDefault();
            newIndex = currentIndex < enabledOptions.length - 1 ? currentIndex + 1 : 0;
            break;
          case 'Home':
            event.preventDefault();
            newIndex = 0;
            break;
          case 'End':
            event.preventDefault();
            newIndex = enabledOptions.length - 1;
            break;
          case ' ':
          case 'Enter':
            event.preventDefault();
            if (focusedValue && focusedValue !== value) {
              onChange(focusedValue);
            }
            return;
          default:
            return;
        }

        const newOption = enabledOptions[newIndex];
        if (newOption) {
          setFocusedValue(newOption.value);
          onChange(newOption.value);
          
          // Focus the button
          const button = optionRefs.current.get(newOption.value);
          button?.focus();
        }
      },
      [disabled, enabledOptions, value, onChange, focusedValue]
    );

    // Handle focus/blur
    const handleFocus = useCallback(
      (event: React.FocusEvent) => {
        setFocusedValue(value);
        onFocus?.(event);
      },
      [value, onFocus]
    );

    const handleBlur = useCallback(
      (event: React.FocusEvent) => {
        setFocusedValue(null);
        onBlur?.(event);
      },
      [onBlur]
    );

    // Component classes
    const containerClasses = cx(
      styles.container,
      variant === 'square' && styles['variant-square'],
      variant === 'underline' && styles['variant-underline'],
      size === 'small' && styles['size-small'],
      size === 'large' && styles['size-large'],
      color === 'secondary' && styles['color-secondary'],
      color === 'neutral' && styles['color-neutral'],
      fullWidth && styles.fullWidth,
      disabled && styles.disabled,
      className
    );

    // Render individual option
    const renderOption = (option: SegmentOption, index: number) => {
      const isSelected = option.value === value;
      const isFocused = option.value === focusedValue;
      const isDisabled = option.disabled || disabled;

      const isIconOnly = option.icon && !option.label;
      const optionClasses = cx(
        styles.option,
        isSelected && styles.selected,
        isFocused && styles.focused,
        isDisabled && styles.optionDisabled,
        isIconOnly && styles.iconOnly
      );

      return (
        <React.Fragment key={option.value}>
          <button
            ref={(el) => {
              if (el) {
                optionRefs.current.set(option.value, el);
              } else {
                optionRefs.current.delete(option.value);
              }
            }}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-disabled={isDisabled}
            aria-label={option.ariaLabel || option.label}
            title={option.tooltip || option.label}
            className={optionClasses}
            disabled={isDisabled}
            onClick={() => handleOptionClick(option.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            tabIndex={isSelected ? 0 : -1}
          >
            {option.icon && <span className={styles.icon}>{option.icon}</span>}
            {option.label && (
              <span className={styles.labelWrapper}>
                <span className={styles.label}>{option.label}</span>
                <span className={styles.labelBold} aria-hidden="true">{option.label}</span>
              </span>
            )}
          </button>
          {showDividers && variant !== 'underline' && index < options.length - 1 && (
            <span className={styles.divider} aria-hidden="true" />
          )}
        </React.Fragment>
      );
    };

    return (
      <div
        ref={(el) => {
          containerRef.current = el;
          if (ref) {
            if (typeof ref === 'function') {
              ref(el);
            } else {
              ref.current = el;
            }
          }
        }}
        role="radiogroup"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-disabled={disabled}
        className={containerClasses}
      >
        <div className={styles.options}>
          {variant !== 'underline' && (
            <div 
              className={styles.indicator} 
              style={indicatorStyle}
              aria-hidden="true"
            />
          )}
          {options.map(renderOption)}
        </div>
        {variant === 'underline' && (
          <div 
            className={styles.indicator} 
            style={indicatorStyle}
            aria-hidden="true"
          />
        )}
        {name && (
          <input
            type="hidden"
            name={name}
            value={value}
          />
        )}
      </div>
    );
  }
);

SegmentedControl.displayName = 'SegmentedControl';