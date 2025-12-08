/**
 * Surface type definitions
 *
 * Surfaces are the foundational concept of UI-Kit. Each surface represents
 * a distinct visual context with its own color tokens that automatically
 * ensure accessibility.
 */

/**
 * Container surfaces - static backgrounds for content regions
 */
export type ContainerSurface =
  | 'page'     // Main application background
  | 'card'     // Elevated content containers
  | 'overlay'  // Modals, dialogs, sheets
  | 'popout'   // Dropdowns, menus, tooltips (highest elevation)
  | 'inset';   // Recessed areas (input fields, wells)

/**
 * Control surfaces - interactive elements
 */
export type ControlSurface =
  | 'control'          // Default interactive (buttons, list items)
  | 'controlPrimary'   // Primary actions (CTA buttons, selected states)
  | 'controlDanger'    // Destructive actions
  | 'controlSubtle'    // Ghost/minimal buttons, tabs
  | 'controlDisabled'; // Non-interactive state

/**
 * Feedback surfaces - status communication
 */
export type FeedbackSurface =
  | 'success'  // Positive outcomes, confirmations
  | 'warning'  // Caution, attention needed
  | 'danger'   // Errors, destructive states
  | 'info';    // Informational, neutral status

/**
 * All standard surfaces
 */
export type Surface = ContainerSurface | ControlSurface | FeedbackSurface;

/**
 * Surface token properties
 */
export interface SurfaceTokens {
  // Background
  bg: string;
  'bg-hover'?: string;
  'bg-pressed'?: string;
  'bg-focus'?: string;

  // Text
  text: string;
  'text-soft'?: string;
  'text-softer'?: string;
  'text-hard'?: string;
  'text-hover'?: string;
  'text-pressed'?: string;

  // Border
  border: string;
  'border-hover'?: string;
  'border-pressed'?: string;
  'border-focus'?: string;

  // Shadow
  shadow?: string;

  // Icon (for feedback surfaces)
  icon?: string;
}

/**
 * Surface state modifiers
 */
export type SurfaceState = 'hover' | 'pressed' | 'focus' | 'selected' | 'disabled';

/**
 * Component shortcut tokens
 */
export interface ComponentTokens {
  '--button-padding-x': string;
  '--button-padding-y': string;
  '--button-radius': string;
  '--input-height': string;
  '--input-padding-x': string;
  '--card-padding': string;
  '--modal-padding': string;
  '--avatar-size-sm': string;
  '--avatar-size-md': string;
  '--avatar-size-lg': string;
}

/**
 * Special tokens (focus, selection, links, scrollbar)
 */
export interface SpecialTokens {
  // Focus ring
  '--focus-ring': string;
  '--focus-ring-offset': string;
  '--focus-ring-width': string;

  // Text selection
  '--selection-bg': string;
  '--selection-text': string;

  // Links
  '--link': string;
  '--link-hover': string;
  '--link-pressed': string;
  '--link-visited': string;

  // Scrollbar
  '--scrollbar-track': string;
  '--scrollbar-thumb': string;
  '--scrollbar-thumb-hover': string;

  // Highlight
  '--highlight-bg': string;
  '--highlight-text': string;
}
