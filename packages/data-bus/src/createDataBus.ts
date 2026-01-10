import { addProvider } from './addProvider.js';
import { createNode } from './createNode.js';
import { getData } from './getData.js';
import { publish } from './publish.js';
import { subscribe } from './subscribe.js';
import type { DataBusChangeFunction } from './types/DataBusChangeFunction.js';
import type { DataBusProvider } from './types/DataBusProvider.js';
import type { DataBusState } from './types/DataBusState.js';
import type { DataBus } from './types/DataBus.js';
import type { DisposeFunction } from './types/DisposeFunction.js';
import type { DataBusPath } from './index.js';

/**
 * Creates a new data bus instance.
 */
export function createDataBus(): DataBus {
  const state: DataBusState = {
    root: createNode(),
  };

  const disposables: DisposeFunction[] = [];

  const bus: DataBus = {
    publish<TData>(path: string[] | DataBusPath, value: TData) {
      const publishPath = Array.isArray(path) ? path : path.path;

      return publish(state, bus, publishPath, value);
    },

    getData<TData>(path: string[] | DataBusPath) {
      const publishPath = Array.isArray(path) ? path : path.path;

      return getData<TData>(state, publishPath);
    },

    subscribe(path: string[] | DataBusPath, change: DataBusChangeFunction) {
      const publishPath = Array.isArray(path) ? path : path.path;
      const internalDispose = subscribe(state, bus, publishPath, change);

      const dispose = () => {
        const index = disposables.indexOf(dispose);

        if (index !== -1) {
          disposables.splice(index, 1);
        }

        internalDispose();
      };

      disposables.push(dispose);

      return dispose;
    },

    addProvider(provider: DataBusProvider) {
      addProvider(state, provider);
    },

    dispose() {
      for (const dispose of disposables) {
        dispose();
      }
    },
  };

  return bus;
}
