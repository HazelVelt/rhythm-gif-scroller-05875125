
import { MediaItem } from '@/types';
import { CacheService } from './cacheService';
import { ApiService } from './apiService';

/**
 * RedgifsService - A service to fetch media from Redgifs
 * This handles token authentication and content fetching
 */
class RedgifsServiceClass {
  // State management for current items
  private currentItems: MediaItem[] = [];
  private currentIndex: number = 0;
  
  /**
   * Clear the cache and reset current items
   */
  public clearCache(): void {
    CacheService.clearCache();
    this.currentItems = [];
    this.currentIndex = 0;
    console.log('Cache cleared');
  }

  /**
   * Fetch media based on tags
   */
  public async fetchMedia(tags: string[], includeNsfw: boolean): Promise<MediaItem[]> {
    if (!tags || tags.length === 0) {
      console.error('No tags provided for fetchMedia');
      return ApiService.fetchTrendingMedia(); // Fallback to trending
    }
    
    // Create a cache key
    const cacheKey = CacheService.createCacheKey(tags, includeNsfw);
    
    // Return cached results if available
    const cachedItems = CacheService.getCachedItems(cacheKey);
    if (cachedItems) {
      return cachedItems;
    }
    
    try {
      const items = await ApiService.fetchMedia(tags, includeNsfw);
      
      // Cache the results
      CacheService.cacheItems(cacheKey, items);
      this.currentItems = items;
      this.currentIndex = 0;
      
      return items;
    } catch (error) {
      console.error('Error fetching media:', error);
      return ApiService.fetchTrendingMedia(); // Fallback to trending
    }
  }
  
  /**
   * Get next media item for the player
   */
  public async getNextItem(settings: { tags: string[], allowNsfw: boolean }): Promise<MediaItem | null> {
    const { tags, allowNsfw } = settings;
    
    // If we ran out of items, fetch more
    if (this.currentItems.length === 0 || this.currentIndex >= this.currentItems.length) {
      console.log('Getting new batch of items, current index:', this.currentIndex);
      
      let newItems: MediaItem[] = [];
      
      if (tags && tags.length > 0) {
        newItems = await this.fetchMedia(tags, allowNsfw);
      } else {
        newItems = await ApiService.fetchTrendingMedia();
      }
      
      if (newItems.length === 0) {
        console.warn('No items found, returning null');
        return null;
      }
      
      this.currentItems = newItems;
      this.currentIndex = 0;
    }
    
    // Return next item
    const item = this.currentItems[this.currentIndex];
    this.currentIndex++;
    
    console.log('Returning item:', item.id, item.type, item.url);
    return item;
  }
}

// Export singleton
export const RedgifsService = new RedgifsServiceClass();
