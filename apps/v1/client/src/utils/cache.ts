interface CacheEntry<T> {
  data: T;
  timestamp: number;
  etag?: string;
}

class ClientCache {
  private cache = new Map<string, CacheEntry<any>>();
  private pendingRequests = new Map<string, Promise<any>>();

  // Get data from cache with stale-while-revalidate pattern
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: {
      maxAge?: number; // Max age in milliseconds
      staleWhileRevalidate?: number; // Additional time where stale data is acceptable
    } = {}
  ): Promise<T> {
    const { maxAge = 5 * 60 * 1000, staleWhileRevalidate = 60 * 1000 } = options;
    const now = Date.now();
    const cached = this.cache.get(key);

    // If we have a pending request for this key, return it
    const pending = this.pendingRequests.get(key);
    if (pending) {
      return pending;
    }

    if (cached) {
      const age = now - cached.timestamp;
      const isStale = age > maxAge;
      const isExpired = age > maxAge + staleWhileRevalidate;

      // If data is fresh, return it immediately
      if (!isStale) {
        return cached.data;
      }

      // If data is stale but not expired, return it and revalidate in background
      if (!isExpired) {
        // Revalidate in background
        this.revalidateInBackground(key, fetcher);
        return cached.data;
      }
    }

    // If no cache or expired, fetch new data
    const fetchPromise = fetcher()
      .then(data => {
        this.set(key, data);
        this.pendingRequests.delete(key);
        return data;
      })
      .catch(error => {
        this.pendingRequests.delete(key);
        // If we have stale data and fetch failed, return stale data
        if (cached && error instanceof Error && error.message.includes('fetch')) {
          console.warn(`Failed to fetch ${key}, returning stale data`, error);
          return cached.data;
        }
        throw error;
      });

    this.pendingRequests.set(key, fetchPromise);
    return fetchPromise;
  }

  // Set data in cache
  set<T>(key: string, data: T, etag?: string): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      etag
    });
  }

  // Clear specific cache entry
  invalidate(key: string): void {
    this.cache.delete(key);
    this.pendingRequests.delete(key);
  }

  // Clear all cache entries matching a pattern
  invalidatePattern(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    
    Array.from(this.cache.keys()).forEach(key => {
      if (regex.test(key)) {
        this.invalidate(key);
      }
    });
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  // Revalidate in background without blocking
  private async revalidateInBackground<T>(key: string, fetcher: () => Promise<T>): Promise<void> {
    // Don't revalidate if already in progress
    if (this.pendingRequests.has(key)) {
      return;
    }

    try {
      const data = await fetcher();
      this.set(key, data);
    } catch (error) {
      console.warn(`Background revalidation failed for ${key}`, error);
    }
  }

  // Get cache statistics
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Singleton instance
export const clientCache = new ClientCache();

// Convenience functions
export function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: Parameters<ClientCache['get']>[2]
): Promise<T> {
  return clientCache.get(key, fetcher, options);
}

export function invalidateCache(keyOrPattern: string | RegExp): void {
  if (typeof keyOrPattern === 'string' && !keyOrPattern.includes('*') && !keyOrPattern.includes('|')) {
    clientCache.invalidate(keyOrPattern);
  } else {
    clientCache.invalidatePattern(keyOrPattern);
  }
}

export function clearCache(): void {
  clientCache.clear();
}