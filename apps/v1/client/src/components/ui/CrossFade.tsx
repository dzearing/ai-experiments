import { useState, useEffect, useRef } from 'react';

interface CrossFadeProps {
  src: string;
  alt?: string;
  className?: string;
  duration?: number; // in milliseconds
  fallbackSrc?: string;
}

interface ImageState {
  src: string;
  key: string;
}

export function CrossFade({
  src,
  alt = '',
  className = '',
  duration = 300,
  fallbackSrc,
}: CrossFadeProps) {
  // Keep track of both current and previous images
  const [images, setImages] = useState<ImageState[]>([{ src, key: `img-0` }]);
  const [activeIndex, setActiveIndex] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const imageCountRef = useRef(1);
  const currentSrcRef = useRef(src);

  useEffect(() => {
    // When src changes, add new image and start transition
    if (src !== currentSrcRef.current) {
      currentSrcRef.current = src;

      // Preload the new image
      const img = new Image();
      img.src = src;

      // Clear any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Add new image and immediately set it as active
      const newKey = `img-${imageCountRef.current++}`;
      setImages((prev) => {
        // Always keep exactly 2 images during transition
        // Use the last image in the array as the current one
        const currentImage = prev[prev.length - 1];
        return [currentImage, { src, key: newKey }];
      });

      // Start transition to new image after a frame to ensure DOM update
      requestAnimationFrame(() => {
        setActiveIndex(1);
      });

      // Clean up after transition completes
      timeoutRef.current = setTimeout(() => {
        setImages((prev) => {
          // Keep only the currently visible image
          const activeImage = prev[1] || prev[0];
          return [activeImage];
        });
        setActiveIndex(0);
      }, duration + 50); // Small buffer after transition
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [src, duration]); // Only depend on src and duration

  const handleError = (index: number) => {
    if (fallbackSrc) {
      setImages((prev) => {
        const newImages = [...prev];
        newImages[index] = { ...newImages[index], src: fallbackSrc };
        return newImages;
      });
    }
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Invisible img to maintain aspect ratio */}
      <img
        src={images[0].src}
        alt=""
        className="invisible w-full h-full object-cover"
        aria-hidden="true"
      />

      {/* Actual crossfading images */}
      {images.map((img, index) => (
        <img
          key={img.key}
          src={img.src}
          alt={alt}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity`}
          style={{
            transitionDuration: `${duration}ms`,
            opacity: index === activeIndex ? 1 : 0,
          }}
          onError={() => handleError(index)}
        />
      ))}
    </div>
  );
}
