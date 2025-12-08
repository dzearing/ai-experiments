/**
 * Token exports
 */
export * from './spacing';
export * from './typography';
export * from './radii';
export * from './shadows';
export * from './animation';

import { spacingTokens } from './spacing';
import { typographyTokens } from './typography';
import { radiiTokens } from './radii';
import { shadowTokens } from './shadows';
import { animationTokens } from './animation';

/**
 * All static tokens (non-color)
 */
export const staticTokens = {
  ...spacingTokens,
  ...typographyTokens,
  ...radiiTokens,
  ...shadowTokens,
  ...animationTokens,
} as const;

export type StaticToken = keyof typeof staticTokens;
