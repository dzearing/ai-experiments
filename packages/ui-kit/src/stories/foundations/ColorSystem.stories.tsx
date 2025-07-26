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
      <h2>Panel Elevation Levels</h2>
      <p>Panels use subtle background and shadow differences to create visual hierarchy.</p>

      <div className="comparison-grid">
        <theme-preview theme="default" mode="light">
          <div className="comparison-column">
            <h3>Light Mode</h3>
            <div className="panels-showcase">
            <div className="panel-example panel-level-0">
              <h4>Level 0 - Base Panel</h4>
              <p>Same as body background</p>
              <div className="panel-specs">
                <code>--panel</code>
              </div>
            </div>

            <div className="panel-example panel-level-1">
              <h4>Level 1 - Raised Panel</h4>
              <p>Slightly elevated</p>
              <div className="panel-specs">
                <code>--panelRaised</code>
              </div>
            </div>

            <div className="panel-example panel-level-2">
              <h4>Level 2 - Elevated Panel</h4>
              <p>More prominent</p>
              <div className="panel-specs">
                <code>--panelElevated</code>
              </div>
            </div>

            <div className="panel-example panel-level-3">
              <h4>Level 3 - Floating Panel</h4>
              <p>Highest elevation</p>
              <div className="panel-specs">
                <code>--panelFloating</code>
              </div>
            </div>

            <div className="panel-stack">
              <div className="panel-layer panel-level-0">
                <span>Base</span>
                <div className="panel-layer panel-level-1">
                  <span>Card</span>
                  <div className="panel-layer panel-level-2">
                    <span>Featured</span>
                    <div className="panel-layer panel-level-3">
                      <span>Modal</span>
                    </div>
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
              <h4>Level 0 - Base Panel</h4>
              <p>Same as body background</p>
              <div className="panel-specs">
                <code>--panel</code>
              </div>
            </div>

            <div className="panel-example panel-level-1">
              <h4>Level 1 - Raised Panel</h4>
              <p>Slightly elevated</p>
              <div className="panel-specs">
                <code>--panelRaised</code>
              </div>
            </div>

            <div className="panel-example panel-level-2">
              <h4>Level 2 - Elevated Panel</h4>
              <p>More prominent</p>
              <div className="panel-specs">
                <code>--panelElevated</code>
              </div>
            </div>

            <div className="panel-example panel-level-3">
              <h4>Level 3 - Floating Panel</h4>
              <p>Highest elevation</p>
              <div className="panel-specs">
                <code>--panelFloating</code>
              </div>
            </div>

            <div className="panel-stack">
              <div className="panel-layer panel-level-0">
                <span>Base</span>
                <div className="panel-layer panel-level-1">
                  <span>Card</span>
                  <div className="panel-layer panel-level-2">
                    <span>Featured</span>
                    <div className="panel-layer panel-level-3">
                      <span>Modal</span>
                    </div>
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

// Dialog and overlay surfaces story
export const DialogOverlaySurfaces: StoryObj = {
  render: () => (
    <div className="surface-comparison">
      <h2>Dialog & Overlay Surfaces</h2>
      <p>
        Surfaces for modal dialogs, overlays, and floating content with appropriate shadows and
        backdrops.
      </p>

      <div className="comparison-grid">
        <theme-preview theme="default" mode="light">
          <div className="comparison-column">
            <h3>Light Mode</h3>
            <div className="dialogs-showcase">
            <div className="dialog-example">
              <div className="backdrop-demo">
                <div className="backdrop-content">
                  <span>Page Content</span>
                </div>
                <div className="backdrop-overlay"></div>
                <div className="dialog-demo dialog-surface">
                  <h4>Dialog</h4>
                  <p>Standard dialog surface</p>
                  <div className="dialog-specs">
                    <code>--dialog</code>
                    <code>--backdrop</code>
                  </div>
                </div>
              </div>
            </div>

            <div className="dialog-example">
              <div className="backdrop-demo">
                <div className="backdrop-content">
                  <span>Page Content</span>
                </div>
                <div className="backdrop-overlay backdrop-blur"></div>
                <div className="dialog-demo dialog-elevated">
                  <h4>Elevated Dialog</h4>
                  <p>More prominent dialog</p>
                  <div className="dialog-specs">
                    <code>--dialogElevated</code>
                    <code>--backdropBlur</code>
                  </div>
                </div>
              </div>
            </div>

            <div className="dialog-example">
              <div className="backdrop-demo">
                <div className="backdrop-content">
                  <span>Page Content</span>
                </div>
                <div className="backdrop-overlay"></div>
                <div className="dialog-demo modal-surface">
                  <h4>Modal</h4>
                  <p>Highest priority surface</p>
                  <div className="dialog-specs">
                    <code>--modal</code>
                  </div>
                </div>
              </div>
            </div>

            <div className="overlay-types">
              <h4>Overlay Examples</h4>
              <div className="overlay-grid">
                <div className="tooltip-demo">
                  <span className="tooltip">Tooltip</span>
                  <code>--tooltip</code>
                </div>
                <div className="menu-demo">
                  <div className="menu">
                    <div className="menu-item">Menu Item</div>
                    <div className="menu-item">Menu Item</div>
                  </div>
                  <code>--menu</code>
                </div>
              </div>
            </div>
            </div>
          </div>
        </theme-preview>

        <theme-preview theme="default" mode="dark">
          <div className="comparison-column">
            <h3>Dark Mode</h3>
            <div className="dialogs-showcase">
            <div className="dialog-example">
              <div className="backdrop-demo">
                <div className="backdrop-content">
                  <span>Page Content</span>
                </div>
                <div className="backdrop-overlay"></div>
                <div className="dialog-demo dialog-surface">
                  <h4>Dialog</h4>
                  <p>Standard dialog surface</p>
                  <div className="dialog-specs">
                    <code>--dialog</code>
                    <code>--backdrop</code>
                  </div>
                </div>
              </div>
            </div>

            <div className="dialog-example">
              <div className="backdrop-demo">
                <div className="backdrop-content">
                  <span>Page Content</span>
                </div>
                <div className="backdrop-overlay backdrop-blur"></div>
                <div className="dialog-demo dialog-elevated">
                  <h4>Elevated Dialog</h4>
                  <p>More prominent dialog</p>
                  <div className="dialog-specs">
                    <code>--dialogElevated</code>
                    <code>--backdropBlur</code>
                  </div>
                </div>
              </div>
            </div>

            <div className="dialog-example">
              <div className="backdrop-demo">
                <div className="backdrop-content">
                  <span>Page Content</span>
                </div>
                <div className="backdrop-overlay"></div>
                <div className="dialog-demo modal-surface">
                  <h4>Modal</h4>
                  <p>Highest priority surface</p>
                  <div className="dialog-specs">
                    <code>--modal</code>
                  </div>
                </div>
              </div>
            </div>

            <div className="overlay-types">
              <h4>Overlay Examples</h4>
              <div className="overlay-grid">
                <div className="tooltip-demo">
                  <span className="tooltip">Tooltip</span>
                  <code>--tooltip</code>
                </div>
                <div className="menu-demo">
                  <div className="menu">
                    <div className="menu-item">Menu Item</div>
                    <div className="menu-item">Menu Item</div>
                  </div>
                  <code>--menu</code>
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
