import type { Meta, StoryObj } from '@storybook/react';
import './ButtonShapes.stories.css';

const meta: Meta = {
  title: 'Components/Button Shapes',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Button shape system for controlling the appearance of buttons through border radius. Includes square, rounded, round, and pill shapes.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const AllShapes: Story = {
  render: () => (
    <div className="button-shapes-showcase">
      <div className="showcase-section">
        <h3>Button Shape Variants</h3>
        <p>Different shapes for different use cases and visual styles</p>

        <div className="shape-comparison">
          <div className="shape-variant">
            <h4>Square</h4>
            <p>Sharp corners for a modern, technical look</p>
            <div className="button-examples">
              <button className="button button-shape-square">Square Button</button>
              <button className="button button-primary button-shape-square">Primary Square</button>
              <button className="button button-danger button-shape-square">Danger Square</button>
            </div>
          </div>

          <div className="shape-variant">
            <h4>Rounded (Default)</h4>
            <p>Slightly rounded corners for a balanced appearance</p>
            <div className="button-examples">
              <button className="button button-shape-rounded">Rounded Button</button>
              <button className="button button-primary button-shape-rounded">Primary Rounded</button>
              <button className="button button-success button-shape-rounded">Success Rounded</button>
            </div>
          </div>

          <div className="shape-variant">
            <h4>Round</h4>
            <p>Heavily rounded corners for a softer feel</p>
            <div className="button-examples">
              <button className="button button-shape-round">Round Button</button>
              <button className="button button-primary button-shape-round">Primary Round</button>
              <button className="button button-neutral button-shape-round">Neutral Round</button>
            </div>
          </div>

          <div className="shape-variant">
            <h4>Pill</h4>
            <p>Fully rounded ends for CTAs and prominent actions</p>
            <div className="button-examples">
              <button className="button button-shape-pill">Pill Button</button>
              <button className="button button-primary button-shape-pill">Get Started</button>
              <button className="button button-success button-shape-pill">Subscribe Now</button>
            </div>
          </div>
        </div>
      </div>

      <div className="showcase-section">
        <h3>Button Groups with Shapes</h3>
        <p>How shapes work in button groups</p>

        <div className="group-examples">
          <div className="group-example">
            <h4>Square Group</h4>
            <div className="button-group">
              <button className="button button-shape-square">Left</button>
              <button className="button button-shape-square">Center</button>
              <button className="button button-shape-square">Right</button>
            </div>
          </div>

          <div className="group-example">
            <h4>Rounded Group</h4>
            <div className="button-group">
              <button className="button button-shape-rounded">Left</button>
              <button className="button button-shape-rounded">Center</button>
              <button className="button button-shape-rounded">Right</button>
            </div>
          </div>

          <div className="group-example">
            <h4>Mixed Icon and Text</h4>
            <div className="button-group">
              <button className="icon-button square" aria-label="Grid view">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z" />
                </svg>
              </button>
              <button className="icon-button square" aria-label="List view">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 4h18v2H3zm0 7h18v2H3zm0 7h18v2H3z" />
                </svg>
              </button>
              <button className="button button-shape-square">View Options</button>
            </div>
          </div>
        </div>
      </div>

      <div className="showcase-section">
        <h3>Real-World Examples</h3>
        <div className="real-world-examples">
          <div className="example-card">
            <h4>Call-to-Action</h4>
            <button className="button button-primary button-shape-pill button-large">
              Start Free Trial
            </button>
          </div>

          <div className="example-card">
            <h4>Social Actions</h4>
            <div className="social-buttons">
              <button className="icon-button round icon-button-primary" aria-label="Share">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
                </svg>
              </button>
              <button className="icon-button round" aria-label="Favorite">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </button>
              <button className="icon-button round" aria-label="Comment">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
                </svg>
              </button>
            </div>
          </div>

          <div className="example-card">
            <h4>Toolbar Actions</h4>
            <div className="toolbar">
              <button className="icon-button square" aria-label="Bold">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z" />
                </svg>
              </button>
              <button className="icon-button square" aria-label="Italic">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z" />
                </svg>
              </button>
              <button className="icon-button square" aria-label="Underline">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const ShapeGuidelines: Story = {
  render: () => (
    <div className="shape-guidelines">
      <div className="guideline-section">
        <h3>When to Use Each Shape</h3>
        <div className="guideline-grid">
          <div className="guideline-card">
            <div className="shape-demo">
              <button className="button button-shape-square">Square</button>
            </div>
            <h4>Square Buttons</h4>
            <ul>
              <li>Technical or developer-focused interfaces</li>
              <li>Data tables and grids</li>
              <li>Toolbar actions</li>
              <li>When matching square design language</li>
            </ul>
          </div>

          <div className="guideline-card">
            <div className="shape-demo">
              <button className="button button-shape-rounded">Rounded</button>
            </div>
            <h4>Rounded Buttons</h4>
            <ul>
              <li>Default for most applications</li>
              <li>Balanced, professional appearance</li>
              <li>Form submissions</li>
              <li>General purpose actions</li>
            </ul>
          </div>

          <div className="guideline-card">
            <div className="shape-demo">
              <button className="button button-shape-round">Round</button>
            </div>
            <h4>Round Buttons</h4>
            <ul>
              <li>Softer, friendlier interfaces</li>
              <li>Consumer applications</li>
              <li>Mobile-first designs</li>
              <li>Playful brand personalities</li>
            </ul>
          </div>

          <div className="guideline-card">
            <div className="shape-demo">
              <button className="button button-primary button-shape-pill">Pill Button</button>
            </div>
            <h4>Pill Buttons</h4>
            <ul>
              <li>Primary call-to-action buttons</li>
              <li>Marketing pages and landing pages</li>
              <li>Subscription or purchase actions</li>
              <li>When button needs maximum prominence</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="guideline-section">
        <h3>Implementation</h3>
        <div className="implementation-example">
          <h4>CSS Classes</h4>
          <code className="code-block">
{`/* Shape classes for regular buttons */
.button-shape-square    /* No border radius */
.button-shape-rounded   /* Default radius */
.button-shape-round     /* Large radius */
.button-shape-pill      /* Full radius + extra padding */

/* Shape classes for icon buttons */
.icon-button.square     /* Square icon button */
.icon-button.rounded    /* Rounded icon button */
.icon-button.round      /* Circular icon button */

/* Utility classes */
.shape-square          /* Force square shape */
.shape-rounded         /* Force rounded shape */
.shape-round           /* Force round shape */
.shape-pill            /* Force pill shape */`}
          </code>
        </div>
      </div>
    </div>
  ),
};