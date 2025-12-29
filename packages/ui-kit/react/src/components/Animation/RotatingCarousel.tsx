import {
  type ReactNode,
  type CSSProperties,
  type HTMLAttributes,
  useState,
  useEffect,
  useRef,
  useCallback,
  Children,
  cloneElement,
  isValidElement,
} from 'react';
import styles from './RotatingCarousel.module.css';

/**
 * RotatingCarousel - Cycles through sets of content with crossfade animations
 *
 * Displays content that automatically rotates through different sets
 * with staggered scale/fade animations for a smooth crossfade effect.
 *
 * IMPORTANT: Apply grid/flex layout via className prop. The carousel container
 * becomes the layout parent, and both exit/enter layers will inherit this layout.
 *
 * Surfaces used: None (wrapper component)
 *
 * Tokens used:
 * - --duration-normal (default transition timing)
 * - --ease-default (default easing)
 *
 * @example
 * ```tsx
 * // With grid layout via className
 * <RotatingCarousel
 *   className={styles.myGrid}
 *   sets={[items1, items2, items3]}
 *   interval={5000}
 *   renderItem={(item, index) => <Card key={index}>{item.name}</Card>}
 * />
 *
 * // With RotatingCarousel.Set children
 * <RotatingCarousel className={styles.myGrid} interval={3000}>
 *   <RotatingCarousel.Set>
 *     <Card>Item 1</Card>
 *     <Card>Item 2</Card>
 *   </RotatingCarousel.Set>
 *   <RotatingCarousel.Set>
 *     <Card>Item A</Card>
 *     <Card>Item B</Card>
 *   </RotatingCarousel.Set>
 * </RotatingCarousel>
 * ```
 */

export interface RotatingCarouselProps<T = unknown>
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Content sets as children using RotatingCarousel.Set */
  children?: ReactNode;
  /** Alternatively, provide data sets directly */
  sets?: T[][];
  /** Render function when using data sets */
  renderItem?: (item: T, index: number, setIndex: number) => ReactNode;
  /** Interval in milliseconds between rotations (default: 5000) */
  interval?: number;
  /** Stagger delay between each item animation in ms (default: 100) */
  staggerDelay?: number;
  /** Animation duration in ms (default: 700) */
  animationDuration?: number;
  /** Whether to pause rotation on hover (default: false) */
  pauseOnHover?: boolean;
  /** Callback when set changes */
  onSetChange?: (index: number) => void;
  /** Class name applied to each item wrapper */
  itemClassName?: string;
  /** Minimum height to prevent layout shift */
  minHeight?: number | string;
}

export interface RotatingCarouselSetProps {
  /** Items in this set */
  children: ReactNode;
}

/**
 * Container for a set of items in the carousel
 */
function RotatingCarouselSet({ children }: RotatingCarouselSetProps) {
  return <>{children}</>;
}
RotatingCarouselSet.displayName = 'RotatingCarousel.Set';

/**
 * Internal component that renders carousel items with stagger animation
 * Uses a two-phase approach to ensure animations trigger on mount
 */
function CarouselLayer({
  children,
  staggerDelay,
  animationDuration,
  isEntering,
  isExiting,
  itemClassName,
}: {
  children: ReactNode;
  staggerDelay: number;
  animationDuration: number;
  isEntering: boolean;
  isExiting: boolean;
  itemClassName?: string;
}) {
  const items = Children.toArray(children);
  const [animationReady, setAnimationReady] = useState(false);

  // Two-phase mount: first mount invisible, then add animation class to fade in
  // This ensures the browser has a chance to lay out elements before animating
  useEffect(() => {
    if (isEntering || isExiting) {
      // Use requestAnimationFrame to ensure DOM has been painted
      const frameId = requestAnimationFrame(() => {
        setAnimationReady(true);
      });
      return () => {
        cancelAnimationFrame(frameId);
        setAnimationReady(false);
      };
    } else {
      setAnimationReady(false);
    }
  }, [isEntering, isExiting]);

  return (
    <>
      {items.map((child, index) => {
        const delay = index * staggerDelay;
        // Start invisible when entering (before animation kicks in)
        const initialOpacity = isEntering && !animationReady ? 0 : undefined;

        const itemStyle: CSSProperties = {
          '--stagger-delay': `${delay}ms`,
          '--animation-duration': `${animationDuration}ms`,
          ...(initialOpacity !== undefined && { opacity: initialOpacity }),
        } as CSSProperties;

        const itemClasses = [
          styles.carouselItem,
          animationReady && isEntering && styles.carouselItemEnter,
          animationReady && isExiting && styles.carouselItemExit,
          itemClassName,
        ]
          .filter(Boolean)
          .join(' ');

        // Clone element to add animation props if it's a valid element
        if (isValidElement(child)) {
          return cloneElement(child, {
            key: index,
            className: `${(child.props as { className?: string }).className || ''} ${itemClasses}`.trim(),
            style: { ...(child.props as { style?: CSSProperties }).style, ...itemStyle },
          } as Record<string, unknown>);
        }

        // Wrap non-elements in a div
        return (
          <div key={index} className={itemClasses} style={itemStyle}>
            {child}
          </div>
        );
      })}
    </>
  );
}

