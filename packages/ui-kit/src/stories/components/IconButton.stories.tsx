import type { Meta, StoryObj } from '@storybook/react';
import './IconButton.stories.css';

const meta: Meta = {
  title: 'Components/Icon Button',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Icon buttons are used for actions that can be represented by an icon alone. They have no borders or shadows for a cleaner appearance.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const HeartIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

const SaveIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

const DeleteIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
  </svg>
);

const MoreIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
  </svg>
);

export const Default: Story = {
  render: () => (
    <div className="icon-button-showcase">
      <div className="showcase-section">
        <h3>Default Icon Buttons</h3>
        <p>Icon buttons with no borders or shadows for a clean appearance</p>
        <div className="button-row">
          <button className="icon-button" aria-label="Like">
            <HeartIcon />
          </button>
          <button className="icon-button" aria-label="Save">
            <SaveIcon />
          </button>
          <button className="icon-button" aria-label="Delete">
            <DeleteIcon />
          </button>
          <button className="icon-button" aria-label="More options">
            <MoreIcon />
          </button>
          <button className="icon-button" aria-label="Add">
            <PlusIcon />
          </button>
          <button className="icon-button" aria-label="Close">
            <CloseIcon />
          </button>
        </div>
      </div>

      <div className="showcase-section">
        <h3>Icon Button Variants</h3>
        <div className="button-row">
          <button className="icon-button icon-button-primary" aria-label="Primary action">
            <PlusIcon />
          </button>
          <button className="icon-button icon-button-danger" aria-label="Delete">
            <DeleteIcon />
          </button>
          <button className="icon-button icon-button-neutral" aria-label="More options">
            <MoreIcon />
          </button>
        </div>
      </div>

      <div className="showcase-section">
        <h3>Icon Button Shapes</h3>
        <div className="button-row align-center">
          <button className="icon-button square" aria-label="Square">
            <PlusIcon />
          </button>
          <button className="icon-button rounded" aria-label="Rounded">
            <SaveIcon />
          </button>
          <button className="icon-button round" aria-label="Round">
            <HeartIcon />
          </button>
        </div>
      </div>

      <div className="showcase-section">
        <h3>Icon Button Sizes</h3>
        <div className="button-row align-center">
          <button className="icon-button icon-button-small" aria-label="Small">
            <HeartIcon />
          </button>
          <button className="icon-button icon-button-medium" aria-label="Medium">
            <HeartIcon />
          </button>
          <button className="icon-button icon-button-large" aria-label="Large">
            <HeartIcon />
          </button>
        </div>
      </div>

      <div className="showcase-section">
        <h3>Icon Button States</h3>
        <div className="button-row">
          <button className="icon-button" aria-label="Normal">
            <HeartIcon />
          </button>
          <button className="icon-button hover-demo" aria-label="Hover">
            <HeartIcon />
          </button>
          <button className="icon-button active-demo" aria-label="Active">
            <HeartIcon />
          </button>
          <button className="icon-button" disabled aria-label="Disabled">
            <HeartIcon />
          </button>
        </div>
      </div>

      <div className="showcase-section">
        <h3>Animation Examples Updated</h3>
        <p>The animation examples now use icon buttons without borders and appropriate shapes</p>
        <div className="button-row">
          <button className="icon-button round like-button" aria-label="Like">
            <HeartIcon />
          </button>
          <button className="icon-button rounded save-button" aria-label="Save">
            <SaveIcon />
          </button>
          <button className="icon-button square remove-button" aria-label="Remove">
            <CloseIcon />
          </button>
        </div>
      </div>
    </div>
  ),
};

export const Interactive: Story = {
  render: () => {
    const handleClick = (action: string) => {
      console.log(`Icon button clicked: ${action}`);
    };

    return (
      <div className="icon-button-showcase">
        <div className="showcase-section">
          <h3>Interactive Icon Buttons</h3>
          <p>Click the buttons to see console logs</p>
          <div className="button-row">
            <button
              className="icon-button"
              aria-label="Like"
              onClick={() => handleClick('Like')}
            >
              <HeartIcon />
            </button>
            <button
              className="icon-button icon-button-primary"
              aria-label="Add"
              onClick={() => handleClick('Add')}
            >
              <PlusIcon />
            </button>
            <button
              className="icon-button icon-button-danger"
              aria-label="Delete"
              onClick={() => handleClick('Delete')}
            >
              <DeleteIcon />
            </button>
          </div>
        </div>
      </div>
    );
  },
};

