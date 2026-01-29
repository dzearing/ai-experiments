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

// Tonal color groups - create visual hierarchy through lightness variation
const tonalGroupTokens: TokenCategory[] = [
  {
    title: 'Softer',
    description: 'Darkest in light mode, recessed - input backgrounds, wells, code blocks',
    tokens: [
      { name: '--softer-bg', description: 'Background', derivation: 'Recessed background' },
      { name: '--softer-bg-hover', description: 'Hover state', derivation: 'Slightly lighter/darker' },
      { name: '--softer-bg-pressed', description: 'Pressed state', derivation: 'More contrast' },
      { name: '--softer-bg-disabled', description: 'Disabled state', derivation: 'Muted' },
      { name: '--softer-border', description: 'Default border', derivation: 'Contrasts with bg' },
      { name: '--softer-border-hover', description: 'Hover border', derivation: 'Slightly stronger' },
      { name: '--softer-border-pressed', description: 'Pressed border', derivation: 'Strongest' },
      { name: '--softer-border-disabled', description: 'Disabled border', derivation: 'Muted' },
      { name: '--softer-fg', description: 'Primary text', derivation: 'Contrasts with softer-bg' },
      { name: '--softer-fg-soft', description: 'Secondary text', derivation: 'Less contrast' },
      { name: '--softer-fg-softer', description: 'Tertiary text', derivation: 'Subtle' },
      { name: '--softer-fg-strong', description: 'Emphasized text', derivation: 'More contrast' },
      { name: '--softer-fg-stronger', description: 'Maximum emphasis', derivation: 'Pure black/white' },
      { name: '--softer-fg-primary', description: 'Primary accent', derivation: 'Accessible on softer-bg' },
      { name: '--softer-fg-danger', description: 'Error color', derivation: 'Accessible on softer-bg' },
      { name: '--softer-fg-success', description: 'Success color', derivation: 'Accessible on softer-bg' },
      { name: '--softer-fg-warning', description: 'Warning color', derivation: 'Accessible on softer-bg' },
      { name: '--softer-fg-info', description: 'Info color', derivation: 'Accessible on softer-bg' },
    ],
  },
  {
    title: 'Soft',
    description: 'Slightly elevated - cards, panels, alternating rows',
    tokens: [
      { name: '--soft-bg', description: 'Background', derivation: 'Slightly elevated' },
      { name: '--soft-bg-hover', description: 'Hover state', derivation: 'Slightly lighter/darker' },
      { name: '--soft-bg-pressed', description: 'Pressed state', derivation: 'More contrast' },
      { name: '--soft-bg-disabled', description: 'Disabled state', derivation: 'Muted' },
      { name: '--soft-border', description: 'Default border', derivation: 'Contrasts with bg' },
      { name: '--soft-border-hover', description: 'Hover border', derivation: 'Slightly stronger' },
      { name: '--soft-border-pressed', description: 'Pressed border', derivation: 'Strongest' },
      { name: '--soft-border-disabled', description: 'Disabled border', derivation: 'Muted' },
      { name: '--soft-fg', description: 'Primary text', derivation: 'Contrasts with soft-bg' },
      { name: '--soft-fg-soft', description: 'Secondary text', derivation: 'Less contrast' },
      { name: '--soft-fg-softer', description: 'Tertiary text', derivation: 'Subtle' },
      { name: '--soft-fg-strong', description: 'Emphasized text', derivation: 'More contrast' },
      { name: '--soft-fg-stronger', description: 'Maximum emphasis', derivation: 'Pure black/white' },
      { name: '--soft-fg-primary', description: 'Primary accent', derivation: 'Accessible on soft-bg' },
      { name: '--soft-fg-danger', description: 'Error color', derivation: 'Accessible on soft-bg' },
      { name: '--soft-fg-success', description: 'Success color', derivation: 'Accessible on soft-bg' },
      { name: '--soft-fg-warning', description: 'Warning color', derivation: 'Accessible on soft-bg' },
      { name: '--soft-fg-info', description: 'Info color', derivation: 'Accessible on soft-bg' },
    ],
  },
  {
    title: 'Base',
    description: 'Page background - default starting point',
    tokens: [
      { name: '--base-bg', description: 'Page background', derivation: 'Theme base color' },
      { name: '--base-bg-hover', description: 'Hover state', derivation: 'Slightly lighter/darker' },
      { name: '--base-bg-pressed', description: 'Pressed state', derivation: 'More contrast' },
      { name: '--base-bg-disabled', description: 'Disabled state', derivation: 'Muted' },
      { name: '--base-border', description: 'Default border', derivation: 'Contrasts with bg' },
      { name: '--base-border-hover', description: 'Hover border', derivation: 'Slightly stronger' },
      { name: '--base-border-pressed', description: 'Pressed border', derivation: 'Strongest' },
      { name: '--base-border-disabled', description: 'Disabled border', derivation: 'Muted' },
      { name: '--base-fg', description: 'Primary text', derivation: 'Contrasts with base-bg' },
      { name: '--base-fg-soft', description: 'Secondary text', derivation: 'Less contrast' },
      { name: '--base-fg-softer', description: 'Tertiary text', derivation: 'Subtle' },
      { name: '--base-fg-strong', description: 'Emphasized text', derivation: 'More contrast' },
      { name: '--base-fg-stronger', description: 'Maximum emphasis', derivation: 'Pure black/white' },
      { name: '--base-fg-primary', description: 'Primary accent', derivation: 'Accessible on base-bg' },
      { name: '--base-fg-danger', description: 'Error color', derivation: 'Accessible on base-bg' },
      { name: '--base-fg-success', description: 'Success color', derivation: 'Accessible on base-bg' },
      { name: '--base-fg-warning', description: 'Warning color', derivation: 'Accessible on base-bg' },
      { name: '--base-fg-info', description: 'Info color', derivation: 'Accessible on base-bg' },
    ],
  },
  {
    title: 'Strong',
    description: 'Emphasized - default buttons, highlights',
    tokens: [
      { name: '--strong-bg', description: 'Background', derivation: 'Emphasized background' },
      { name: '--strong-bg-hover', description: 'Hover state', derivation: 'Slightly lighter/darker' },
      { name: '--strong-bg-pressed', description: 'Pressed state', derivation: 'More contrast' },
      { name: '--strong-bg-disabled', description: 'Disabled state', derivation: 'Muted' },
      { name: '--strong-border', description: 'Default border', derivation: 'Contrasts with bg' },
      { name: '--strong-border-hover', description: 'Hover border', derivation: 'Slightly stronger' },
      { name: '--strong-border-pressed', description: 'Pressed border', derivation: 'Strongest' },
      { name: '--strong-border-disabled', description: 'Disabled border', derivation: 'Muted' },
      { name: '--strong-fg', description: 'Primary text', derivation: 'Contrasts with strong-bg' },
      { name: '--strong-fg-soft', description: 'Secondary text', derivation: 'Less contrast' },
      { name: '--strong-fg-softer', description: 'Tertiary text', derivation: 'Subtle' },
      { name: '--strong-fg-strong', description: 'Emphasized text', derivation: 'More contrast' },
      { name: '--strong-fg-stronger', description: 'Maximum emphasis', derivation: 'Pure black/white' },
      { name: '--strong-fg-primary', description: 'Primary accent', derivation: 'Accessible on strong-bg' },
      { name: '--strong-fg-danger', description: 'Error color', derivation: 'Accessible on strong-bg' },
      { name: '--strong-fg-success', description: 'Success color', derivation: 'Accessible on strong-bg' },
      { name: '--strong-fg-warning', description: 'Warning color', derivation: 'Accessible on strong-bg' },
      { name: '--strong-fg-info', description: 'Info color', derivation: 'Accessible on strong-bg' },
    ],
  },
  {
    title: 'Stronger',
    description: 'Maximum emphasis - very strong emphasis without semantic color',
    tokens: [
      { name: '--stronger-bg', description: 'Background', derivation: 'Maximum emphasis background' },
      { name: '--stronger-bg-hover', description: 'Hover state', derivation: 'Slightly lighter/darker' },
      { name: '--stronger-bg-pressed', description: 'Pressed state', derivation: 'More contrast' },
      { name: '--stronger-bg-disabled', description: 'Disabled state', derivation: 'Muted' },
      { name: '--stronger-border', description: 'Default border', derivation: 'Contrasts with bg' },
      { name: '--stronger-border-hover', description: 'Hover border', derivation: 'Slightly stronger' },
      { name: '--stronger-border-pressed', description: 'Pressed border', derivation: 'Strongest' },
      { name: '--stronger-border-disabled', description: 'Disabled border', derivation: 'Muted' },
      { name: '--stronger-fg', description: 'Primary text', derivation: 'Contrasts with stronger-bg' },
      { name: '--stronger-fg-soft', description: 'Secondary text', derivation: 'Less contrast' },
      { name: '--stronger-fg-softer', description: 'Tertiary text', derivation: 'Subtle' },
      { name: '--stronger-fg-strong', description: 'Emphasized text', derivation: 'More contrast' },
      { name: '--stronger-fg-stronger', description: 'Maximum emphasis', derivation: 'Pure black/white' },
      { name: '--stronger-fg-primary', description: 'Primary accent', derivation: 'Accessible on stronger-bg' },
      { name: '--stronger-fg-danger', description: 'Error color', derivation: 'Accessible on stronger-bg' },
      { name: '--stronger-fg-success', description: 'Success color', derivation: 'Accessible on stronger-bg' },
      { name: '--stronger-fg-warning', description: 'Warning color', derivation: 'Accessible on stronger-bg' },
      { name: '--stronger-fg-info', description: 'Info color', derivation: 'Accessible on stronger-bg' },
    ],
  },
];

