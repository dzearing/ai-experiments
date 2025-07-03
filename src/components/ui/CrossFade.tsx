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

export function CrossFade({ src, alt = '', className = '', duration = 300, fallbackSrc }: CrossFadeProps) {
  // Keep track of both current and previous images
  const [images, setImages] = useState<ImageState[]>([
    { src, key: `img-0` }
  ]);
  const [activeIndex, setActiveIndex] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const imageCountRef = useRef(1);

  useEffect(() => {
    // When src changes, add new image and start transition
    const currentSrc = images[activeIndex]?.src;
    if (src !== currentSrc) {
      // Preload the new image
      const img = new Image();
      img.src = src;
      
      // Add new image to the stack
      const newKey = `img-${imageCountRef.current++}`;
      setImages(prev => [...prev, { src, key: newKey }]);
      
      // Start transition to new image after a frame to ensure DOM update
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setActiveIndex(images.length); // This will be the index of the newly added image
        });
      });

      // Clean up old images after transition
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        setImages(prev => {
          // Keep only the active image
          const activeImg = prev[prev.length - 1];
          return [activeImg];
        });
        setActiveIndex(0);
      }, duration + 100); // Add small buffer after transition
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [src, images, activeIndex, duration]);

  const handleError = (index: number) => {
    if (fallbackSrc) {
      setImages(prev => {
        const newImages = [...prev];
        newImages[index] = { ...newImages[index], src: fallbackSrc };
        return newImages;
      });
    }
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Invisible img to maintain aspect ratio */}
      <img src={images[0].src} alt="" className="invisible w-full h-full object-cover" aria-hidden="true" />
      
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
            zIndex: index === activeIndex ? 1 : 0
          }}
          onError={() => handleError(index)}
        />
      ))}
    </div>
  );
}