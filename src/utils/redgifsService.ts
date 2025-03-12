
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
      
      const response = await fetch(`${this.API_URL}${this.TOKEN_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          grant_type: 'client_credentials'
        })
      });
      
      if (!response.ok) {
        console.log(`Token request failed with status: ${response.status}`);
        throw new Error(`Token endpoint failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Token response:', data);
      
      if (!data.access_token) {
        console.error('No access_token in response');
        throw new Error('No token in response');
      }
      
      this.temporaryToken = data.access_token;
      this.tokenExpiry = now + ((data.expires_in || 3600) * 1000); // Use expires_in or default to 1 hour
      console.log('Successfully obtained token');
      
      return this.temporaryToken;
    } catch (error) {
      console.error('Token endpoint failed, trying anonymous access:', error);
      
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
      // Always get a fresh token
      this.clearCache();
      await this.getTemporaryToken();
      
      // Prepare search parameters - use the correct format
      const searchTags = tags.join(' ');
      const count = 30;
      
      // Build the proper URL with query parameters
      const params = new URLSearchParams({
        search_text: searchTags,
        count: String(count),
        order: 'trending'
      });
      
      // If we care about NSFW content
      if (includeNsfw) {
        params.append('type', 'g');
      }
      
      const url = `${this.API_URL}${this.SEARCH_ENDPOINT}?${params.toString()}`;
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
        console.error('Response:', await response.text());
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
      
      // Log the first item to see its structure
      if (items.length > 0) {
        console.log('Sample item structure:', JSON.stringify(items[0], null, 2));
      }
      
      // Map API items to our format
      const mediaItems: MediaItem[] = this.mapApiResponseToMediaItems(items);
      console.log('Mapped items count:', mediaItems.length);
      
      // Cache results if we got any
      if (mediaItems.length > 0) {
        this.cache[cacheKey] = mediaItems;
        this.currentItems = mediaItems;
        this.currentIndex = 0;
      } else {
        console.warn('No items found in search results');
        return this.fetchTrendingMedia(); // Fallback to trending
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
      
      // Build proper URL with query parameters
      const params = new URLSearchParams({
        count: '30',
        page: '1'
      });
      
      const url = `${this.API_URL}${this.TRENDING_ENDPOINT}?${params.toString()}`;
      console.log('Trending URL:', url);
      
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
      const response = await fetch(url, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error(`Trending API failed with status: ${response.status}`);
        const responseText = await response.text();
        console.error('Response:', responseText);
        throw new Error(`Trending API failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Trending response structure:', Object.keys(data));
      
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
      
      // Log the first item to see its structure
      if (items.length > 0) {
        console.log('Sample trending item:', JSON.stringify(items[0], null, 2));
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
    
    console.log('Returning item:', item.id, item.type, item.url);
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
      try {
        console.log("Processing item:", item.id);
        
        // Extract URLs from various possible locations in the API response
        const urls = item.urls || {};
        const contentUrls = item.content_urls || {};
        
        // Find best video URL
        let mediaUrl = '';
        
        // First check HD sources
        if (urls.hd) mediaUrl = urls.hd;
        else if (urls.mp4) mediaUrl = urls.mp4;
        else if (contentUrls.mp4) mediaUrl = contentUrls.mp4;
        else if (item.mp4Url) mediaUrl = item.mp4Url;
        else if (item.url && item.url.endsWith('.mp4')) mediaUrl = item.url;
        
        // Check SD sources if no HD found
        if (!mediaUrl) {
          if (urls.sd) mediaUrl = urls.sd;
          else if (item.url) mediaUrl = item.url;
        }
        
        // Check if the item has any URLs at all
        if (!mediaUrl) {
          console.warn('No usable URL found for item:', item.id);
          return null;
        }
        
        // Get thumbnail URL
        let thumbnailUrl = '';
        if (urls.thumbnail) thumbnailUrl = urls.thumbnail;
        else if (urls.poster) thumbnailUrl = urls.poster;
        else if (item.thumbnail) thumbnailUrl = item.thumbnail;
        else if (item.poster) thumbnailUrl = item.poster;
        else if (item.preview) thumbnailUrl = item.preview;
        
        // Ensure the URL is absolute
        if (mediaUrl && !mediaUrl.startsWith('http')) {
          mediaUrl = `https:${mediaUrl}`;
        }
        
        if (thumbnailUrl && !thumbnailUrl.startsWith('http')) {
          thumbnailUrl = `https:${thumbnailUrl}`;
        }
        
        console.log(`Processed item ${item.id}: URL = ${mediaUrl}`);
        
        // For Redgifs, all content is treated as video for proper playback
        return {
          id: item.id || `redgif-${Math.random().toString(36).substring(2, 11)}`,
          url: mediaUrl,
          type: "video" as "video" | "image" | "gif",
          width: item.width || 0,
          height: item.height || 0,
          thumbnailUrl: thumbnailUrl
        };
      } catch (e) {
        console.error("Error mapping item:", e);
        return null;
      }
    }).filter(Boolean) as MediaItem[]; // Remove null items
  }
}

// Export singleton
export const RedgifsService = new RedgifsServiceClass();