// Semantic color groups - carry meaning through color
const semanticGroupTokens: TokenCategory[] = [
  {
    title: 'Primary',
    description: 'Brand color - primary buttons, selected states, active elements',
    tokens: [
      { name: '--primary-bg', description: 'Primary background', derivation: 'Theme primary color' },
      { name: '--primary-bg-hover', description: 'Hover state', derivation: 'Darker/lighter primary' },
      { name: '--primary-bg-pressed', description: 'Pressed state', derivation: 'More contrast' },
      { name: '--primary-bg-disabled', description: 'Disabled state', derivation: 'Muted primary' },
      { name: '--primary-border', description: 'Default border', derivation: 'Usually transparent or subtle' },
      { name: '--primary-border-hover', description: 'Hover border', derivation: 'Slightly stronger' },
      { name: '--primary-border-pressed', description: 'Pressed border', derivation: 'Strongest' },
      { name: '--primary-border-disabled', description: 'Disabled border', derivation: 'Muted' },
      { name: '--primary-fg', description: 'Text on primary', derivation: 'Auto contrast (usually white)' },
      { name: '--primary-fg-soft', description: 'Secondary text', derivation: 'Slightly transparent' },
      { name: '--primary-fg-softer', description: 'Tertiary text', derivation: 'More transparent' },
      { name: '--primary-fg-strong', description: 'Emphasized text', derivation: 'Full opacity' },
      { name: '--primary-fg-stronger', description: 'Maximum emphasis', derivation: 'Pure white/black' },
      { name: '--primary-fg-primary', description: 'Accent on primary', derivation: 'Usually white' },
      { name: '--primary-fg-danger', description: 'Error on primary', derivation: 'Light red' },
      { name: '--primary-fg-success', description: 'Success on primary', derivation: 'Light green' },
      { name: '--primary-fg-warning', description: 'Warning on primary', derivation: 'Light amber' },
      { name: '--primary-fg-info', description: 'Info on primary', derivation: 'Light blue' },
    ],
  },
  {
    title: 'Inverted',
    description: 'Opposite scheme - tooltips (dark in light mode, light in dark mode)',
    tokens: [
      { name: '--inverted-bg', description: 'Inverted background', derivation: 'Opposite of page bg' },
      { name: '--inverted-bg-hover', description: 'Hover state', derivation: 'Slightly adjusted' },
      { name: '--inverted-bg-pressed', description: 'Pressed state', derivation: 'More contrast' },
      { name: '--inverted-bg-disabled', description: 'Disabled state', derivation: 'Muted' },
      { name: '--inverted-border', description: 'Default border', derivation: 'Contrasts with inverted-bg' },
      { name: '--inverted-border-hover', description: 'Hover border', derivation: 'Slightly stronger' },
      { name: '--inverted-border-pressed', description: 'Pressed border', derivation: 'Strongest' },
      { name: '--inverted-border-disabled', description: 'Disabled border', derivation: 'Muted' },
      { name: '--inverted-fg', description: 'Text on inverted', derivation: 'Contrasts with inverted-bg' },
      { name: '--inverted-fg-soft', description: 'Secondary text', derivation: 'Less contrast' },
      { name: '--inverted-fg-softer', description: 'Tertiary text', derivation: 'Subtle' },
      { name: '--inverted-fg-strong', description: 'Emphasized text', derivation: 'More contrast' },
      { name: '--inverted-fg-stronger', description: 'Maximum emphasis', derivation: 'Pure white/black' },
      { name: '--inverted-fg-primary', description: 'Primary on inverted', derivation: 'Accessible primary' },
      { name: '--inverted-fg-danger', description: 'Error on inverted', derivation: 'Accessible red' },
      { name: '--inverted-fg-success', description: 'Success on inverted', derivation: 'Accessible green' },
      { name: '--inverted-fg-warning', description: 'Warning on inverted', derivation: 'Accessible amber' },
      { name: '--inverted-fg-info', description: 'Info on inverted', derivation: 'Accessible blue' },
    ],
  },
  {
    title: 'Success',
    description: 'Positive outcomes - success toasts, confirmations',
    tokens: [
      { name: '--success-bg', description: 'Success background', derivation: 'Green-based' },
      { name: '--success-bg-hover', description: 'Hover state', derivation: 'Darker/lighter green' },
      { name: '--success-bg-pressed', description: 'Pressed state', derivation: 'More contrast' },
      { name: '--success-bg-disabled', description: 'Disabled state', derivation: 'Muted green' },
      { name: '--success-border', description: 'Default border', derivation: 'Subtle or transparent' },
      { name: '--success-border-hover', description: 'Hover border', derivation: 'Slightly stronger' },
      { name: '--success-border-pressed', description: 'Pressed border', derivation: 'Strongest' },
      { name: '--success-border-disabled', description: 'Disabled border', derivation: 'Muted' },
      { name: '--success-fg', description: 'Text on success', derivation: 'Auto contrast' },
      { name: '--success-fg-soft', description: 'Secondary text', derivation: 'Slightly transparent' },
      { name: '--success-fg-softer', description: 'Tertiary text', derivation: 'More transparent' },
      { name: '--success-fg-strong', description: 'Emphasized text', derivation: 'Full opacity' },
      { name: '--success-fg-stronger', description: 'Maximum emphasis', derivation: 'Pure white/black' },
    ],
  },
  {
    title: 'Warning',
    description: 'Caution states - warning toasts, attention needed',
    tokens: [
      { name: '--warning-bg', description: 'Warning background', derivation: 'Amber-based' },
      { name: '--warning-bg-hover', description: 'Hover state', derivation: 'Darker/lighter amber' },
      { name: '--warning-bg-pressed', description: 'Pressed state', derivation: 'More contrast' },
      { name: '--warning-bg-disabled', description: 'Disabled state', derivation: 'Muted amber' },
      { name: '--warning-border', description: 'Default border', derivation: 'Subtle or transparent' },
      { name: '--warning-border-hover', description: 'Hover border', derivation: 'Slightly stronger' },
      { name: '--warning-border-pressed', description: 'Pressed border', derivation: 'Strongest' },
      { name: '--warning-border-disabled', description: 'Disabled border', derivation: 'Muted' },
      { name: '--warning-fg', description: 'Text on warning', derivation: 'Auto contrast (usually black)' },
      { name: '--warning-fg-soft', description: 'Secondary text', derivation: 'Slightly transparent' },
      { name: '--warning-fg-softer', description: 'Tertiary text', derivation: 'More transparent' },
      { name: '--warning-fg-strong', description: 'Emphasized text', derivation: 'Full opacity' },
      { name: '--warning-fg-stronger', description: 'Maximum emphasis', derivation: 'Pure black' },
    ],
  },
  {
    title: 'Danger',
    description: 'Errors/destructive - error toasts, destructive alerts',
    tokens: [
      { name: '--danger-bg', description: 'Danger background', derivation: 'Red-based' },
      { name: '--danger-bg-hover', description: 'Hover state', derivation: 'Darker/lighter red' },
      { name: '--danger-bg-pressed', description: 'Pressed state', derivation: 'More contrast' },
      { name: '--danger-bg-disabled', description: 'Disabled state', derivation: 'Muted red' },
      { name: '--danger-border', description: 'Default border', derivation: 'Subtle or transparent' },
      { name: '--danger-border-hover', description: 'Hover border', derivation: 'Slightly stronger' },
      { name: '--danger-border-pressed', description: 'Pressed border', derivation: 'Strongest' },
      { name: '--danger-border-disabled', description: 'Disabled border', derivation: 'Muted' },
      { name: '--danger-fg', description: 'Text on danger', derivation: 'Auto contrast (usually white)' },
      { name: '--danger-fg-soft', description: 'Secondary text', derivation: 'Slightly transparent' },
      { name: '--danger-fg-softer', description: 'Tertiary text', derivation: 'More transparent' },
      { name: '--danger-fg-strong', description: 'Emphasized text', derivation: 'Full opacity' },
      { name: '--danger-fg-stronger', description: 'Maximum emphasis', derivation: 'Pure white' },
    ],
  },
  {
    title: 'Info',
    description: 'Informational - info toasts, neutral status',
    tokens: [
      { name: '--info-bg', description: 'Info background', derivation: 'Blue-based' },
      { name: '--info-bg-hover', description: 'Hover state', derivation: 'Darker/lighter blue' },
      { name: '--info-bg-pressed', description: 'Pressed state', derivation: 'More contrast' },
      { name: '--info-bg-disabled', description: 'Disabled state', derivation: 'Muted blue' },
      { name: '--info-border', description: 'Default border', derivation: 'Subtle or transparent' },
      { name: '--info-border-hover', description: 'Hover border', derivation: 'Slightly stronger' },
      { name: '--info-border-pressed', description: 'Pressed border', derivation: 'Strongest' },
      { name: '--info-border-disabled', description: 'Disabled border', derivation: 'Muted' },
      { name: '--info-fg', description: 'Text on info', derivation: 'Auto contrast (usually white)' },
      { name: '--info-fg-soft', description: 'Secondary text', derivation: 'Slightly transparent' },
      { name: '--info-fg-softer', description: 'Tertiary text', derivation: 'More transparent' },
      { name: '--info-fg-strong', description: 'Emphasized text', derivation: 'Full opacity' },
      { name: '--info-fg-stronger', description: 'Maximum emphasis', derivation: 'Pure white' },
    ],
  },
];