export const Shapes: Story = {
  render: () => (
    <div className="icon-button-showcase">
      <div className="showcase-section">
        <h3>Shape Variations</h3>
        <p>Icon buttons can have different shapes for different use cases</p>
        
        <div className="shape-grid">
          <div className="shape-example">
            <h4>Square (Default)</h4>
            <p>Sharp corners for a modern, clean look</p>
            <div className="button-row">
              <button className="icon-button square" aria-label="Add">
                <PlusIcon />
              </button>
              <button className="icon-button square icon-button-primary" aria-label="Add">
                <PlusIcon />
              </button>
              <button className="icon-button square icon-button-danger" aria-label="Delete">
                <DeleteIcon />
              </button>
            </div>
          </div>
          
          <div className="shape-example">
            <h4>Rounded</h4>
            <p>Slightly rounded corners for a softer appearance</p>
            <div className="button-row">
              <button className="icon-button rounded" aria-label="Save">
                <SaveIcon />
              </button>
              <button className="icon-button rounded icon-button-primary" aria-label="Save">
                <SaveIcon />
              </button>
              <button className="icon-button rounded icon-button-neutral" aria-label="More">
                <MoreIcon />
              </button>
            </div>
          </div>
          
          <div className="shape-example">
            <h4>Round</h4>
            <p>Perfect circles for playful or social actions</p>
            <div className="button-row">
              <button className="icon-button round" aria-label="Like">
                <HeartIcon />
              </button>
              <button className="icon-button round icon-button-primary" aria-label="Like">
                <HeartIcon />
              </button>
              <button className="icon-button round icon-button-danger" aria-label="Close">
                <CloseIcon />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="showcase-section">
        <h3>Size and Shape Combinations</h3>
        <div className="size-shape-grid">
          <div className="size-shape-row">
            <span className="label">Small</span>
            <button className="icon-button icon-button-small square" aria-label="Square small">
              <PlusIcon />
            </button>
            <button className="icon-button icon-button-small rounded" aria-label="Rounded small">
              <SaveIcon />
            </button>
            <button className="icon-button icon-button-small round" aria-label="Round small">
              <HeartIcon />
            </button>
          </div>
          <div className="size-shape-row">
            <span className="label">Medium</span>
            <button className="icon-button icon-button-medium square" aria-label="Square medium">
              <PlusIcon />
            </button>
            <button className="icon-button icon-button-medium rounded" aria-label="Rounded medium">
              <SaveIcon />
            </button>
            <button className="icon-button icon-button-medium round" aria-label="Round medium">
              <HeartIcon />
            </button>
          </div>
          <div className="size-shape-row">
            <span className="label">Large</span>
            <button className="icon-button icon-button-large square" aria-label="Square large">
              <PlusIcon />
            </button>
            <button className="icon-button icon-button-large rounded" aria-label="Rounded large">
              <SaveIcon />
            </button>
            <button className="icon-button icon-button-large round" aria-label="Round large">
              <HeartIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const Usage: Story = {
  render: () => (
    <div className="usage-examples">
      <div className="usage-section">
        <h3>Usage Guidelines</h3>
        <div className="usage-grid">
          <div className="usage-card">
            <h4>When to use icon buttons</h4>
            <ul>
              <li>For common, universally understood actions</li>
              <li>When space is limited</li>
              <li>In toolbars and action bars</li>
              <li>For secondary actions</li>
            </ul>
          </div>
          <div className="usage-card">
            <h4>Shape Guidelines</h4>
            <ul>
              <li><strong>Square:</strong> Default for toolbars and technical UIs</li>
              <li><strong>Rounded:</strong> Softer look for consumer apps</li>
              <li><strong>Round:</strong> Social actions, FABs, playful UIs</li>
              <li>Maintain consistency within a feature</li>
            </ul>
          </div>
          <div className="usage-card">
            <h4>CSS Classes</h4>
            <code className="code-block">
              {`/* Base classes */
.icon-button
.icon-button-primary
.icon-button-danger
.icon-button-neutral

/* Size classes */
.icon-button-small
.icon-button-medium
.icon-button-large

/* Shape classes */
.square (default)
.rounded
.round`}
            </code>
          </div>
        </div>
      </div>
    </div>
  ),
};