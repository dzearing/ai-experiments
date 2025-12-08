import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import './Shadows.stories.css';

const meta = {
  title: 'Foundations/Shadows',
  parameters: {
    docs: {
      description: {
        component: 'Elevation and depth system using consistent shadow tokens for visual hierarchy and interactive states.',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

interface ShadowTokenProps {
  name: string;
  cssVar: string;
  description?: string;
  isInner?: boolean;
}

const ShadowToken: React.FC<ShadowTokenProps> = ({ name, cssVar, description, isInner = false }) => {
  const [value, setValue] = React.useState('');

  React.useEffect(() => {
    const computedValue = getComputedStyle(document.documentElement).getPropertyValue(cssVar);
    setValue(computedValue.trim());
  }, [cssVar]);

  return (
    <div className="shadow-token">
      <div className="shadow-token-info">
        <h4 className="shadow-token-name">{name}</h4>
        <code className="shadow-token-var">{cssVar}</code>
        {description && <p className="shadow-token-description">{description}</p>}
      </div>
      <div className="shadow-token-visual">
        <div 
          className={`shadow-box ${isInner ? 'shadow-box-inner' : ''}`} 
          style={{ boxShadow: `var(${cssVar})` }}
        >
          {isInner && <span>Inner Shadow</span>}
        </div>
      </div>
    </div>
  );
};

export const ElevationScale: Story = {
  render: () => (
    <div className="story-container">
      <div className="shadow-intro">
        <h3>Shadow Elevation System</h3>
        <p>
          Our shadow system provides consistent elevation and depth cues. Shadows increase in size and blur 
          as elements rise higher off the page, creating a natural sense of layering.
        </p>
      </div>

      <div className="shadow-tokens-grid">
        <ShadowToken 
          name="None" 
          cssVar="--shadow-none" 
          description="No shadow - flat elements"
        />
        <ShadowToken 
          name="XS" 
          cssVar="--shadow-xs" 
          description="Minimal elevation - subtle depth"
        />
        <ShadowToken 
          name="SM" 
          cssVar="--shadow-sm" 
          description="Small elevation - cards at rest"
        />
        <ShadowToken 
          name="MD" 
          cssVar="--shadow-md" 
          description="Medium elevation - raised elements"
        />
        <ShadowToken 
          name="LG" 
          cssVar="--shadow-lg" 
          description="Large elevation - dropdowns, popovers"
        />
        <ShadowToken 
          name="XL" 
          cssVar="--shadow-xl" 
          description="Extra large - modals, dialogs"
        />
        <ShadowToken 
          name="2XL" 
          cssVar="--shadow-2xl" 
          description="Maximum elevation - floating elements"
        />
      </div>

      <div className="shadow-section">
        <h4>Inner Shadows</h4>
        <p>Inner shadows create depth within elements, useful for inputs and recessed areas.</p>
        <div className="shadow-tokens-grid inner-shadows">
          <ShadowToken 
            name="Inner SM" 
            cssVar="--shadow-inner-sm" 
            description="Subtle inner depth"
            isInner={true}
          />
          <ShadowToken 
            name="Inner MD" 
            cssVar="--shadow-inner-md" 
            description="Deeper inner shadow"
            isInner={true}
          />
        </div>
      </div>
    </div>
  ),
};

interface InteractiveCardProps {
  title: string;
  children: React.ReactNode;
}

const InteractiveCard: React.FC<InteractiveCardProps> = ({ title, children }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isActive, setIsActive] = React.useState(false);

  return (
    <div 
      className={`interactive-card ${isHovered ? 'hovered' : ''} ${isActive ? 'active' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsActive(true)}
      onMouseUp={() => setIsActive(false)}
    >
      <h4>{title}</h4>
      {children}
      <div className="card-state">
        State: {isActive ? 'Active' : isHovered ? 'Hovered' : 'Default'}
      </div>
    </div>
  );
};

export const InteractiveElevation: Story = {
  render: () => (
    <div className="story-container">
      <h3>Interactive Elevation Changes</h3>
      <p>
        Elements can change elevation in response to user interaction, providing visual feedback 
        and reinforcing interactivity.
      </p>

      <div className="interactive-demo">
        <InteractiveCard title="Hover to Elevate">
          <p>This card rises on hover using shadow transitions.</p>
          <code>Default: var(--shadow-card)</code>
          <code>Hover: var(--shadow-card-hover)</code>
        </InteractiveCard>

        <InteractiveCard title="Click for Depth">
          <p>Click and hold to see the active state with reduced elevation.</p>
          <code>Active: var(--shadow-sm)</code>
        </InteractiveCard>

        <div className="elevation-examples">
          <h4>Common Interactive Patterns</h4>
          
          <div className="example-grid">
            <div className="example-item">
              <button className="elevation-button">
                Elevated Button
              </button>
              <p>Buttons gain elevation on hover</p>
            </div>

            <div className="example-item">
              <div className="elevation-card">
                <h5>Card Component</h5>
                <p>Cards lift on interaction</p>
              </div>
            </div>

            <div className="example-item">
              <div className="elevation-fab">
                <span>+</span>
              </div>
              <p>FAB with high elevation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const ComponentShadows: Story = {
  render: () => (
    <div className="story-container">
      <h3>Component-Specific Shadows</h3>
      <p>
        Pre-defined shadow tokens for common UI components ensure consistency across the design system.
      </p>

      <div className="component-shadows-grid">
        <div className="component-shadow-example">
          <h4>Button Shadow</h4>
          <button className="shadow-example-button">
            Button Example
          </button>
          <code>--shadow-button</code>
          <code>--shadow-button-hover</code>
        </div>

        <div className="component-shadow-example">
          <h4>Card Shadow</h4>
          <div className="shadow-example-card">
            <h5>Card Title</h5>
            <p>Card content with standard elevation</p>
          </div>
          <code>--shadow-card</code>
          <code>--shadow-card-hover</code>
        </div>

        <div className="component-shadow-example">
          <h4>Dropdown Shadow</h4>
          <div className="shadow-example-dropdown">
            <div className="dropdown-item">Option 1</div>
            <div className="dropdown-item">Option 2</div>
            <div className="dropdown-item">Option 3</div>
          </div>
          <code>--shadow-dropdown</code>
        </div>

        <div className="component-shadow-example">
          <h4>Modal Shadow</h4>
          <div className="shadow-example-modal">
            <h5>Modal Dialog</h5>
            <p>High elevation for overlay content</p>
          </div>
          <code>--shadow-modal</code>
        </div>

        <div className="component-shadow-example">
          <h4>Popover Shadow</h4>
          <div className="shadow-example-popover">
            <p>Tooltip or popover content</p>
          </div>
          <code>--shadow-popover</code>
        </div>

        <div className="component-shadow-example">
          <h4>Tooltip Shadow</h4>
          <div className="shadow-example-tooltip">
            Helpful information
          </div>
          <code>--shadow-tooltip</code>
        </div>
      </div>
    </div>
  ),
};

export const FocusStates: Story = {
  render: () => (
    <div className="story-container">
      <h3>Focus State Shadows</h3>
      <p>
        Focus shadows provide clear visual indicators for keyboard navigation and accessibility.
      </p>

      <div className="focus-examples">
        <div className="focus-example">
          <h4>Default Focus Ring</h4>
          <div className="focus-demo">
            <button className="focus-button">Tab to focus me</button>
            <input type="text" className="focus-input" placeholder="Or focus this input" />
          </div>
          <code>--shadow-focus: 0 0 0 3px hsl(var(--color-primary) / 0.2)</code>
        </div>

        <div className="focus-example">
          <h4>Focus States Comparison</h4>
          <div className="focus-states-grid">
            <div className="focus-state-item">
              <button className="button-default">Default</button>
              <p>No focus shadow</p>
            </div>
            <div className="focus-state-item">
              <button className="button-focused">Focused</button>
              <p>With focus shadow</p>
            </div>
            <div className="focus-state-item">
              <button className="button-focused-visible">Focus Visible</button>
              <p>Keyboard focus only</p>
            </div>
          </div>
        </div>

        <div className="accessibility-notes">
          <h4>Accessibility Considerations</h4>
          <ul>
            <li>Focus shadows must have sufficient contrast against backgrounds</li>
            <li>Use <code>:focus-visible</code> to show focus only for keyboard navigation</li>
            <li>Ensure focus indicators are not removed or hidden</li>
            <li>Test focus states with keyboard navigation</li>
            <li>Consider using both outline and shadow for maximum visibility</li>
          </ul>
        </div>
      </div>
    </div>
  ),
};

export const TextShadows: Story = {
  render: () => (
    <div className="story-container">
      <h3>Text Shadows</h3>
      <p>Text shadows can improve legibility on complex backgrounds or create subtle depth effects.</p>

      <div className="text-shadow-examples">
        <div className="text-shadow-demo">
          <div className="text-shadow-item light-bg">
            <h2 style={{ textShadow: 'var(--text-shadow-sm)' }}>Small Text Shadow</h2>
            <code>--text-shadow-sm</code>
          </div>
          <div className="text-shadow-item light-bg">
            <h2 style={{ textShadow: 'var(--text-shadow-md)' }}>Medium Text Shadow</h2>
            <code>--text-shadow-md</code>
          </div>
          <div className="text-shadow-item light-bg">
            <h2 style={{ textShadow: 'var(--text-shadow-lg)' }}>Large Text Shadow</h2>
            <code>--text-shadow-lg</code>
          </div>
        </div>

        <div className="text-shadow-use-cases">
          <h4>Common Use Cases</h4>
          <div className="use-case-grid">
            <div className="use-case image-overlay">
              <h3>Text Over Images</h3>
              <p>Improves readability on varied backgrounds</p>
            </div>
            <div className="use-case hero-text">
              <h1>Hero Headlines</h1>
              <p>Creates depth and emphasis</p>
            </div>
            <div className="use-case subtle-depth">
              <h3>Subtle Depth</h3>
              <p>Adds dimension without being heavy</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const DarkModeAdaptation: Story = {
  render: () => {
    const [isDarkMode, setIsDarkMode] = React.useState(false);

    React.useEffect(() => {
      const container = document.querySelector('.dark-mode-demo');
      if (container) {
        if (isDarkMode) {
          container.setAttribute('data-mode', 'dark');
        } else {
          container.removeAttribute('data-mode');
        }
      }
    }, [isDarkMode]);

    return (
      <div className="story-container">
        <h3>Dark Mode Shadow Adaptation</h3>
        <p>
          Shadows automatically adjust in dark mode with reduced opacity and inverted colors for 
          appropriate contrast.
        </p>

        <div className="dark-mode-controls">
          <label className="theme-toggle">
            <input 
              type="checkbox" 
              checked={isDarkMode} 
              onChange={(e) => setIsDarkMode(e.target.checked)}
            />
            <span>Dark Mode</span>
          </label>
        </div>

        <div className={`dark-mode-demo ${isDarkMode ? 'dark' : 'light'}`} data-theme="default">
          <div className="shadow-comparison">
            <div className="comparison-card">
              <h4>Card Shadow</h4>
              <p>Notice how shadows adapt to the theme</p>
            </div>
            <div className="comparison-dropdown">
              <div className="dropdown-header">Dropdown Menu</div>
              <div className="dropdown-content">
                <div>Option 1</div>
                <div>Option 2</div>
                <div>Option 3</div>
              </div>
            </div>
            <div className="comparison-modal">
              <h4>Modal Shadow</h4>
              <p>Higher elevation elements maintain visibility</p>
            </div>
          </div>

          <div className="shadow-values">
            <h4>Shadow Values in {isDarkMode ? 'Dark' : 'Light'} Mode</h4>
            <div className="value-grid">
              <div>
                <strong>Shadow Color:</strong>
                <code>{isDarkMode ? '0deg 0% 100%' : '0deg 0% 0%'}</code>
              </div>
              <div>
                <strong>Light Opacity:</strong>
                <code>{isDarkMode ? '0.05' : '0.1'}</code>
              </div>
              <div>
                <strong>Medium Opacity:</strong>
                <code>{isDarkMode ? '0.1' : '0.15'}</code>
              </div>
              <div>
                <strong>Dark Opacity:</strong>
                <code>{isDarkMode ? '0.15' : '0.2'}</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
};

export const UsageGuidelines: Story = {
  render: () => (
    <div className="story-container">
      <h3>Shadow Usage Guidelines</h3>

      <div className="guidelines-grid">
        <div className="guideline-card">
          <h4>Elevation Hierarchy</h4>
          <div className="elevation-stack">
            <div className="elevation-level" style={{ zIndex: 1 }}>
              <span>Base Level</span>
              <code>--shadow-none to --shadow-xs</code>
            </div>
            <div className="elevation-level" style={{ zIndex: 2 }}>
              <span>Raised Level</span>
              <code>--shadow-sm to --shadow-md</code>
            </div>
            <div className="elevation-level" style={{ zIndex: 3 }}>
              <span>Floating Level</span>
              <code>--shadow-lg to --shadow-xl</code>
            </div>
            <div className="elevation-level" style={{ zIndex: 4 }}>
              <span>Overlay Level</span>
              <code>--shadow-2xl</code>
            </div>
          </div>
        </div>

        <div className="guideline-card">
          <h4>Best Practices</h4>
          <ul className="best-practices">
            <li>Use shadows consistently for similar components</li>
            <li>Increase shadow on hover to indicate interactivity</li>
            <li>Reduce shadow on active/pressed states</li>
            <li>Ensure shadows don't overlap important content</li>
            <li>Test shadows on different backgrounds</li>
            <li>Consider performance with many shadowed elements</li>
            <li>Use inner shadows sparingly for special effects</li>
          </ul>
        </div>

        <div className="guideline-card">
          <h4>Common Patterns</h4>
          <div className="pattern-examples">
            <div className="pattern-item">
              <div className="pattern-demo rest-state">Rest State</div>
              <code>--shadow-card</code>
            </div>
            <div className="pattern-item">
              <div className="pattern-demo hover-state">Hover State</div>
              <code>--shadow-card-hover</code>
            </div>
            <div className="pattern-item">
              <div className="pattern-demo active-state">Active State</div>
              <code>--shadow-sm</code>
            </div>
            <div className="pattern-item">
              <div className="pattern-demo disabled-state">Disabled State</div>
              <code>--shadow-none</code>
            </div>
          </div>
        </div>

        <div className="guideline-card">
          <h4>Accessibility Notes</h4>
          <ul className="accessibility-list">
            <li>Don't rely solely on shadows to convey information</li>
            <li>Ensure sufficient contrast between elements</li>
            <li>Focus shadows must meet WCAG contrast requirements</li>
            <li>Test with reduced motion preferences</li>
            <li>Provide alternative indicators for elevation changes</li>
          </ul>
        </div>
      </div>
    </div>
  ),
};