// Feedback tokens - soft tinted backgrounds for alerts/cards
const feedbackTokens: TokenCategory[] = [
  {
    title: 'Feedback Success',
    description: 'Soft tinted backgrounds for success alerts, notifications, and cards',
    tokens: [
      { name: '--feedback-success-bg', description: 'Soft success background', derivation: 'Light green tint' },
      { name: '--feedback-success-bg-hover', description: 'Hover state', derivation: 'Slightly darker' },
      { name: '--feedback-success-fg', description: 'Text on feedback bg', derivation: 'Dark green' },
      { name: '--feedback-success-border', description: 'Border color', derivation: 'Medium green' },
    ],
  },
  {
    title: 'Feedback Warning',
    description: 'Soft tinted backgrounds for warning alerts, notifications, and cards',
    tokens: [
      { name: '--feedback-warning-bg', description: 'Soft warning background', derivation: 'Light amber tint' },
      { name: '--feedback-warning-bg-hover', description: 'Hover state', derivation: 'Slightly darker' },
      { name: '--feedback-warning-fg', description: 'Text on feedback bg', derivation: 'Dark amber' },
      { name: '--feedback-warning-border', description: 'Border color', derivation: 'Medium amber' },
    ],
  },
  {
    title: 'Feedback Danger',
    description: 'Soft tinted backgrounds for error alerts, notifications, and cards',
    tokens: [
      { name: '--feedback-danger-bg', description: 'Soft danger background', derivation: 'Light red tint' },
      { name: '--feedback-danger-bg-hover', description: 'Hover state', derivation: 'Slightly darker' },
      { name: '--feedback-danger-fg', description: 'Text on feedback bg', derivation: 'Dark red' },
      { name: '--feedback-danger-border', description: 'Border color', derivation: 'Medium red' },
    ],
  },
  {
    title: 'Feedback Info',
    description: 'Soft tinted backgrounds for info alerts, notifications, and cards',
    tokens: [
      { name: '--feedback-info-bg', description: 'Soft info background', derivation: 'Light blue tint' },
      { name: '--feedback-info-bg-hover', description: 'Hover state', derivation: 'Slightly darker' },
      { name: '--feedback-info-fg', description: 'Text on feedback bg', derivation: 'Dark blue' },
      { name: '--feedback-info-border', description: 'Border color', derivation: 'Medium blue' },
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
    title: 'Control Heights',
    description: 'Standard heights for interactive controls',
    tokens: [
      { name: '--control-height-sm', description: 'Small control height', derivation: '28px' },
      { name: '--control-height-md', description: 'Medium control height', derivation: '36px' },
      { name: '--control-height-lg', description: 'Large control height', derivation: '44px' },
    ],
  },
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
      ...tonalGroupTokens,
      ...semanticGroupTokens,
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
            <div className={styles.goldenRule}>
              <h3>The Golden Rule</h3>
              <p>
                <strong>Pick a color group for your background, use ONLY that group's tokens for text and borders.</strong>
                {' '}Contrast is guaranteed when you stay within the same group.
              </p>
              <pre className={styles.codeExample}>
{`/* ✅ CORRECT - all tokens from the same group */
.primary-button {
  background: var(--primary-bg);
  color: var(--primary-fg);
  border: 1px solid var(--primary-border);
}

/* ❌ WRONG - mixing groups breaks contrast */
.broken {
  background: var(--primary-bg);
  color: var(--base-fg);  /* May not be readable! */
}`}
              </pre>
            </div>
          </div>

          <Section
            id="tonal-groups"
            title="Tonal Color Groups"
            description="Create visual hierarchy through lightness variation. Each group includes background, border, and foreground tokens that work together with guaranteed contrast."
            categories={tonalGroupTokens}
            computedValues={computedValues}
          />

          <Section
            id="semantic-groups"
            title="Semantic Color Groups"
            description="Carry meaning through color. Use for primary actions, inverted contexts, and feedback states. Each group provides a complete set of tokens for building components on that background."
            categories={semanticGroupTokens}
            computedValues={computedValues}
          />

          <Section
            id="feedback-tokens"
            title="Feedback Tokens"
            description="Soft tinted backgrounds for alerts, notifications, and cards. These provide a lighter alternative to the full semantic backgrounds."
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
              remain readable on different backgrounds. Every <code>.surface</code> element resets ALL tokens to page defaults,
              then applies overrides specific to that surface variant.
            </p>
            <pre className={styles.codeExample}>
{`<!-- Components inside a surface automatically get appropriate token values -->
<div class="surface raised">
  <button>This button works correctly</button>
</div>

<!-- Nested surfaces reset properly - no compounding issues -->
<div class="surface sunken">
  <p>Sunken area</p>
  <div class="surface raised">
    <p>Raised card inside - tokens reset</p>
  </div>
</div>`}
            </pre>
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
