
import { MediaItem } from '@/types';

// This is a front-end service to interact with the Python Scrolller-scraper API
class ScrollerServiceClass {
  private cache: Record<string, MediaItem[]> = {};
  private API_URL = 'https://api.your-server.com/scrolller'; // Replace with your Python API URL
  
  // Clear the media cache
  public clearCache(): void {
    this.cache = {};
  }

  // Fetch media items based on the provided tags
  public async fetchMedia(tags: string[], includeNsfw: boolean, mediaTypes: { image: boolean, gif: boolean, video: boolean }): Promise<MediaItem[]> {
    // Create a cache key based on the request parameters
    const cacheKey = this.createCacheKey(tags, includeNsfw, mediaTypes);
    
    // Return cached results if available
    if (this.cache[cacheKey] && this.cache[cacheKey].length > 0) {
      return this.cache[cacheKey];
    }
    
    try {
      // Generate the appropriate request URL
      const url = this.buildApiUrl(tags, includeNsfw, mediaTypes);
      
      // Make the API request
      const response = await fetch(url);
      
      // If the request was unsuccessful, throw an error
      if (!response.ok) {
        throw new Error(`Scrolller API returned ${response.status}: ${response.statusText}`);
      }
      
      // Parse the response JSON
      const data = await response.json();
      
      // Map the API response to our MediaItem type
      const mediaItems: MediaItem[] = this.mapApiResponseToMediaItems(data);
      
      // Cache the results
      this.cache[cacheKey] = mediaItems;
      
      return mediaItems;
    } catch (error) {
      console.error('Error fetching media from Scrolller:', error);
      
      // Return an empty array if there was an error
      return [];
    }
  }
  
  // Create a cache key based on the request parameters
  private createCacheKey(tags: string[], includeNsfw: boolean, mediaTypes: { image: boolean, gif: boolean, video: boolean }): string {
    const mediaTypesString = `${mediaTypes.image ? 'img' : ''}${mediaTypes.gif ? 'gif' : ''}${mediaTypes.video ? 'vid' : ''}`;
    return `${tags.sort().join('+')}:${includeNsfw ? 'nsfw' : 'sfw'}:${mediaTypesString}`;
  }
  
  // Build the API URL based on the request parameters
  private buildApiUrl(tags: string[], includeNsfw: boolean, mediaTypes: { image: boolean, gif: boolean, video: boolean }): string {
    const baseUrl = this.API_URL;
    const tagsParam = tags.join(',');
    const typeParam = this.getTypeParam(mediaTypes);
    const nsfwParam = includeNsfw ? 'true' : 'false';
    
    return `${baseUrl}?tags=${tagsParam}&mediaTypes=${typeParam}&nsfw=${nsfwParam}`;
  }
  
  // Get the media type parameter for the API request
  private getTypeParam(mediaTypes: { image: boolean, gif: boolean, video: boolean }): string {
    const types = [];
    
    if (mediaTypes.image) types.push('image');
    if (mediaTypes.gif) types.push('gif');
    if (mediaTypes.video) types.push('video');
    
    return types.join(',');
  }
  
  // Map the API response to our MediaItem type
  private mapApiResponseToMediaItems(data: any[]): MediaItem[] {
    return data.map(item => ({
      id: item.id || `id-${Math.random().toString(36).substr(2, 9)}`,
      url: item.url,
      type: this.determineMediaType(item.url),
      width: item.width || 0,
      height: item.height || 0,
      thumbnailUrl: item.thumbnail || item.url
    }));
  }
  
  // Determine the media type based on the URL
  private determineMediaType(url: string): 'image' | 'video' | 'gif' {
    const extension = url.split('.').pop()?.toLowerCase();
    
    if (!extension) {
      return 'image'; // Default to image if we can't determine
    }
    
    if (['jpg', 'jpeg', 'png', 'webp'].includes(extension)) {
      return 'image';
    } else if (['mp4', 'webm', 'mov'].includes(extension)) {
      return 'video';
    } else if (['gif'].includes(extension)) {
      return 'gif';
    }
    
    return 'image'; // Default to image
  }
}

// Export a singleton instance
export const ScrollerService = new ScrollerServiceClass();
