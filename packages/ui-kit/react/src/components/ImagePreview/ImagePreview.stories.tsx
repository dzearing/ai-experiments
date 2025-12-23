import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ImagePreview } from './ImagePreview';

const meta = {
  title: 'Overlays/ImagePreview',
  component: ImagePreview,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A fullscreen image viewer with zoom and pan capabilities.

## Features

- **Fullscreen display** with dimmed backdrop
- **Ctrl+wheel zoom** centered on mouse position
- **Drag to pan** when zoomed in
- **Pinch-to-zoom** and touch pan for mobile
- **Context-aware Escape**: reset zoom if zoomed, close if not
- **Caption** with optional author and timestamp (only visible when not zoomed)

## Usage

\`\`\`tsx
import { ImagePreview } from '@ui-kit/react';

function Gallery() {
  const [preview, setPreview] = useState<{ open: boolean; src: string }>({
    open: false,
    src: '',
  });

  return (
    <>
      <img
        src="/photo.jpg"
        onClick={() => setPreview({ open: true, src: '/photo.jpg' })}
      />
      <ImagePreview
        open={preview.open}
        onClose={() => setPreview(p => ({ ...p, open: false }))}
        src={preview.src}
        name="Beach Photo"
        username="John Doe"
        timestamp={new Date()}
      />
    </>
  );
}
\`\`\`

## Keyboard Shortcuts

- **Escape**: Reset zoom (if zoomed) or close (if not zoomed)
- **Ctrl+Scroll**: Zoom in/out centered on mouse

## Touch Gestures

- **Pinch**: Zoom in/out
- **Drag**: Pan when zoomed in
        `,
      },
    },
  },
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Whether the preview is visible',
    },
    src: {
      control: 'text',
      description: 'Image source URL',
    },
    alt: {
      control: 'text',
      description: 'Alt text for accessibility',
    },
    name: {
      control: 'text',
      description: 'Image name shown in caption',
    },
    username: {
      control: 'text',
      description: 'Author name shown in caption',
    },
    minZoom: {
      control: { type: 'number', min: 0.1, max: 1, step: 0.1 },
      description: 'Minimum zoom level',
    },
    maxZoom: {
      control: { type: 'number', min: 1, max: 20, step: 1 },
      description: 'Maximum zoom level',
    },
    zoomStep: {
      control: { type: 'number', min: 0.05, max: 0.5, step: 0.05 },
      description: 'Zoom increment per wheel tick',
    },
  },
} satisfies Meta<typeof ImagePreview>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample images from picsum.photos
const sampleImages = {
  landscape: 'https://picsum.photos/1920/1080',
  portrait: 'https://picsum.photos/1080/1920',
  square: 'https://picsum.photos/1000/1000',
  large: 'https://picsum.photos/4000/3000',
  small: 'https://picsum.photos/400/300',
};

// Interactive wrapper component
const InteractivePreview = (props: Omit<typeof ImagePreview, 'open' | 'onClose'> & {
  src?: string;
  name?: string;
  username?: string;
  timestamp?: Date | number | string;
  alt?: string;
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: '12px 24px',
          background: 'var(--color-buttonPrimary-background, #0066cc)',
          color: 'var(--color-buttonPrimary-text, white)',
          border: 'none',
          borderRadius: 'var(--radius-button, 6px)',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        Open Image Preview
      </button>
      <ImagePreview
        {...props}
        open={open}
        onClose={() => setOpen(false)}
        src={props.src || sampleImages.landscape}
      />
    </div>
  );
};

// Default story
export const Default: Story = {
  render: () => <InteractivePreview />,
};

// With caption
export const WithCaption: Story = {
  render: () => (
    <InteractivePreview
      name="Mountain Landscape"
      username="John Doe"
      timestamp={Date.now() - 5 * 60 * 1000}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows caption with image name, author, and relative timestamp.',
      },
    },
  },
};

// Portrait image
export const PortraitImage: Story = {
  render: () => (
    <InteractivePreview
      src={sampleImages.portrait}
      name="Portrait Photo"
      alt="A portrait orientation photo"
    />
  ),
};

// Large image for zoom testing
export const LargeImage: Story = {
  render: () => (
    <InteractivePreview
      src={sampleImages.large}
      name="High Resolution Photo"
      username="Photographer"
      timestamp={Date.now() - 24 * 60 * 60 * 1000}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Large image (4000x3000) to test zoom and pan functionality. Use Ctrl+scroll to zoom in and drag to pan.',
      },
    },
  },
};

