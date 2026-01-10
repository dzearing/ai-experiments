import type { DeltaOperation } from './types.js';

/**
 * Computes the differences between two values and returns delta operations.
 *
 * @param oldValue The previous value.
 * @param newValue The new value.
 * @param path The current path (used recursively).
 * @returns Array of delta operations representing the changes.
 */
export function diffValues(oldValue: unknown, newValue: unknown, path: string[]): DeltaOperation[] {
  // Same reference or value - no change
  if (oldValue === newValue) {
    return [];
  }

  // Handle null/undefined cases
  if (newValue === null || newValue === undefined) {
    if (oldValue !== null && oldValue !== undefined) {
      return [{ op: 'delete', path }];
    }

    return [];
  }

  if (oldValue === null || oldValue === undefined) {
    return [{ op: 'set', path, value: newValue }];
  }

  // Different types - full replacement
  const oldType = typeof oldValue;
  const newType = typeof newValue;

  if (oldType !== newType) {
    return [{ op: 'set', path, value: newValue }];
  }

  // Arrays - compare element by element
  if (Array.isArray(oldValue) && Array.isArray(newValue)) {
    // For simplicity, do full replacement if arrays differ in length
    // A more sophisticated implementation could detect splices
    if (oldValue.length !== newValue.length) {
      return [{ op: 'set', path, value: newValue }];
    }

    const operations: DeltaOperation[] = [];

    for (let i = 0; i < newValue.length; i++) {
      const childOps = diffValues(oldValue[i], newValue[i], [...path, String(i)]);

      operations.push(...childOps);
    }

    return operations;
  }

  // Objects - compare properties
  if (oldType === 'object') {
    const oldObj = oldValue as Record<string, unknown>;
    const newObj = newValue as Record<string, unknown>;
    const operations: DeltaOperation[] = [];
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

    for (const key of allKeys) {
      const childOps = diffValues(oldObj[key], newObj[key], [...path, key]);

      operations.push(...childOps);
    }

    return operations;
  }

  // Primitives - simple replacement
  if (oldValue !== newValue) {
    return [{ op: 'set', path, value: newValue }];
  }

  return [];
}
