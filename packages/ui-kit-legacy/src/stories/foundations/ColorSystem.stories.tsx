import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import './ColorSystem.stories.css';

// Import web components and type definitions
import '../../index';

// Ensure theme-preview web component type definitions
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'theme-preview': {
        theme?: string;
        mode?: 'light' | 'dark';
        children?: React.ReactNode;
      };
    }
  }
}

const meta: Meta = {
  title: 'Foundations/Color System',
  parameters: {
    docs: {
      description: {
        component: 'Interactive examples of the surface-based color system',
      },
    },
  },
};

export default meta;

// Helper component to display a color swatch - commented out for now as it's not used
// const ColorSwatch = ({
//   variable,
//   label,
//   surface = 'body',
// }: {
//   variable: string;
//   label?: string;
//   surface?: string;
// }) => {
//   const fullVariable = `--${surface}-${variable}`;
//   const _value = getComputedStyle(document.documentElement).getPropertyValue(fullVariable);

//   return (
//     <div className="color-swatch">
//       <div
//         className="swatch-color"
//         style={{
//           backgroundColor:
//             variable.includes('background') || variable.includes('border')
//               ? `var(${fullVariable})`
//               : 'var(--body-background)',
//           color:
//             variable.includes('text') || variable.includes('link') || variable.includes('icon')
//               ? `var(${fullVariable})`
//               : 'var(--body-text)',
//           borderColor: variable.includes('border') ? `var(${fullVariable})` : 'transparent',
//         }}
//       >
//         {variable.includes('text') || variable.includes('link') ? 'Aa' : ''}
//       </div>
//       <div className="swatch-info">
//         <span className="swatch-label">{label || variable}</span>
//         <code className="swatch-variable">{fullVariable}</code>
//       </div>
//     </div>
//   );
// };

// Surface showcase component - commented out for now as it's not used
// const SurfaceShowcase = ({ surface, description }: { surface: string; description: string }) => {
//   const textVariants = ['text', 'textSoft10', 'textSoft20', 'textSoft30', 'textHard10'];
//   const otherElements = ['link', 'link-hover', 'border', 'icon', 'background'];

//   return (
//     <div className="surface-showcase" style={{ background: `var(--${surface})` }}>
//       <h3 style={{ color: `var(--${surface}-text)` }}>{surface} Surface</h3>
//       <p style={{ color: `var(--${surface}-textSoft20)` }}>{description}</p>

//       <div className="surface-grid">
//         <div className="surface-section">
//           <h4 style={{ color: `var(--${surface}-textHard10)` }}>Text Variants</h4>
//           <div className="color-list">
//             {textVariants.map((variant) => (
//               <ColorSwatch key={variant} surface={surface} variable={variant} />
//             ))}
//           </div>
//         </div>

