import {
  useState,
  useRef,
  useLayoutEffect,
  useEffect,
  useCallback,
  type ReactNode,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import styles from './Segmented.module.css';

/**
 * Segmented - A set of mutually exclusive options with animated indicator
 *
 * Features:
 * - Smooth sliding animation for active indicator
 * - Consistent heights matching other controls (28px/36px/44px)
 * - Full keyboard navigation (arrow keys, Home, End)
 * - RTL support
 * - ARIA radiogroup semantics
 *
 * Surfaces used:
 * - inset (background container)
 * - controlPrimary (active indicator)
 * - controlSubtle (segment buttons)
 *
 * Tokens used:
 * - --inset-bg, --inset-border
 * - --controlPrimary-bg, --controlPrimary-text
 * - --controlSubtle-text, --controlSubtle-text-hover
 * - --controlDisabled-text
 * - --space-1, --space-2, --space-3, --space-4
 * - --radius-md, --radius-full
 * - --focus-ring, --focus-ring-width, --focus-ring-offset
 * - --duration-normal, --ease-default
 * - --text-sm, --text-base, --text-lg
 * - --weight-medium
 */

export type SegmentedSize = 'sm' | 'md' | 'lg';
export type SegmentedVariant = 'pill' | 'rounded';

export interface SegmentOption {
  /** Unique value for this segment */
  value: string;
  /** Label to display */
  label: ReactNode;
  /** Optional icon */
  icon?: ReactNode;
  /** Disable this segment */
  disabled?: boolean;
  /** Accessible label for icon-only segments */
  'aria-label'?: string;
}

export interface SegmentedProps {
  /** Segment options */
  options: SegmentOption[];
  /** Default selected value (uncontrolled) */
  defaultValue?: string;
  /** Controlled selected value */
  value?: string;
  /** Callback when selection changes */
  onChange?: (value: string) => void;
  /** Size variant - matches Button/Input heights */
  size?: SegmentedSize;
  /** Shape variant */
  variant?: SegmentedVariant;
  /** Full width mode */
  fullWidth?: boolean;
  /** Icon-only mode (hides labels) */
  iconOnly?: boolean;
  /** Disable all segments */
  disabled?: boolean;
  /** Additional class name */
  className?: string;
  /** Accessible label for the control group */
  'aria-label'?: string;
}

interface IndicatorStyle {
  left: number;
  width: number;
}

export function Segmented({
  options,
  defaultValue,
  value: controlledValue,
  onChange,
  size = 'md',
  variant = 'pill',
  fullWidth = false,
  iconOnly = false,
  disabled = false,
  className,
  'aria-label': ariaLabel,
}: SegmentedProps) {
  const [internalValue, setInternalValue] = useState(defaultValue || options[0]?.value);
  const [indicatorStyle, setIndicatorStyle] = useState<IndicatorStyle | null>(null);
  const [isInitialRender, setIsInitialRender] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const segmentRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const isControlled = controlledValue !== undefined;
  const activeValue = isControlled ? controlledValue : internalValue;

  // Get enabled options for keyboard navigation
  const enabledOptions = options.filter((opt) => !opt.disabled);

  // Update indicator position
  const updateIndicator = useCallback(() => {
    const activeSegment = segmentRefs.current.get(activeValue);
    const container = containerRef.current;

    if (activeSegment && container) {
      const segmentRect = activeSegment.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      // Account for RTL
      const isRTL = getComputedStyle(container).direction === 'rtl';
      const left = isRTL
        ? containerRect.right - segmentRect.right
        : segmentRect.left - containerRect.left;

      setIndicatorStyle({
        left,
        width: segmentRect.width,
      });
    }
  }, [activeValue]);

  // Update indicator on mount and when active value changes
  useLayoutEffect(() => {
    updateIndicator();

    // Mark initial render complete after first paint
    if (isInitialRender) {
      requestAnimationFrame(() => {
        setIsInitialRender(false);
      });
    }
  }, [activeValue, options, updateIndicator, isInitialRender]);

  // Update indicator on window resize
  useEffect(() => {
    const handleResize = () => updateIndicator();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateIndicator]);

  const handleSegmentClick = (value: string) => {
    if (disabled) return;

    const option = options.find((o) => o.value === value);
    if (option?.disabled) return;

    if (!isControlled) {
      setInternalValue(value);
    }
    onChange?.(value);
  };

  const setSegmentRef = (value: string, element: HTMLButtonElement | null) => {
    if (element) {
      segmentRefs.current.set(value, element);
    } else {
      segmentRefs.current.delete(value);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled || enabledOptions.length === 0) return;

    const currentIndex = enabledOptions.findIndex((opt) => opt.value === activeValue);
    let newIndex = currentIndex;

    // Check for RTL
    const isRTL = containerRef.current
      ? getComputedStyle(containerRef.current).direction === 'rtl'
      : false;

    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        newIndex = isRTL
          ? Math.max(0, currentIndex - 1)
          : Math.min(enabledOptions.length - 1, currentIndex + 1);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        newIndex = isRTL
          ? Math.min(enabledOptions.length - 1, currentIndex + 1)
          : Math.max(0, currentIndex - 1);
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = enabledOptions.length - 1;
        break;
      default:
        return;
    }

    if (newIndex !== currentIndex) {
      const newValue = enabledOptions[newIndex].value;
      handleSegmentClick(newValue);
    }
  };

  const containerClassNames = [
    styles.segmented,
    styles[size],
    styles[variant],
    fullWidth && styles.fullWidth,
    iconOnly && styles.iconOnly,
    disabled && styles.disabled,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // Indicator style with transition (skip transition on initial render)
  const indicatorCSSStyle: CSSProperties | undefined = indicatorStyle
    ? {
        transform: `translateX(${indicatorStyle.left}px)`,
        width: `${indicatorStyle.width}px`,
        transition: isInitialRender ? 'none' : undefined,
      }
    : undefined;

  return (
    <div
      ref={containerRef}
      className={containerClassNames}
      role="radiogroup"
      aria-label={ariaLabel}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
    >
      {/* Animated indicator - behind segments */}
      {indicatorStyle && (
        <div
          className={styles.indicator}
          style={indicatorCSSStyle}
          aria-hidden="true"
        />
      )}

      {options.map((option) => {
        const isActive = option.value === activeValue;
        const isDisabled = disabled || option.disabled;

        const segmentClassNames = [
          styles.segment,
          isActive && styles.active,
          isDisabled && styles.segmentDisabled,
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <button
            key={option.value}
            ref={(el) => setSegmentRef(option.value, el)}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={option['aria-label'] || (iconOnly ? String(option.label) : undefined)}
            className={segmentClassNames}
            onClick={() => handleSegmentClick(option.value)}
            disabled={isDisabled}
            tabIndex={-1}
            title={iconOnly ? String(option.label) : undefined}
          >
            {option.icon && <span className={styles.segmentIcon}>{option.icon}</span>}
            {!iconOnly && <span className={styles.segmentLabel}>{option.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
Segmented.displayName = 'Segmented';

export default Segmented;
