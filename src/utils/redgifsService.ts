
import { MediaItem } from '@/types';

/**
 * RedgifsService - A service to fetch media from Redgifs
 * This handles token authentication and content fetching
 */
class RedgifsServiceClass {
  // Core properties
  private API_URL = 'https://api.redgifs.com/v2';
  private TOKEN_ENDPOINT = '/oauth/temporary';
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
      // Try the primary token endpoint
      console.log('Requesting temporary token from:', `${this.API_URL}${this.TOKEN_ENDPOINT}`);
      
      const response = await fetch(`${this.API_URL}${this.TOKEN_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Token endpoint failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.token) {
        throw new Error('No token in response');
      }
      
      this.temporaryToken = data.token;
      this.tokenExpiry = now + 3600000; // 1 hour
      console.log('Successfully obtained token');
      
      return this.temporaryToken;
    } catch (error) {
      console.error('Primary token endpoint failed:', error);
      
      // Try the alternative token endpoint
      try {
        console.log('Trying alternative token endpoint');
        const altResponse = await fetch(`${this.API_URL}/auth/temporary`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!altResponse.ok) {
          throw new Error(`Alt token endpoint failed: ${altResponse.status}`);
        }
        
        const altData = await altResponse.json();
        
        if (!altData.token) {
          throw new Error('No token in alt response');
        }
        
        this.temporaryToken = altData.token;
        this.tokenExpiry = now + 3600000; // 1 hour
        console.log('Successfully obtained token from alt endpoint');
        
        return this.temporaryToken;
      } catch (altError) {
        console.error('Alternative token endpoint failed:', altError);
        
        // Use anonymous access as fallback (some endpoints work without auth)
        console.log('Using anonymous access as fallback');
        this.temporaryToken = 'anonymous';
        this.tokenExpiry = now + 3600000; // 1 hour
        return this.temporaryToken;
      }
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
      // Try to get auth token
      await this.getTemporaryToken();
      
      // Prepare search parameters
      const searchTags = tags.join(',');
      const count = 30;
      const url = `${this.API_URL}${this.SEARCH_ENDPOINT}?search_text=${encodeURIComponent(searchTags)}&count=${count}&order=trending`;
      
      console.log('Fetching from search endpoint:', url);
      
      // Standard user agent for web requests
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
      
      // Headers for request
      const headers: Record<string, string> = {
        'User-Agent': userAgent,
        'Accept': 'application/json'
      };
      
      // Add auth token if we have one
      if (this.temporaryToken && this.temporaryToken !== 'anonymous') {
        headers['Authorization'] = `Bearer ${this.temporaryToken}`;
      }
      
      // Make the request
      const response = await fetch(url, { headers });
      
      // If unsuccessful, try fallback
      if (!response.ok) {
        console.error(`Search endpoint failed: ${response.status}`);
        throw new Error(`Search failed: ${response.status}`);
      }
      
      // Parse response
      const data = await response.json();
      console.log('Search response structure:', Object.keys(data));
      
      // Handle different response formats
      let items = [];
      if (data.gifs && Array.isArray(data.gifs)) {
        console.log('Using gifs array from response, count:', data.gifs.length);
        items = data.gifs;
      } else if (data.items && Array.isArray(data.items)) {
        console.log('Using items array from response, count:', data.items.length);
        items = data.items;
      } else {
        console.error('Unexpected response format:', Object.keys(data));
        throw new Error('Invalid API response format');
      }
      
      // Map API items to our format
      const mediaItems: MediaItem[] = this.mapApiResponseToMediaItems(items);
      console.log('Mapped items count:', mediaItems.length);
      
      // Cache results if we got any
      if (mediaItems.length > 0) {
        this.cache[cacheKey] = mediaItems;
        this.currentItems = mediaItems;
        this.currentIndex = 0;
      }
      
      return mediaItems;
    } catch (error) {
      console.error('Error fetching from search endpoint:', error);
      return this.fetchTrendingMedia(); // Fallback to trending
    }
  }
  
  /**
   * Fetch trending media as fallback
   */
  private async fetchTrendingMedia(): Promise<MediaItem[]> {
    try {
      console.log('Fetching trending content as fallback');
      const url = `${this.API_URL}${this.TRENDING_ENDPOINT}?count=30`;
      
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
      const response = await fetch(url, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Trending API failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Handle different response formats
      let items = [];
      if (data.gifs && Array.isArray(data.gifs)) {
        items = data.gifs;
      } else if (data.items && Array.isArray(data.items)) {
        items = data.items;
      } else {
        console.error('Unexpected trending response format:', Object.keys(data));
        return [];
      }
      
      // Map to our format
      const mediaItems: MediaItem[] = this.mapApiResponseToMediaItems(items);
      console.log('Trending items count:', mediaItems.length);
      
      return mediaItems;
    } catch (error) {
      console.error('All fetching methods failed:', error);
      return []; // Return empty if all fails
    }
  }
  
  /**
   * Get next media item for the player
   */
  public async getNextItem(settings: { tags: string[], allowNsfw: boolean }): Promise<MediaItem | null> {
    const { tags, allowNsfw } = settings;
    
    if (!tags || tags.length === 0) {
      console.warn('No tags provided for getNextItem, using trending');
      const trendingItems = await this.fetchTrendingMedia();
      return trendingItems.length > 0 ? trendingItems[0] : null;
    }
    
    // If we ran out of items, fetch more
    if (this.currentItems.length === 0 || this.currentIndex >= this.currentItems.length) {
      console.log('Fetching new batch of items');
      const newItems = await this.fetchMedia(tags, allowNsfw);
      
      if (newItems.length === 0) {
        console.warn('No items found, try trending');
        const trendingItems = await this.fetchTrendingMedia();
        return trendingItems.length > 0 ? trendingItems[0] : null;
      }
      
      this.currentItems = newItems;
      this.currentIndex = 0;
    }
    
    // Return next item
    const item = this.currentItems[this.currentIndex];
    this.currentIndex++;
    
    console.log('Returning item:', item.id, item.type);
    return item;
  }
  
  /**
   * Create a cache key from request parameters
   */
  private createCacheKey(tags: string[], includeNsfw: boolean): string {
    return `${tags.sort().join('+')}:${includeNsfw ? 'nsfw' : 'sfw'}`;
  }
  
  /**
   * Map API response to our MediaItem type
   */
  private mapApiResponseToMediaItems(items: any[]): MediaItem[] {
    if (!Array.isArray(items)) {
      console.error('Expected array for mapping, got:', typeof items);
      return [];
    }
    
    return items.map(item => {
      // Handle various response formats
      const urls = item.urls || item;
      
      // Get the best URL available
      let mediaUrl = '';
      if (urls.hd) mediaUrl = urls.hd;
      else if (urls.sd) mediaUrl = urls.sd;
      else if (item.url) mediaUrl = item.url;
      else if (urls.mp4) mediaUrl = urls.mp4;
      else if (urls.gif) mediaUrl = urls.gif;
      else if (item.content_urls?.mp4) mediaUrl = item.content_urls.mp4;
      
      // Skip if no usable URL
      if (!mediaUrl) {
        console.warn('No usable URL found for item');
        return null;
      }
      
      // Get a thumbnail
      const thumbnailUrl = urls.thumbnail || urls.poster || item.thumbnail || item.poster || '';
      
      // For Redgifs, all content is treated as video for proper playback
      return {
        id: item.id || `redgif-${Math.random().toString(36).substring(2, 11)}`,
        url: mediaUrl,
        type: "video" as "video" | "image" | "gif",
        width: item.width || 0, 
        height: item.height || 0,
        thumbnailUrl: thumbnailUrl
      };
    }).filter(Boolean) as MediaItem[]; // Remove null items
  }
}

// Export singleton
export const RedgifsService = new RedgifsServiceClass();