//         <div className="surface-section">
//           <h4 style={{ color: `var(--${surface}-textHard10)` }}>Other Elements</h4>
//           <div className="color-list">
//             {otherElements.map((element) => (
//               <ColorSwatch key={element} surface={surface} variable={element} />
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// Body surface story
export const BodySurface: StoryObj = {
  render: () => (
    <div className="surface-comparison">
      <h2>Body Surface</h2>
      <p>
        The foundational surface layer that serves as the main application background. All other surfaces and components are layered on top of this base.
      </p>

      <div className="comparison-grid">
        <theme-preview theme="default" mode="light">
          <div className="comparison-column">
            <h3>Light Mode</h3>
            <div className="body-surface-showcase">
              <div className="surface-color-grid">
              <div className="color-item">
                <div className="color-swatch body-background"></div>
                <div className="color-info">
                  <strong>Background</strong>
                  <code>--color-body-background</code>
                  <span className="color-description">Main application background</span>
                </div>
              </div>
              
              <div className="color-item">
                <div className="color-swatch body-background-soft10"></div>
                <div className="color-info">
                  <strong>Background Soft</strong>
                  <code>--color-body-background-soft10</code>
                  <span className="color-description">Subtle background variation</span>
                </div>
              </div>
              
              <div className="color-item">
                <div className="color-swatch body-background-hard10"></div>
                <div className="color-info">
                  <strong>Background Hard</strong>
                  <code>--color-body-background-hard10</code>
                  <span className="color-description">Stronger background variation</span>
                </div>
              </div>
            </div>

            <div className="surface-demo">
              <h4>Surface Hierarchy</h4>
              <div className="surface-layer body-layer">
                <span className="layer-label">Body Surface (Base Layer)</span>
                <div className="surface-layer panel-layer">
                  <span className="layer-label">Panel Surface</span>
                  <div className="surface-layer elevated-layer">
                    <span className="layer-label">Elevated Content</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="body-tokens-showcase">
              <h4>Body Surface Tokens</h4>
              <div className="token-grid">
                <div className="token-category">
                  <h5>Text Colors</h5>
                  <div className="token-item">
                    <span className="body-text-sample">Text</span>
                    <code>--color-body-text</code>
                  </div>
                  <div className="token-item">
                    <span className="body-text-soft10-sample">Text Soft 10</span>
                    <code>--color-body-text-soft10</code>
                  </div>
                  <div className="token-item">
                    <span className="body-text-soft20-sample">Text Soft 20</span>
                    <code>--color-body-text-soft20</code>
                  </div>
                  <div className="token-item">
                    <span className="body-text-soft30-sample">Text Soft 30</span>
                    <code>--color-body-text-soft30</code>
                  </div>
                </div>
                
                <div className="token-category">
                  <h5>Interactive Elements</h5>
                  <div className="token-item">
                    <span className="body-link-sample">Link</span>
                    <code>--color-body-link</code>
                  </div>
                  <div className="token-item">
                    <span className="body-link-hover-sample">Link Hover</span>
                    <code>--color-body-link-hover</code>
                  </div>
                  <div className="token-item">
                    <span className="body-icon-sample">◆</span>
                    <code>--color-body-icon</code>
                  </div>
                </div>
                
                <div className="token-category">
                  <h5>Borders & Dividers</h5>
                  <div className="token-item">
                    <div className="body-border-sample"></div>
                    <code>--color-body-border</code>
                  </div>
                  <div className="token-item">
                    <div className="body-border-soft-sample"></div>
                    <code>--color-body-border-soft10</code>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        </theme-preview>

        <theme-preview theme="default" mode="dark">
          <div className="comparison-column">
            <h3>Dark Mode</h3>
            <div className="body-surface-showcase">
              <div className="surface-color-grid">
              <div className="color-item">
                <div className="color-swatch body-background"></div>
                <div className="color-info">
                  <strong>Background</strong>
                  <code>--color-body-background</code>
                  <span className="color-description">Main application background</span>
                </div>
              </div>
              
              <div className="color-item">
                <div className="color-swatch body-background-soft10"></div>
                <div className="color-info">
                  <strong>Background Soft</strong>
                  <code>--color-body-background-soft10</code>
                  <span className="color-description">Subtle background variation</span>
                </div>
              </div>
              
              <div className="color-item">
                <div className="color-swatch body-background-hard10"></div>
                <div className="color-info">
                  <strong>Background Hard</strong>
                  <code>--color-body-background-hard10</code>
                  <span className="color-description">Stronger background variation</span>
                </div>
              </div>
            </div>

            <div className="surface-demo">
              <h4>Surface Hierarchy</h4>
              <div className="surface-layer body-layer">
                <span className="layer-label">Body Surface (Base Layer)</span>
                <div className="surface-layer panel-layer">
                  <span className="layer-label">Panel Surface</span>
                  <div className="surface-layer elevated-layer">
                    <span className="layer-label">Elevated Content</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="body-tokens-showcase">
              <h4>Body Surface Tokens</h4>
              <div className="token-grid">
                <div className="token-category">
                  <h5>Text Colors</h5>
                  <div className="token-item">
                    <span className="body-text-sample">Text</span>
                    <code>--color-body-text</code>
                  </div>
                  <div className="token-item">
                    <span className="body-text-soft10-sample">Text Soft 10</span>
                    <code>--color-body-text-soft10</code>
                  </div>
                  <div className="token-item">
                    <span className="body-text-soft20-sample">Text Soft 20</span>
                    <code>--color-body-text-soft20</code>
                  </div>
                  <div className="token-item">
                    <span className="body-text-soft30-sample">Text Soft 30</span>
                    <code>--color-body-text-soft30</code>
                  </div>
                </div>
                
                <div className="token-category">
                  <h5>Interactive Elements</h5>
                  <div className="token-item">
                    <span className="body-link-sample">Link</span>
                    <code>--color-body-link</code>
                  </div>
                  <div className="token-item">
                    <span className="body-link-hover-sample">Link Hover</span>
                    <code>--color-body-link-hover</code>
                  </div>
                  <div className="token-item">
                    <span className="body-icon-sample">◆</span>
                    <code>--color-body-icon</code>
                  </div>
                </div>
                
                <div className="token-category">
                  <h5>Borders & Dividers</h5>
                  <div className="token-item">
                    <div className="body-border-sample"></div>
                    <code>--color-body-border</code>
                  </div>
                  <div className="token-item">
                    <div className="body-border-soft-sample"></div>
                    <code>--color-body-border-soft10</code>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        </theme-preview>
      </div>
    </div>
  ),
};

