import { getNode } from './getNode.js';
import type { DataBusChangeFunction } from './types/DataBusChangeFunction.js';
import type { DisposeFunction } from './types/DisposeFunction.js';
import type { DataBusState } from './types/DataBusState.js';
import type { DataBus } from './types/DataBus.js';

export function subscribe(
  state: DataBusState,
  bus: DataBus,
  path: string[],
  change: DataBusChangeFunction,
): DisposeFunction {
  const { node, nodePath } = getNode(state, path, true);
  const { value } = node;
  const pathString = path.join('/');

  node.subscribers ??= new Set<DataBusChangeFunction>();
  node.subscribers.add(change);

  // Fire the initial change with the value.
  if (value !== undefined) {
    change(value, value, path);
  }

  // Activate any deactivated providers available for this path.
  for (let index = nodePath.length - 1; index >= 0; index--) {
    const currentNode = nodePath[index];

    if (currentNode.providers?.length) {
      const activeProviders = (currentNode.activeProviders ??= {});

      currentNode.providers.forEach((provider) => {
        activeProviders[pathString] ??= { provider, count: 0 };

        if (activeProviders[pathString].count === 0) {
          provider.onActivate?.({ path, bus });
        }

        activeProviders[pathString].count++;
      });
    }
  }

  return () => {
    node.subscribers?.delete(change);

    // Deactivate providers.
    for (let index = nodePath.length - 1; index >= 0; index--) {
      const currentNode = nodePath[index];

      if (currentNode.providers?.length) {
        const activeRecord = currentNode.activeProviders?.[pathString];

        if (activeRecord) {
          activeRecord.count--;

          if (!activeRecord.count) {
            activeRecord?.provider.onDeactivate?.({ path, bus });
            delete currentNode.activeProviders?.[pathString];
          }
        }
      }
    }
  };
}
