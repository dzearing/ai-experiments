/**
 * Standalone surfaces export
 *
 * This file is the entry point for the 'surfaces' export.
 * It re-exports everything from the surfaces module for convenience.
 */

export {
  // Types
  type TonalSurface,
  type FeedbackSurface,
  type SurfaceType,
  type SurfaceTokens,
  type SurfaceState,
  type ComponentTokens,
  type SpecialTokens,

  // Constants
  tonalSurfaces,
  feedbackSurfaces,
  surfaceTypes,

  // Functions
  isSurfaceType,
  isTonalSurface,
  isFeedbackSurface,
  surfaceClassName,
  getSurfaceClasses,
} from './surfaces/index';
