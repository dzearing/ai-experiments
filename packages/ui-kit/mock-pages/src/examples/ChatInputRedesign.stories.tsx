import type { Meta, StoryObj } from '@storybook/react';
import { useState, useCallback } from 'react';
import { IconButton, Tooltip } from '@ui-kit/react';
import styles from './ChatInputRedesign.module.css';

/**
 * # ChatInput Redesign Exploration
 *
 * Exploring improved designs for the ChatInput component.
 *
 * ## Issues with Current Design
 *
 * 1. **Double border on focus** - The outline + border creates visual noise
 * 2. **Sharp corners** - Feels dated compared to modern chat UIs
 * 3. **Weak visual hierarchy** - Doesn't feel like a primary interaction point
 * 4. **Generic appearance** - Looks like a standard form input, not a chat input
 *
 * ## Design Goals
 *
 * - Remove the double border effect
 * - Explore more rounded corner treatments
 * - Try different focus indicators (glow, background, border only)
 * - Consider elevation/shadow for depth
 * - Maintain support for single-line and multiline modes
 */

interface MockChatInputProps {
  variant: 'current' | 'rounded-pill' | 'subtle-glow' | 'elevated-card' | 'minimal-border' | 'background-focus' | 'floating-bar' | 'inset-well';
  multiline?: boolean;
  placeholder?: string;
}

