// Types
export type {
  Delta,
  DeltaBuffer,
  DeltaOperation,
  SetOperation,
  DeleteOperation,
  MergeOperation,
  AppendOperation,
  SpliceOperation,
} from './types.js';

// Path utilities
export { getAtPath } from './getAtPath.js';
export { setAtPath } from './setAtPath.js';
export { deleteAtPath } from './deleteAtPath.js';

// Delta operations
export { applyOperation } from './applyOperation.js';
export { applyDelta } from './applyDelta.js';
export { diffValues } from './diffValues.js';
export { createDelta } from './createDelta.js';

// Delta buffer
export { createDeltaBuffer } from './createDeltaBuffer.js';
export { addToDeltaBuffer } from './addToDeltaBuffer.js';
export { getDeltasSince } from './getDeltasSince.js';
