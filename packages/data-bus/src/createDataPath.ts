import type { z } from 'zod';
import type { DataBusPath } from './types/DataBusPath.js';

/**
 * Helper to make source typing and paths joined in a structure.
 */
export function createDataPath<TZodType extends z.ZodType>(options: {
  path: string[];
  type: TZodType;
}): DataBusPath<TZodType> {
  return options;
}
