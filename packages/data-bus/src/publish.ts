import type { DataBusState } from './types/DataBusState.js';
import type { DataBus } from './types/DataBus.js';
import { getNode } from './getNode.js';

/**
 * Publishes data to a given dataPath/Id.
 */
export function publish<TData>(state: DataBusState, bus: DataBus, path: string[], value: TData): void {
  const { node, nodePath } = getNode(state, path, true);
  const oldValue = node.value as TData;

  // Notify pre-publishing providers and allow them to apply transforms or publish additional metadata.
  for (let i = nodePath.length - 1; i >= 0; i--) {
    nodePath[i].providers?.forEach((provider) => {
      const newValue = provider.onPublish?.({ bus, value, oldValue, path }) as TData | undefined;

      if (newValue !== undefined) {
        value = newValue;
      }
    });
  }

  node.value = value;

  // Notify subscribers
  for (let i = nodePath.length - 1; i >= 0; i--) {
    nodePath[i].subscribers?.forEach((subscriber) => subscriber(value, oldValue, path));
  }
}
