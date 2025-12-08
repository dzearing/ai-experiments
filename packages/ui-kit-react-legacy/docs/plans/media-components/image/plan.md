# Image

## Component Name and Description
Image is a display primitive that provides optimized image rendering with loading states, error handling, responsive sizing, and accessibility features.

## Use Cases
- User profile pictures and avatars
- Product and content images
- Hero banners and backgrounds
- Thumbnails and previews
- Gallery and carousel images
- Logo and branding images

## API/Props Interface

```typescript
interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Image source URL */
  src: string;
  
  /** Alternative text for accessibility */
  alt: string;
  
  /** Fallback image source */
  fallbackSrc?: string;
  
  /** Placeholder while loading */
  placeholder?: React.ReactNode | string;
  
  /** Loading strategy */
  loading?: 'lazy' | 'eager';
  
  /** Size variants */
  size?: ResponsiveValue<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'> | number | string;
  
  /** Aspect ratio */
  aspectRatio?: 'square' | 'portrait' | 'landscape' | 'wide' | 'video' | string;
  
  /** Object fit behavior */
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  
  /** Object position */
  objectPosition?: string;
  
  /** Border radius */
  borderRadius?: ResponsiveValue<'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'>;
  
  /** Image quality (for dynamic sources) */
  quality?: number;
  
  /** Blur while loading */
  blurDataURL?: string;
  
  /** Priority loading for above-fold images */
  priority?: boolean;
  
  /** Responsive sizes */
  sizes?: string;
  
  /** Responsive source set */
  srcSet?: string;
  
  /** Error state content */
  errorContent?: React.ReactNode;
  
  /** Loading state content */
  loadingContent?: React.ReactNode;
  
  /** Caption text */
  caption?: string;
  
  /** Image overlay content */
  overlay?: React.ReactNode;
  
  /** Zoom on hover */
  zoomOnHover?: boolean;
  
  /** Grayscale filter */
  grayscale?: boolean;
  
  /** Event handlers */
  onLoad?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
  onError?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
  onLoadingComplete?: () => void;
  
  /** Progressive enhancement */
  progressive?: boolean;
  
  /** Cross-origin setting */
  crossOrigin?: 'anonymous' | 'use-credentials';
}

// Predefined aspect ratios
type AspectRatios = {
  square: '1:1';
  portrait: '3:4';
  landscape: '4:3';
  wide: '16:9';
  video: '16:9';
};

// Predefined sizes
type ImageSizes = {
  xs: '32px';
  sm: '48px';
  md: '64px';
  lg: '96px';
  xl: '128px';
  '2xl': '192px';
};
```

## Sub-components

### Image.Placeholder
Customizable placeholder component for loading states.

### Image.Overlay
Overlay component for interactive content over images.

### Image.Caption
Caption component for image descriptions.

## Usage Examples

### Basic Image
```html
<div class="image-container">
  <img class="image" 
       src="https://example.com/photo.jpg"
       alt="Beautiful landscape photo"
       data-size="md"
       data-border-radius="md"
       loading="lazy">
</div>
```

### Avatar Image with Fallback
```html
<div class="avatar-image" data-size="lg">
  <img class="image" 
       src="https://example.com/user-avatar.jpg"
       alt="User profile picture"
       data-aspect-ratio="square"
       data-border-radius="full"
       data-object-fit="cover"
       onerror="this.src='https://example.com/default-avatar.svg'">
</div>
```

### Responsive Image with Placeholder
```html
<div class="image-container responsive">
  <div class="image-placeholder" 
       data-loading="true"
       style="background: linear-gradient(90deg, #f0f0f0 25%, transparent 50%, #f0f0f0 75%); background-size: 200% 100%; animation: loading 1.5s infinite;">
    <div class="placeholder-icon">📷</div>
  </div>
  
  <img class="image" 
       src="https://example.com/large-photo.jpg"
       alt="Product showcase image"
       data-aspect-ratio="landscape"
       data-object-fit="cover"
       sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
       srcset="
         https://example.com/small-photo.jpg 480w,
         https://example.com/medium-photo.jpg 800w,
         https://example.com/large-photo.jpg 1200w
       "
       loading="lazy"
       style="display: none;"
       onload="this.style.display='block'; this.previousElementSibling.style.display='none';">
</div>
```