/**
 * RotatingCarousel component
 */
export function RotatingCarousel<T = unknown>({
  children,
  sets,
  renderItem,
  interval = 5000,
  staggerDelay = 200,
  animationDuration = 700,
  pauseOnHover = false,
  onSetChange,
  itemClassName,
  minHeight = 180,
  className,
  style,
  ...props
}: RotatingCarouselProps<T>) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [animationKey, setAnimationKey] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Use refs to track values without causing effect re-runs
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  // Store onSetChange in ref to keep rotate callback stable
  const onSetChangeRef = useRef(onSetChange);
  onSetChangeRef.current = onSetChange;

  // Extract sets from children if not provided directly
  const contentSets: ReactNode[] = [];

  if (sets && renderItem) {
    // Use data sets with render function
    // Push arrays directly (not wrapped in Fragment) to allow proper children iteration
    sets.forEach((set, setIndex) => {
      contentSets.push(set.map((item, itemIndex) => renderItem(item, itemIndex, setIndex)));
    });
  } else if (children) {
    // Extract sets from children
    Children.forEach(children, (child) => {
      if (isValidElement(child) && child.type === RotatingCarouselSet) {
        contentSets.push((child.props as RotatingCarouselSetProps).children);
      }
    });
  }

  const totalSets = contentSets.length;
  const totalSetsRef = useRef(totalSets);
  totalSetsRef.current = totalSets;

  const rotate = useCallback(() => {
    const total = totalSetsRef.current;
    if (total <= 1) return;

    const current = currentIndexRef.current;
    const nextIndex = (current + 1) % total;
    setPrevIndex(current);
    setCurrentIndex(nextIndex);
    setAnimationKey((k) => k + 1);
    onSetChangeRef.current?.(nextIndex);

    // Clear prevIndex after animation completes
    setTimeout(() => {
      setPrevIndex(null);
    }, animationDuration + staggerDelay * 10); // Account for stagger
  }, [animationDuration, staggerDelay]);

  useEffect(() => {
    if (totalSets <= 1 || isPaused) return;

    const intervalId = setInterval(rotate, interval);

    return () => {
      clearInterval(intervalId);
    };
  }, [totalSets, interval, isPaused, rotate]);

  const currentContent = contentSets[currentIndex];
  const prevContent = prevIndex !== null ? contentSets[prevIndex] : null;

  // Container just provides positioning context - does NOT get user's grid className
  const containerClasses = styles.carouselContainer;

  // Layer classes - user's className goes on layers for grid/flex layout
  const baseLayerClasses = [styles.carouselLayer, className].filter(Boolean).join(' ');
  const exitLayerClasses = [styles.carouselLayerExit, className].filter(Boolean).join(' ');
  const enterLayerClasses = [styles.carouselLayerEnter, className].filter(Boolean).join(' ');

  const containerStyle: CSSProperties = {
    ...style,
    minHeight,
  };

  const handleMouseEnter = pauseOnHover ? () => setIsPaused(true) : undefined;
  const handleMouseLeave = pauseOnHover ? () => setIsPaused(false) : undefined;

  return (
    <div
      {...props}
      className={containerClasses}
      style={containerStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Current content - base layer, establishes layout space */}
      <div
        key={`current-${animationKey}`}
        className={prevIndex !== null ? enterLayerClasses : baseLayerClasses}
      >
        <CarouselLayer
          staggerDelay={staggerDelay}
          animationDuration={animationDuration}
          isEntering={prevIndex !== null}
          isExiting={false}
          itemClassName={itemClassName}
        >
          {currentContent}
        </CarouselLayer>
      </div>

      {/* Previous content - absolutely positioned overlay, fading out */}
      {prevContent && (
        <div
          key={`prev-${animationKey}`}
          className={exitLayerClasses}
        >
          <CarouselLayer
            staggerDelay={staggerDelay}
            animationDuration={animationDuration}
            isEntering={false}
            isExiting={true}
            itemClassName={itemClassName}
          >
            {prevContent}
          </CarouselLayer>
        </div>
      )}
    </div>
  );
}

// Attach Set component
RotatingCarousel.Set = RotatingCarouselSet;

RotatingCarousel.displayName = 'RotatingCarousel';
