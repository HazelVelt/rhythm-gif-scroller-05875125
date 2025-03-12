
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
      // Correct endpoint for getting temporary token as per updated Redgifs API
      console.log('Requesting new temporary token from Redgifs');
      
      const response = await fetch(`${this.API_URL}/auth/temporary`, {
        method: 'POST'
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
      
      // Fallback to alternative endpoint if the primary fails
      try {
        console.log('Trying fallback endpoint');
        const fallbackResponse = await fetch(`${this.API_URL}/oauth/guest-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            app: 'web_browser'
          })
        });
        
        if (!fallbackResponse.ok) {
          throw new Error(`Fallback endpoint failed: ${fallbackResponse.status}`);
        }
        
        const fallbackData = await fallbackResponse.json();
        
        if (!fallbackData.token) {
          throw new Error('No token returned from fallback API');
        }
        
        this.temporaryToken = fallbackData.token;
        this.tokenExpiry = now + 3600000;
        console.log('Successfully obtained token from fallback endpoint');
        return this.temporaryToken;
      } catch (fallbackError) {
        console.error('Fallback authentication also failed:', fallbackError);
        throw error; // Throw the original error
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
      // Get a token first
      const token = await this.getTemporaryToken();
      
      // Prepare search parameters
      const searchTags = tags.join(',');
      const order = 'trending'; // trending, latest, best, etc.
      const count = 50; // Number of results to fetch
      
      // Build the URL for searching gifs
      const url = `${this.API_URL}/gifs/search?search_text=${encodeURIComponent(searchTags)}&order=${order}&count=${count}`;
      
      console.log('Fetching media from:', url);
      
      // Make the API request with the token
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // If the request was unsuccessful, throw an error
      if (!response.ok) {
        console.error(`API response: ${response.status} ${response.statusText}`);
        const responseText = await response.text();
        console.error('Response body:', responseText);
        throw new Error(`Redgifs API returned ${response.status}: ${response.statusText}`);
      }
      
      // Parse the response JSON
      const data = await response.json();
      console.log('Received data items:', data.gifs ? data.gifs.length : 'unknown length');
      
      if (!data.gifs || !Array.isArray(data.gifs)) {
        console.error('Unexpected response format:', data);
        return [];
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
      
      // Return an empty array if there was an error
      return [];
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
      
      return {
        id: gif.id || `id-${Math.random().toString(36).substr(2, 9)}`,
        url: gif.urls?.hd || gif.urls?.sd || gif.url || gif.urls?.gif,
        type: 'video', // Redgifs primarily hosts videos
        width: gif.width || 0,
        height: gif.height || 0,
        thumbnailUrl: gif.urls?.thumbnail || gif.urls?.poster || gif.thumbnail
      };
    }).filter(item => !!item.url); // Filter out items with no URL
  }
}

// Export a singleton instance
export const RedgifsService = new RedgifsServiceClass();