### Gallery Images
```html
<div class="image-gallery">
  <div class="gallery-item">
    <div class="image-container" data-aspect-ratio="square">
      <img class="image" 
           src="https://example.com/gallery-1.jpg"
           alt="Gallery image 1"
           data-object-fit="cover"
           data-border-radius="md"
           data-zoom-on-hover="true"
           loading="lazy">
      <div class="image-overlay">
        <button class="overlay-button" aria-label="View full size">🔍</button>
      </div>
    </div>
    <div class="image-caption">
      Beautiful sunset over the mountains
    </div>
  </div>
  
  <div class="gallery-item">
    <div class="image-container" data-aspect-ratio="square">
      <img class="image" 
           src="https://example.com/gallery-2.jpg"
           alt="Gallery image 2"
           data-object-fit="cover"
           data-border-radius="md"
           data-zoom-on-hover="true"
           loading="lazy">
      <div class="image-overlay">
        <button class="overlay-button" aria-label="View full size">🔍</button>
      </div>
    </div>
    <div class="image-caption">
      City skyline at night
    </div>
  </div>
</div>
```

### Hero Banner Image
```html
<section class="hero-banner">
  <div class="hero-image-container">
    <img class="hero-image" 
         src="https://example.com/hero-banner.jpg"
         alt="Welcome to our platform"
         data-aspect-ratio="wide"
         data-object-fit="cover"
         data-priority="true"
         sizes="100vw"
         srcset="
           https://example.com/hero-mobile.jpg 768w,
           https://example.com/hero-tablet.jpg 1024w,
           https://example.com/hero-desktop.jpg 1920w
         ">
    
    <div class="hero-overlay">
      <div class="hero-content">
        <h1>Welcome to Our Platform</h1>
        <p>Discover amazing features and capabilities</p>
        <button class="cta-button">Get Started</button>
      </div>
    </div>
  </div>
</section>
```

### Error and Loading States
```html
<div class="image-states">
  <!-- Loading state -->
  <div class="image-container loading">
    <div class="image-placeholder">
      <div class="loading-spinner"></div>
      <span class="loading-text">Loading image...</span>
    </div>
  </div>
  
  <!-- Error state -->
  <div class="image-container error">
    <div class="image-error">
      <div class="error-icon">⚠️</div>
      <span class="error-text">Failed to load image</span>
      <button class="retry-button">Retry</button>
    </div>
  </div>
  
  <!-- Grayscale filter -->
  <div class="image-container">
    <img class="image" 
         src="https://example.com/photo.jpg"
         alt="Grayscale image"
         data-grayscale="true"
         data-border-radius="md">
  </div>
</div>
```

### Product Images
```html
<div class="product-images">
  <!-- Main product image -->
  <div class="main-image-container">
    <img class="main-image" 
         src="https://example.com/product-main.jpg"
         alt="Product name - main view"
         data-aspect-ratio="square"
         data-object-fit="cover"
         data-zoom-on-hover="true"
         loading="eager">
  </div>
  
  <!-- Thumbnail images -->
  <div class="thumbnail-images">
    <div class="thumbnail active">
      <img class="thumbnail-image" 
           src="https://example.com/product-thumb-1.jpg"
           alt="Product view 1"
           data-size="sm"
           data-aspect-ratio="square"
           data-object-fit="cover"
           data-border-radius="sm">
    </div>
    
    <div class="thumbnail">
      <img class="thumbnail-image" 
           src="https://example.com/product-thumb-2.jpg"
           alt="Product view 2"
           data-size="sm"
           data-aspect-ratio="square"
           data-object-fit="cover"
           data-border-radius="sm">
    </div>
    
    <div class="thumbnail">
      <img class="thumbnail-image" 
           src="https://example.com/product-thumb-3.jpg"
           alt="Product view 3"
           data-size="sm"
           data-aspect-ratio="square"
           data-object-fit="cover"
           data-border-radius="sm">
    </div>
  </div>
</div>
```

## Accessibility Notes
- Always provide descriptive `alt` text that conveys the image content and purpose
- Use empty `alt=""` for purely decorative images
- Ensure images don't rely on color alone to convey information
- Provide alternative formats for complex images (like charts)
- Test images with screen readers and high contrast modes
- Consider providing long descriptions for complex images
- Ensure interactive images have proper focus indicators
- Use semantic markup for image captions and descriptions

## Performance Considerations
- Use lazy loading for images below the fold
- Implement responsive images with `srcset` and `sizes`
- Optimize image formats (WebP, AVIF) with fallbacks
- Use appropriate image compression and quality settings
- Implement progressive image loading for better perceived performance
- Consider using blur-up or skeleton placeholders
- Use `loading="eager"` sparingly for above-fold images
- Implement intersection observer for custom lazy loading
- Cache images appropriately with proper headers

## Related Components
- **Avatar**: Specialized component for user profile images
- **Gallery**: Collection of images with navigation
- **Card**: Often contains images as content
- **Hero**: Large banner images with overlays
- **Thumbnail**: Small preview images
- **Skeleton**: Loading placeholders for images