import { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { TableOfContents } from '../../components/TableOfContents';
import styles from './ReferencePage.module.css';

interface TokenInfo {
  name: string;
  description: string;
  derivation?: string;
}

interface TokenCategory {
  title: string;
  description?: string;
  tokens: TokenInfo[];
}

// Container role tokens
const containerTokens: TokenCategory[] = [
  {
    title: 'Page',
    description: 'Main application background - the base layer',
    tokens: [
      { name: '--page-bg', description: 'Main app background', derivation: 'Theme base color' },
      { name: '--page-text', description: 'Primary text on page', derivation: 'Contrasts with page-bg' },
      { name: '--page-text-soft', description: 'Secondary text (30% less contrast)', derivation: 'mix(text, bg, 0.3)' },
      { name: '--page-text-softer', description: 'Tertiary text (50% less contrast)', derivation: 'mix(text, bg, 0.5)' },
      { name: '--page-text-strong', description: 'Higher contrast text', derivation: 'mix(text, max-contrast, 0.3)' },
      { name: '--page-text-stronger', description: 'Maximum contrast text', derivation: 'Pure black/white' },
      { name: '--page-border', description: 'Standard borders', derivation: 'darken/lighten page-bg' },
      { name: '--page-border-soft', description: 'Subtle borders', derivation: 'mix(border, bg, 0.4)' },
      { name: '--page-border-strong', description: 'Higher contrast borders', derivation: 'darken/lighten border 20%' },
      { name: '--page-border-stronger', description: 'Maximum contrast borders', derivation: 'mix(border, max-contrast, 0.5)' },
      { name: '--page-shadow', description: 'Page-level shadows', derivation: 'Contextual shadow' },
    ],
  },
  {
    title: 'Card',
    description: 'Elevated content containers - raised from page',
    tokens: [
      { name: '--card-bg', description: 'Card background', derivation: 'lighten(page-bg, 8)' },
      { name: '--card-text', description: 'Text on cards', derivation: 'Inherits page-text' },
      { name: '--card-text-soft', description: 'Secondary card text', derivation: 'mix(text, bg, 0.3)' },
      { name: '--card-text-strong', description: 'Higher contrast card text', derivation: 'mix(text, max-contrast, 0.3)' },
      { name: '--card-text-stronger', description: 'Maximum contrast card text', derivation: 'Pure black/white' },
      { name: '--card-border', description: 'Card borders', derivation: 'Inherits page-border' },
      { name: '--card-border-soft', description: 'Subtle card borders', derivation: 'mix(border, bg, 0.4)' },
      { name: '--card-border-strong', description: 'Strong card borders', derivation: 'darken/lighten 20%' },
      { name: '--card-border-stronger', description: 'Maximum contrast borders', derivation: 'mix(border, max-contrast, 0.5)' },
      { name: '--card-shadow', description: 'Card elevation shadow', derivation: 'Box shadow with opacity' },
    ],
  },
  {
    title: 'Overlay',
    description: 'Modals, dialogs, sheets - higher elevation than card',
    tokens: [
      { name: '--overlay-bg', description: 'Modal/dialog background', derivation: 'lighten(page-bg, 10-12)' },
      { name: '--overlay-text', description: 'Text on overlays', derivation: 'Inherits page-text' },
      { name: '--overlay-text-soft', description: 'Secondary overlay text', derivation: 'mix(text, bg, 0.3)' },
      { name: '--overlay-text-strong', description: 'Higher contrast text', derivation: 'mix(text, max-contrast, 0.3)' },
      { name: '--overlay-text-stronger', description: 'Maximum contrast text', derivation: 'Pure black/white' },
      { name: '--overlay-border', description: 'Overlay borders', derivation: 'Inherits page-border' },
      { name: '--overlay-border-soft', description: 'Subtle borders', derivation: 'mix(border, bg, 0.4)' },
      { name: '--overlay-border-strong', description: 'Strong borders', derivation: 'darken/lighten 20%' },
      { name: '--overlay-border-stronger', description: 'Maximum contrast borders', derivation: 'mix(border, max-contrast, 0.5)' },
      { name: '--overlay-shadow', description: 'Overlay shadow', derivation: 'Multi-layer shadow' },
    ],
  },
  {
    title: 'Popout',
    description: 'Dropdowns, menus, tooltips - highest elevation',
    tokens: [
      { name: '--popout-bg', description: 'Dropdown/menu background', derivation: 'lighten(page-bg, 12-16)' },
      { name: '--popout-text', description: 'Text in popouts', derivation: 'Inherits page-text' },
      { name: '--popout-text-soft', description: 'Secondary text', derivation: 'mix(text, bg, 0.3)' },
      { name: '--popout-text-strong', description: 'Higher contrast text', derivation: 'mix(text, max-contrast, 0.3)' },
      { name: '--popout-text-stronger', description: 'Maximum contrast text', derivation: 'Pure black/white' },
      { name: '--popout-border', description: 'Popout borders', derivation: 'Inherits page-border' },
      { name: '--popout-border-soft', description: 'Subtle borders', derivation: 'mix(border, bg, 0.4)' },
      { name: '--popout-border-strong', description: 'Strong borders', derivation: 'darken/lighten 20%' },
      { name: '--popout-border-stronger', description: 'Maximum contrast borders', derivation: 'mix(border, max-contrast, 0.5)' },
      { name: '--popout-shadow', description: 'Popout shadow', derivation: 'Deep shadow' },
    ],
  },
  {
    title: 'Inset',
    description: 'Recessed areas - input fields, wells, sunken regions',
    tokens: [
      { name: '--inset-bg', description: 'Default background', derivation: 'darken(page-bg, 4)' },
      { name: '--inset-bg-hover', description: 'Hover state', derivation: 'darken(page-bg, 6) or lighten 4' },
      { name: '--inset-bg-focus', description: 'Focus state', derivation: 'lighten(page-bg, 4-6)' },
      { name: '--inset-text', description: 'Input text', derivation: 'Inherits page-text' },
      { name: '--inset-text-soft', description: 'Placeholder text', derivation: 'mix(text, bg, 0.3)' },
      { name: '--inset-border', description: 'Input border', derivation: 'Inherits page-border' },
      { name: '--inset-border-focus', description: 'Focus border', derivation: 'theme:primary' },
    ],
  },
];

// Control role tokens
const controlTokens: TokenCategory[] = [
  {
    title: 'Control',
    description: 'Default interactive elements - secondary buttons, list items',
    tokens: [
      { name: '--control-bg', description: 'Default background', derivation: 'Neutral gray' },
      { name: '--control-bg-hover', description: 'Hover background', derivation: 'Slightly darker/lighter' },
      { name: '--control-bg-pressed', description: 'Active/pressed background', derivation: 'More contrast' },
      { name: '--control-text', description: 'Control text', derivation: 'Contrasts with control-bg' },
      { name: '--control-text-hover', description: 'Hover text', derivation: 'Often same as text' },
      { name: '--control-text-pressed', description: 'Pressed text', derivation: 'Often same as text' },
      { name: '--control-border', description: 'Control border', derivation: 'Subtle border' },
      { name: '--control-border-hover', description: 'Hover border', derivation: 'Slightly stronger' },
      { name: '--control-border-pressed', description: 'Pressed border', derivation: 'Strongest' },
      { name: '--control-shadow', description: 'Control shadow', derivation: 'Subtle shadow' },
    ],
  },
  {
    title: 'Control Primary',
    description: 'Primary actions - CTA buttons, selected states',
    tokens: [
      { name: '--controlPrimary-bg', description: 'Primary background', derivation: 'theme:primary color' },
      { name: '--controlPrimary-bg-hover', description: 'Hover state', derivation: 'darken/lighten primary 8%' },
      { name: '--controlPrimary-bg-pressed', description: 'Pressed state', derivation: 'darken/lighten primary 12%' },
      { name: '--controlPrimary-text', description: 'Text on primary', derivation: 'Auto contrast (black/white)' },
      { name: '--controlPrimary-border', description: 'Primary border', derivation: 'Usually transparent' },
      { name: '--controlPrimary-shadow', description: 'Primary shadow', derivation: 'Optional glow' },
    ],
  },
  {
    title: 'Control Danger',
    description: 'Destructive actions - delete buttons, dangerous operations',
    tokens: [
      { name: '--controlDanger-bg', description: 'Danger background', derivation: 'semantic:danger (#dc2626)' },
      { name: '--controlDanger-bg-hover', description: 'Hover state', derivation: 'darken/lighten danger 8%' },
      { name: '--controlDanger-bg-pressed', description: 'Pressed state', derivation: 'darken/lighten danger 12%' },
      { name: '--controlDanger-text', description: 'Text on danger', derivation: 'Auto contrast (white)' },
      { name: '--controlDanger-border', description: 'Danger border', derivation: 'Usually transparent' },
      { name: '--controlDanger-shadow', description: 'Danger shadow', derivation: 'Optional' },
    ],
  },
  {
    title: 'Control Subtle',
    description: 'Ghost/minimal buttons - tabs, toolbar actions',
    tokens: [
      { name: '--controlSubtle-bg', description: 'Default (transparent)', derivation: 'transparent' },
      { name: '--controlSubtle-bg-hover', description: 'Hover background', derivation: 'rgba overlay 4-8%' },
      { name: '--controlSubtle-bg-pressed', description: 'Pressed background', derivation: 'rgba overlay 8-12%' },
      { name: '--controlSubtle-text', description: 'Subtle text', derivation: 'mix(page-text, bg, 0.2)' },
      { name: '--controlSubtle-text-hover', description: 'Hover text', derivation: 'page-text' },
      { name: '--controlSubtle-text-pressed', description: 'Pressed text', derivation: 'page-text' },
      { name: '--controlSubtle-border', description: 'Border (transparent)', derivation: 'transparent' },
    ],
  },
  {
    title: 'Control Disabled',
    description: 'Non-interactive state for any control',
    tokens: [
      { name: '--controlDisabled-bg', description: 'Disabled background', derivation: 'Muted gray' },
      { name: '--controlDisabled-text', description: 'Disabled text', derivation: 'Low contrast gray' },
      { name: '--controlDisabled-border', description: 'Disabled border', derivation: 'Muted border' },
    ],
  },
];

// Feedback role tokens
const feedbackTokens: TokenCategory[] = [
  {
    title: 'Success',
    description: 'Positive outcomes, confirmations, completion states',
    tokens: [
      { name: '--success-bg', description: 'Success background', derivation: 'mix(green, white/black, 0.85-0.9)' },
      { name: '--success-text', description: 'Success text', derivation: 'darken/lighten green 30%' },
      { name: '--success-text-soft', description: 'Secondary success text', derivation: 'mix(text, bg, 0.3)' },
      { name: '--success-border', description: 'Success border', derivation: 'darken/lighten green 10-20%' },
      { name: '--success-icon', description: 'Success icon color', derivation: 'semantic:success (#16a34a)' },
    ],
  },
  {
    title: 'Warning',
    description: 'Caution states, attention needed, pending actions',
    tokens: [
      { name: '--warning-bg', description: 'Warning background', derivation: 'mix(amber, white/black, 0.85-0.9)' },
      { name: '--warning-text', description: 'Warning text', derivation: 'darken/lighten amber 30%' },
      { name: '--warning-text-soft', description: 'Secondary warning text', derivation: 'mix(text, bg, 0.3)' },
      { name: '--warning-border', description: 'Warning border', derivation: 'darken/lighten amber 10-20%' },
      { name: '--warning-icon', description: 'Warning icon color', derivation: 'semantic:warning (#f59e0b)' },
    ],
  },
  {
    title: 'Danger',
    description: 'Errors, destructive states, critical alerts',
    tokens: [
      { name: '--danger-bg', description: 'Danger background', derivation: 'mix(red, white/black, 0.85-0.9)' },
      { name: '--danger-text', description: 'Danger text', derivation: 'darken/lighten red 30%' },
      { name: '--danger-text-soft', description: 'Secondary danger text', derivation: 'mix(text, bg, 0.3)' },
      { name: '--danger-border', description: 'Danger border', derivation: 'darken/lighten red 10-20%' },
      { name: '--danger-icon', description: 'Danger icon color', derivation: 'semantic:danger (#dc2626)' },
    ],
  },
  {
    title: 'Info',
    description: 'Informational messages, help content, neutral status',
    tokens: [
      { name: '--info-bg', description: 'Info background', derivation: 'mix(blue, white/black, 0.85-0.9)' },
      { name: '--info-text', description: 'Info text', derivation: 'darken/lighten blue 30%' },
      { name: '--info-text-soft', description: 'Secondary info text', derivation: 'mix(text, bg, 0.3)' },
      { name: '--info-border', description: 'Info border', derivation: 'darken/lighten blue 10-20%' },
      { name: '--info-icon', description: 'Info icon color', derivation: 'semantic:info (#0ea5e9)' },
    ],
  },
];

// Special tokens
const specialTokens: TokenCategory[] = [
  {
    title: 'Focus',
    description: 'Accessibility focus indicators',
    tokens: [
      { name: '--focus-ring', description: 'Focus ring color', derivation: 'theme:primary' },
      { name: '--focus-ring-width', description: 'Ring thickness', derivation: 'Default: 2px' },
      { name: '--focus-ring-offset', description: 'Space between element and ring', derivation: 'Default: 2px' },
    ],
  },
  {
    title: 'Link',
    description: 'Hyperlink colors',
    tokens: [
      { name: '--link', description: 'Default link color', derivation: 'theme:primary' },
      { name: '--link-hover', description: 'Hover color', derivation: 'darken/lighten primary 10%' },
      { name: '--link-pressed', description: 'Active/pressed color', derivation: 'darken/lighten primary 15%' },
      { name: '--link-visited', description: 'Visited link color', derivation: 'mix(primary, purple, 0.5)' },
    ],
  },
  {
    title: 'Selection',
    description: 'Text selection highlight',
    tokens: [
      { name: '--selection-bg', description: 'Selection background', derivation: 'mix(primary, white/black, 0.7)' },
      { name: '--selection-text', description: 'Selected text color', derivation: 'black/white' },
    ],
  },
  {
    title: 'Scrollbar',
    description: 'Custom scrollbar styling',
    tokens: [
      { name: '--scrollbar-track', description: 'Scrollbar track', derivation: 'Light/dark gray' },
      { name: '--scrollbar-thumb', description: 'Scrollbar thumb', derivation: 'Medium gray' },
      { name: '--scrollbar-thumb-hover', description: 'Thumb hover state', derivation: 'Darker/lighter gray' },
    ],
  },
  {
    title: 'Skeleton',
    description: 'Loading placeholder states',
    tokens: [
      { name: '--skeleton-bg', description: 'Skeleton background', derivation: 'Muted gray' },
      { name: '--skeleton-shimmer', description: 'Shimmer highlight', derivation: 'Semi-transparent white' },
    ],
  },
  {
    title: 'Highlight',
    description: 'Search and text highlighting',
    tokens: [
      { name: '--highlight-bg', description: 'Highlight background', derivation: 'mix(primary, white/black, 0.8)' },
      { name: '--highlight-text', description: 'Highlighted text', derivation: 'black/white' },
    ],
  },
];

// Static tokens (don't change with theme)
const staticTokens: TokenCategory[] = [
  {
    title: 'Spacing',
    description: 'Based on 4px grid system',
    tokens: [
      { name: '--space-1', description: '4px - Tightest spacing', derivation: '4px' },
      { name: '--space-2', description: '8px - Small gaps', derivation: '8px' },
      { name: '--space-3', description: '12px - Compact padding', derivation: '12px' },
      { name: '--space-4', description: '16px - Base unit', derivation: '16px' },
      { name: '--space-5', description: '20px - Medium spacing', derivation: '20px' },
      { name: '--space-6', description: '24px - Section gaps', derivation: '24px' },
      { name: '--space-8', description: '32px - Large gaps', derivation: '32px' },
      { name: '--space-10', description: '40px - Section padding', derivation: '40px' },
      { name: '--space-12', description: '48px - Large sections', derivation: '48px' },
      { name: '--space-16', description: '64px - Major sections', derivation: '64px' },
      { name: '--space-20', description: '80px - Page sections', derivation: '80px' },
      { name: '--space-24', description: '96px - Largest spacing', derivation: '96px' },
    ],
  },
  {
    title: 'Typography - Sizes',
    description: 'Font size scale',
    tokens: [
      { name: '--text-xs', description: 'Fine print, labels', derivation: '11px' },
      { name: '--text-sm', description: 'Small text, captions', derivation: '13px' },
      { name: '--text-base', description: 'Body text (default)', derivation: '15px' },
      { name: '--text-lg', description: 'Large body text', derivation: '17px' },
      { name: '--text-xl', description: 'Subheadings', derivation: '20px' },
      { name: '--text-2xl', description: 'Section headings', derivation: '24px' },
      { name: '--text-3xl', description: 'Page headings', derivation: '30px' },
      { name: '--text-4xl', description: 'Large headings', derivation: '36px' },
    ],
  },
  {
    title: 'Typography - Weights',
    description: 'Font weight scale',
    tokens: [
      { name: '--weight-normal', description: 'Regular text', derivation: '400' },
      { name: '--weight-medium', description: 'Slightly emphasized', derivation: '500' },
      { name: '--weight-semibold', description: 'Emphasized text', derivation: '600' },
      { name: '--weight-bold', description: 'Strong emphasis', derivation: '700' },
    ],
  },
  {
    title: 'Typography - Line Heights',
    description: 'Line height scale',
    tokens: [
      { name: '--leading-tight', description: 'Compact text', derivation: '1.25' },
      { name: '--leading-normal', description: 'Default line height', derivation: '1.5' },
      { name: '--leading-loose', description: 'Spacious text', derivation: '1.75' },
    ],
  },
  {
    title: 'Typography - Fonts',
    description: 'Font family stacks',
    tokens: [
      { name: '--font-sans', description: 'System sans-serif', derivation: 'System font stack' },
      { name: '--font-mono', description: 'Monospace font', derivation: 'Monospace stack' },
      { name: '--font-serif', description: 'Serif font', derivation: 'Serif stack' },
    ],
  },
  {
    title: 'Border Radius',
    description: 'Corner rounding scale',
    tokens: [
      { name: '--radius-sm', description: 'Subtle rounding', derivation: '2px' },
      { name: '--radius-md', description: 'Default (buttons)', derivation: '4px' },
      { name: '--radius-lg', description: 'Cards, panels', derivation: '8px' },
      { name: '--radius-xl', description: 'Large elements', derivation: '12px' },
      { name: '--radius-2xl', description: 'Extra large', derivation: '16px' },
      { name: '--radius-full', description: 'Pill/circle', derivation: '9999px' },
    ],
  },
  {
    title: 'Shadows',
    description: 'Elevation shadow scale',
    tokens: [
      { name: '--shadow-sm', description: 'Subtle shadow', derivation: 'Small offset, low opacity' },
      { name: '--shadow-md', description: 'Default card shadow', derivation: 'Medium offset' },
      { name: '--shadow-lg', description: 'Elevated elements', derivation: 'Larger offset' },
      { name: '--shadow-xl', description: 'Modals, overlays', derivation: 'Large multi-layer' },
      { name: '--shadow-inner', description: 'Inset shadow', derivation: 'Inset shadow' },
    ],
  },
  {
    title: 'Animation - Durations',
    description: 'Timing values for transitions',
    tokens: [
      { name: '--duration-fast', description: 'Micro-interactions', derivation: '100ms' },
      { name: '--duration-normal', description: 'Default transitions', derivation: '200ms' },
      { name: '--duration-slow', description: 'Larger animations', derivation: '300ms' },
    ],
  },
  {
    title: 'Animation - Easing',
    description: 'Timing functions',
    tokens: [
      { name: '--ease-default', description: 'General purpose', derivation: 'ease-out' },
      { name: '--ease-in', description: 'Enter animations', derivation: 'ease-in' },
      { name: '--ease-out', description: 'Exit animations', derivation: 'ease-out' },
      { name: '--ease-in-out', description: 'Continuous motion', derivation: 'ease-in-out' },
    ],
  },
];

// Component tokens
const componentTokens: TokenCategory[] = [
  {
    title: 'Button',
    description: 'Button-specific tokens',
    tokens: [
      { name: '--button-padding-x', description: 'Horizontal padding', derivation: 'var(--space-4)' },
      { name: '--button-padding-y', description: 'Vertical padding', derivation: 'var(--space-2)' },
      { name: '--button-radius', description: 'Border radius', derivation: 'var(--radius-md)' },
    ],
  },
  {
    title: 'Input',
    description: 'Input field tokens',
    tokens: [
      { name: '--input-height', description: 'Input field height', derivation: '40px' },
      { name: '--input-padding-x', description: 'Horizontal padding', derivation: 'var(--space-3)' },
    ],
  },
  {
    title: 'Containers',
    description: 'Container padding tokens',
    tokens: [
      { name: '--card-padding', description: 'Card content padding', derivation: 'var(--space-4)' },
      { name: '--modal-padding', description: 'Modal content padding', derivation: 'var(--space-6)' },
    ],
  },
  {
    title: 'Avatar',
    description: 'Avatar size presets',
    tokens: [
      { name: '--avatar-size-sm', description: 'Small avatar', derivation: '24px' },
      { name: '--avatar-size-md', description: 'Medium avatar', derivation: '32px' },
      { name: '--avatar-size-lg', description: 'Large avatar', derivation: '48px' },
    ],
  },
];

// Surface classes
const surfaceClasses = [
  { name: '.surface.base', description: 'Explicit reset to page defaults' },
  { name: '.surface.raised', description: 'Elevated (cards, panels) - lighter than page' },
  { name: '.surface.sunken', description: 'Recessed (sidebars, wells) - darker than page' },
  { name: '.surface.soft', description: 'Slightly muted background' },
  { name: '.surface.softer', description: 'More muted background' },
  { name: '.surface.strong', description: 'Higher contrast background' },
  { name: '.surface.stronger', description: 'Highest contrast background' },
  { name: '.surface.inverted', description: 'Opposite color scheme (dark↔light)' },
  { name: '.surface.primary', description: 'Primary color background (branded)' },
  { name: '.surface.success', description: 'Success feedback surface' },
  { name: '.surface.warning', description: 'Warning feedback surface' },
  { name: '.surface.danger', description: 'Danger feedback surface' },
  { name: '.surface.info', description: 'Info feedback surface' },
];

function isColorValue(value: string): boolean {
  if (!value) return false;
  return (
    value.startsWith('#') ||
    value.startsWith('rgb') ||
    value.startsWith('hsl') ||
    value.startsWith('oklch') ||
    value.startsWith('var(--')
  );
}

function TokenRow({ token, computedValue }: { token: TokenInfo; computedValue: string }) {
  const showSwatch = isColorValue(computedValue) && !computedValue.startsWith('var(');

  return (
    <tr className={styles.tokenTableRow}>
      <td className={styles.tokenNameCell}>
        <code className={styles.tokenName}>{token.name}</code>
      </td>
      <td className={styles.tokenValueCell}>
        {showSwatch && (
          <span
            className={styles.colorSwatch}
            style={{ background: computedValue }}
          />
        )}
        <code className={styles.tokenValue}>{computedValue || '—'}</code>
      </td>
      <td className={styles.tokenDescCell}>
        <span className={styles.tokenDesc}>{token.description}</span>
        {token.derivation && (
          <span className={styles.tokenDerivation}>{token.derivation}</span>
        )}
      </td>
    </tr>
  );
}

function TokenTable({
  category,
  computedValues,
}: {
  category: TokenCategory;
  computedValues: Record<string, string>;
}) {
  return (
    <div className={styles.category}>
      <h3 className={styles.categoryTitle}>{category.title}</h3>
      {category.description && (
        <p className={styles.categoryDesc}>{category.description}</p>
      )}
      <table className={styles.tokenTable}>
        <thead>
          <tr>
            <th className={styles.tokenTableHeader}>Token</th>
            <th className={styles.tokenTableHeader}>Value</th>
            <th className={styles.tokenTableHeader}>Description / Derivation</th>
          </tr>
        </thead>
        <tbody>
          {category.tokens.map((token) => (
            <TokenRow
              key={token.name}
              token={token}
              computedValue={computedValues[token.name] || ''}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Section({
  id,
  title,
  description,
  categories,
  computedValues,
}: {
  id: string;
  title: string;
  description: string;
  categories: TokenCategory[];
  computedValues: Record<string, string>;
}) {
  return (
    <section className={styles.section}>
      <h2 id={id} className={styles.sectionTitle}>{title}</h2>
      <p className={styles.sectionDesc}>{description}</p>
      <div className={styles.categories}>
        {categories.map((category) => (
          <TokenTable
            key={category.title}
            category={category}
            computedValues={computedValues}
          />
        ))}
      </div>
    </section>
  );
}

export function ReferencePage() {
  const [computedValues, setComputedValues] = useState<Record<string, string>>({});
  const contentRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const getAllTokenNames = useCallback(() => {
    const allCategories = [
      ...containerTokens,
      ...controlTokens,
      ...feedbackTokens,
      ...specialTokens,
      ...staticTokens,
      ...componentTokens,
    ];
    return allCategories.flatMap((cat) => cat.tokens.map((t) => t.name));
  }, []);

  const updateComputedValues = useCallback(() => {
    const root = document.documentElement;
    const computedStyles = getComputedStyle(root);
    const values: Record<string, string> = {};

    for (const tokenName of getAllTokenNames()) {
      const value = computedStyles.getPropertyValue(tokenName).trim();
      values[tokenName] = value;
    }

    setComputedValues(values);
  }, [getAllTokenNames]);

  useEffect(() => {
    updateComputedValues();

    // Watch for theme changes via class mutations on html element
    const observer = new MutationObserver(() => {
      updateComputedValues();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme', 'data-mode'],
    });

    return () => observer.disconnect();
  }, [updateComputedValues]);

  return (
    <div className={styles.pageLayout}>
      <div className={styles.content} ref={contentRef}>
        <article className={styles.reference}>
          <div className={styles.header}>
            <h1 className={styles.title}>Token Reference</h1>
            <p className={styles.subtitle}>
              Complete documentation of all UI-Kit design tokens. Values shown reflect the current theme.
            </p>
          </div>

          <Section
            id="container-tokens"
            title="Container Tokens"
            description="Tokens for static background regions. Each container role provides a complete set of background, text, and border tokens that ensure accessible contrast."
            categories={containerTokens}
            computedValues={computedValues}
          />

          <Section
            id="control-tokens"
            title="Control Tokens"
            description="Tokens for interactive elements with hover, pressed, and other state variations. Always pair -bg and -text tokens from the same control role."
            categories={controlTokens}
            computedValues={computedValues}
          />

          <Section
            id="feedback-tokens"
            title="Feedback Tokens"
            description="Semantic status colors that maintain consistent meaning across themes. Use for alerts, badges, and status indicators."
            categories={feedbackTokens}
            computedValues={computedValues}
          />

          <Section
            id="special-tokens"
            title="Special Tokens"
            description="Utility tokens for focus states, links, selections, and other specialized UI patterns."
            categories={specialTokens}
            computedValues={computedValues}
          />

          <Section
            id="static-tokens"
            title="Static Tokens"
            description="Fixed values that don't change with themes. These define the spacing grid, typography scale, and animation timing."
            categories={staticTokens}
            computedValues={computedValues}
          />

          <Section
            id="component-tokens"
            title="Component Tokens"
            description="Pre-configured shortcuts for common component patterns. Reference these for consistent sizing across components."
            categories={componentTokens}
            computedValues={computedValues}
          />

          <section className={styles.section}>
            <h2 id="surface-classes" className={styles.sectionTitle}>Surface Classes</h2>
            <p className={styles.sectionDesc}>
              CSS classes that create distinct visual contexts. Surfaces reset and override tokens to ensure components
              remain readable on different backgrounds. Use <code>--surface-*</code> tokens inside surface contexts.
            </p>
            <div className={styles.surfaceGrid}>
              {surfaceClasses.map((surface) => (
                <div key={surface.name} className={styles.surfaceCard}>
                  <code className={styles.surfaceName}>{surface.name}</code>
                  <span className={styles.surfaceDesc}>{surface.description}</span>
                </div>
              ))}
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
