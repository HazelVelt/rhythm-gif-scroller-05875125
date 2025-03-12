
import { MediaItem } from '@/types';

// This is a front-end service to interact with Redgifs API
class RedgifsServiceClass {
  private cache: Record<string, MediaItem[]> = {};
  private API_URL = 'https://api.your-server.com/redgifs'; // Replace with your Python API URL
  private currentIndex: number = 0;
  private currentItems: MediaItem[] = [];
  
  // Clear the media cache
  public clearCache(): void {
    this.cache = {};
    this.currentItems = [];
    this.currentIndex = 0;
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
      // Generate the appropriate request URL
      const url = this.buildApiUrl(tags, includeNsfw);
      console.log('Fetching media from:', url);
      
      // Make the API request
      const response = await fetch(url);
      
      // If the request was unsuccessful, throw an error
      if (!response.ok) {
        throw new Error(`Redgifs API returned ${response.status}: ${response.statusText}`);
      }
      
      // Parse the response JSON
      const data = await response.json();
      console.log('Received data items:', data.length || 'unknown length');
      
      // Map the API response to our MediaItem type
      const mediaItems: MediaItem[] = this.mapApiResponseToMediaItems(data);
      
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
  
  // Build the API URL based on the request parameters
  private buildApiUrl(tags: string[], includeNsfw: boolean): string {
    const baseUrl = this.API_URL;
    const tagsParam = encodeURIComponent(tags.join(','));
    const nsfwParam = includeNsfw ? 'true' : 'false';
    
    return `${baseUrl}?tags=${tagsParam}&nsfw=${nsfwParam}`;
  }
  
  // Map the API response to our MediaItem type
  private mapApiResponseToMediaItems(data: any[]): MediaItem[] {
    if (!Array.isArray(data)) {
      console.error('Expected array data from API, received:', typeof data);
      return [];
    }
    
    return data.map(item => ({
      id: item.id || `id-${Math.random().toString(36).substr(2, 9)}`,
      url: item.url,
      type: 'video', // Redgifs primarily hosts videos
      width: item.width || 0,
      height: item.height || 0,
      thumbnailUrl: item.thumbnail || item.url
    }));
  }
}

// Export a singleton instance
export const RedgifsService = new RedgifsServiceClass();