// Button surfaces story
export const ButtonSurfaces: StoryObj = {
  render: () => (
    <div className="surface-comparison">
      <h2>Button Surfaces</h2>
      <p>Action surfaces for different button types with guaranteed text contrast.</p>

      <div className="comparison-grid">
        <theme-preview theme="default" mode="light">
          <div className="comparison-column">
            <h3>Light Mode</h3>
            <div className="buttons-showcase">
              <div className="button-showcase">
                <button className="button button-primary">Primary Action</button>
                <div className="button-info">
                  <code>--buttonPrimary</code>
                  <code>--buttonPrimary-text</code>
                </div>
              </div>

              <div className="button-showcase">
                <button className="button button-danger">Danger Action</button>
                <div className="button-info">
                  <code>--buttonDanger</code>
                  <code>--buttonDanger-text</code>
                </div>
              </div>

              <div className="button-showcase">
                <button className="button button-success">Success Action</button>
                <div className="button-info">
                  <code>--buttonSuccess</code>
                  <code>--buttonSuccess-text</code>
                </div>
              </div>

              <div className="button-showcase">
                <button className="button button-neutral">Neutral Action</button>
                <div className="button-info">
                  <code>--buttonNeutral</code>
                  <code>--buttonNeutral-text</code>
                </div>
              </div>

              <div className="button-states">
                <h4>Button States</h4>
                <div className="button-row">
                  <button className="button button-primary">Normal</button>
                  <button className="button button-primary button-hover">Hover</button>
                  <button className="button button-primary button-active">Active</button>
                  <button className="button button-primary" disabled>
                    Disabled
                  </button>
                </div>
              </div>
            </div>
          </div>
        </theme-preview>

        <theme-preview theme="default" mode="dark">
          <div className="comparison-column">
            <h3>Dark Mode</h3>
            <div className="buttons-showcase">
              <div className="button-showcase">
                <button className="button button-primary">Primary Action</button>
                <div className="button-info">
                  <code>--buttonPrimary</code>
                  <code>--buttonPrimary-text</code>
                </div>
              </div>

              <div className="button-showcase">
                <button className="button button-danger">Danger Action</button>
                <div className="button-info">
                  <code>--buttonDanger</code>
                  <code>--buttonDanger-text</code>
                </div>
              </div>

              <div className="button-showcase">
                <button className="button button-success">Success Action</button>
                <div className="button-info">
                  <code>--buttonSuccess</code>
                  <code>--buttonSuccess-text</code>
                </div>
              </div>

              <div className="button-showcase">
                <button className="button button-neutral">Neutral Action</button>
                <div className="button-info">
                  <code>--buttonNeutral</code>
                  <code>--buttonNeutral-text</code>
                </div>
              </div>

              <div className="button-states">
                <h4>Button States</h4>
                <div className="button-row">
                  <button className="button button-primary">Normal</button>
                  <button className="button button-primary button-hover">Hover</button>
                  <button className="button button-primary button-active">Active</button>
                  <button className="button button-primary" disabled>
                    Disabled
                  </button>
                </div>
              </div>
            </div>
          </div>
        </theme-preview>
      </div>
    </div>
  ),
};

