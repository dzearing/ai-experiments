import type { DeltaOperation } from './types.js';
import { getAtPath } from './getAtPath.js';
import { setAtPath } from './setAtPath.js';
import { deleteAtPath } from './deleteAtPath.js';

/**
 * Applies a single delta operation to state, returning a new state.
 *
 * @param state The current state.
 * @param operation The operation to apply.
 * @returns The new state after applying the operation.
 */
export function applyOperation<T>(state: T, operation: DeltaOperation): T {
  switch (operation.op) {
    case 'set':
      return setAtPath(state, operation.path, operation.value);

    case 'delete':
      return deleteAtPath(state, operation.path);

    case 'merge': {
      const current = getAtPath(state, operation.path) ?? {};
      const merged = { ...(current as object), ...operation.value };

      return setAtPath(state, operation.path, merged);
    }

    case 'append': {
      const array = getAtPath(state, operation.path);

      if (!Array.isArray(array)) {
        return setAtPath(state, operation.path, [operation.value]);
      }

      return setAtPath(state, operation.path, [...array, operation.value]);
    }

    case 'splice': {
      const array = getAtPath(state, operation.path);

      if (!Array.isArray(array)) {
        return state;
      }

      const newArray = [...array];

      newArray.splice(operation.index, operation.deleteCount, ...(operation.items ?? []));

      return setAtPath(state, operation.path, newArray);
    }

    default:
      return state;
  }
}
