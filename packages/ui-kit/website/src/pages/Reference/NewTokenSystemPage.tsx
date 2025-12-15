import { useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { TableOfContents } from '../../components/TableOfContents';
import styles from './ReferencePage.module.css';

// Color groups in the new system
const colorGroups = [
  { name: 'softer', description: 'Recessed areas, subtle wells, input backgrounds' },
  { name: 'soft', description: 'Elevated cards, panels, alternating row backgrounds' },
  { name: 'base', description: 'Default page content, main surface' },
  { name: 'strong', description: 'Emphasized sections, highlights' },
  { name: 'stronger', description: 'Maximum emphasis, high contrast areas' },
  { name: 'primary', description: 'Selection, active states, branded elements' },
  { name: 'inverted', description: 'Opposite color scheme (tooltips, callouts)' },
  { name: 'success', description: 'Success states, positive feedback' },
  { name: 'warning', description: 'Warning states, caution indicators' },
  { name: 'danger', description: 'Error states, destructive actions' },
  { name: 'info', description: 'Informational states, neutral status' },
];

// Token structure per group
const tokenStructure = [
  { suffix: '-bg', description: 'Default background' },
  { suffix: '-bg-hover', description: 'Hover state background' },
  { suffix: '-bg-pressed', description: 'Pressed/active state background' },
  { suffix: '-bg-disabled', description: 'Disabled state background' },
  { suffix: '-text-softer', description: 'Most subtle text (placeholders, hints)' },
  { suffix: '-text-soft', description: 'Secondary text' },
  { suffix: '-text', description: 'Primary text (default)' },
  { suffix: '-text-strong', description: 'Emphasized text' },
  { suffix: '-text-stronger', description: 'Maximum emphasis text (headlines)' },
  { suffix: '-border-soft', description: 'Subtle separators' },
  { suffix: '-border', description: 'Default borders' },
  { suffix: '-border-strong', description: 'Emphasized borders' },
];

export function NewTokenSystemPage() {
  const contentRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  return (
    <div className={styles.pageLayout}>
      <div className={styles.content} ref={contentRef}>
        <article className={styles.reference}>
          <div className={styles.header}>
            <div style={{
              background: 'var(--info-bg)',
              border: '1px solid var(--info-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-4)',
              marginBottom: 'var(--space-6)'
            }}>
              <strong style={{ color: 'var(--info-text)' }}>Preview Documentation</strong>
              <p style={{ color: 'var(--info-text)', margin: 'var(--space-2) 0 0 0', fontSize: 'var(--text-sm)' }}>
                This documents a proposed redesign of the token system. Review the concepts below and provide feedback before implementation.
              </p>
            </div>
            <h1 className={styles.title}>New Token System: Color Groups</h1>
            <p className={styles.subtitle}>
              A simpler, more predictable approach to token selection based on visual intent rather than container types.
            </p>
          </div>

          {/* The Problem */}
          <section className={styles.section}>
            <h2 id="the-problem" className={styles.sectionTitle}>The Problem</h2>
            <p className={styles.sectionDesc}>
              The current token system uses container-based names like <code>card</code>, <code>overlay</code>, and <code>popout</code>.
              When building custom UI, you have to ask "Is this a card? An overlay? A popout?" - which is subjective and confusing.
            </p>
            <div style={{
              background: 'var(--danger-bg)',
              border: '1px solid var(--danger-border)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-4)',
              marginTop: 'var(--space-4)'
            }}>
              <p style={{ color: 'var(--danger-text)', margin: 0, fontStyle: 'italic' }}>
                "I need to style a custom tile. Is it a <code>card</code>? An <code>overlay</code>? A <code>popout</code>? They all sound plausible."
              </p>
            </div>
            <p style={{ marginTop: 'var(--space-4)' }}>
              Additionally, many token groups lack complete state coverage (hover, pressed, disabled), forcing developers to improvise.
            </p>
          </section>

          {/* The Core Rule */}
          <section className={styles.section}>
            <h2 id="the-core-rule" className={styles.sectionTitle}>The Core Rule</h2>
            <div style={{
              background: 'var(--success-bg)',
              border: '1px solid var(--success-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-5)',
              marginBottom: 'var(--space-4)'
            }}>
              <p style={{ color: 'var(--success-text)', margin: 0, fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)' }}>
                Pick a color group for your background. Use ONLY that group's foreground tokens. Contrast is guaranteed.
              </p>
            </div>
            <p>This rule is:</p>
            <ul style={{ marginTop: 'var(--space-3)', paddingLeft: 'var(--space-6)' }}>
              <li><strong>Simple</strong> - one decision: "what visual weight do I want?"</li>
              <li><strong>Enforceable</strong> - lint rules can catch cross-group mixing</li>
              <li><strong>Visually validatable</strong> - look at it and see if it's right</li>
              <li><strong>Contrast-safe</strong> - the system guarantees accessibility</li>
            </ul>
          </section>

          {/* Color Groups */}
          <section className={styles.section}>
            <h2 id="color-groups" className={styles.sectionTitle}>Color Groups</h2>
            <p className={styles.sectionDesc}>
              Instead of container-specific names, use <strong>tones</strong> that describe visual weight.
              Each tone provides a complete <strong>color group</strong> with all states and contrast levels.
            </p>
            <table className={styles.tokenTable} style={{ marginTop: 'var(--space-4)' }}>
              <thead>
                <tr>
                  <th className={styles.tokenTableHeader}>Color Group</th>
                  <th className={styles.tokenTableHeader}>When to Use</th>
                </tr>
              </thead>
              <tbody>
                {colorGroups.map((group) => (
                  <tr key={group.name} className={styles.tokenTableRow}>
                    <td className={styles.tokenNameCell}>
                      <code className={styles.tokenName}>{group.name}</code>
                    </td>
                    <td className={styles.tokenDescCell}>
                      <span className={styles.tokenDesc}>{group.description}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Token Structure */}
          <section className={styles.section}>
            <h2 id="token-structure" className={styles.sectionTitle}>Token Structure Per Group</h2>
            <p className={styles.sectionDesc}>
              Each color group contains 12 tokens covering backgrounds, text, and borders with all necessary states and contrast levels.
            </p>
            <table className={styles.tokenTable} style={{ marginTop: 'var(--space-4)' }}>
              <thead>
                <tr>
                  <th className={styles.tokenTableHeader}>Token Pattern</th>
                  <th className={styles.tokenTableHeader}>Example (soft group)</th>
                  <th className={styles.tokenTableHeader}>Purpose</th>
                </tr>
              </thead>
              <tbody>
                {tokenStructure.map((token) => (
                  <tr key={token.suffix} className={styles.tokenTableRow}>
                    <td className={styles.tokenNameCell}>
                      <code className={styles.tokenName}>--{'{group}'}{token.suffix}</code>
                    </td>
                    <td className={styles.tokenValueCell}>
                      <code className={styles.tokenValue}>--soft{token.suffix}</code>
                    </td>
                    <td className={styles.tokenDescCell}>
                      <span className={styles.tokenDesc}>{token.description}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ marginTop: 'var(--space-4)', color: 'var(--page-text-soft)' }}>
              <strong>Icons:</strong> Use <code>color: var(--{'{group}'}-text)</code> on the parent element.
              Icons inherit via <code>color: inherit</code>.
            </p>

            <h3 style={{ marginTop: 'var(--space-6)', marginBottom: 'var(--space-3)', fontSize: 'var(--text-lg)' }}>
              Semantic Accent Text (Global)
            </h3>
            <p style={{ marginBottom: 'var(--space-3)', color: 'var(--page-text-soft)' }}>
              These work across standard backgrounds (base, soft, strong) for inline colored text:
            </p>
            <table className={styles.tokenTable}>
              <thead>
                <tr>
                  <th className={styles.tokenTableHeader}>Token</th>
                  <th className={styles.tokenTableHeader}>Purpose</th>
                </tr>
              </thead>
              <tbody>
                <tr className={styles.tokenTableRow}>
                  <td className={styles.tokenNameCell}><code className={styles.tokenName}>--text-primary</code></td>
                  <td className={styles.tokenDescCell}>Brand/primary colored text, links</td>
                </tr>
                <tr className={styles.tokenTableRow}>
                  <td className={styles.tokenNameCell}><code className={styles.tokenName}>--text-primary-hover</code></td>
                  <td className={styles.tokenDescCell}>Link hover state</td>
                </tr>
                <tr className={styles.tokenTableRow}>
                  <td className={styles.tokenNameCell}><code className={styles.tokenName}>--text-primary-pressed</code></td>
                  <td className={styles.tokenDescCell}>Link pressed/active state</td>
                </tr>
                <tr className={styles.tokenTableRow}>
                  <td className={styles.tokenNameCell}><code className={styles.tokenName}>--text-danger</code></td>
                  <td className={styles.tokenDescCell}>Red text for errors, warnings</td>
                </tr>
                <tr className={styles.tokenTableRow}>
                  <td className={styles.tokenNameCell}><code className={styles.tokenName}>--text-success</code></td>
                  <td className={styles.tokenDescCell}>Green text for positive messages</td>
                </tr>
                <tr className={styles.tokenTableRow}>
                  <td className={styles.tokenNameCell}><code className={styles.tokenName}>--text-warning</code></td>
                  <td className={styles.tokenDescCell}>Amber text for caution</td>
                </tr>
                <tr className={styles.tokenTableRow}>
                  <td className={styles.tokenNameCell}><code className={styles.tokenName}>--text-info</code></td>
                  <td className={styles.tokenDescCell}>Blue text for informational</td>
                </tr>
              </tbody>
            </table>
            <p style={{ marginTop: 'var(--space-3)', color: 'var(--page-text-soft)', fontSize: 'var(--text-sm)' }}>
              <strong>Note:</strong> These are distinct from <code>--danger-text</code> (text ON a danger surface).
              Use <code>--text-danger</code> for inline red text on any standard background.
            </p>

            <p style={{ marginTop: 'var(--space-4)', color: 'var(--page-text-soft)' }}>
              <strong>Total:</strong> 11 color groups × 12 tokens + 7 semantic text = <strong>139 color tokens</strong>
            </p>
          </section>

          {/* Usage Examples */}
          <section className={styles.section}>
            <h2 id="usage-examples" className={styles.sectionTitle}>Usage Examples</h2>
            <p className={styles.sectionDesc}>
              See how the color group system simplifies common patterns.
            </p>

            <h3 style={{ marginTop: 'var(--space-5)', marginBottom: 'var(--space-3)', fontSize: 'var(--text-lg)' }}>
              Correct Usage
            </h3>
            <pre style={{
              background: 'var(--inset-bg)',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-md)',
              overflow: 'auto',
              fontSize: 'var(--text-sm)',
              border: '1px solid var(--success-border)'
            }}>
{`/* ✅ CORRECT - same color group */
.card {
  background: var(--soft-bg);
  color: var(--soft-text);
  border-color: var(--soft-border);
}

.card-subtitle {
  color: var(--soft-text-soft);  /* secondary text within soft group */
}

.card:hover {
  background: var(--soft-bg-hover);
}`}
            </pre>

            <h3 style={{ marginTop: 'var(--space-5)', marginBottom: 'var(--space-3)', fontSize: 'var(--text-lg)' }}>
              Incorrect Usage
            </h3>
            <pre style={{
              background: 'var(--inset-bg)',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-md)',
              overflow: 'auto',
              fontSize: 'var(--text-sm)',
              border: '1px solid var(--danger-border)'
            }}>
{`/* ❌ WRONG - mixing groups breaks contrast guarantee */
.broken {
  background: var(--soft-bg);
  color: var(--strong-text);  /* Don't mix! */
}`}
            </pre>

            <h3 style={{ marginTop: 'var(--space-5)', marginBottom: 'var(--space-3)', fontSize: 'var(--text-lg)' }}>
              Table with Selection
            </h3>
            <pre style={{
              background: 'var(--inset-bg)',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-md)',
              overflow: 'auto',
              fontSize: 'var(--text-sm)'
            }}>
{`/* Alternating rows use different color groups */
.row:nth-child(odd) {
  background: var(--base-bg);
  color: var(--base-text);
}
.row:nth-child(even) {
  background: var(--soft-bg);
  color: var(--soft-text);
}

/* Hover stays in same color group */
.row:hover {
  background: var(--soft-bg-hover);
}

/* Selection switches to primary color group */
.row.selected {
  background: var(--primary-bg);
  color: var(--primary-text);
}

/* Selected + hover uses primary group's hover */
.row.selected:hover {
  background: var(--primary-bg-hover);
}`}
            </pre>
          </section>

          {/* Key Decisions */}
          <section className={styles.section}>
            <h2 id="key-decisions" className={styles.sectionTitle}>Key Design Decisions</h2>
            <p className={styles.sectionDesc}>
              Important architectural choices in this system.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
              <div style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)'
              }}>
                <h4 style={{ margin: '0 0 var(--space-2) 0', fontSize: 'var(--text-base)' }}>States Map to CSS Pseudo-selectors</h4>
                <p style={{ margin: 0, color: 'var(--card-text-soft)' }}>
                  <code>:hover</code> → <code>-hover</code>,
                  <code style={{ marginLeft: 'var(--space-2)' }}>:active</code> → <code>-pressed</code>,
                  <code style={{ marginLeft: 'var(--space-2)' }}>:disabled</code> → <code>-disabled</code>
                </p>
              </div>

              <div style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)'
              }}>
                <h4 style={{ margin: '0 0 var(--space-2) 0', fontSize: 'var(--text-base)' }}>Selection Changes the Color Group</h4>
                <p style={{ margin: 0, color: 'var(--card-text-soft)' }}>
                  When an item is selected, apply a <code>.selected</code> class that switches to <code>primary-*</code> tokens.
                  This is cleaner than adding <code>-selected</code> to every tone.
                </p>
              </div>

              <div style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)'
              }}>
                <h4 style={{ margin: '0 0 var(--space-2) 0', fontSize: 'var(--text-base)' }}>Elevation Merged with Tone</h4>
                <p style={{ margin: 0, color: 'var(--card-text-soft)' }}>
                  <code>raised</code> ≈ <code>soft</code> (lighter background + shadow),
                  <code style={{ marginLeft: 'var(--space-2)' }}>sunken</code> ≈ <code>softer</code> (recessed background)
                </p>
              </div>

              <div style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)'
              }}>
                <h4 style={{ margin: '0 0 var(--space-2) 0', fontSize: 'var(--text-base)' }}>5 Text Contrast Levels</h4>
                <p style={{ margin: 0, color: 'var(--card-text-soft)' }}>
                  <code>-text-softer</code> (placeholders) → <code>-text-soft</code> (secondary) →
                  <code>-text</code> (primary) → <code>-text-strong</code> (emphasized) → <code>-text-stronger</code> (headlines)
                </p>
              </div>

              <div style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)'
              }}>
                <h4 style={{ margin: '0 0 var(--space-2) 0', fontSize: 'var(--text-base)'}}><code>base</code> Replaces <code>page</code></h4>
                <p style={{ margin: 0, color: 'var(--card-text-soft)' }}>
                  The default surface is now called <code>base</code> instead of <code>page</code> for consistency with the tonal naming.
                </p>
              </div>
            </div>
          </section>

          {/* Surface Mapping */}
          <section className={styles.section}>
            <h2 id="surface-mapping" className={styles.sectionTitle}>Surface Class Mapping</h2>
            <p className={styles.sectionDesc}>
              Surfaces now map directly to color groups. The surface class sets which color group is active for that region.
            </p>
            <table className={styles.tokenTable} style={{ marginTop: 'var(--space-4)' }}>
              <thead>
                <tr>
                  <th className={styles.tokenTableHeader}>Surface Class</th>
                  <th className={styles.tokenTableHeader}>Color Group</th>
                  <th className={styles.tokenTableHeader}>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className={styles.tokenTableRow}>
                  <td className={styles.tokenNameCell}><code className={styles.tokenName}>.surface</code></td>
                  <td className={styles.tokenValueCell}><code>base</code></td>
                  <td className={styles.tokenDescCell}>Default page background</td>
                </tr>
                <tr className={styles.tokenTableRow}>
                  <td className={styles.tokenNameCell}><code className={styles.tokenName}>.surface.softer</code> or <code>.surface.sunken</code></td>
                  <td className={styles.tokenValueCell}><code>softer</code></td>
                  <td className={styles.tokenDescCell}>Recessed areas, wells</td>
                </tr>
                <tr className={styles.tokenTableRow}>
                  <td className={styles.tokenNameCell}><code className={styles.tokenName}>.surface.soft</code> or <code>.surface.raised</code></td>
                  <td className={styles.tokenValueCell}><code>soft</code></td>
                  <td className={styles.tokenDescCell}>Elevated cards, panels</td>
                </tr>
                <tr className={styles.tokenTableRow}>
                  <td className={styles.tokenNameCell}><code className={styles.tokenName}>.surface.strong</code></td>
                  <td className={styles.tokenValueCell}><code>strong</code></td>
                  <td className={styles.tokenDescCell}>Emphasized sections</td>
                </tr>
                <tr className={styles.tokenTableRow}>
                  <td className={styles.tokenNameCell}><code className={styles.tokenName}>.surface.stronger</code></td>
                  <td className={styles.tokenValueCell}><code>stronger</code></td>
                  <td className={styles.tokenDescCell}>Maximum emphasis</td>
                </tr>
                <tr className={styles.tokenTableRow}>
                  <td className={styles.tokenNameCell}><code className={styles.tokenName}>.surface.primary</code></td>
                  <td className={styles.tokenValueCell}><code>primary</code></td>
                  <td className={styles.tokenDescCell}>Branded, selected</td>
                </tr>
                <tr className={styles.tokenTableRow}>
                  <td className={styles.tokenNameCell}><code className={styles.tokenName}>.surface.inverted</code></td>
                  <td className={styles.tokenValueCell}><code>inverted</code></td>
                  <td className={styles.tokenDescCell}>Opposite color scheme</td>
                </tr>
                <tr className={styles.tokenTableRow}>
                  <td className={styles.tokenNameCell}><code className={styles.tokenName}>.surface.success</code></td>
                  <td className={styles.tokenValueCell}><code>success</code></td>
                  <td className={styles.tokenDescCell}>Success states</td>
                </tr>
                <tr className={styles.tokenTableRow}>
                  <td className={styles.tokenNameCell}><code className={styles.tokenName}>.surface.warning</code></td>
                  <td className={styles.tokenValueCell}><code>warning</code></td>
                  <td className={styles.tokenDescCell}>Warning states</td>
                </tr>
                <tr className={styles.tokenTableRow}>
                  <td className={styles.tokenNameCell}><code className={styles.tokenName}>.surface.danger</code></td>
                  <td className={styles.tokenValueCell}><code>danger</code></td>
                  <td className={styles.tokenDescCell}>Danger/error states</td>
                </tr>
                <tr className={styles.tokenTableRow}>
                  <td className={styles.tokenNameCell}><code className={styles.tokenName}>.surface.info</code></td>
                  <td className={styles.tokenValueCell}><code>info</code></td>
                  <td className={styles.tokenDescCell}>Informational states</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Vocabulary */}
          <section className={styles.section}>
            <h2 id="vocabulary" className={styles.sectionTitle}>Vocabulary</h2>
            <p className={styles.sectionDesc}>
              Consistent terminology for discussing the token system.
            </p>
            <table className={styles.tokenTable} style={{ marginTop: 'var(--space-4)' }}>
              <thead>
                <tr>
                  <th className={styles.tokenTableHeader}>Term</th>
                  <th className={styles.tokenTableHeader}>Definition</th>
                </tr>
              </thead>
              <tbody>
                <tr className={styles.tokenTableRow}>
                  <td className={styles.tokenNameCell}><strong>Tone</strong></td>
                  <td className={styles.tokenDescCell}>A visual weight/emphasis level (softer, soft, base, strong, stronger, primary, inverted)</td>
                </tr>
                <tr className={styles.tokenTableRow}>
                  <td className={styles.tokenNameCell}><strong>Color Group</strong></td>
                  <td className={styles.tokenDescCell}>A complete set of tokens for a tone (bg, text, border + all states)</td>
                </tr>
                <tr className={styles.tokenTableRow}>
                  <td className={styles.tokenNameCell}><strong>State</strong></td>
                  <td className={styles.tokenDescCell}>CSS pseudo-selector mapping (hover, pressed, disabled)</td>
                </tr>
                <tr className={styles.tokenTableRow}>
                  <td className={styles.tokenNameCell}><strong>Contrast</strong></td>
                  <td className={styles.tokenDescCell}>A text/border modifier (soft = less contrast, strong = more contrast)</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Open Questions */}
          <section className={styles.section}>
            <h2 id="open-questions" className={styles.sectionTitle}>Open Questions</h2>
            <p className={styles.sectionDesc}>
              These edge cases need resolution before implementation.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
              {/* Links - RESOLVED */}
              <div style={{
                background: 'var(--success-bg)',
                border: '1px solid var(--success-border)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)'
              }}>
                <h4 style={{ margin: '0 0 var(--space-2) 0', color: 'var(--success-text)' }}>1. Links - RESOLVED</h4>
                <p style={{ margin: '0 0 var(--space-3) 0', color: 'var(--success-text)' }}>
                  Links use <code>--text-primary</code> and its state variants:
                </p>
                <p style={{ margin: 0, color: 'var(--success-text)', fontSize: 'var(--text-sm)' }}>
                  <code>--text-primary</code> - default link color<br/>
                  <code>--text-primary-hover</code> - hover state<br/>
                  <code>--text-primary-pressed</code> - active/pressed state<br/>
                  <code>--text-primary-visited</code> - visited links (optional)
                </p>
              </div>

              {/* Semantic text colors - RESOLVED */}
              <div style={{
                background: 'var(--success-bg)',
                border: '1px solid var(--success-border)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)'
              }}>
                <h4 style={{ margin: '0 0 var(--space-2) 0', color: 'var(--success-text)' }}>2. Semantic Text Colors - RESOLVED</h4>
                <p style={{ margin: '0 0 var(--space-3) 0', color: 'var(--success-text)' }}>
                  Add accent text tokens that work on standard backgrounds (base, soft, strong):
                </p>
                <p style={{ margin: 0, color: 'var(--success-text)', fontSize: 'var(--text-sm)' }}>
                  <code>--text-primary</code> - brand colored text<br/>
                  <code>--text-danger</code> - red for errors/warnings<br/>
                  <code>--text-success</code> - green for positive messages<br/>
                  <code>--text-warning</code> - amber for caution<br/>
                  <code>--text-info</code> - blue for informational
                </p>
                <p style={{ margin: 'var(--space-2) 0 0 0', color: 'var(--success-text)', fontSize: 'var(--text-sm)', fontStyle: 'italic' }}>
                  Note: These are distinct from <code>--danger-text</code> which is for text ON a danger surface.
                </p>
              </div>

              {/* Feedback buttons vs surfaces - RESOLVED */}
              <div style={{
                background: 'var(--success-bg)',
                border: '1px solid var(--success-border)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)'
              }}>
                <h4 style={{ margin: '0 0 var(--space-2) 0', color: 'var(--success-text)' }}>3. Feedback Buttons vs Surfaces - RESOLVED</h4>
                <p style={{ margin: '0 0 var(--space-3) 0', color: 'var(--success-text)' }}>
                  <strong>Tokens are not surfaces.</strong> They serve different purposes:
                </p>
                <p style={{ margin: 0, color: 'var(--success-text)', fontSize: 'var(--text-sm)' }}>
                  <strong>Tokens</strong> (<code>--danger-bg</code>, <code>--danger-text</code>) = solid colors for danger buttons<br/>
                  <strong>Surfaces</strong> (<code>.surface.danger</code>) = class that creates a danger context, may override colors for contrast (e.g., tinted background for toasts)
                </p>
                <p style={{ margin: 'var(--space-2) 0 0 0', color: 'var(--success-text)', fontSize: 'var(--text-sm)', fontStyle: 'italic' }}>
                  No separate <code>controlDanger</code> needed. Danger buttons use <code>--danger-*</code> tokens directly.
                </p>
              </div>

              {/* Accent colors - OUT OF SCOPE */}
              <div style={{
                background: 'var(--info-bg)',
                border: '1px solid var(--info-border)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)'
              }}>
                <h4 style={{ margin: '0 0 var(--space-2) 0', color: 'var(--info-text)' }}>4. Accent Colors - OUT OF SCOPE</h4>
                <p style={{ margin: 0, color: 'var(--info-text)', fontSize: 'var(--text-sm)' }}>
                  Decorative colors for badges/tags (blue, purple, orange) are out of scope.
                  Use raw colors or theme-specific custom properties for decorative purposes.
                </p>
              </div>
            </div>
          </section>

          {/* Migration */}
          <section className={styles.section}>
            <h2 id="migration" className={styles.sectionTitle}>Migration Path</h2>
            <p className={styles.sectionDesc}>
              How we'll transition from the current system.
            </p>
            <div style={{ marginTop: 'var(--space-4)' }}>
              <h4 style={{ marginBottom: 'var(--space-2)' }}>Old → New Token Mapping</h4>
              <pre style={{
                background: 'var(--inset-bg)',
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-md)',
                overflow: 'auto',
                fontSize: 'var(--text-sm)'
              }}>
{`/* Backwards compatibility aliases */
--page-bg: var(--base-bg);
--page-text: var(--base-text);
--card-bg: var(--soft-bg);
--card-text: var(--soft-text);
--controlPrimary-bg: var(--primary-bg);
--controlPrimary-text: var(--primary-text);
/* ... etc */`}
              </pre>
              <p style={{ marginTop: 'var(--space-3)', color: 'var(--page-text-soft)' }}>
                Existing code continues to work. New code uses the new token names. Migration can happen incrementally.
              </p>
            </div>
          </section>

        </article>
      </div>
      <aside className={styles.sidebar}>
        <TableOfContents
          key={location.pathname}
          containerRef={contentRef}
          headingSelector="h2"
          title="On this page"
        />
      </aside>
    </div>
  );
}
