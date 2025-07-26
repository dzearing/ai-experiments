import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import './Borders.stories.css';

const meta = {
  title: 'Foundations/Borders',
  parameters: {
    docs: {
      description: {
        component: 'Comprehensive border system including widths, radius, and styles for consistent UI boundaries and shapes.',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

interface BorderTokenProps {
  name: string;
  cssVar: string;
  description?: string;
  type: 'width' | 'radius' | 'style';
}

const BorderToken: React.FC<BorderTokenProps> = ({ name, cssVar, description, type }) => {
  const [value, setValue] = React.useState('');

  React.useEffect(() => {
    const computedValue = getComputedStyle(document.documentElement).getPropertyValue(cssVar);
    setValue(computedValue.trim());
  }, [cssVar]);

  const renderVisual = () => {
    switch (type) {
      case 'width':
        return (
          <div className="border-width-visual">
            <div 
              className="border-line" 
              style={{ borderBottomWidth: `var(${cssVar})` }}
            />
          </div>
        );
      case 'radius':
        return (
          <div className="border-radius-visual">
            <div 
              className="radius-box" 
              style={{ borderRadius: `var(${cssVar})` }}
            />
          </div>
        );
      case 'style':
        return (
          <div className="border-style-visual">
            <div 
              className="style-line" 
              style={{ borderBottomStyle: `var(${cssVar})` }}
            />
          </div>
        );
    }
  };

  return (
    <div className="border-token">
      <div className="border-token-info">
        <h4 className="border-token-name">{name}</h4>
        <code className="border-token-var">{cssVar}</code>
        <span className="border-token-value">{value}</span>
        {description && <p className="border-token-description">{description}</p>}
      </div>
      <div className="border-token-visual">
        {renderVisual()}
      </div>
    </div>
  );
};

export const BorderWidths: Story = {
  render: () => (
    <div className="story-container">
      <div className="border-intro">
        <h3>Border Width System</h3>
        <p>
          Consistent border widths create visual hierarchy and define boundaries between elements.
          Our system provides both numeric and semantic tokens.
        </p>
      </div>

      <div className="border-tokens-grid">
        <BorderToken 
          name="0" 
          cssVar="--border-width-0" 
          description="No border"
          type="width"
        />
        <BorderToken 
          name="Thin" 
          cssVar="--border-width-thin" 
          description="Default borders (1px)"
          type="width"
        />
        <BorderToken 
          name="Medium" 
          cssVar="--border-width-medium" 
          description="Emphasis borders (2px)"
          type="width"
        />
        <BorderToken 
          name="Thick" 
          cssVar="--border-width-thick" 
          description="Strong borders (4px)"
          type="width"
        />
        <BorderToken 
          name="Heavy" 
          cssVar="--border-width-heavy" 
          description="Maximum emphasis (8px)"
          type="width"
        />
      </div>

      <div className="semantic-borders">
        <h4>Semantic Border Widths</h4>
        <div className="semantic-grid">
          <div className="semantic-item">
            <div className="semantic-example border-default">
              Default Border
            </div>
            <code>--border-width-default</code>
          </div>
          <div className="semantic-item">
            <div className="semantic-example border-focus">
              Focus Border
            </div>
            <code>--border-width-focus</code>
          </div>
          <div className="semantic-item">
            <div className="semantic-example border-divider">
              <span>Content Above</span>
              <hr />
              <span>Content Below</span>
            </div>
            <code>--border-width-divider</code>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const BorderRadius: Story = {
  render: () => (
    <div className="story-container">
      <h3>Border Radius Scale</h3>
      <p>
        Rounded corners soften interfaces and create visual hierarchy. Our radius scale provides 
        consistent corner rounding from sharp to fully rounded.
      </p>

      <div className="radius-scale">
        <BorderToken 
          name="None" 
          cssVar="--radius-none" 
          description="Sharp corners (0)"
          type="radius"
        />
        <BorderToken 
          name="SM" 
          cssVar="--radius-sm" 
          description="Subtle rounding (2px)"
          type="radius"
        />
        <BorderToken 
          name="MD" 
          cssVar="--radius-md" 
          description="Default rounding (4px)"
          type="radius"
        />
        <BorderToken 
          name="LG" 
          cssVar="--radius-lg" 
          description="Prominent rounding (8px)"
          type="radius"
        />
        <BorderToken 
          name="XL" 
          cssVar="--radius-xl" 
          description="Large rounding (12px)"
          type="radius"
        />
        <BorderToken 
          name="2XL" 
          cssVar="--radius-2xl" 
          description="Extra large (16px)"
          type="radius"
        />
        <BorderToken 
          name="3XL" 
          cssVar="--radius-3xl" 
          description="Maximum rounding (24px)"
          type="radius"
        />
        <BorderToken 
          name="Full" 
          cssVar="--radius-full" 
          description="Fully rounded (9999px)"
          type="radius"
        />
      </div>

      <div className="component-radius">
        <h4>Component-Specific Radius</h4>
        <div className="component-radius-grid">
          <div className="radius-example">
            <button className="example-button">Button</button>
            <code>--radius-button</code>
          </div>
          <div className="radius-example">
            <input className="example-input" placeholder="Input field" />
            <code>--radius-input</code>
          </div>
          <div className="radius-example">
            <div className="example-card">
              <h5>Card</h5>
              <p>Card content</p>
            </div>
            <code>--radius-card</code>
          </div>
          <div className="radius-example">
            <div className="example-modal">Modal Dialog</div>
            <code>--radius-modal</code>
          </div>
          <div className="radius-example">
            <div className="example-tooltip">Tooltip</div>
            <code>--radius-tooltip</code>
          </div>
          <div className="radius-example">
            <span className="example-badge">Badge</span>
            <code>--radius-badge</code>
          </div>
          <div className="radius-example">
            <span className="example-chip">Chip</span>
            <code>--radius-chip</code>
          </div>
          <div className="radius-example">
            <div className="example-avatar">AV</div>
            <code>--radius-avatar</code>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const BorderStyles: Story = {
  render: () => (
    <div className="story-container">
      <h3>Border Styles</h3>
      <p>Different border styles convey different meanings and create visual variety.</p>

      <div className="border-styles-grid">
        <div className="style-example">
          <h4>None</h4>
          <div className="style-box" style={{ borderStyle: 'var(--border-style-none)' }}>
            No visible border
          </div>
          <code>--border-style-none</code>
        </div>
        <div className="style-example">
          <h4>Solid</h4>
          <div className="style-box" style={{ borderStyle: 'var(--border-style-solid)' }}>
            Solid line border
          </div>
          <code>--border-style-solid</code>
        </div>
        <div className="style-example">
          <h4>Dashed</h4>
          <div className="style-box" style={{ borderStyle: 'var(--border-style-dashed)' }}>
            Dashed line border
          </div>
          <code>--border-style-dashed</code>
        </div>
        <div className="style-example">
          <h4>Dotted</h4>
          <div className="style-box" style={{ borderStyle: 'var(--border-style-dotted)' }}>
            Dotted line border
          </div>
          <code>--border-style-dotted</code>
        </div>
      </div>

      <div className="style-use-cases">
        <h4>Common Use Cases</h4>
        <div className="use-case-grid">
          <div className="use-case-item">
            <div className="divider-example horizontal">
              <span>Section 1</span>
              <hr />
              <span>Section 2</span>
            </div>
            <p>Horizontal dividers</p>
          </div>
          <div className="use-case-item">
            <div className="divider-example vertical">
              <span>Left</span>
              <div className="vertical-divider"></div>
              <span>Right</span>
            </div>
            <p>Vertical dividers</p>
          </div>
          <div className="use-case-item">
            <div className="placeholder-box">
              Drag files here
            </div>
            <p>Drop zones (dashed)</p>
          </div>
          <div className="use-case-item">
            <div className="focus-indicator">
              Keyboard focus
            </div>
            <p>Focus indicators (dotted)</p>
          </div>
        </div>
      </div>
    </div>
  ),
};

interface InteractiveBorderDemoProps {
  title: string;
  description: string;
}

const InteractiveBorderDemo: React.FC<InteractiveBorderDemoProps> = ({ title, description }) => {
  const [borderWidth, setBorderWidth] = React.useState('--border-width-thin');
  const [borderRadius, setBorderRadius] = React.useState('--radius-md');
  const [borderStyle, setBorderStyle] = React.useState('--border-style-solid');
  const [borderColor, setBorderColor] = React.useState('--color-border');

  return (
    <div className="interactive-border-demo">
      <h4>{title}</h4>
      <p>{description}</p>
      
      <div className="demo-controls">
        <div className="control-group">
          <label>Width:</label>
          <select value={borderWidth} onChange={(e) => setBorderWidth(e.target.value)}>
            <option value="--border-width-0">None</option>
            <option value="--border-width-thin">Thin</option>
            <option value="--border-width-medium">Medium</option>
            <option value="--border-width-thick">Thick</option>
            <option value="--border-width-heavy">Heavy</option>
          </select>
        </div>
        
        <div className="control-group">
          <label>Radius:</label>
          <select value={borderRadius} onChange={(e) => setBorderRadius(e.target.value)}>
            <option value="--radius-none">None</option>
            <option value="--radius-sm">SM</option>
            <option value="--radius-md">MD</option>
            <option value="--radius-lg">LG</option>
            <option value="--radius-xl">XL</option>
            <option value="--radius-2xl">2XL</option>
            <option value="--radius-full">Full</option>
          </select>
        </div>
        
        <div className="control-group">
          <label>Style:</label>
          <select value={borderStyle} onChange={(e) => setBorderStyle(e.target.value)}>
            <option value="--border-style-solid">Solid</option>
            <option value="--border-style-dashed">Dashed</option>
            <option value="--border-style-dotted">Dotted</option>
          </select>
        </div>
      </div>
      
      <div className="demo-preview">
        <div 
          className="preview-box"
          style={{
            borderWidth: `var(${borderWidth})`,
            borderRadius: `var(${borderRadius})`,
            borderStyle: `var(${borderStyle})`,
            borderColor: `var(${borderColor})`,
          }}
        >
          Interactive Border Demo
        </div>
      </div>
      
      <div className="demo-code">
        <code>
          {`border: var(${borderWidth}) var(${borderStyle}) var(${borderColor});
border-radius: var(${borderRadius});`}
        </code>
      </div>
    </div>
  );
};

export const InteractiveBorders: Story = {
  render: () => (
    <div className="story-container">
      <h3>Interactive Border Explorer</h3>
      <p>Experiment with different border combinations to see how they work together.</p>
      
      <InteractiveBorderDemo 
        title="Border Playground"
        description="Adjust the controls to see different border combinations"
      />
      
      <div className="common-patterns">
        <h4>Common Border Patterns</h4>
        <div className="pattern-grid">
          <div className="pattern-card">
            <div className="pattern-example input-pattern">
              <input type="text" placeholder="Default input" />
            </div>
            <h5>Input Field</h5>
            <code>border: var(--border-width-thin) solid var(--color-border)</code>
            <code>border-radius: var(--radius-input)</code>
          </div>
          
          <div className="pattern-card">
            <div className="pattern-example card-pattern">
              <div className="card-content">
                <h5>Card with border</h5>
                <p>Card content here</p>
              </div>
            </div>
            <h5>Bordered Card</h5>
            <code>border: var(--border-width-thin) solid var(--color-border)</code>
            <code>border-radius: var(--radius-card)</code>
          </div>
          
          <div className="pattern-card">
            <div className="pattern-example button-pattern">
              <button className="outline-button">Outline Button</button>
            </div>
            <h5>Outline Button</h5>
            <code>border: var(--border-width-medium) solid var(--color-primary)</code>
            <code>border-radius: var(--radius-button)</code>
          </div>
          
          <div className="pattern-card">
            <div className="pattern-example avatar-pattern">
              <div className="avatar-border">
                <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='40' fill='%23ddd'/><text x='50%' y='50%' text-anchor='middle' dy='.3em' fill='%23999' font-size='40'>U</text></svg>" alt="User" />
              </div>
            </div>
            <h5>Avatar Border</h5>
            <code>border: var(--border-width-thick) solid var(--color-surface)</code>
            <code>border-radius: var(--radius-avatar)</code>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const FocusRings: Story = {
  render: () => (
    <div className="story-container">
      <h3>Focus Rings & Outlines</h3>
      <p>
        Focus rings are critical for accessibility, providing clear visual indicators for keyboard navigation.
      </p>
      
      <div className="focus-ring-examples">
        <div className="focus-section">
          <h4>Focus Ring Properties</h4>
          <div className="focus-properties">
            <div className="property-item">
              <strong>Width:</strong>
              <code>--focus-ring-width: var(--border-width-medium)</code>
            </div>
            <div className="property-item">
              <strong>Color:</strong>
              <code>--focus-ring-color: var(--color-primary)</code>
            </div>
            <div className="property-item">
              <strong>Offset:</strong>
              <code>--focus-ring-offset: var(--outline-offset-2)</code>
            </div>
          </div>
        </div>
        
        <div className="focus-examples-grid">
          <div className="focus-example">
            <button className="focus-default">Default Focus</button>
            <p>Standard focus ring</p>
          </div>
          <div className="focus-example">
            <button className="focus-offset">With Offset</button>
            <p>Focus ring with gap</p>
          </div>
          <div className="focus-example">
            <input className="focus-input" type="text" placeholder="Input focus" />
            <p>Input field focus</p>
          </div>
          <div className="focus-example">
            <div className="focus-card" tabIndex={0}>
              Focusable Card
            </div>
            <p>Custom focusable element</p>
          </div>
        </div>
        
        <div className="outline-offsets">
          <h4>Outline Offset Scale</h4>
          <div className="offset-grid">
            <div className="offset-example">
              <div className="offset-box" style={{ outlineOffset: 'var(--outline-offset-0)' }}>
                0px offset
              </div>
              <code>--outline-offset-0</code>
            </div>
            <div className="offset-example">
              <div className="offset-box" style={{ outlineOffset: 'var(--outline-offset-1)' }}>
                1px offset
              </div>
              <code>--outline-offset-1</code>
            </div>
            <div className="offset-example">
              <div className="offset-box" style={{ outlineOffset: 'var(--outline-offset-2)' }}>
                2px offset
              </div>
              <code>--outline-offset-2</code>
            </div>
            <div className="offset-example">
              <div className="offset-box" style={{ outlineOffset: 'var(--outline-offset-4)' }}>
                4px offset
              </div>
              <code>--outline-offset-4</code>
            </div>
          </div>
        </div>
        
        <div className="accessibility-guidelines">
          <h4>Accessibility Guidelines</h4>
          <ul>
            <li>Never remove focus indicators without providing an alternative</li>
            <li>Ensure focus rings have sufficient contrast (3:1 minimum)</li>
            <li>Use <code>:focus-visible</code> for keyboard-only focus styles</li>
            <li>Test focus indicators with Windows High Contrast Mode</li>
            <li>Consider using both border and box-shadow for maximum visibility</li>
            <li>Maintain consistent focus styles across all interactive elements</li>
          </ul>
        </div>
      </div>
    </div>
  ),
};

export const RTLSupport: Story = {
  render: () => {
    const [isRTL, setIsRTL] = React.useState(false);
    
    return (
      <div className="story-container">
        <h3>RTL & Internationalization Support</h3>
        <p>
          Borders should adapt properly for right-to-left languages. Use logical properties 
          for directional borders.
        </p>
        
        <div className="rtl-controls">
          <label className="rtl-toggle">
            <input 
              type="checkbox" 
              checked={isRTL} 
              onChange={(e) => setIsRTL(e.target.checked)}
            />
            <span>Enable RTL Mode</span>
          </label>
        </div>
        
        <div className={`rtl-demo ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="rtl-examples">
            <div className="rtl-example">
              <div className="directional-border start-border">
                Border at start edge
              </div>
              <code>border-inline-start: var(--border-width-thick) solid</code>
            </div>
            
            <div className="rtl-example">
              <div className="directional-border end-border">
                Border at end edge
              </div>
              <code>border-inline-end: var(--border-width-thick) solid</code>
            </div>
            
            <div className="rtl-example">
              <div className="directional-radius start-radius">
                Rounded start corners
              </div>
              <code>border-start-start-radius: var(--radius-lg)</code>
              <code>border-end-start-radius: var(--radius-lg)</code>
            </div>
            
            <div className="rtl-example">
              <div className="directional-radius end-radius">
                Rounded end corners
              </div>
              <code>border-start-end-radius: var(--radius-lg)</code>
              <code>border-end-end-radius: var(--radius-lg)</code>
            </div>
          </div>
          
          <div className="logical-properties">
            <h4>Logical Properties Reference</h4>
            <table>
              <thead>
                <tr>
                  <th>Physical Property</th>
                  <th>Logical Property</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>border-left</code></td>
                  <td><code>border-inline-start</code></td>
                  <td>Start edge in writing direction</td>
                </tr>
                <tr>
                  <td><code>border-right</code></td>
                  <td><code>border-inline-end</code></td>
                  <td>End edge in writing direction</td>
                </tr>
                <tr>
                  <td><code>border-top</code></td>
                  <td><code>border-block-start</code></td>
                  <td>Top in horizontal writing</td>
                </tr>
                <tr>
                  <td><code>border-bottom</code></td>
                  <td><code>border-block-end</code></td>
                  <td>Bottom in horizontal writing</td>
                </tr>
                <tr>
                  <td><code>border-top-left-radius</code></td>
                  <td><code>border-start-start-radius</code></td>
                  <td>Start-start corner</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  },
};

export const UsageGuidelines: Story = {
  render: () => (
    <div className="story-container">
      <h3>Border Usage Guidelines</h3>
      
      <div className="guidelines-grid">
        <div className="guideline-card">
          <h4>When to Use Borders</h4>
          <ul>
            <li>Define boundaries between sections</li>
            <li>Create visual grouping of related content</li>
            <li>Indicate interactive states (focus, hover)</li>
            <li>Separate items in lists or tables</li>
            <li>Frame important content or images</li>
            <li>Show form field boundaries</li>
          </ul>
        </div>
        
        <div className="guideline-card">
          <h4>Border vs. Shadow</h4>
          <div className="comparison-examples">
            <div className="comparison-item">
              <div className="with-border">With Border</div>
              <p>Clear boundaries, takes space</p>
            </div>
            <div className="comparison-item">
              <div className="with-shadow">With Shadow</div>
              <p>Soft elevation, no space</p>
            </div>
            <div className="comparison-item">
              <div className="with-both">Both Border & Shadow</div>
              <p>Maximum definition</p>
            </div>
          </div>
        </div>
        
        <div className="guideline-card">
          <h4>Best Practices</h4>
          <ul className="best-practices">
            <li>Use consistent border widths for similar elements</li>
            <li>Match border radius to component hierarchy</li>
            <li>Ensure borders have sufficient contrast</li>
            <li>Use logical properties for international support</li>
            <li>Consider border impact on layout spacing</li>
            <li>Test borders with different color themes</li>
            <li>Avoid mixing border styles within a component</li>
          </ul>
        </div>
        
        <div className="guideline-card">
          <h4>Common Mistakes</h4>
          <div className="mistakes-grid">
            <div className="mistake-item">
              <div className="mistake-example bad">
                <div className="mixed-radius">Mixed Radius</div>
              </div>
              <span className="mistake-label">❌ Inconsistent radius</span>
            </div>
            <div className="mistake-item">
              <div className="mistake-example good">
                <div className="consistent-radius">Consistent</div>
              </div>
              <span className="correct-label">✓ Matching radius</span>
            </div>
            <div className="mistake-item">
              <div className="mistake-example bad">
                <div className="heavy-borders">Too Heavy</div>
              </div>
              <span className="mistake-label">❌ Overwhelming borders</span>
            </div>
            <div className="mistake-item">
              <div className="mistake-example good">
                <div className="balanced-borders">Balanced</div>
              </div>
              <span className="correct-label">✓ Appropriate weight</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};