/**
 * Standalone surfaces export
 *
 * This file is the entry point for the 'surfaces' export.
 * It re-exports everything from the surfaces module for convenience.
 */

export {
  // Types
  type Surface,
  type ContainerSurface,
  type ControlSurface,
  type FeedbackSurface,
  type SurfaceTokens,
  type SurfaceState,
  type ComponentTokens,
  type SpecialTokens,

  // Constants
  containerSurfaces,
  controlSurfaces,
  feedbackSurfaces,
  surfaces,

  // Functions
  getTokenNamesForSurface,
  surfaceTokenName,
  surfaceClassName,
  isSurface,
} from './surfaces/index';
