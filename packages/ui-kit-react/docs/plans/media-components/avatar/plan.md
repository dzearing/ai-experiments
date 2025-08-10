# Avatar

## Component Name and Description
Avatar is a display primitive that represents users, AI agents, or entities with profile images, initials, or icons, including status indicators and interactive states.

## Use Cases
- User profile representation
- Comment and chat systems
- Team member displays
- Contact and user lists
- Navigation and headers
- AI agent representation

## API/Props Interface

```typescript
interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Image source URL */
  src?: string;
  
  /** Alternative text for image */
  alt: string;
  
  /** Fallback image source */
  fallbackSrc?: string;
  
  /** Name for generating initials */
  name?: string;
  
  /** Custom initials override */
  initials?: string;
  
  /** Avatar size variants */
  size?: ResponsiveValue<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'> | number | string;
  
  /** Avatar shape */
  shape?: 'circle' | 'square' | 'rounded';
  
  /** Color scheme for fallback */
  colorScheme?: 
    | 'primary'
    | 'secondary'
    | 'accent'
    | 'neutral'
    | 'auto'; // Auto-generated from name
  
  /** Status indicator */
  status?: {
    variant: 'online' | 'offline' | 'away' | 'busy' | 'custom';
    color?: string;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    pulse?: boolean;
  };
  
  /** Badge overlay */
  badge?: {
    content: React.ReactNode;
    color?: string;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  };
  
  /** Loading state */
  loading?: boolean;
  
  /** Interactive/clickable avatar */
  interactive?: boolean;
  onClick?: (event: React.MouseEvent) => void;
  
  /** Icon fallback */
  icon?: React.ReactNode;
  
  /** Custom background color */
  backgroundColor?: string;
  
  /** Custom text color */
  textColor?: string;
  
  /** Border configuration */
  border?: {
    width?: string;
    color?: string;
  };
  
  /** Image loading strategy */
  loading?: 'lazy' | 'eager';
  
  /** Cross-origin for images */
  crossOrigin?: 'anonymous' | 'use-credentials';
  
  /** Event handlers */
  onImageLoad?: () => void;
  onImageError?: () => void;
  
  /** Group context for overlapping avatars */
  group?: {
    overlap?: boolean;
    max?: number;
    showMore?: boolean;
  };
}

// Predefined avatar sizes
type AvatarSizes = {
  xs: '24px';
  sm: '32px';
  md: '40px';
  lg: '48px';
  xl: '64px';
  '2xl': '80px';
  '3xl': '96px';
};
```

## Sub-components

### Avatar.Group
Container for displaying multiple overlapping avatars.

### Avatar.Status
Status indicator component with predefined states.

### Avatar.Badge
Badge overlay component for notifications or counts.

## Usage Examples

### Basic Avatars
```html
<div class="avatar-examples">
  <!-- Image avatar -->
  <div class="avatar" data-size="md" data-shape="circle">
    <img class="avatar-image" 
         src="https://example.com/user1.jpg"
         alt="John Doe"
         loading="lazy">
  </div>
  
  <!-- Initials fallback -->
  <div class="avatar initials" 
       data-size="md" 
       data-shape="circle"
       data-color-scheme="primary">
    <span class="avatar-initials">JD</span>
  </div>
  
  <!-- Icon fallback -->
  <div class="avatar icon" 
       data-size="md" 
       data-shape="circle"
       data-color-scheme="neutral">
    <svg class="avatar-icon" data-name="user" aria-hidden="true">
      <use href="#icon-user"></use>
    </svg>
  </div>
</div>
```

### Avatar with Status Indicators
```html
<div class="status-avatars">
  <!-- Online status -->
  <div class="avatar" data-size="lg" data-shape="circle">
    <img class="avatar-image" 
         src="https://example.com/user1.jpg"
         alt="John Doe">
    <div class="avatar-status online" 
         data-position="bottom-right"
         aria-label="Online">
    </div>
  </div>
  
  <!-- Away status with pulse -->
  <div class="avatar" data-size="lg" data-shape="circle">
    <img class="avatar-image" 
         src="https://example.com/user2.jpg"
         alt="Jane Smith">
    <div class="avatar-status away pulse" 
         data-position="bottom-right"
         aria-label="Away">
    </div>
  </div>
  
  <!-- Custom status -->
  <div class="avatar" data-size="lg" data-shape="circle">
    <img class="avatar-image" 
         src="https://example.com/user3.jpg"
         alt="Mike Johnson">
    <div class="avatar-status custom" 
         data-position="bottom-right"
         style="background-color: #ff6b35;"
         aria-label="In meeting">
    </div>
  </div>
</div>
```

### Avatar Group
```html
<div class="avatar-group" data-max="4" data-overlap="true">
  <div class="avatar" data-size="md" data-shape="circle">
    <img class="avatar-image" 
         src="https://example.com/user1.jpg"
         alt="John Doe">
  </div>
  
  <div class="avatar" data-size="md" data-shape="circle">
    <img class="avatar-image" 
         src="https://example.com/user2.jpg"
         alt="Jane Smith">
  </div>
  
  <div class="avatar" data-size="md" data-shape="circle">
    <img class="avatar-image" 
         src="https://example.com/user3.jpg"
         alt="Mike Johnson">
  </div>
  
  <div class="avatar" data-size="md" data-shape="circle">
    <img class="avatar-image" 
         src="https://example.com/user4.jpg"
         alt="Sarah Wilson">
  </div>
  
  <!-- More indicator -->
  <div class="avatar more" 
       data-size="md" 
       data-shape="circle"
       data-color-scheme="neutral">
    <span class="avatar-initials">+3</span>
  </div>
</div>
```

