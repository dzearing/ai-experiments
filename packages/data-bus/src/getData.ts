import type { DataBusState } from './types/DataBusState.js';
import { getNode } from './getNode.js';

/**
 * Gets data containing the corresponding props.
 */
export function getData<TData>(state: DataBusState, path: string[]): TData | undefined {
  const { node } = getNode(state, path);

  return node?.value as TData | undefined;
}
