import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import './SpacingPlayground.stories.css';

const meta = {
  title: 'Foundations/Spacing/Playground',
  parameters: {
    docs: {
      description: {
        component: 'Interactive playground to experiment with spacing values and see their effects in real-time.',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const spacingTokens = [
  { name: '0', value: '--spacing-0' },
  { name: 'px', value: '--spacing-px' },
  { name: '2xs', value: '--spacing-2xs' },
  { name: 'xs', value: '--spacing-xs' },
  { name: 'sm', value: '--spacing-sm' },
  { name: 'md', value: '--spacing-md' },
  { name: 'lg', value: '--spacing-lg' },
  { name: 'xl', value: '--spacing-xl' },
  { name: '2xl', value: '--spacing-2xl' },
  { name: '3xl', value: '--spacing-3xl' },
  { name: '4xl', value: '--spacing-4xl' },
  { name: '5xl', value: '--spacing-5xl' },
];

export const InteractiveSpacing: Story = {
  render: () => {
    const [selectedPadding, setSelectedPadding] = React.useState('--spacing-md');
    const [selectedMargin, setSelectedMargin] = React.useState('--spacing-lg');
    const [selectedGap, setSelectedGap] = React.useState('--spacing-md');

    return (
      <div className="playground-container">
        <div className="playground-controls">
          <div className="control-group">
            <h4>Padding</h4>
            <div className="token-buttons">
              {spacingTokens.map((token) => (
                <button
                  key={token.value}
                  className={`token-button ${selectedPadding === token.value ? 'active' : ''}`}
                  onClick={() => setSelectedPadding(token.value)}
                >
                  {token.name}
                </button>
              ))}
            </div>
            <code className="selected-value">var({selectedPadding})</code>
          </div>

          <div className="control-group">
            <h4>Margin</h4>
            <div className="token-buttons">
              {spacingTokens.map((token) => (
                <button
                  key={token.value}
                  className={`token-button ${selectedMargin === token.value ? 'active' : ''}`}
                  onClick={() => setSelectedMargin(token.value)}
                >
                  {token.name}
                </button>
              ))}
            </div>
            <code className="selected-value">var({selectedMargin})</code>
          </div>

          <div className="control-group">
            <h4>Gap</h4>
            <div className="token-buttons">
              {spacingTokens.map((token) => (
                <button
                  key={token.value}
                  className={`token-button ${selectedGap === token.value ? 'active' : ''}`}
                  onClick={() => setSelectedGap(token.value)}
                >
                  {token.name}
                </button>
              ))}
            </div>
            <code className="selected-value">var({selectedGap})</code>
          </div>
        </div>

        <div className="playground-preview">
          <h4>Preview</h4>
          <div className="preview-container">
            <div className="preview-wrapper" style={{ padding: `var(${selectedMargin})` }}>
              <div 
                className="preview-box"
                style={{ 
                  padding: `var(${selectedPadding})`,
                  gap: `var(${selectedGap})`
                }}
              >
                <div className="preview-item">Item 1</div>
                <div className="preview-item">Item 2</div>
                <div className="preview-item">Item 3</div>
              </div>
              <div className="preview-annotations">
                <div className="annotation margin-annotation">Margin</div>
                <div className="annotation padding-annotation">Padding</div>
                <div className="annotation gap-annotation">Gap</div>
              </div>
            </div>
          </div>

          <div className="code-output">
            <h5>Generated CSS</h5>
            <pre>
              <code>{`.container {
  margin: var(${selectedMargin});
  padding: var(${selectedPadding});
  gap: var(${selectedGap});
}`}</code>
            </pre>
          </div>
        </div>
      </div>
    );
  },
};

export const SpacingComparison: Story = {
  render: () => {
    const [baseSize, setBaseSize] = React.useState(8);

    return (
      <div className="comparison-container">
        <div className="comparison-controls">
          <label>
            Base Unit: 
            <input 
              type="range" 
              min="4" 
              max="16" 
              value={baseSize} 
              onChange={(e) => setBaseSize(Number(e.target.value))}
            />
            <span>{baseSize}px</span>
          </label>
        </div>

        <div className="comparison-grid">
          <div className="comparison-column">
            <h4>Standard (8px base)</h4>
            <div className="size-list">
              {spacingTokens.slice(2).map((token) => (
                <div key={token.value} className="size-item">
                  <span className="size-label">{token.name}</span>
                  <div 
                    className="size-bar"
                    style={{ width: `var(${token.value})` }}
                  />
                  <span className="size-value">
                    {getComputedStyle(document.documentElement).getPropertyValue(token.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="comparison-column">
            <h4>Custom ({baseSize}px base)</h4>
            <div className="size-list">
              {[0.25, 0.5, 1, 2, 3, 4, 6, 8, 12, 16].map((multiplier, index) => (
                <div key={multiplier} className="size-item">
                  <span className="size-label">{spacingTokens[index + 2]?.name || `${multiplier}x`}</span>
                  <div 
                    className="size-bar custom"
                    style={{ width: `${baseSize * multiplier}px` }}
                  />
                  <span className="size-value">{baseSize * multiplier}px</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  },
};

export const ResponsiveSpacingDemo: Story = {
  render: () => {
    const [viewportWidth, setViewportWidth] = React.useState(1024);

    const getBreakpointName = (width: number) => {
      if (width < 640) return 'Mobile';
      if (width < 1024) return 'Tablet';
      if (width < 1920) return 'Desktop';
      return 'Large';
    };

    return (
      <div className="responsive-demo-container">
        <div className="viewport-controls">
          <label>
            Viewport Width: 
            <input 
              type="range" 
              min="320" 
              max="2560" 
              value={viewportWidth} 
              onChange={(e) => setViewportWidth(Number(e.target.value))}
            />
            <span>{viewportWidth}px ({getBreakpointName(viewportWidth)})</span>
          </label>
        </div>

        <div 
          className="viewport-frame"
          style={{ width: `${Math.min(viewportWidth, 1200)}px` }}
        >
          <div className={`responsive-content ${getBreakpointName(viewportWidth).toLowerCase()}`}>
            <header className="demo-header">
              <h1>Responsive Layout</h1>
              <p>Container padding adjusts based on viewport</p>
            </header>

            <main className="demo-main">
              <section className="demo-section">
                <h2>Section Title</h2>
                <p>Section spacing changes at different breakpoints to maintain optimal readability and visual hierarchy.</p>
              </section>

              <div className="demo-cards">
                <div className="demo-card">
                  <h3>Card 1</h3>
                  <p>Card padding adapts to screen size</p>
                </div>
                <div className="demo-card">
                  <h3>Card 2</h3>
                  <p>Ensuring comfortable touch targets</p>
                </div>
                <div className="demo-card">
                  <h3>Card 3</h3>
                  <p>Maintaining visual consistency</p>
                </div>
              </div>
            </main>
          </div>
        </div>

        <div className="responsive-values">
          <h4>Current Values</h4>
          <table>
            <tbody>
              <tr>
                <td>Container Padding:</td>
                <td><code>var(--container-padding-{getBreakpointName(viewportWidth).toLowerCase()})</code></td>
              </tr>
              <tr>
                <td>Section Spacing:</td>
                <td><code>var(--spacing-section)</code></td>
              </tr>
              <tr>
                <td>Card Padding:</td>
                <td><code>var(--spacing-card)</code></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  },
};

export const SpacingInContext: Story = {
  render: () => {
    return (
      <div className="context-examples">
        <div className="context-example">
          <h3>Navigation Bar</h3>
          <nav className="example-nav">
            <div className="nav-brand">Brand</div>
            <div className="nav-menu">
              <a href="#" className="nav-link">Home</a>
              <a href="#" className="nav-link">Products</a>
              <a href="#" className="nav-link">About</a>
              <a href="#" className="nav-link">Contact</a>
            </div>
            <button className="nav-button">Sign Up</button>
          </nav>
          <div className="context-notes">
            <p><strong>Horizontal rhythm:</strong> Items use <code>gap: var(--spacing-lg)</code></p>
            <p><strong>Padding:</strong> <code>var(--spacing-md) var(--spacing-lg)</code></p>
          </div>
        </div>

        <div className="context-example">
          <h3>Feature Card</h3>
          <div className="example-feature-card">
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
              </svg>
            </div>
            <h4>Security First</h4>
            <p>Your data is protected with enterprise-grade encryption and security measures.</p>
            <a href="#" className="feature-link">Learn more →</a>
          </div>
          <div className="context-notes">
            <p><strong>Content flow:</strong> <code>gap: var(--spacing-md)</code></p>
            <p><strong>Card padding:</strong> <code>var(--spacing-xl)</code></p>
            <p><strong>Icon spacing:</strong> <code>margin-bottom: var(--spacing-lg)</code></p>
          </div>
        </div>

        <div className="context-example">
          <h3>Data Table</h3>
          <table className="example-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>John Doe</td>
                <td>Developer</td>
                <td><span className="status-badge active">Active</span></td>
                <td><button className="table-action">Edit</button></td>
              </tr>
              <tr>
                <td>Jane Smith</td>
                <td>Designer</td>
                <td><span className="status-badge active">Active</span></td>
                <td><button className="table-action">Edit</button></td>
              </tr>
              <tr>
                <td>Mike Johnson</td>
                <td>Manager</td>
                <td><span className="status-badge inactive">Inactive</span></td>
                <td><button className="table-action">Edit</button></td>
              </tr>
            </tbody>
          </table>
          <div className="context-notes">
            <p><strong>Cell padding:</strong> <code>var(--spacing-sm) var(--spacing-md)</code></p>
            <p><strong>Comfortable touch targets</strong> with adequate spacing</p>
          </div>
        </div>
      </div>
    );
  },
};