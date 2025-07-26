import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import './Typography.stories.css';

const meta = {
  title: 'Foundations/Typography',
  parameters: {
    docs: {
      description: {
        component: 'Typography system with modular scale, font families, and responsive sizing.',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

interface TypeSpecimenProps {
  name: string;
  cssVar: string;
  sample?: string;
  showMetrics?: boolean;
}

const TypeSpecimen: React.FC<TypeSpecimenProps> = ({
  name,
  cssVar,
  sample = 'The quick brown fox jumps over the lazy dog',
  showMetrics = true,
}) => {
  const [metrics, setMetrics] = React.useState({ size: '', lineHeight: '' });

  React.useEffect(() => {
    const element = document.createElement('div');
    element.style.fontSize = `var(${cssVar})`;
    element.style.lineHeight = 'var(--line-height-normal)';
    document.body.appendChild(element);
    const computedElement = getComputedStyle(element);
    setMetrics({
      size: computedElement.fontSize,
      lineHeight: computedElement.lineHeight,
    });
    document.body.removeChild(element);
  }, [cssVar]);

  return (
    <div className="type-specimen">
      <div className="type-specimen-info">
        <h4 className="type-specimen-name">{name}</h4>
        <code className="type-specimen-var">{cssVar}</code>
        {showMetrics && (
          <span className="type-specimen-metrics">
            {metrics.size} / {metrics.lineHeight}
          </span>
        )}
      </div>
      <p className="type-specimen-sample" style={{ fontSize: `var(${cssVar})` }}>
        {sample}
      </p>
    </div>
  );
};

export const TypeScale: Story = {
  render: () => (
    <div className="story-container">
      <h3>Display & Headings</h3>
      <TypeSpecimen name="Display" cssVar="--font-size-display" />
      <TypeSpecimen name="Heading 1" cssVar="--font-size-h1" />
      <TypeSpecimen name="Heading 2" cssVar="--font-size-h2" />
      <TypeSpecimen name="Heading 3" cssVar="--font-size-h3" />
      <TypeSpecimen name="Heading 4" cssVar="--font-size-h4" />
      <TypeSpecimen name="Heading 5" cssVar="--font-size-h5" />
      <TypeSpecimen name="Heading 6" cssVar="--font-size-h6" />

      <h3 style={{ marginTop: 'var(--spacing-xl)' }}>Body & UI Text</h3>
      <TypeSpecimen name="Body" cssVar="--font-size-body" />
      <TypeSpecimen name="Caption" cssVar="--font-size-caption" />
      <TypeSpecimen
        name="Code"
        cssVar="--font-size-code"
        sample="const example = 'Hello, World!';"
      />
    </div>
  ),
};

interface FontWeightSpecimenProps {
  weight: number;
  cssVar: string;
  usage: string;
}

const FontWeightSpecimen: React.FC<FontWeightSpecimenProps> = ({ weight, cssVar, usage }) => {
  return (
    <div className="weight-specimen">
      <div className="weight-specimen-info">
        <span className="weight-value">{weight}</span>
        <code className="weight-var">{cssVar}</code>
        <span className="weight-usage">{usage}</span>
      </div>
      <p className="weight-sample" style={{ fontWeight: `var(${cssVar})` }}>
        The quick brown fox jumps over the lazy dog
      </p>
    </div>
  );
};

export const FontWeights: Story = {
  render: () => (
    <div className="story-container">
      <FontWeightSpecimen
        weight={300}
        cssVar="--font-weight-light"
        usage="Large display text only"
      />
      <FontWeightSpecimen weight={400} cssVar="--font-weight-regular" usage="Body text and UI" />
      <FontWeightSpecimen
        weight={600}
        cssVar="--font-weight-semibold"
        usage="Emphasis and headings"
      />
      <FontWeightSpecimen weight={700} cssVar="--font-weight-bold" usage="Strong emphasis" />
    </div>
  ),
};

interface LineHeightExampleProps {
  name: string;
  cssVar: string;
  description: string;
}

const LineHeightExample: React.FC<LineHeightExampleProps> = ({ name, cssVar, description }) => {
  const longText = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.`;

  return (
    <div className="line-height-example">
      <div className="line-height-info">
        <h4>{name}</h4>
        <code>{cssVar}</code>
        <p className="line-height-description">{description}</p>
      </div>
      <p className="line-height-sample" style={{ lineHeight: `var(${cssVar})` }}>
        {longText}
      </p>
    </div>
  );
};

export const LineHeights: Story = {
  render: () => (
    <div className="story-container">
      <LineHeightExample
        name="Tight"
        cssVar="--line-height-tight"
        description="For display text and headings"
      />
      <LineHeightExample
        name="Normal"
        cssVar="--line-height-normal"
        description="Default for body text"
      />
      <LineHeightExample
        name="Relaxed"
        cssVar="--line-height-relaxed"
        description="For long-form reading"
      />
    </div>
  ),
};

export const FontFamilies: Story = {
  render: () => (
    <div className="story-container">
      <div className="font-family-specimen">
        <h4>Sans Serif (Default)</h4>
        <code>--font-family</code>
        <p style={{ fontFamily: 'var(--font-family)' }}>
          Segoe UI Web provides a clean, modern look perfect for interfaces and body text.
          ABCDEFGHIJKLMNOPQRSTUVWXYZ
          <br />
          abcdefghijklmnopqrstuvwxyz
          <br />
          0123456789 !@#$%^&*()
        </p>
      </div>

      <div className="font-family-specimen">
        <h4>Monospace</h4>
        <code>--font-family-mono</code>
        <p style={{ fontFamily: 'var(--font-family-mono)' }}>
          Cascadia Code is perfect for code and technical content.
          <br />
          <code>const greeting = 'Hello, World!';</code>
          <br />
          <code>function calculate(x, y) {'{ return x + y; }'}</code>
        </p>
      </div>

      <div className="font-family-specimen">
        <h4>Serif</h4>
        <code>--font-family-serif</code>
        <p style={{ fontFamily: 'var(--font-family-serif)' }}>
          Serif fonts can be used for editorial content or traditional designs.
          ABCDEFGHIJKLMNOPQRSTUVWXYZ
          <br />
          abcdefghijklmnopqrstuvwxyz
        </p>
      </div>
    </div>
  ),
};

export const ResponsiveTypography: Story = {
  render: () => (
    <div className="story-container">
      <div className="responsive-demo">
        <h3>Responsive Scaling</h3>
        <p>Typography scales automatically based on viewport size:</p>

        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>Breakpoint</th>
                <th>Scale Factor</th>
                <th>Display Size</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Mobile (&lt;640px)</td>
                <td>0.9</td>
                <td>~43px</td>
              </tr>
              <tr>
                <td>Tablet (641-1024px)</td>
                <td>0.95</td>
                <td>~45px</td>
              </tr>
              <tr>
                <td>Desktop (1025-1919px)</td>
                <td>1.0</td>
                <td>48px</td>
              </tr>
              <tr>
                <td>Large (&gt;1920px)</td>
                <td>1.1</td>
                <td>~53px</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="responsive-example">
          <h1 style={{ fontSize: 'var(--font-size-display)' }}>Responsive Display Text</h1>
          <p>Resize your browser to see the text scale smoothly.</p>
        </div>
      </div>
    </div>
  ),
};
