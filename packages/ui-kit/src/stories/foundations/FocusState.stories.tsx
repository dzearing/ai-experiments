import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import './FocusState.stories.css';

export default {
  title: 'Foundations/Focus State',
  parameters: {
    layout: 'centered',
  },
} as Meta;

export const Interactive: StoryObj = {
  name: 'Interactive Examples',
  render: () => (
    <div className="focus-demo-container">
      <section className="focus-demo-section">
        <h3>Standard Focus Ring</h3>
        <p>Tab through these elements to see 2px internal focus borders contained within components:</p>
        <div className="focus-demo-row">
          <button className="focus-demo-button">Primary Button</button>
          <button className="focus-demo-button focus-demo-button-secondary">Secondary Button</button>
          <button className="focus-demo-button focus-demo-button-danger">Danger Button</button>
        </div>
      </section>

      <section className="focus-demo-section">
        <h3>Form Inputs</h3>
        <p>Form elements use consistent 2px internal focus borders:</p>
        <div className="focus-demo-column">
          <input 
            type="text" 
            className="focus-demo-input" 
            placeholder="Text input with focus style"
          />
          <textarea 
            className="focus-demo-textarea" 
            placeholder="Textarea with focus style"
            rows={3}
          />
          <select className="focus-demo-select">
            <option>Select with focus style</option>
            <option>Option 2</option>
            <option>Option 3</option>
          </select>
        </div>
      </section>

      <section className="focus-demo-section">
        <h3>Interactive Cards</h3>
        <p>Clickable containers with focus states:</p>
        <div className="focus-demo-row">
          <div className="focus-demo-card" tabIndex={0} role="button">
            <h4>Card Title</h4>
            <p>This entire card is focusable with internal focus border.</p>
          </div>
          <div className="focus-demo-card focus-demo-card-elevated" tabIndex={0} role="button">
            <h4>Elevated Card</h4>
            <p>Different surface with appropriate focus color.</p>
          </div>
        </div>
      </section>

      <section className="focus-demo-section">
        <h3>Links and Inline Elements</h3>
        <p>
          Here's some text with <a href="#" className="focus-demo-link">an inline link</a> and 
          another <a href="#" className="focus-demo-link">focusable link</a> to demonstrate 
          focus states on inline elements.
        </p>
      </section>

      <section className="focus-demo-section focus-demo-guidelines">
        <h3>Focus State Guidelines</h3>
        <ul>
          <li>✅ Use <code>:focus-visible</code> for keyboard-only focus</li>
          <li>✅ Use 2px internal borders with <code>box-shadow: inset 0 0 0 2px</code></li>
          <li>✅ Keep focus indicators within component boundaries</li>
          <li>✅ Add inner white shadow for contrast on filled buttons</li>
          <li>✅ Maintain 3:1 contrast ratio for focus indicators</li>
          <li>❌ Don't use external outlines that can be clipped by overflow</li>
          <li>❌ Don't rely on color alone for focus indication</li>
        </ul>
      </section>
    </div>
  ),
};

export const ContrastComparison: StoryObj = {
  name: 'Contrast Examples',
  render: () => (
    <div className="focus-contrast-container">
      <section className="focus-contrast-section">
        <h3>Good Contrast Examples</h3>
        <div className="focus-contrast-grid">
          <div className="focus-contrast-item focus-contrast-good">
            <button className="focus-contrast-button">
              Strong Outline
            </button>
            <span>✅ Meets WCAG AA</span>
          </div>
          <div className="focus-contrast-item focus-contrast-good">
            <button className="focus-contrast-button focus-contrast-button-offset">
              With Offset
            </button>
            <span>✅ Extra inner padding</span>
          </div>
          <div className="focus-contrast-item focus-contrast-good">
            <button className="focus-contrast-button focus-contrast-button-thick">
              Thick Border
            </button>
            <span>✅ 3px for visibility</span>
          </div>
        </div>
      </section>

      <section className="focus-contrast-section">
        <h3>Poor Contrast Examples</h3>
        <div className="focus-contrast-grid">
          <div className="focus-contrast-item focus-contrast-bad">
            <button className="focus-contrast-button focus-contrast-button-thin">
              Thin Outline
            </button>
            <span>❌ Only 1px width</span>
          </div>
          <div className="focus-contrast-item focus-contrast-bad">
            <button className="focus-contrast-button focus-contrast-button-lowcontrast">
              Low Contrast
            </button>
            <span>❌ Hard to see</span>
          </div>
          <div className="focus-contrast-item focus-contrast-bad">
            <button className="focus-contrast-button focus-contrast-button-coloronly">
              Color Only
            </button>
            <span>❌ No outline</span>
          </div>
        </div>
      </section>
    </div>
  ),
};

export const FocusManagement: StoryObj = {
  name: 'Focus Management Demo',
  render: () => {
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const triggerRef = React.useRef<HTMLButtonElement>(null);
    
    return (
      <div className="focus-management-container">
        <h3>Focus Management Example</h3>
        <p>Click the button to open a dialog and see focus management in action:</p>
        
        <button 
          ref={triggerRef}
          className="focus-demo-button"
          onClick={() => setDialogOpen(true)}
        >
          Open Dialog
        </button>

        {dialogOpen && (
          <>
            <div className="focus-overlay" onClick={() => setDialogOpen(false)} />
            <div 
              className="focus-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="dialog-title"
            >
              <h3 id="dialog-title">Example Dialog</h3>
              <p>Focus is trapped within this dialog. Press Tab to cycle through elements.</p>
              
              <input 
                type="text" 
                className="focus-demo-input" 
                placeholder="First input"
                autoFocus
              />
              
              <input 
                type="text" 
                className="focus-demo-input" 
                placeholder="Second input"
              />
              
              <div className="focus-dialog-actions">
                <button 
                  className="focus-demo-button focus-demo-button-secondary"
                  onClick={() => {
                    setDialogOpen(false);
                    triggerRef.current?.focus();
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="focus-demo-button"
                  onClick={() => {
                    setDialogOpen(false);
                    triggerRef.current?.focus();
                  }}
                >
                  Confirm
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  },
};