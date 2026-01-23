import type { Meta, StoryObj } from '@storybook/react';
import { useState, useCallback } from 'react';
import { IconButton, Tooltip } from '@ui-kit/react';
import styles from './ChatInputRedesign.module.css';

/**
 * # ChatInput Redesign
 *
 * Comparing the current ChatInput design with the new floating bar design.
 *
 * ## Issues with Current Design
 *
 * 1. **Double border on focus** - The outline + border creates visual noise
 * 2. **Sharp corners** - Feels dated compared to modern chat UIs
 * 3. **Weak visual hierarchy** - Doesn't feel like a primary interaction point
 *
 * ## New Design Goals
 *
 * - Remove the double border effect
 * - More rounded corners for modern feel
 * - Elevated appearance with subtle shadow
 * - Multi-colored gradient border on focus
 * - Smooth elevation animation on focus
 */

interface MockChatInputProps {
  variant: 'current' | 'floating-bar';
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

      case 'floating-bar':
        return {
          ...baseStyles,
          background: 'var(--soft-bg)',
          border: '1px solid var(--soft-border)',
          borderRadius: 'var(--radius-xl)',
        };

      default:
        return baseStyles;
    }
  };

  const getTextareaStyles = (): React.CSSProperties => {
    const padding = variant === 'floating-bar' ? 'var(--space-3)' : 'var(--space-2)';
    const paddingRight = variant === 'floating-bar' ? '48px' : '40px';

    return {
      flex: 1,
      background: 'transparent',
      border: 'none',
      outline: 'none',
      resize: 'none',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-base)',
      lineHeight: 'var(--leading-normal)',
      color: 'var(--softer-fg)',
      minHeight: isMultiline ? 80 : 24,
      maxHeight: 200,
      padding,
      paddingRight,
      boxSizing: 'border-box',
      width: '100%',
    };
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

function ComparisonPage() {
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
        ChatInput Redesign
      </h1>
      <p style={{
        margin: '0 0 var(--space-8) 0',
        fontSize: 'var(--text-base)',
        color: 'var(--base-fg-soft)',
        lineHeight: 'var(--leading-relaxed)',
      }}>
        Click into each input to see the focus state. Toggle between single-line and multiline modes using the button.
      </p>

      <VariantShowcase
        variant="current"
        title="Current Design"
        description="The existing ChatInput design with double border on focus (outline + border change). Sharp corners feel dated."
      />

      <VariantShowcase
        variant="floating-bar"
        title="New Design (Floating Bar)"
        description="Elevated card-like appearance with subtle shadow. Focus triggers a multi-colored gradient border with smooth elevation animation."
      />
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
## ChatInput Redesign

Comparing the current ChatInput design with the new floating bar design.

### Current Issues
- Double border on focus (outline + border)
- Sharp corners feel dated
- Weak visual hierarchy

### New Design Features
- Elevated card-like appearance
- Multi-colored gradient border on focus
- Smooth elevation animation
- More rounded corners
        `,
      },
    },
  },
};

export default meta;

type Story = StoryObj;

export const Comparison: Story = {
  name: 'Comparison',
  render: () => <ComparisonPage />,
  parameters: {
    docs: {
      description: {
        story: 'Side-by-side comparison of current and new ChatInput designs.',
      },
    },
  },
};

export const CurrentDesign: Story = {
  name: 'Current Design',
  render: () => (
    <SingleVariantPage
      variant="current"
      title="Current Design"
      description="The existing ChatInput design with double border on focus (outline + border change). Sharp corners feel dated."
    />
  ),
};

export const NewDesign: Story = {
  name: 'New Design (Floating Bar)',
  render: () => (
    <SingleVariantPage
      variant="floating-bar"
      title="New Design (Floating Bar)"
      description="Elevated card-like appearance with subtle shadow. Focus triggers a multi-colored gradient border with smooth elevation animation."
    />
  ),
};
