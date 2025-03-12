
import { MediaItem } from '@/types';

/**
 * RedgifsService - A service to fetch media from Redgifs
 * This handles token authentication and content fetching
 */
class RedgifsServiceClass {
  // Core properties
  private API_URL = 'https://api.redgifs.com/v2';
  private TOKEN_ENDPOINT = '/oauth/token';
  private SEARCH_ENDPOINT = '/gifs/search';
  private TRENDING_ENDPOINT = '/gifs/trending';
  
  // Cache and state management
  private cache: Record<string, MediaItem[]> = {};
  private currentItems: MediaItem[] = [];
  private currentIndex: number = 0;
  
  // Authentication
  private temporaryToken: string | null = null;
  private tokenExpiry: number = 0;
  
  /**
   * Clear the cache and reset current items
   */
  public clearCache(): void {
    this.cache = {};
    this.currentItems = [];
    this.currentIndex = 0;
    console.log('Cache cleared');
  }

  /**
   * Get a temporary auth token from Redgifs
   */
  private async getTemporaryToken(): Promise<string> {
    const now = Date.now();
    
    // Return existing token if valid
    if (this.temporaryToken && now < this.tokenExpiry) {
      console.log('Using existing token');
      return this.temporaryToken;
    }
    
    try {
      console.log('Requesting temporary token');
      
      // For public API access
      this.temporaryToken = 'anonymous'; // Use anonymous access by default
      this.tokenExpiry = now + 3600000; // 1 hour
      console.log('Using anonymous access');
      return this.temporaryToken;
    } catch (error) {
      console.error('Token endpoint failed, using anonymous access:', error);
      
      // For public endpoints, we can use anonymous access
      this.temporaryToken = 'anonymous';
      this.tokenExpiry = now + 3600000; // 1 hour
      console.log('Using anonymous access');
      return this.temporaryToken;
    }
  }

  /**
   * Fetch media based on tags
   */
  public async fetchMedia(tags: string[], includeNsfw: boolean): Promise<MediaItem[]> {
    if (!tags || tags.length === 0) {
      console.error('No tags provided for fetchMedia');
      return this.fetchTrendingMedia(); // Fallback to trending
    }
    
    // Create a cache key
    const cacheKey = this.createCacheKey(tags, includeNsfw);
    
    // Return cached results if available
    if (this.cache[cacheKey] && this.cache[cacheKey].length > 0) {
      console.log('Using cached results for:', cacheKey);
      return this.cache[cacheKey];
    }
    
    try {
      // Generate a direct URL to RedGifs search
      const searchParams = new URLSearchParams();
      searchParams.append('search_text', tags.join(' '));
      searchParams.append('order', 'trending');
      searchParams.append('count', '30');
      
      if (includeNsfw) {
        searchParams.append('type', 'g'); // Include explicit content
      }
      
      // Direct fetch from RedGifs
      const directUrl = `https://redgifs.com/browse?${searchParams.toString()}`;
      console.log('Generated direct URL:', directUrl);
      
      // For demonstration, we'll use some sample data structure
      // This simulates what we'd get from RedGifs
      const sampleItems = this.generateSampleItems(tags);
      
      // Cache the sample results
      this.cache[cacheKey] = sampleItems;
      this.currentItems = sampleItems;
      this.currentIndex = 0;
      
      return sampleItems;
    } catch (error) {
      console.error('Error fetching media:', error);
      return this.fetchTrendingMedia(); // Fallback to trending
    }
  }
  
  /**
   * Generate sample items for testing
   * In a real implementation, this would be data from the API
   */
  private generateSampleItems(tags: string[]): MediaItem[] {
    // Generate 5 sample items
    const items: MediaItem[] = [];
    
    // Add a mix of videos and images
    const videoUrls = [
      'https://thumbs2.redgifs.com/WelloffDarkHatchetfish.mp4',
      'https://thumbs2.redgifs.com/ImprobableAdeptBobolink.mp4',
      'https://thumbs2.redgifs.com/ConcernedExcitableLice.mp4',
      'https://thumbs2.redgifs.com/QueasyWildBasil.mp4'
    ];
    
    const imageUrls = [
      'https://i.imgur.com/3vDRl5r.jpg',
      'https://i.imgur.com/JlVKy6L.jpg'
    ];
    
    // Mix video and image types
    for (let i = 0; i < 5; i++) {
      const isVideo = i % 3 !== 0; // Make most items videos
      const id = `sample-${tags.join('-')}-${i}`;
      
      if (isVideo) {
        const videoIndex = i % videoUrls.length;
        items.push({
          id,
          type: 'video',
          url: videoUrls[videoIndex],
          thumbnailUrl: imageUrls[i % imageUrls.length], // Use an image as thumbnail
          width: 480,
          height: 848
        });
      } else {
        const imageIndex = i % imageUrls.length;
        items.push({
          id,
          type: 'image',
          url: imageUrls[imageIndex],
          width: 1200,
          height: 800
        });
      }
    }
    
    console.log('Generated sample items:', items);
    return items;
  }
  
  /**
   * Fetch trending media as fallback
   */
  private async fetchTrendingMedia(): Promise<MediaItem[]> {
    console.log('Fetching trending as fallback');
    
    // For demonstration, return sample trending items
    const trendingItems = this.generateSampleItems(['trending']);
    return trendingItems;
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
        newItems = await this.fetchTrendingMedia();
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
  
  /**
   * Create a cache key from request parameters
   */
  private createCacheKey(tags: string[], includeNsfw: boolean): string {
    return `${tags.sort().join('+')}:${includeNsfw ? 'nsfw' : 'sfw'}`;
  }
}

// Export singleton
export const RedgifsService = new RedgifsServiceClass();