function MockChatInput({ variant, multiline = false, placeholder = 'Type a message...' }: MockChatInputProps) {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isMultiline, setIsMultiline] = useState(multiline);

  const handleSubmit = useCallback(() => {
    if (value.trim()) {
      setValue('');
    }
  }, [value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey && !isMultiline) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit, isMultiline]
  );

  const getVariantStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      position: 'relative',
      display: 'flex',
      alignItems: 'stretch',
      transition: 'all var(--duration-normal) var(--ease-default)',
      boxSizing: 'border-box',
    };

    switch (variant) {
      case 'current':
        return {
          ...baseStyles,
          background: 'var(--softer-bg)',
          border: '1px solid var(--softer-border)',
          borderRadius: 'var(--radius-md)',
          ...(isFocused && {
            background: 'var(--softer-bg-pressed)',
            borderColor: 'var(--focus-ring)',
            outline: 'var(--focus-ring-width) solid var(--focus-ring)',
            outlineOffset: 'var(--focus-ring-offset)',
          }),
        };

      case 'rounded-pill':
        return {
          ...baseStyles,
          background: 'var(--softer-bg)',
          border: '1px solid var(--softer-border)',
          borderRadius: 'var(--radius-2xl)',
          ...(isFocused && {
            background: 'var(--softer-bg-pressed)',
            borderColor: 'var(--primary-border)',
          }),
        };

      case 'subtle-glow':
        return {
          ...baseStyles,
          background: 'var(--softer-bg)',
          border: '1px solid var(--softer-border)',
          borderRadius: 'var(--radius-lg)',
          ...(isFocused && {
            background: 'var(--softer-bg-hover)',
            borderColor: 'var(--primary-border)',
            boxShadow: '0 0 0 3px color-mix(in srgb, var(--primary-bg) 25%, transparent)',
          }),
        };

      case 'elevated-card':
        return {
          ...baseStyles,
          background: 'var(--soft-bg)',
          border: 'none',
          borderRadius: 'var(--radius-lg)',
          boxShadow: isFocused
            ? '0 4px 12px -2px rgba(0, 0, 0, 0.15), 0 0 0 2px var(--primary-border)'
            : '0 2px 8px -2px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.05)',
        };

      case 'minimal-border':
        return {
          ...baseStyles,
          background: 'transparent',
          border: '1px solid var(--base-border)',
          borderRadius: 'var(--radius-lg)',
          ...(isFocused && {
            background: 'var(--softer-bg)',
            borderColor: 'var(--primary-border)',
          }),
        };

      case 'background-focus':
        return {
          ...baseStyles,
          background: isFocused ? 'var(--primary-bg)' : 'var(--softer-bg)',
          border: 'none',
          borderRadius: 'var(--radius-lg)',
        };

      case 'floating-bar':
        return {
          ...baseStyles,
          background: 'var(--soft-bg)',
          border: '1px solid var(--soft-border)',
          borderRadius: 'var(--radius-xl)',
        };

      case 'inset-well':
        return {
          ...baseStyles,
          background: 'var(--softer-bg)',
          border: 'none',
          borderRadius: 'var(--radius-lg)',
          boxShadow: isFocused
            ? 'inset 0 2px 4px rgba(0, 0, 0, 0.06), 0 0 0 2px var(--primary-border)'
            : 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
        };

      default:
        return baseStyles;
    }
  };

  const getTextareaStyles = (): React.CSSProperties => {
    const padding = variant === 'floating-bar' ? 'var(--space-3)' : 'var(--space-2)';
    const paddingRight = variant === 'floating-bar' ? '48px' : '40px';

    const base: React.CSSProperties = {
      flex: 1,
      background: 'transparent',
      border: 'none',
      outline: 'none',
      resize: 'none',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-base)',
      lineHeight: 'var(--leading-normal)',
      minHeight: isMultiline ? 80 : 24,
      maxHeight: 200,
      padding,
      paddingRight,
      boxSizing: 'border-box',
      width: '100%',
    };

    switch (variant) {
      case 'background-focus':
        return {
          ...base,
          color: isFocused ? 'var(--primary-fg)' : 'var(--softer-fg)',
        };
      default:
        return {
          ...base,
          color: 'var(--softer-fg)',
        };
    }
  };

  const buttonPadding = 'var(--space-2)';
  const containerClass = variant === 'floating-bar' ? styles.floatingBar : undefined;

  return (
    <div style={getVariantStyles()} className={containerClass}>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={isMultiline ? 3 : 1}
        className={styles.textarea}
        style={getTextareaStyles()}
      />
      <div style={{
        position: 'absolute',
        right: buttonPadding,
        top: isMultiline ? 'var(--space-2)' : '50%',
        transform: isMultiline ? 'none' : 'translateY(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-1)',
      }}>
        <Tooltip
          content={isMultiline ? 'Multiline mode (Shift+Enter for newline)' : 'Single line (Enter to send)'}
          position="top"
        >
          <IconButton
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2 4h12v1H2V4zm0 3h8v1H2V7zm0 3h10v1H2v-1zm0 3h6v1H2v-1z" />
              </svg>
            }
            variant={isMultiline ? 'primary' : 'ghost'}
            onClick={() => setIsMultiline(!isMultiline)}
            aria-label={isMultiline ? 'Switch to single line mode' : 'Switch to multiline mode'}
          />
        </Tooltip>
      </div>
    </div>
  );
}

interface VariantShowcaseProps {
  variant: MockChatInputProps['variant'];
  title: string;
  description: string;
}