### Interactive Avatars
```html
<div class="interactive-avatars">
  <!-- Clickable user avatar -->
  <button class="avatar interactive" 
          data-size="lg" 
          data-shape="circle"
          onclick="showUserProfile('john-doe')"
          aria-label="View John Doe's profile">
    <img class="avatar-image" 
         src="https://example.com/user1.jpg"
         alt="John Doe">
    <div class="avatar-status online" 
         data-position="bottom-right"
         aria-hidden="true">
    </div>
  </button>
  
  <!-- Avatar with notification badge -->
  <button class="avatar interactive" 
          data-size="lg" 
          data-shape="circle"
          onclick="openMessages()"
          aria-label="Messages (3 unread)">
    <img class="avatar-image" 
         src="https://example.com/current-user.jpg"
         alt="Current user">
    <div class="avatar-badge" 
         data-position="top-right">
      <span class="badge notification">3</span>
    </div>
  </button>
</div>
```

### Avatar Sizes and Shapes
```html
<div class="avatar-variations">
  <!-- Different sizes -->
  <div class="avatar" data-size="xs" data-shape="circle">
    <span class="avatar-initials">XS</span>
  </div>
  
  <div class="avatar" data-size="sm" data-shape="circle">
    <span class="avatar-initials">SM</span>
  </div>
  
  <div class="avatar" data-size="md" data-shape="circle">
    <span class="avatar-initials">MD</span>
  </div>
  
  <div class="avatar" data-size="lg" data-shape="circle">
    <span class="avatar-initials">LG</span>
  </div>
  
  <div class="avatar" data-size="xl" data-shape="circle">
    <span class="avatar-initials">XL</span>
  </div>
</div>

<div class="avatar-shapes">
  <!-- Different shapes -->
  <div class="avatar" data-size="lg" data-shape="circle">
    <span class="avatar-initials">CI</span>
  </div>
  
  <div class="avatar" data-size="lg" data-shape="rounded">
    <span class="avatar-initials">RO</span>
  </div>
  
  <div class="avatar" data-size="lg" data-shape="square">
    <span class="avatar-initials">SQ</span>
  </div>
</div>
```

### Loading and Error States
```html
<div class="avatar-states">
  <!-- Loading state -->
  <div class="avatar loading" data-size="lg" data-shape="circle">
    <div class="avatar-skeleton">
      <div class="skeleton-shimmer"></div>
    </div>
  </div>
  
  <!-- Error state with retry -->
  <div class="avatar error" data-size="lg" data-shape="circle">
    <button class="avatar-retry" 
            onclick="retryImageLoad(this)"
            aria-label="Retry loading image">
      <svg class="retry-icon" data-name="refresh" aria-hidden="true">
        <use href="#icon-refresh"></use>
      </svg>
    </button>
  </div>
  
  <!-- Fallback with custom color -->
  <div class="avatar" 
       data-size="lg" 
       data-shape="circle"
       style="background-color: #6366f1; color: white;">
    <span class="avatar-initials">CF</span>
  </div>
</div>
```

### AI Agent Avatars
```html
<div class="ai-avatars">
  <!-- AI assistant avatar -->
  <div class="avatar ai" 
       data-size="md" 
       data-shape="circle"
       data-color-scheme="accent">
    <svg class="avatar-icon" data-name="robot" aria-hidden="true">
      <use href="#icon-robot"></use>
    </svg>
    <div class="avatar-status online pulse" 
         data-position="bottom-right"
         aria-label="AI assistant active">
    </div>
  </div>
  
  <!-- Claude avatar -->
  <div class="avatar claude" 
       data-size="md" 
       data-shape="circle"
       data-color-scheme="primary">
    <span class="avatar-initials">C</span>
  </div>
  
  <!-- Bot avatar with custom icon -->
  <div class="avatar bot" 
       data-size="md" 
       data-shape="square"
       data-color-scheme="secondary">
    <svg class="avatar-icon" data-name="cpu" aria-hidden="true">
      <use href="#icon-cpu"></use>
    </svg>
  </div>
</div>
```

## Accessibility Notes
- Always provide meaningful `alt` text for avatar images
- Use `aria-label` for interactive avatars to describe their purpose
- Ensure status indicators are announced to screen readers
- Use semantic buttons for clickable avatars
- Provide sufficient color contrast for initials and backgrounds
- Consider providing text alternatives for icon-only avatars
- Test avatar interactions with keyboard navigation
- Use `aria-describedby` to link avatars with additional context

## Performance Considerations
- Implement lazy loading for avatar images below the fold
- Use optimized image formats (WebP, AVIF) with fallbacks
- Cache avatar images with appropriate headers
- Use efficient color generation algorithms for auto-colored avatars
- Consider using CSS containment for avatar layouts
- Implement proper cleanup for event listeners
- Use efficient DOM updates for status changes
- Consider using intersection observer for visibility detection

## Related Components
- **Image**: Base component for avatar images
- **Badge**: For notification overlays
- **Status**: For user status indicators
- **Button**: For interactive avatar functionality
- **Tooltip**: For additional avatar information
- **UserCard**: For expanded user information