// Custom zoom settings
export const CustomZoomSettings: Story = {
  render: () => (
    <InteractivePreview
      src={sampleImages.landscape}
      name="Custom Zoom"
      minZoom={0.25}
      maxZoom={20}
      zoomStep={0.25}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates custom zoom settings: minZoom=0.25, maxZoom=20, zoomStep=0.25.',
      },
    },
  },
};

// Custom caption
export const CustomCaption: Story = {
  render: () => (
    <InteractivePreview
      src={sampleImages.landscape}
      name="Custom"
      renderCaption={() => (
        <div style={{
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          padding: '8px 16px',
          background: 'rgba(0, 0, 0, 0.6)',
          borderRadius: '8px',
        }}>
          <span style={{ color: 'white', fontWeight: 500 }}>Custom Caption</span>
          <button
            style={{
              padding: '4px 12px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              cursor: 'pointer',
            }}
            onClick={(e) => {
              e.stopPropagation();
              alert('Download clicked!');
            }}
          >
            Download
          </button>
        </div>
      )}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Use `renderCaption` prop to render custom content in the caption area.',
      },
    },
  },
};

// Gallery context example
const GalleryExample = () => {
  const [selectedImage, setSelectedImage] = useState<{
    src: string;
    name: string;
    username: string;
    timestamp: number;
  } | null>(null);

  const images = [
    { src: 'https://picsum.photos/seed/a/400/300', name: 'Sunset Beach', username: 'Alice', timestamp: Date.now() - 2 * 60 * 60 * 1000 },
    { src: 'https://picsum.photos/seed/b/400/300', name: 'Mountain Peak', username: 'Bob', timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000 },
    { src: 'https://picsum.photos/seed/c/400/300', name: 'City Lights', username: 'Carol', timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000 },
    { src: 'https://picsum.photos/seed/d/400/300', name: 'Forest Path', username: 'Dave', timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000 },
  ];

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '16px',
        maxWidth: '600px',
      }}>
        {images.map((img) => (
          <div
            key={img.src}
            onClick={() => setSelectedImage(img)}
            style={{
              cursor: 'pointer',
              borderRadius: '8px',
              overflow: 'hidden',
              transition: 'transform 0.2s',
            }}
          >
            <img
              src={img.src}
              alt={img.name}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
              }}
            />
            <div style={{
              padding: '8px 12px',
              background: 'var(--color-panel-background, #f5f5f5)',
              fontSize: '13px',
            }}>
              <div style={{ fontWeight: 500 }}>{img.name}</div>
              <div style={{ color: 'var(--color-body-textSoft10, #666)', fontSize: '12px' }}>
                by {img.username}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedImage && (
        <ImagePreview
          open={true}
          onClose={() => setSelectedImage(null)}
          src={selectedImage.src.replace('/400/300', '/1920/1080')}
          name={selectedImage.name}
          username={selectedImage.username}
          timestamp={selectedImage.timestamp}
        />
      )}
    </div>
  );
};

export const GalleryContext: Story = {
  render: () => <GalleryExample />,
  parameters: {
    docs: {
      description: {
        story: 'Example of ImagePreview used in an image gallery context. Click any image to preview.',
      },
    },
  },
};

// Controlled open state
export const ControlledOpenState: Story = {
  args: {
    open: true,
    src: sampleImages.landscape,
    name: 'Controlled Preview',
    username: 'User',
    timestamp: Date.now(),
    onClose: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Direct control over the open state via Storybook controls.',
      },
    },
  },
};

// Instructions story
export const ZoomInstructions: Story = {
  render: () => (
    <div style={{ padding: '20px', maxWidth: '500px' }}>
      <h3>How to Use ImagePreview</h3>
      <ol style={{ lineHeight: 1.8 }}>
        <li><strong>Open:</strong> Click the button below to open the preview</li>
        <li><strong>Zoom In:</strong> Hold Ctrl and scroll up (or pinch out on touch)</li>
        <li><strong>Zoom Out:</strong> Hold Ctrl and scroll down (or pinch in)</li>
        <li><strong>Pan:</strong> When zoomed in, drag the image to pan around</li>
        <li><strong>Reset:</strong> Press Escape to reset zoom</li>
        <li><strong>Close:</strong> Press Escape again (when not zoomed) or click X or backdrop</li>
      </ol>
      <div style={{ marginTop: '20px' }}>
        <InteractivePreview
          src={sampleImages.large}
          name="Try Me"
          username="Demo"
          timestamp={Date.now()}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Instructions for using the ImagePreview component.',
      },
    },
  },
};
