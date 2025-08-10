import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import './Gradients.stories.css';

const meta: Meta = {
  title: 'Foundations/Gradients',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

const GradientShowcase = () => {
  const gradients = [
    {
      name: 'Primary',
      token: '--gradient-body-primary',
      description: 'Brand identity gradient',
      usage: 'Headers, hero sections, brand emphasis',
    },
    {
      name: 'Success',
      token: '--gradient-body-success',
      description: 'Positive state gradient',
      usage: 'Success messages, confirmations, achievements',
    },
    {
      name: 'Warning',
      token: '--gradient-body-warning',
      description: 'Caution state gradient',
      usage: 'Warning alerts, important notices',
    },
    {
      name: 'Danger',
      token: '--gradient-body-danger',
      description: 'Error state gradient',
      usage: 'Error messages, destructive actions',
    },
    {
      name: 'Info',
      token: '--gradient-body-info',
      description: 'Informational gradient',
      usage: 'Info panels, tooltips, help content',
    },
    {
      name: 'Accent',
      token: '--gradient-body-accent',
      description: 'Decorative dual-color gradient',
      usage: 'Special features, premium content, decorative elements',
    },
  ];

  return (
    <div className="gradient-showcase">
      <header className="showcase-header">
        <h1>Gradient System</h1>
        <p className="showcase-description">
          Subtle gradient overlays that maintain accessibility with all body surface foreground tokens.
          These gradients use <code>color-mix()</code> for smooth transitions and fade to transparent
          to ensure text remains readable.
        </p>
      </header>

      <section className="gradient-grid">
        {gradients.map((gradient) => (
          <div key={gradient.token} className="gradient-card">
            <div 
              className="gradient-preview"
              style={{
                background: `var(${gradient.token}), var(--color-panel-background)`,
              }}
            >
              <h3 className="gradient-name">{gradient.name}</h3>
              <code className="gradient-token">{gradient.token}</code>
            </div>
            <div className="gradient-info">
              <p className="gradient-description">{gradient.description}</p>
              <p className="gradient-usage">
                <strong>Use for:</strong> {gradient.usage}
              </p>
            </div>
          </div>
        ))}
      </section>

      <section className="usage-examples">
        <h2>Usage Examples</h2>
        
        <div className="example-grid">
          <div className="example-card gradient-primary-example">
            <h3>Hero Section</h3>
            <p>Primary gradient creates brand emphasis without sacrificing readability.</p>
            <button className="example-button">Get Started</button>
          </div>

          <div className="example-card gradient-success-example">
            <div className="success-icon">✓</div>
            <h3>Success Message</h3>
            <p>Your changes have been saved successfully.</p>
          </div>

          <div className="example-card gradient-warning-example">
            <div className="warning-icon">⚠</div>
            <h3>Warning Notice</h3>
            <p>This action cannot be undone. Please proceed with caution.</p>
          </div>

          <div className="example-card gradient-danger-example">
            <div className="danger-icon">✕</div>
            <h3>Error Alert</h3>
            <p>Failed to process your request. Please try again.</p>
          </div>

          <div className="example-card gradient-info-example">
            <div className="info-icon">ℹ</div>
            <h3>Information</h3>
            <p>New features are available in this update.</p>
          </div>

          <div className="example-card gradient-accent-example">
            <h3>Premium Feature</h3>
            <p>Unlock advanced capabilities with our pro plan.</p>
            <button className="example-button-accent">Upgrade Now</button>
          </div>
        </div>
      </section>

      <section className="implementation-guide">
        <h2>Implementation</h2>
        <div className="code-examples">
          <div className="code-block">
            <h4>Basic Usage</h4>
            <pre>{`/* Apply gradient as background overlay */
.card {
  background: 
    var(--gradient-body-primary),
    var(--color-body-background);
}`}</pre>
          </div>

          <div className="code-block">
            <h4>With Hover Effect</h4>
            <pre>{`/* Transition between gradients */
.interactive-card {
  background: 
    var(--gradient-body-primary),
    var(--color-panel-background);
  transition: background 300ms ease;
}

.interactive-card:hover {
  background: 
    var(--gradient-body-accent),
    var(--color-panel-background);
}`}</pre>
          </div>

          <div className="code-block">
            <h4>Layered Gradients</h4>
            <pre>{`/* Multiple gradient layers */
.complex-background {
  background: 
    var(--gradient-body-primary),
    var(--gradient-body-accent),
    var(--color-body-background);
}`}</pre>
          </div>
        </div>
      </section>

      <section className="accessibility-notes">
        <h2>Accessibility Considerations</h2>
        <div className="note-cards">
          <div className="note-card">
            <h4>Contrast Maintained</h4>
            <p>All gradients use low opacity (15-25%) to ensure text contrast requirements are met.</p>
          </div>
          <div className="note-card">
            <h4>Transparent Fade</h4>
            <p>Gradients fade to transparent, preventing color buildup that could affect readability.</p>
          </div>
          <div className="note-card">
            <h4>Surface Compatibility</h4>
            <p>Designed specifically for body surface - all body foreground tokens remain accessible.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export const Default: Story = {
  render: () => <GradientShowcase />,
};

export const InteractiveDemo: Story = {
  render: () => (
    <div className="interactive-demo">
      <h2>Interactive Gradient Demo</h2>
      <p>Hover over the cards to see gradient transitions</p>
      
      <div className="interactive-grid">
        {['primary', 'success', 'warning', 'danger', 'info', 'accent'].map((type) => (
          <div key={type} className={`interactive-card gradient-${type}`}>
            <h3>{type.charAt(0).toUpperCase() + type.slice(1)}</h3>
            <p>Hover to see transition effect</p>
          </div>
        ))}
      </div>
    </div>
  ),
};