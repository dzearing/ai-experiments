import { getNode } from './getNode.js';
import type { DataBusProvider } from './types/DataBusProvider.js';
import type { DataBusState } from './types/DataBusState.js';

/**
 * Adds a provider.
 */
export function addProvider(state: DataBusState, provider: DataBusProvider): void {
  const { node } = getNode(state, provider.path, true);

  node.providers ??= [];
  node.providers.push(provider);
}
