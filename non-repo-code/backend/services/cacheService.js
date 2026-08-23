/**
 * High-Performance Multi-Tier In-Memory LRU Cache
 * Provides sub-millisecond data retrieval for facilities, geo-lookups, and device catalogs
 * with automatic TTL expiry and live operational metrics.
 */

class LRUCache {
  constructor(maxItems = 1000, defaultTtlMs = 1000 * 60 * 10) { // 10 mins default TTL
    this.maxItems = maxItems;
    this.defaultTtlMs = defaultTtlMs;
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0,
      expirations: 0
    };
  }

  get(key) {
    if (!this.cache.has(key)) {
      this.stats.misses++;
      return null;
    }

    const item = this.cache.get(key);
    const now = Date.now();

    if (item.expiry && now > item.expiry) {
      this.cache.delete(key);
      this.stats.expirations++;
      this.stats.misses++;
      return null;
    }

    // Refresh LRU order (delete & re-insert)
    this.cache.delete(key);
    this.cache.set(key, item);
    this.stats.hits++;
    return item.value;
  }

  set(key, value, ttlMs = this.defaultTtlMs) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxItems) {
      // Evict oldest item
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
      this.stats.evictions++;
    }

    const expiry = ttlMs ? Date.now() + ttlMs : null;
    this.cache.set(key, { value, expiry });
    this.stats.sets++;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

    return {
      size: this.cache.size,
      maxItems: this.maxItems,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: `${hitRate.toFixed(1)}%`,
      evictions: this.stats.evictions,
      expirations: this.stats.expirations
    };
  }
}

// Global Singletons for various domains
export const facilityCache = new LRUCache(2000, 1000 * 60 * 15); // 15 mins
export const deviceCache = new LRUCache(500, 1000 * 60 * 60);    // 1 hour
export const geoDistanceCache = new LRUCache(5000, 1000 * 60 * 30); // 30 mins
export const systemMetricsCache = new LRUCache(100, 1000 * 5);    // 5 secs