function VariantShowcase({ variant, title, description }: VariantShowcaseProps) {
  return (
    <div style={{ marginBottom: 'var(--space-8)' }}>
      <h3 style={{
        margin: '0 0 var(--space-2) 0',
        fontSize: 'var(--text-lg)',
        fontWeight: 'var(--weight-semibold)',
        color: 'var(--base-fg)',
      }}>
        {title}
      </h3>
      <p style={{
        margin: '0 0 var(--space-4) 0',
        fontSize: 'var(--text-sm)',
        color: 'var(--base-fg-soft)',
      }}>
        {description}
      </p>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
      }}>
        <div>
          <p style={{
            margin: '0 0 var(--space-2) 0',
            fontSize: 'var(--text-xs)',
            color: 'var(--base-fg-softer)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Single Line Mode
          </p>
          <MockChatInput variant={variant} />
        </div>

        <div>
          <p style={{
            margin: '0 0 var(--space-2) 0',
            fontSize: 'var(--text-xs)',
            color: 'var(--base-fg-softer)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Multiline Mode
          </p>
          <MockChatInput variant={variant} multiline />
        </div>
      </div>
    </div>
  );
}

function AllVariantsPage() {
  const variants: VariantShowcaseProps[] = [
    {
      variant: 'current',
      title: '1. Current Design (Baseline)',
      description: 'The current ChatInput design with double border on focus (outline + border change). Shows the issues we want to address.',
    },
    {
      variant: 'rounded-pill',
      title: '2. Rounded Pill',
      description: 'More rounded corners (2xl radius) creating a pill-like shape. Focus uses border color change only, no outline.',
    },
    {
      variant: 'subtle-glow',
      title: '3. Subtle Glow',
      description: 'Uses a soft, semi-transparent glow effect on focus instead of an outline. Creates a more modern, refined look.',
    },
    {
      variant: 'elevated-card',
      title: '4. Elevated Card',
      description: 'No border, uses shadow for depth. Focus increases shadow and adds a subtle ring. Feels more like a floating card.',
    },
    {
      variant: 'minimal-border',
      title: '5. Minimal Border',
      description: 'Very subtle border with transparent background. Focus fills the background and changes border color.',
    },
    {
      variant: 'background-focus',
      title: '6. Background Focus',
      description: 'No border at all. Focus changes the entire background to primary color. Bold and attention-grabbing.',
    },
    {
      variant: 'floating-bar',
      title: '7. Floating Bar',
      description: 'Card-like with shadow that gains a colored glow on focus. Border becomes focus-ring colored, shadow tinted to create a subtle glow emanating from the border.',
    },
    {
      variant: 'inset-well',
      title: '8. Inset Well',
      description: 'Uses inset shadow to create a recessed/well effect. Focus adds a ring around the outside.',
    },
  ];

  return (
    <div style={{
      padding: 'var(--space-8)',
      maxWidth: 800,
      margin: '0 auto',
    }}>
      <h1 style={{
        margin: '0 0 var(--space-2) 0',
        fontSize: 'var(--text-3xl)',
        fontWeight: 'var(--weight-bold)',
        color: 'var(--base-fg)',
      }}>
        ChatInput Redesign Exploration
      </h1>
      <p style={{
        margin: '0 0 var(--space-8) 0',
        fontSize: 'var(--text-base)',
        color: 'var(--base-fg-soft)',
        lineHeight: 'var(--leading-relaxed)',
      }}>
        Click into each input to see the focus state. Compare how different treatments
        feel and look. Toggle between single-line and multiline modes using the button.
      </p>

      {variants.map((v) => (
        <VariantShowcase key={v.variant} {...v} />
      ))}
    </div>
  );
}

function SingleVariantPage({ variant, title, description }: VariantShowcaseProps) {
  return (
    <div style={{
      padding: 'var(--space-8)',
      maxWidth: 800,
      margin: '0 auto',
    }}>
      <VariantShowcase variant={variant} title={title} description={description} />

      <div style={{
        marginTop: 'var(--space-8)',
        padding: 'var(--space-4)',
        background: 'var(--soft-bg)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--soft-border)',
      }}>
        <h4 style={{
          margin: '0 0 var(--space-3) 0',
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--weight-semibold)',
          color: 'var(--soft-fg)',
        }}>
          In Context: Chat Interface
        </h4>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-4)',
        }}>
          <div style={{
            padding: 'var(--space-3)',
            background: 'var(--softer-bg)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-sm)',
            color: 'var(--softer-fg)',
          }}>
            Hello! How can I help you today?
          </div>
          <div style={{
            padding: 'var(--space-3)',
            background: 'var(--primary-bg)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-sm)',
            color: 'var(--primary-fg)',
            alignSelf: 'flex-end',
            maxWidth: '80%',
          }}>
            Can you explain React hooks?
          </div>
          <div style={{
            padding: 'var(--space-3)',
            background: 'var(--softer-bg)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-sm)',
            color: 'var(--softer-fg)',
          }}>
            React Hooks are functions that let you use state and other React features in functional components...
          </div>
        </div>
        <MockChatInput variant={variant} placeholder="Reply to the conversation..." />
      </div>
    </div>
  );
}