// Notification surfaces story
export const NotificationSurfaces: StoryObj = {
  render: () => (
    <div className="surface-comparison">
      <h2>Notification Surfaces</h2>
      <p>Contextual surfaces for alerts and notices with appropriate contrast for each type.</p>

      <div className="comparison-grid">
        <theme-preview theme="default" mode="light">
          <div className="comparison-column">
            <h3>Light Mode</h3>
            <div className="notifications-showcase">
              <div className="notification notification-info">
                <h4>Information</h4>
                <p>This is an informational message.</p>
                <a href="#">Learn more</a>
                <div className="notification-specs">
                  <code>--noticeInfo</code>
                </div>
              </div>

              <div className="notification notification-success">
                <h4>Success!</h4>
                <p>Your changes have been saved.</p>
                <a href="#">View changes</a>
                <div className="notification-specs">
                  <code>--noticeSuccess</code>
                </div>
              </div>

              <div className="notification notification-warning">
                <h4>Warning</h4>
                <p>Please review your settings.</p>
                <a href="#">Review</a>
                <div className="notification-specs">
                  <code>--noticeWarning</code>
                </div>
              </div>

              <div className="notification notification-danger">
                <h4>Error</h4>
                <p>There was a problem processing.</p>
                <a href="#">Try again</a>
                <div className="notification-specs">
                  <code>--noticeDanger</code>
                </div>
              </div>
            </div>
          </div>
        </theme-preview>

        <theme-preview theme="default" mode="dark">
          <div className="comparison-column">
            <h3>Dark Mode</h3>
            <div className="notifications-showcase">
              <div className="notification notification-info">
              <h4>Information</h4>
              <p>This is an informational message.</p>
              <a href="#">Learn more</a>
              <div className="notification-specs">
                <code>--noticeInfo</code>
              </div>
            </div>

            <div className="notification notification-success">
              <h4>Success!</h4>
              <p>Your changes have been saved.</p>
              <a href="#">View changes</a>
              <div className="notification-specs">
                <code>--noticeSuccess</code>
              </div>
            </div>

            <div className="notification notification-warning">
              <h4>Warning</h4>
              <p>Please review your settings.</p>
              <a href="#">Review</a>
              <div className="notification-specs">
                <code>--noticeWarning</code>
              </div>
            </div>

            <div className="notification notification-danger">
              <h4>Error</h4>
              <p>There was a problem processing.</p>
              <a href="#">Try again</a>
              <div className="notification-specs">
                <code>--noticeDanger</code>
              </div>
            </div>
            </div>
          </div>
        </theme-preview>
      </div>
    </div>
  ),
};

// Panel surfaces story
export const PanelSurfaces: StoryObj = {
  render: () => (
    <div className="surface-comparison">
      <h2>Panel Surface</h2>
      <p>The panel surface provides a clean background for content containers, cards, and other UI elements that need separation from the main page background.</p>

      <div className="comparison-grid">
        <theme-preview theme="default" mode="light">
          <div className="comparison-column">
            <h3>Light Mode</h3>
            <div className="panels-showcase">
            <div className="panel-example panel-level-0">
              <h4>Panel Surface (<code>--panel</code>)</h4>
              <p><strong>When to use:</strong> Content containers that need subtle separation from the page background</p>
              <ul className="panel-usage-list">
                <li>Content cards and containers</li>
                <li>Sidebar panels</li>
                <li>Form sections</li>
                <li>Table containers</li>
                <li>List items</li>
                <li>Comment threads</li>
              </ul>
              <div className="panel-real-world">
                <strong>Example:</strong> Cards, panels, content sections
              </div>
            </div>

            <div className="panel-best-practices">
              <h4>Best Practices</h4>
              <div className="practice-grid">
                <div className="practice-item">
                  <strong>Do:</strong>
                  <ul>
                    <li>Use panel surface for content grouping</li>
                    <li>Combine with shadows for elevation effects</li>
                    <li>Ensure sufficient contrast with body background</li>
                  </ul>
                </div>
                <div className="practice-item">
                  <strong>Don't:</strong>
                  <ul>
                    <li>Overuse panels - maintain visual hierarchy</li>
                    <li>Use panels for purely decorative purposes</li>
                    <li>Stack too many panel levels</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="panel-stack">
              <h4>Visual Hierarchy Example</h4>
              <div className="panel-layer panel-level-0">
                <span>Page Background (Body Surface)</span>
                <div className="panel-layer panel-level-1">
                  <span>Content Container (Panel Surface)</span>
                  <div className="panel-layer elevated-layer">
                    <span>Elevated Content (with shadows)</span>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        </theme-preview>

        <theme-preview theme="default" mode="dark">
          <div className="comparison-column">
            <h3>Dark Mode</h3>
            <div className="panels-showcase">
            <div className="panel-example panel-level-0">
              <h4>Panel Surface (<code>--panel</code>)</h4>
              <p><strong>When to use:</strong> Content containers that need subtle separation from the page background</p>
              <ul className="panel-usage-list">
                <li>Content cards and containers</li>
                <li>Sidebar panels</li>
                <li>Form sections</li>
                <li>Table containers</li>
                <li>List items</li>
                <li>Comment threads</li>
              </ul>
              <div className="panel-real-world">
                <strong>Example:</strong> Cards, panels, content sections
              </div>
            </div>

            <div className="panel-best-practices">
              <h4>Best Practices</h4>
              <div className="practice-grid">
                <div className="practice-item">
                  <strong>Do:</strong>
                  <ul>
                    <li>Use panel surface for content grouping</li>
                    <li>Combine with shadows for elevation effects</li>
                    <li>Ensure sufficient contrast with body background</li>
                  </ul>
                </div>
                <div className="practice-item">
                  <strong>Don't:</strong>
                  <ul>
                    <li>Overuse panels - maintain visual hierarchy</li>
                    <li>Use panels for purely decorative purposes</li>
                    <li>Stack too many panel levels</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="panel-stack">
              <h4>Visual Hierarchy Example</h4>
              <div className="panel-layer panel-level-0">
                <span>Page Background (Body Surface)</span>
                <div className="panel-layer panel-level-1">
                  <span>Content Container (Panel Surface)</span>
                  <div className="panel-layer elevated-layer">
                    <span>Elevated Content (with shadows)</span>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        </theme-preview>
      </div>
    </div>
  ),
};

