import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react';
import type { DataBus } from '../types/DataBus.js';
import type { DataBusPath } from '../types/DataBusPath.js';
import type { z } from 'zod';

/**
 * Result from useResource hook.
 */
export interface UseResourceResult<T> {
  /** The current data value, or undefined if not yet loaded. */
  data: T | undefined;

  /** True while waiting for initial data. */
  isLoading: boolean;

  /** Version number of the current data, if tracked. */
  version: number | null;
}

/**
 * Options for useResource hook.
 */
export interface UseResourceOptions<T> {
  /** Initial value to use before first data arrives. */
  initialValue?: T;
}

/** Internal cache entry for subscription state. */
interface CacheEntry<T> {
  value: T | undefined;
  version: number | null;
  hasReceivedData: boolean;
}

/**
 * React hook for subscribing to data bus resources.
 *
 * Uses useSyncExternalStore for concurrent-safe subscriptions.
 * Automatically subscribes/unsubscribes based on component lifecycle.
 *
 * @param bus The data bus instance.
 * @param path Path to subscribe to, or null to skip subscription.
 * @param options Optional configuration.
 * @returns Current data, loading state, and version.
 *
 * @example
 * ```typescript
 * const { data: idea, isLoading } = useResource(dataBus, ['ideas', ideaId]);
 *
 * // With typed path
 * const ideaPath = createDataPath({ path: ['ideas', id], type: IdeaSchema });
 * const { data } = useResource(dataBus, ideaPath);
 * ```
 */
export function useResource<T>(
  bus: DataBus,
  path: DataBusPath<z.ZodType<T>> | string[] | null,
  options?: UseResourceOptions<T>,
): UseResourceResult<T> {
  // Memoize the path key for stable dependencies
  const pathKey = path ? (Array.isArray(path) ? path.join('/') : path.path.join('/')) : null;
  const pathArray = path ? (Array.isArray(path) ? path : path.path) : null;

  // Store the current cached value
  const cacheRef = useRef<CacheEntry<T>>({
    value: options?.initialValue,
    version: null,
    hasReceivedData: false,
  });

  // Subscribe function for useSyncExternalStore
  const subscribe = useCallback(
    (onStoreChange: () => void): (() => void) => {
      if (!pathArray) {
        return () => {
          // no-op
        };
      }

      const dispose = bus.subscribe<T>(pathArray, (value, _oldValue, _path) => {
        cacheRef.current = {
          value,
          version: (cacheRef.current.version ?? 0) + 1,
          hasReceivedData: true,
        };
        onStoreChange();
      });

      return dispose;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bus, pathKey],
  );

  // Snapshot function for useSyncExternalStore
  const getSnapshot = useCallback((): CacheEntry<T> => {
    return cacheRef.current;
  }, []);

  // Server snapshot (for SSR)
  const getServerSnapshot = useCallback((): CacheEntry<T> => {
    return {
      value: options?.initialValue,
      version: null,
      hasReceivedData: false,
    };
  }, [options?.initialValue]);

  // Use useSyncExternalStore for concurrent-safe subscription
  const cache = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Compute the result
  const result = useMemo<UseResourceResult<T>>(() => {
    // If no path, return initial/undefined
    if (!pathArray) {
      return {
        data: options?.initialValue,
        isLoading: false,
        version: null,
      };
    }

    return {
      data: cache.value,
      isLoading: !cache.hasReceivedData && cache.value === undefined,
      version: cache.version,
    };
  }, [pathArray, cache, options?.initialValue]);

  return result;
}

/**
 * Hook variant that accepts a path factory function.
 * Useful when the path depends on component props.
 *
 * @param bus The data bus instance.
 * @param createPath Factory function that returns a path, or null.
 * @param deps Dependencies for the path factory.
 * @param options Optional configuration.
 */
export function useResourceFactory<T>(
  bus: DataBus,
  createPath: () => DataBusPath<z.ZodType<T>> | string[] | null,
  deps: unknown[],
  options?: UseResourceOptions<T>,
): UseResourceResult<T> {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const path = useMemo(createPath, deps);

  return useResource(bus, path, options);
}
