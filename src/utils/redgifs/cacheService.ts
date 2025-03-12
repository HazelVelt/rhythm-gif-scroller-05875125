
import { MediaItem } from '@/types';

/**
 * Service for caching RedGifs API responses
 */
class CacheServiceClass {
  private cache: Record<string, MediaItem[]> = {};
  
  /**
   * Get cached items for a key
   */
  public getCachedItems(key: string): MediaItem[] | null {
    if (this.cache[key] && this.cache[key].length > 0) {
      console.log('Using cached results for:', key);
      return this.cache[key];
    }
    return null;
  }
  
  /**
   * Store items in cache
   */
  public cacheItems(key: string, items: MediaItem[]): void {
    this.cache[key] = items;
    console.log('Cached items for key:', key);
  }
  
  /**
   * Clear the entire cache
   */
  public clearCache(): void {
    this.cache = {};
    console.log('Cache cleared');
  }
  
  /**
   * Create a cache key from request parameters
   */
  public createCacheKey(tags: string[], includeNsfw: boolean): string {
    return `${tags.sort().join('+')}:${includeNsfw ? 'nsfw' : 'sfw'}`;
  }
}

// Export singleton
export const CacheService = new CacheServiceClass();