// Input surfaces story
export const InputSurfaces: StoryObj = {
  render: () => (
    <div className="surface-comparison">
      <h2>Input Surface States</h2>
      <p>Input fields have their own surface with specialized states for user interaction.</p>

      <div className="comparison-grid">
        <theme-preview theme="default" mode="light">
          <div className="comparison-column">
            <h3>Light Mode</h3>
            <div className="inputs-showcase">
            <div className="input-example">
              <label>Default Input</label>
              <input type="text" className="input-default" placeholder="Enter text..." />
            </div>

            <div className="input-example">
              <label>Focus State</label>
              <input
                type="text"
                className="input-focus"
                placeholder="Focused..."
                defaultValue="Focused input"
              />
            </div>

            <div className="input-example">
              <label>Disabled State</label>
              <input type="text" className="input-disabled" placeholder="Disabled..." disabled />
            </div>

            <div className="input-example">
              <label>Error State</label>
              <input type="text" className="input-error" defaultValue="Invalid input" />
              <span className="input-error-message">Error message</span>
            </div>

            <form className="input-form-example">
              <h4>Form Example</h4>
              <div className="form-field">
                <label>Email</label>
                <input type="email" placeholder="name@example.com" />
              </div>

              <div className="form-field error">
                <label>Username</label>
                <input type="text" defaultValue="admin" />
                <span className="error-message">Already taken</span>
              </div>

              <div className="form-field">
                <label>Comments</label>
                <textarea placeholder="Enter comments..." rows={2}></textarea>
              </div>
            </form>
            </div>
          </div>
        </theme-preview>

        <theme-preview theme="default" mode="dark">
          <div className="comparison-column">
            <h3>Dark Mode</h3>
            <div className="inputs-showcase">
            <div className="input-example">
              <label>Default Input</label>
              <input type="text" className="input-default" placeholder="Enter text..." />
            </div>

            <div className="input-example">
              <label>Focus State</label>
              <input
                type="text"
                className="input-focus"
                placeholder="Focused..."
                defaultValue="Focused input"
              />
            </div>

            <div className="input-example">
              <label>Disabled State</label>
              <input type="text" className="input-disabled" placeholder="Disabled..." disabled />
            </div>

            <div className="input-example">
              <label>Error State</label>
              <input type="text" className="input-error" defaultValue="Invalid input" />
              <span className="input-error-message">Error message</span>
            </div>

            <form className="input-form-example">
              <h4>Form Example</h4>
              <div className="form-field">
                <label>Email</label>
                <input type="email" placeholder="name@example.com" />
              </div>

              <div className="form-field error">
                <label>Username</label>
                <input type="text" defaultValue="admin" />
                <span className="error-message">Already taken</span>
              </div>

              <div className="form-field">
                <label>Comments</label>
                <textarea placeholder="Enter comments..." rows={2}></textarea>
              </div>
            </form>
            </div>
          </div>
        </theme-preview>
      </div>
    </div>
  ),
};

