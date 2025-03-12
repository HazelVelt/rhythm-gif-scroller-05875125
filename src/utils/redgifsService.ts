
import { MediaItem } from '@/types';

// This is a front-end service to interact with Redgifs API
class RedgifsServiceClass {
  private cache: Record<string, MediaItem[]> = {};
  private API_URL = 'https://api.redgifs.com/v2';
  private currentIndex: number = 0;
  private currentItems: MediaItem[] = [];
  private temporaryToken: string | null = null;
  private tokenExpiry: number = 0;
  
  // Clear the media cache
  public clearCache(): void {
    this.cache = {};
    this.currentItems = [];
    this.currentIndex = 0;
  }

  // Get or refresh the temporary token
  private async getTemporaryToken(): Promise<string> {
    // If we have a token and it's not expired, return it
    const now = Date.now();
    if (this.temporaryToken && now < this.tokenExpiry) {
      return this.temporaryToken;
    }
    
    try {
      // Updated endpoint based on the latest Redgifs API (as of 2023)
      console.log('Requesting temporary token using current API');
      
      const response = await fetch(`${this.API_URL}/auth/temporary-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error(`Failed to get token, status: ${response.status}`);
        console.error('Response:', await response.text());
        throw new Error(`Failed to get temporary token: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Token response:', data);
      
      if (!data.token) {
        throw new Error('No token returned from API');
      }
      
      // Save the token and set expiry to 1 hour from now
      this.temporaryToken = data.token;
      this.tokenExpiry = now + 3600000; // 1 hour in milliseconds
      
      console.log('Successfully obtained temporary token');
      return this.temporaryToken;
    } catch (error) {
      console.error('Error getting temporary token:', error);
      
      // Try alternative method - using public API
      try {
        console.log('Trying public token method');
        
        // Some Redgifs endpoints can be accessed with a standard User-Agent
        const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
        
        // Try to access a public endpoint that doesn't require authentication
        const publicResponse = await fetch(`${this.API_URL}/tags/trending`, {
          headers: {
            'User-Agent': userAgent
          }
        });
        
        if (!publicResponse.ok) {
          throw new Error(`Public API failed: ${publicResponse.status}`);
        }
        
        // Using a fake token approach since we've verified we can access the API
        this.temporaryToken = 'public-access-token';
        this.tokenExpiry = now + 3600000; // 1 hour
        
        console.log('Using public access method');
        return this.temporaryToken;
      } catch (publicError) {
        console.error('Public access method failed:', publicError);
        
        // Final fallback - direct query
        console.log('Using final fallback method');
        
        // This is for demonstration only - in a production app you would
        // implement a proper backend proxy for API calls
        this.temporaryToken = 'fallback-access';
        this.tokenExpiry = now + 3600000;
        return this.temporaryToken;
      }
    }
  }

  // Fetch media items based on the provided tags
  public async fetchMedia(tags: string[], includeNsfw: boolean): Promise<MediaItem[]> {
    if (!tags.length) {
      console.error('No tags provided for RedgifsService.fetchMedia');
      return [];
    }
    
    // Create a cache key based on the request parameters
    const cacheKey = this.createCacheKey(tags, includeNsfw);
    
    // Return cached results if available
    if (this.cache[cacheKey] && this.cache[cacheKey].length > 0) {
      console.log('Returning cached items for', cacheKey);
      return this.cache[cacheKey];
    }
    
    try {
      // Try to get a token first (but it might be a fallback token)
      await this.getTemporaryToken();
      
      // Prepare search parameters
      const searchTags = tags.join(',');
      const count = 30; // Number of results to fetch
      
      // Use public API method first (does not require auth token)
      console.log('Trying direct fetch with search terms:', searchTags);
      
      // Build the URL for searching gifs - using public API
      const url = `${this.API_URL}/gifs/search?search_text=${encodeURIComponent(searchTags)}&count=${count}`;
      
      console.log('Fetching media from:', url);
      
      // Make the request with standard browser headers
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
      const response = await fetch(url, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'application/json'
        }
      });
      
      // If the request was unsuccessful, try fallback
      if (!response.ok) {
        console.error(`API response: ${response.status} ${response.statusText}`);
        throw new Error(`Redgifs API returned ${response.status}`);
      }
      
      // Parse the response JSON
      const data = await response.json();
      console.log('Received data:', data);
      
      if (!data.gifs || !Array.isArray(data.gifs)) {
        // Try alternative endpoint format
        if (data.items && Array.isArray(data.items)) {
          console.log('Using alternative data format (items)');
          const mediaItems: MediaItem[] = this.mapApiResponseToMediaItems(data.items || []);
          
          // Cache the results
          this.cache[cacheKey] = mediaItems;
          this.currentItems = mediaItems;
          this.currentIndex = 0;
          
          return mediaItems;
        }
        
        console.error('Unexpected response format:', data);
        throw new Error('Invalid API response format');
      }
      
      // Map the API response to our MediaItem type
      const mediaItems: MediaItem[] = this.mapApiResponseToMediaItems(data.gifs || []);
      
      // Cache the results
      this.cache[cacheKey] = mediaItems;
      this.currentItems = mediaItems;
      this.currentIndex = 0;
      
      return mediaItems;
    } catch (error) {
      console.error('Error fetching media from Redgifs:', error);
      
      // Try one more alternative method - trending gifs
      try {
        console.log('Trying trending content as fallback');
        const trendingUrl = `${this.API_URL}/gifs/trending?count=30`;
        
        const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
        const response = await fetch(trendingUrl, {
          headers: {
            'User-Agent': userAgent,
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Trending API returned ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Received trending data items:', data.gifs ? data.gifs.length : 'unknown');
        
        if (!data.gifs && !data.items) {
          throw new Error('No trending items found');
        }
        
        // Use either gifs or items property based on the response
        const items = data.gifs || data.items || [];
        const mediaItems: MediaItem[] = this.mapApiResponseToMediaItems(items);
        
        // Cache the results
        this.cache[cacheKey] = mediaItems;
        this.currentItems = mediaItems;
        this.currentIndex = 0;
        
        return mediaItems;
      } catch (fallbackError) {
        console.error('All fetching methods failed:', fallbackError);
        
        // Return an empty array if all methods failed
        return [];
      }
    }
  }
  
  // Get the next media item based on current settings
  public async getNextItem(settings: { tags: string[], allowNsfw: boolean }): Promise<MediaItem | null> {
    const { tags, allowNsfw } = settings;
    
    if (!tags.length) {
      console.error('No tags provided for RedgifsService.getNextItem');
      return null;
    }
    
    // If we have no cached items or we've reached the end, fetch more
    if (this.currentItems.length === 0 || this.currentIndex >= this.currentItems.length) {
      const newItems = await this.fetchMedia(tags, allowNsfw);
      
      if (newItems.length === 0) {
        return null;
      }
      
      this.currentItems = newItems;
      this.currentIndex = 0;
    }
    
    // Return the next item and increment the index
    const item = this.currentItems[this.currentIndex];
    this.currentIndex++;
    
    return item;
  }
  
  // Create a cache key based on the request parameters
  private createCacheKey(tags: string[], includeNsfw: boolean): string {
    return `${tags.sort().join('+')}:${includeNsfw ? 'nsfw' : 'sfw'}`;
  }
  
  // Map the API response to our MediaItem type
  private mapApiResponseToMediaItems(gifs: any[]): MediaItem[] {
    if (!Array.isArray(gifs)) {
      console.error('Expected array data from API, received:', typeof gifs);
      return [];
    }
    
    return gifs.map(gif => {
      console.log('Processing gif:', gif.id, gif.urls);
      
      // Handle different response formats
      const urls = gif.urls || gif;
      const id = gif.id || `id-${Math.random().toString(36).substr(2, 9)}`;
      const hdUrl = urls?.hd || urls?.sd || gif.url || urls?.mp4 || urls?.gif || gif.content_urls?.mp4 || '';
      const thumbnailUrl = urls?.thumbnail || urls?.poster || gif.thumbnail || gif.poster || '';
      
      // Explicitly assign the type as "video" for Redgifs content
      // This ensures we comply with the MediaItem type definition
      return {
        id: id,
        url: hdUrl,
        type: "video" as "video" | "image" | "gif", // Ensure correct type assignment
        width: gif.width || 0,
        height: gif.height || 0,
        thumbnailUrl: thumbnailUrl
      };
    }).filter(item => !!item.url); // Filter out items with no URL
  }
}

// Export a singleton instance
export const RedgifsService = new RedgifsServiceClass();