const meta: Meta = {
  title: 'Design Explorations/ChatInput Redesign',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
## ChatInput Redesign Exploration

Exploring alternative designs for the ChatInput component to address:

1. **Double border issue** - Current design uses both border and outline on focus
2. **Visual polish** - Making the input feel more modern and refined
3. **Focus treatment** - Exploring glows, background changes, and subtle borders
4. **Corner rounding** - Testing pill shapes vs. moderate rounding
5. **Elevation** - Using shadows instead of borders for depth

### Variants Explored

1. **Current** - Baseline for comparison
2. **Rounded Pill** - More rounded corners
3. **Subtle Glow** - Soft glow on focus
4. **Elevated Card** - Shadow-based depth
5. **Minimal Border** - Very subtle border
6. **Background Focus** - Background color change
7. **Floating Bar** - Pronounced shadow floating effect
8. **Inset Well** - Recessed/well appearance
        `,
      },
    },
  },
};

export default meta;

type Story = StoryObj;

export const AllVariants: Story = {
  name: 'All Variants',
  render: () => <AllVariantsPage />,
  parameters: {
    docs: {
      description: {
        story: 'View all ChatInput design variants side by side for comparison.',
      },
    },
  },
};

export const Current: Story = {
  name: '1. Current (Baseline)',
  render: () => (
    <SingleVariantPage
      variant="current"
      title="Current Design (Baseline)"
      description="The current ChatInput design with double border on focus (outline + border change). Shows the issues we want to address."
    />
  ),
};

export const RoundedPill: Story = {
  name: '2. Rounded Pill',
  render: () => (
    <SingleVariantPage
      variant="rounded-pill"
      title="Rounded Pill"
      description="More rounded corners (2xl radius) creating a pill-like shape. Focus uses border color change only, no outline."
    />
  ),
};

export const SubtleGlow: Story = {
  name: '3. Subtle Glow',
  render: () => (
    <SingleVariantPage
      variant="subtle-glow"
      title="Subtle Glow"
      description="Uses a soft, semi-transparent glow effect on focus instead of an outline. Creates a more modern, refined look."
    />
  ),
};

export const ElevatedCard: Story = {
  name: '4. Elevated Card',
  render: () => (
    <SingleVariantPage
      variant="elevated-card"
      title="Elevated Card"
      description="No border, uses shadow for depth. Focus increases shadow and adds a subtle ring. Feels more like a floating card."
    />
  ),
};

export const MinimalBorder: Story = {
  name: '5. Minimal Border',
  render: () => (
    <SingleVariantPage
      variant="minimal-border"
      title="Minimal Border"
      description="Very subtle border with transparent background. Focus fills the background and changes border color."
    />
  ),
};

export const BackgroundFocus: Story = {
  name: '6. Background Focus',
  render: () => (
    <SingleVariantPage
      variant="background-focus"
      title="Background Focus"
      description="No border at all. Focus changes the entire background to primary color. Bold and attention-grabbing."
    />
  ),
};

export const FloatingBar: Story = {
  name: '7. Floating Bar',
  render: () => (
    <SingleVariantPage
      variant="floating-bar"
      title="Floating Bar"
      description="Card-like with shadow that gains a colored glow on focus. Border becomes focus-ring colored, shadow tinted to create a subtle glow emanating from the border."
    />
  ),
};

export const InsetWell: Story = {
  name: '8. Inset Well',
  render: () => (
    <SingleVariantPage
      variant="inset-well"
      title="Inset Well"
      description="Uses inset shadow to create a recessed/well effect. Focus adds a ring around the outside."
    />
  ),
};

/**
 * Context Meter Exploration
 * Exploring different placements for a context/token usage progress bar
 */

interface ContextMeterInputProps {
  placement: 'inside' | 'pill-attached' | 'outside';
  contextUsed: number;
  contextMax: number;
}

function ContextMeterInput({ placement, contextUsed, contextMax }: ContextMeterInputProps) {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isMultiline, setIsMultiline] = useState(false);

  const percentage = Math.min((contextUsed / contextMax) * 100, 100);
  const isWarning = percentage > 75;
  const isCritical = percentage > 90;

  const progressColor = isCritical
    ? 'var(--feedback-danger-bg)'
    : isWarning
      ? 'var(--feedback-warning-bg)'
      : 'var(--primary-bg)';

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'stretch',
    background: 'var(--soft-bg)',
    border: isFocused ? '2px solid var(--focus-ring)' : '2px solid var(--soft-border)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: '0 2px 8px -4px rgba(0, 0, 0, 0.08)',
    transform: isFocused ? 'translateY(-1px)' : 'translateY(0)',
    transition: 'all var(--duration-normal) var(--ease-default)',
  };

  const textareaStyle: React.CSSProperties = {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    resize: 'none',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-base)',
    lineHeight: 'var(--leading-normal)',
    color: 'var(--softer-fg)',
    padding: 'var(--space-3)',
    paddingRight: '48px',
    paddingBottom: placement === 'inside' ? 'var(--space-8)' : 'var(--space-3)',
    boxSizing: 'border-box',
    width: '100%',
    minHeight: isMultiline ? 80 : 24,
  };

  const renderContextMeter = () => {
    const meterLabel = `${Math.round(contextUsed / 1000)}k / ${Math.round(contextMax / 1000)}k`;

    // Common track styles - sunken appearance with border
    const trackStyle: React.CSSProperties = {
      background: 'var(--base-bg)',
      border: '1px solid var(--base-border)',
      borderRadius: 4,
      boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden',
    };

    // Common fill styles - raised/filled appearance
    const fillStyle: React.CSSProperties = {
      width: `${percentage}%`,
      height: '100%',
      background: progressColor,
      borderRadius: 3,
      transition: 'width 0.3s ease-out',
      boxShadow: '0 1px 0 rgba(255, 255, 255, 0.2) inset',
    };

    if (placement === 'inside') {
      return (
        <div style={{
          position: 'absolute',
          bottom: 'var(--space-2)',
          left: 'var(--space-3)',
          right: 'var(--space-3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 'var(--space-2)',
        }}>
          <div style={{
            ...trackStyle,
            width: 100,
            height: 8,
          }}>
            <div style={fillStyle} />
          </div>
          <span style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--base-fg-soft)',
            whiteSpace: 'nowrap',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {meterLabel}
          </span>
        </div>
      );
    }

    if (placement === 'pill-attached') {
      return (
        <div style={{
          position: 'absolute',
          bottom: -1,
          right: '56px',
          transform: 'translateY(50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          padding: 'var(--space-1-5) var(--space-3)',
          background: 'var(--soft-bg)',
          border: isFocused ? '2px solid var(--focus-ring)' : '2px solid var(--soft-border)',
          borderRadius: 'var(--radius-full)',
          fontSize: 'var(--text-xs)',
          color: 'var(--base-fg-soft)',
          boxShadow: '0 2px 8px -2px rgba(0, 0, 0, 0.1)',
          transition: 'border-color var(--duration-normal) var(--ease-default)',
          zIndex: 1,
        }}>
          <div style={{
            ...trackStyle,
            width: 60,
            height: 6,
          }}>
            <div style={fillStyle} />
          </div>
          <span style={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{meterLabel}</span>
        </div>
      );
    }

    if (placement === 'outside') {
      return (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          transform: 'translateY(calc(100% + var(--space-2)))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 'var(--space-2)',
        }}>
          <div style={{
            ...trackStyle,
            width: 100,
            height: 8,
          }}>
            <div style={fillStyle} />
          </div>
          <span style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--base-fg-soft)',
            whiteSpace: 'nowrap',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {meterLabel}
          </span>
        </div>
      );
    }

    return null;
  };

  return (
    <div style={{ position: 'relative', marginBottom: placement === 'outside' || placement === 'pill-attached' ? 'var(--space-6)' : 0 }}>
      <div style={containerStyle} className={isFocused ? styles.floatingBarFocused : undefined}>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Type a message..."
          rows={isMultiline ? 3 : 1}
          className={styles.textarea}
          style={textareaStyle}
        />
        <div style={{
          position: 'absolute',
          right: 'var(--space-2)',
          top: isMultiline ? 'var(--space-2)' : '50%',
          transform: isMultiline ? 'none' : 'translateY(-50%)',
        }}>
          <IconButton
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2 4h12v1H2V4zm0 3h8v1H2V7zm0 3h10v1H2v-1zm0 3h6v1H2v-1z" />
              </svg>
            }
            variant={isMultiline ? 'primary' : 'ghost'}
            onClick={() => setIsMultiline(!isMultiline)}
            aria-label={isMultiline ? 'Switch to single line mode' : 'Switch to multiline mode'}
          />
        </div>
        {(placement === 'inside') && renderContextMeter()}
      </div>
      {(placement === 'pill-attached' || placement === 'outside') && renderContextMeter()}
    </div>
  );
}

function ContextMeterExplorationPage() {
  return (
    <div style={{
      padding: 'var(--space-8)',
      maxWidth: 800,
      margin: '0 auto',
    }}>
      <h1 style={{
        margin: '0 0 var(--space-2) 0',
        fontSize: 'var(--text-2xl)',
        fontWeight: 'var(--weight-bold)',
        color: 'var(--base-fg)',
      }}>
        Context Meter Placement
      </h1>
      <p style={{
        margin: '0 0 var(--space-8) 0',
        fontSize: 'var(--text-base)',
        color: 'var(--base-fg-soft)',
        lineHeight: 'var(--leading-relaxed)',
      }}>
        Exploring where to place the context/token usage progress bar. Click each input to see how focus affects the meter.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        <div>
          <h3 style={{
            margin: '0 0 var(--space-2) 0',
            fontSize: 'var(--text-lg)',
            fontWeight: 'var(--weight-semibold)',
            color: 'var(--base-fg)',
          }}>
            1. Inside (Bottom Edge)
          </h3>
          <p style={{
            margin: '0 0 var(--space-4) 0',
            fontSize: 'var(--text-sm)',
            color: 'var(--base-fg-soft)',
          }}>
            Progress bar sits inside the input at the bottom. Contained within the border, affected by focus glow. Takes up vertical space in the input.
          </p>
          <ContextMeterInput placement="inside" contextUsed={45000} contextMax={256000} />
        </div>

        <div>
          <h3 style={{
            margin: '0 0 var(--space-2) 0',
            fontSize: 'var(--text-lg)',
            fontWeight: 'var(--weight-semibold)',
            color: 'var(--base-fg)',
          }}>
            2. Pill Attached to Border
          </h3>
          <p style={{
            margin: '0 0 var(--space-4) 0',
            fontSize: 'var(--text-sm)',
            color: 'var(--base-fg-soft)',
          }}>
            A pill shape that connects to the bottom of the border. Shares the border color with the input. Right-aligned but positioned before the multiline button.
          </p>
          <ContextMeterInput placement="pill-attached" contextUsed={45000} contextMax={256000} />
        </div>

        <div>
          <h3 style={{
            margin: '0 0 var(--space-2) 0',
            fontSize: 'var(--text-lg)',
            fontWeight: 'var(--weight-semibold)',
            color: 'var(--base-fg)',
          }}>
            3. Outside (Below Input)
          </h3>
          <p style={{
            margin: '0 0 var(--space-4) 0',
            fontSize: 'var(--text-sm)',
            color: 'var(--base-fg-soft)',
          }}>
            Progress bar sits completely outside, below the input. Not affected by the focus ring. Clean separation but adds vertical space.
          </p>
          <ContextMeterInput placement="outside" contextUsed={45000} contextMax={256000} />
        </div>
      </div>
    </div>
  );
}

export const ContextMeterExploration: Story = {
  name: '9. Context Meter Placement',
  render: () => <ContextMeterExplorationPage />,
  parameters: {
    docs: {
      description: {
        story: 'Exploring different placements for a context/token usage progress bar.',
      },
    },
  },
};