// Elevated content surfaces story
export const ElevatedSurfaces: StoryObj = {
  render: () => {
    const [showModal, setShowModal] = React.useState(false);
    const [showDropdown, setShowDropdown] = React.useState(false);

    return (
      <div className="surface-comparison">
        <h2>Elevated Content Surfaces</h2>
        <p>
          Examples showing how panel surfaces can be elevated using shadows and positioning for overlays, dropdowns, and modal content.
        </p>

        <div className="comparison-grid">
          <theme-preview theme="default" mode="light">
            <div className="comparison-column">
              <h3>Light Mode</h3>
              <div className="dialogs-showcase">
                {/* Interactive Demo Buttons */}
                <div className="dialog-controls">
                  <button className="button button-primary" onClick={() => setShowModal(true)}>
                    Show Modal
                  </button>
                  <div className="dropdown-trigger">
                    <button className="button button-neutral" onClick={() => setShowDropdown(!showDropdown)}>
                      Dropdown Menu
                    </button>
                    {showDropdown && (
                      <div className="dropdown-menu">
                        <div className="menu-item">Option 1</div>
                        <div className="menu-item">Option 2</div>
                        <div className="menu-item">Option 3</div>
                        <div className="menu-divider"></div>
                        <div className="menu-item">Settings</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Modal Example */}
                {showModal && (
                  <div className="modal-container">
                    <div className="modal-backdrop" onClick={() => setShowModal(false)}></div>
                    <div className="modal-content">
                      <div className="modal-header">
                        <h3>Modal Dialog</h3>
                        <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                      </div>
                      <div className="modal-body">
                        <p>This modal uses panel surface with high elevation shadows to appear above all other content.</p>
                        <div className="modal-specs">
                          <code>background: var(--color-panel-background)</code>
                          <code>box-shadow: var(--shadow-2xl)</code>
                        </div>
                      </div>
                      <div className="modal-footer">
                        <button className="button button-neutral" onClick={() => setShowModal(false)}>Cancel</button>
                        <button className="button button-primary" onClick={() => setShowModal(false)}>Confirm</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Surface Examples */}
                <div className="surface-examples">
                  <h4>Elevation Hierarchy</h4>
                  <div className="elevation-stack">
                    <div className="elevation-layer base-layer">
                      <span>Body Surface (Base)</span>
                      <div className="elevation-layer raised-layer">
                        <span>Panel Surface</span>
                        <div className="elevation-layer elevated-layer">
                          <span>Elevated Panel (shadow-lg)</span>
                          <div className="elevation-layer floating-layer">
                            <span>Floating Panel (shadow-xl)</span>
                            <div className="elevation-layer modal-layer">
                              <span>Modal (shadow-2xl)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Static Examples */}
                <div className="static-examples">
                  <h4>Common Elevated Components</h4>
                  
                  <div className="example-item">
                    <div className="dropdown-static">
                      <div className="menu-item">Menu Item 1</div>
                      <div className="menu-item active">Active Item</div>
                      <div className="menu-item">Menu Item 3</div>
                    </div>
                    <code>Panel surface + shadow-lg</code>
                  </div>

                  <div className="example-item">
                    <div className="toast-notification">
                      <strong>Success!</strong> Your changes have been saved.
                    </div>
                    <code>Notice surface + shadow-md</code>
                  </div>
                </div>
              </div>
            </div>
          </theme-preview>

          <theme-preview theme="default" mode="dark">
            <div className="comparison-column">
              <h3>Dark Mode</h3>
              <div className="dialogs-showcase">
                {/* Same interactive components but in dark mode context */}
                <div className="dialog-controls">
                  <button className="button button-primary">Show Modal</button>
                  <div className="dropdown-trigger">
                    <button className="button button-neutral">Dropdown Menu</button>
                  </div>
                </div>

                {/* Surface Examples */}
                <div className="surface-examples">
                  <h4>Elevation Hierarchy</h4>
                  <div className="elevation-stack">
                    <div className="elevation-layer base-layer">
                      <span>Body Surface (Base)</span>
                      <div className="elevation-layer raised-layer">
                        <span>Panel Surface</span>
                        <div className="elevation-layer elevated-layer">
                          <span>Elevated Panel (shadow-lg)</span>
                          <div className="elevation-layer floating-layer">
                            <span>Floating Panel (shadow-xl)</span>
                            <div className="elevation-layer modal-layer">
                              <span>Modal (shadow-2xl)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Static Examples */}
                <div className="static-examples">
                  <h4>Common Elevated Components</h4>
                  
                  <div className="example-item">
                    <div className="dropdown-static">
                      <div className="menu-item">Menu Item 1</div>
                      <div className="menu-item active">Active Item</div>
                      <div className="menu-item">Menu Item 3</div>
                    </div>
                    <code>Panel surface + shadow-lg</code>
                  </div>

                  <div className="example-item">
                    <div className="toast-notification">
                      <strong>Success!</strong> Your changes have been saved.
                    </div>
                    <code>Notice surface + shadow-md</code>
                  </div>
                </div>
              </div>
            </div>
          </theme-preview>
        </div>
      </div>
    );
  },
};
