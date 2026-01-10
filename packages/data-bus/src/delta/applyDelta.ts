import type { Delta } from './types.js';
import { applyOperation } from './applyOperation.js';

/**
 * Applies a delta to state, returning a new state object.
 *
 * @param state The current state.
 * @param delta The delta to apply.
 * @returns The new state after applying all operations in the delta.
 */
export function applyDelta<T>(state: T, delta: Delta): T {
  let result = state;

  for (const operation of delta.operations) {
    result = applyOperation(result, operation);
  }

  return result;
}
