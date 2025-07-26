import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import './Spacing.stories.css';

const meta = {
  title: 'Foundations/Spacing',
  parameters: {
    docs: {
      description: {
        component: 'Comprehensive spacing system based on an 8px grid for consistent rhythm and visual hierarchy.',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

interface SpacingTokenProps {
  name: string;
  cssVar: string;
  description?: string;
}

const SpacingToken: React.FC<SpacingTokenProps> = ({ name, cssVar, description }) => {
  const [value, setValue] = React.useState('');

  React.useEffect(() => {
    const computedValue = getComputedStyle(document.documentElement).getPropertyValue(cssVar);
    setValue(computedValue.trim());
  }, [cssVar]);

  return (
    <div className="spacing-token">
      <div className="spacing-token-info">
        <div className="spacing-token-header">
          <h4 className="spacing-token-name">{name}</h4>
          <code className="spacing-token-var">{cssVar}</code>
          <span className="spacing-token-value">{value}</span>
        </div>
        {description && <p className="spacing-token-description">{description}</p>}
      </div>
      <div className="spacing-token-visual">
        <div className="spacing-box" style={{ width: `var(${cssVar})`, height: `var(${cssVar})` }} />
      </div>
    </div>
  );
};

export const SpacingScale: Story = {
  render: () => (
    <div className="story-container">
      <div className="spacing-intro">
        <h3>8px Grid System</h3>
        <p>
          Our spacing system is based on an 8px grid, providing consistent rhythm throughout the interface.
          Each spacing token is a multiple of the base unit, creating harmonious relationships between elements.
        </p>
      </div>

      <div className="spacing-tokens-grid">
        <SpacingToken name="0" cssVar="--spacing-0" description="No spacing" />
        <SpacingToken name="px" cssVar="--spacing-px" description="Minimal 1px spacing" />
        <SpacingToken name="2xs" cssVar="--spacing-2xs" description="2px - Hairline spacing" />
        <SpacingToken name="xs" cssVar="--spacing-xs" description="4px - Extra small" />
        <SpacingToken name="sm" cssVar="--spacing-sm" description="8px - Small (1x base)" />
        <SpacingToken name="md" cssVar="--spacing-md" description="16px - Medium (2x base)" />
        <SpacingToken name="lg" cssVar="--spacing-lg" description="24px - Large (3x base)" />
        <SpacingToken name="xl" cssVar="--spacing-xl" description="32px - Extra large (4x base)" />
        <SpacingToken name="2xl" cssVar="--spacing-2xl" description="48px - 2X large (6x base)" />
        <SpacingToken name="3xl" cssVar="--spacing-3xl" description="64px - 3X large (8x base)" />
        <SpacingToken name="4xl" cssVar="--spacing-4xl" description="96px - 4X large (12x base)" />
        <SpacingToken name="5xl" cssVar="--spacing-5xl" description="128px - 5X large (16x base)" />
      </div>
    </div>
  ),
};

interface SpacingExampleProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

const SpacingExample: React.FC<SpacingExampleProps> = ({ title, description, children }) => (
  <div className="spacing-example">
    <div className="spacing-example-info">
      <h4>{title}</h4>
      <p>{description}</p>
    </div>
    <div className="spacing-example-demo">{children}</div>
  </div>
);

export const CommonPatterns: Story = {
  render: () => (
    <div className="story-container">
      <h3>Common Spacing Patterns</h3>
      
      <SpacingExample
        title="Component Padding"
        description="Standard padding patterns for buttons, inputs, and cards"
      >
        <div className="pattern-grid">
          <div className="pattern-item">
            <div className="component-example button-example">Button</div>
            <code>padding: var(--spacing-button-y) var(--spacing-button-x)</code>
          </div>
          <div className="pattern-item">
            <div className="component-example input-example">Input Field</div>
            <code>padding: var(--spacing-input-y) var(--spacing-input-x)</code>
          </div>
          <div className="pattern-item">
            <div className="component-example card-example">
              <h5>Card Title</h5>
              <p>Card content with consistent padding</p>
            </div>
            <code>padding: var(--spacing-card)</code>
          </div>
        </div>
      </SpacingExample>

      <SpacingExample
        title="Layout Gaps"
        description="Consistent spacing between elements using gap utilities"
      >
        <div className="gap-examples">
          <div className="gap-demo">
            <h5>Extra Small Gap (4px)</h5>
            <div className="gap-container" style={{ gap: 'var(--gap-xs)' }}>
              <div className="gap-item">Item</div>
              <div className="gap-item">Item</div>
              <div className="gap-item">Item</div>
            </div>
            <code>gap: var(--gap-xs)</code>
          </div>
          
          <div className="gap-demo">
            <h5>Small Gap (8px)</h5>
            <div className="gap-container" style={{ gap: 'var(--gap-sm)' }}>
              <div className="gap-item">Item</div>
              <div className="gap-item">Item</div>
              <div className="gap-item">Item</div>
            </div>
            <code>gap: var(--gap-sm)</code>
          </div>
          
          <div className="gap-demo">
            <h5>Medium Gap (16px)</h5>
            <div className="gap-container" style={{ gap: 'var(--gap-md)' }}>
              <div className="gap-item">Item</div>
              <div className="gap-item">Item</div>
              <div className="gap-item">Item</div>
            </div>
            <code>gap: var(--gap-md)</code>
          </div>
          
          <div className="gap-demo">
            <h5>Large Gap (24px)</h5>
            <div className="gap-container" style={{ gap: 'var(--gap-lg)' }}>
              <div className="gap-item">Item</div>
              <div className="gap-item">Item</div>
              <div className="gap-item">Item</div>
            </div>
            <code>gap: var(--gap-lg)</code>
          </div>
        </div>
      </SpacingExample>

      <SpacingExample
        title="Stacking Rhythm"
        description="Vertical spacing between stacked elements"
      >
        <div className="stacking-example">
          <div className="stack-group">
            <h4>Heading Group</h4>
            <h2 style={{ marginBottom: 'var(--spacing-xs)' }}>Main Heading</h2>
            <p style={{ color: 'var(--color-body-text-soft20)' }}>Supporting text with minimal spacing</p>
          </div>
          
          <div className="stack-group">
            <h4>Form Fields</h4>
            <div className="form-stack">
              <input type="text" placeholder="First Name" className="form-input" />
              <input type="text" placeholder="Last Name" className="form-input" />
              <input type="email" placeholder="Email" className="form-input" />
            </div>
          </div>
          
          <div className="stack-group">
            <h4>Content Sections</h4>
            <section className="content-section">
              <h3>Section Title</h3>
              <p>Section content with appropriate spacing for readability.</p>
            </section>
            <section className="content-section">
              <h3>Another Section</h3>
              <p>Sections separated by larger spacing for clear hierarchy.</p>
            </section>
          </div>
        </div>
      </SpacingExample>
    </div>
  ),
};

export const ResponsiveSpacing: Story = {
  render: () => (
    <div className="story-container">
      <h3>Responsive Spacing</h3>
      <p>Spacing adapts to different screen sizes for optimal layouts.</p>
      
      <div className="responsive-spacing-demo">
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>Token</th>
                <th>Mobile (&lt;640px)</th>
                <th>Tablet (641-1024px)</th>
                <th>Desktop (&gt;1024px)</th>
                <th>Large (&gt;1920px)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>--container-padding</code></td>
                <td>16px (md)</td>
                <td>24px (lg)</td>
                <td>32px (xl)</td>
                <td>48px (2xl)</td>
              </tr>
              <tr>
                <td><code>--spacing-section</code></td>
                <td>48px (2xl)</td>
                <td>64px (3xl)</td>
                <td>64px (3xl)</td>
                <td>96px (4xl)</td>
              </tr>
              <tr>
                <td><code>--spacing-modal</code></td>
                <td>24px (lg)</td>
                <td>32px (xl)</td>
                <td>32px (xl)</td>
                <td>32px (xl)</td>
              </tr>
              <tr>
                <td><code>--spacing-card</code></td>
                <td>16px (md)</td>
                <td>24px (lg)</td>
                <td>24px (lg)</td>
                <td>24px (lg)</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="responsive-example-container">
          <div className="responsive-container">
            <h4>Container Padding</h4>
            <p>This container has responsive padding that adjusts based on screen size.</p>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const LayoutComposition: Story = {
  render: () => (
    <div className="story-container">
      <h3>Layout Composition</h3>
      <p>Combining spacing tokens to create consistent layouts.</p>
      
      <div className="layout-examples">
        <div className="layout-example">
          <h4>Card Layout</h4>
          <div className="example-card">
            <div className="card-header">
              <h5>Card Title</h5>
              <span className="card-badge">New</span>
            </div>
            <div className="card-content">
              <p>Card content with proper spacing between elements.</p>
              <div className="card-actions">
                <button className="btn-primary">Primary</button>
                <button className="btn-secondary">Secondary</button>
              </div>
            </div>
          </div>
          <div className="layout-annotations">
            <p><strong>Header:</strong> <code>padding: var(--spacing-md); gap: var(--spacing-sm)</code></p>
            <p><strong>Content:</strong> <code>padding: var(--spacing-lg); gap: var(--spacing-md)</code></p>
            <p><strong>Actions:</strong> <code>gap: var(--spacing-sm); margin-top: var(--spacing-md)</code></p>
          </div>
        </div>
        
        <div className="layout-example">
          <h4>Form Layout</h4>
          <form className="example-form">
            <div className="form-group">
              <label>Name</label>
              <input type="text" placeholder="Enter your name" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" placeholder="Enter your email" />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary">Submit</button>
              <button type="button" className="btn-secondary">Cancel</button>
            </div>
          </form>
          <div className="layout-annotations">
            <p><strong>Form:</strong> <code>gap: var(--spacing-lg)</code></p>
            <p><strong>Field Group:</strong> <code>gap: var(--spacing-xs)</code></p>
            <p><strong>Actions:</strong> <code>gap: var(--spacing-sm); margin-top: var(--spacing-xl)</code></p>
          </div>
        </div>
        
        <div className="layout-example">
          <h4>Grid Layout</h4>
          <div className="example-grid">
            <div className="grid-item">Item 1</div>
            <div className="grid-item">Item 2</div>
            <div className="grid-item">Item 3</div>
            <div className="grid-item">Item 4</div>
            <div className="grid-item">Item 5</div>
            <div className="grid-item">Item 6</div>
          </div>
          <div className="layout-annotations">
            <p><strong>Grid:</strong> <code>gap: var(--spacing-md)</code></p>
            <p><strong>Items:</strong> <code>padding: var(--spacing-lg)</code></p>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const UsageGuidelines: Story = {
  render: () => (
    <div className="story-container">
      <h3>Usage Guidelines</h3>
      
      <div className="guidelines-grid">
        <div className="guideline-card">
          <h4>When to Use Each Size</h4>
          <div className="guideline-list">
            <div className="guideline-item">
              <code>--spacing-2xs to --spacing-xs</code>
              <p>Tight relationships: icon spacing, inline elements, minimal separation</p>
            </div>
            <div className="guideline-item">
              <code>--spacing-sm to --spacing-md</code>
              <p>Related content: form fields, list items, component padding</p>
            </div>
            <div className="guideline-item">
              <code>--spacing-lg to --spacing-xl</code>
              <p>Content groups: sections, card padding, modal spacing</p>
            </div>
            <div className="guideline-item">
              <code>--spacing-2xl to --spacing-5xl</code>
              <p>Major sections: page padding, hero spacing, layout separation</p>
            </div>
          </div>
        </div>
        
        <div className="guideline-card">
          <h4>Best Practices</h4>
          <ul className="best-practices">
            <li>Always use spacing tokens instead of arbitrary values</li>
            <li>Maintain consistent spacing relationships (e.g., always use md for button padding)</li>
            <li>Use larger spacing to create visual hierarchy</li>
            <li>Consider responsive spacing for mobile optimization</li>
            <li>Combine spacing with other design tokens (borders, shadows) for depth</li>
            <li>Test spacing with different content lengths</li>
          </ul>
        </div>
        
        <div className="guideline-card">
          <h4>Common Mistakes to Avoid</h4>
          <ul className="mistakes-list">
            <li className="mistake-item">
              <span className="mistake-badge">❌</span>
              Using pixel values: <code>margin: 12px</code>
            </li>
            <li className="correct-item">
              <span className="correct-badge">✓</span>
              Use tokens: <code>margin: var(--spacing-md)</code>
            </li>
            <li className="mistake-item">
              <span className="mistake-badge">❌</span>
              Mixing spacing systems: <code>padding: 1rem 16px</code>
            </li>
            <li className="correct-item">
              <span className="correct-badge">✓</span>
              Consistent tokens: <code>padding: var(--spacing-md)</code>
            </li>
            <li className="mistake-item">
              <span className="mistake-badge">❌</span>
              Arbitrary calculations: <code>margin-top: 20px</code>
            </li>
            <li className="correct-item">
              <span className="correct-badge">✓</span>
              Grid-based spacing: <code>margin-top: var(--spacing-lg)</code>
            </li>
          </ul>
        </div>
      </div>
    </div>
  ),
};