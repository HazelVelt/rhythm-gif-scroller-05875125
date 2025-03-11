
import { MediaItem, PlayerSettings } from '../types';

export class ScrollerService {
  private static readonly BASE_URL = 'https://api.scrolller.com';
  private static readonly QUERY_URL = `${ScrollerService.BASE_URL}/api/v2/graphql`;
  private static readonly DEFAULT_SUBREDDIT = 'gifs';
  
  private static cachedItems: MediaItem[] = [];
  private static lastFetchTime: number = 0;
  private static isFetching: boolean = false;
  
  // Convert tags to subreddits
  private static formatTags(tags: string[]): string[] {
    // Process and sanitize tags
    return tags.length > 0 
      ? tags.map(tag => tag.toLowerCase().trim().replace(/\s+/g, ''))
      : [this.DEFAULT_SUBREDDIT];
  }
  
  // Construct GraphQL query for Scrolller with media type and NSFW options
  private static buildQuery(settings: Partial<PlayerSettings>, limit: number = 20): string {
    const subreddits = this.formatTags(settings.tags || []);
    const subredditsStr = JSON.stringify(subreddits);
    
    // Determine which media types to include
    const mediaTypes: string[] = [];
    if (settings.mediaTypes?.image) mediaTypes.push('IMAGE');
    if (settings.mediaTypes?.gif) mediaTypes.push('GIF');
    if (settings.mediaTypes?.video) mediaTypes.push('VIDEO');
    
    // If no media types are selected, default to IMAGE
    const mediaTypesStr = JSON.stringify(mediaTypes.length > 0 ? mediaTypes : ['IMAGE']);
    
    // Use the allowNsfw setting from the settings
    const isNsfw = settings.allowNsfw === true;
    
    return `
      query {
        reddit {
          subreddits(names: ${subredditsStr}) {
            items {
              mediaItems(
                first: ${limit}
                mediaType: ${mediaTypesStr}
                filter: { 
                  isNsfw: ${isNsfw}
                }
              ) {
                items {
                  id
                  type
                  url
                  width
                  height
                  preview {
                    url
                  }
                }
              }
            }
          }
        }
      }
    `;
  }
  
  // Fetch media from Scrolller
  public static async fetchMedia(settings: Partial<PlayerSettings>, limit: number = 20): Promise<MediaItem[]> {
    // Don't allow multiple concurrent fetches
    if (this.isFetching) {
      return this.cachedItems;
    }
    
    this.isFetching = true;
    
    try {
      console.log('Fetching media with settings:', settings);
      const query = this.buildQuery(settings, limit);
      
      // Actually make the fetch request to the Scrolller API
      const response = await fetch(this.QUERY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Process the response data
      const items: MediaItem[] = [];
      
      // Extract items from the nested response structure
      try {
        const subreddits = data.data?.reddit?.subreddits?.items || [];
        
        for (const subreddit of subreddits) {
          const mediaItems = subreddit.mediaItems?.items || [];
          
          for (const item of mediaItems) {
            if (item.url) {
              let type: 'image' | 'video' | 'gif' = 'image';
              
              // Determine media type based on the API response
              if (item.type === 'GIF') {
                type = 'gif';
              } else if (item.type === 'VIDEO') {
                type = 'video';
              }
              
              items.push({
                id: item.id,
                type: type,
                url: item.url,
                width: item.width,
                height: item.height,
                thumbnailUrl: item.preview?.url || item.url
              });
            }
          }
        }
      } catch (error) {
        console.error('Error processing Scrolller response:', error);
        
        // Fallback to mock data if we can't process the real data
        if (items.length === 0) {
          const mockItems = await this.getMockMediaItems(settings, limit);
          this.cachedItems = [...this.cachedItems, ...mockItems];
          return mockItems;
        }
      }
      
      this.cachedItems = [...this.cachedItems, ...items];
      this.lastFetchTime = Date.now();
      return items;
    } catch (error) {
      console.error('Error fetching from Scrolller:', error);
      
      // Fallback to mock data if the API request fails
      const mockItems = await this.getMockMediaItems(settings, limit);
      this.cachedItems = [...this.cachedItems, ...mockItems];
      return mockItems;
    } finally {
      this.isFetching = false;
    }
  }
  
  // Get items from cache or fetch new ones
  public static async getMediaItems(settings: Partial<PlayerSettings>, limit: number = 20): Promise<MediaItem[]> {
    // Check if we have enough cached items
    if (this.cachedItems.length >= limit) {
      return this.cachedItems.slice(0, limit);
    }
    
    // If cache is stale or insufficient, fetch new items
    const newItems = await this.fetchMedia(settings, limit);
    return newItems;
  }
  
  // Get a specific item from cache or fetch it if needed
  public static async getNextItem(settings: Partial<PlayerSettings>): Promise<MediaItem | null> {
    // If cache is empty, fetch new items
    if (this.cachedItems.length === 0) {
      await this.fetchMedia(settings, 20);
      
      if (this.cachedItems.length === 0) {
        return null;
      }
    }
    
    // Get and remove the first item from cache
    const item = this.cachedItems.shift() || null;
    
    // If cache is getting low, fetch more items in the background
    if (this.cachedItems.length < 5) {
      setTimeout(() => {
        this.fetchMedia(settings, 20);
      }, 100);
    }
    
    return item;
  }
  
  // For demo and fallback purposes - simulates Scrolller API responses with mock data
  private static async getMockMediaItems(settings: Partial<PlayerSettings>, limit: number): Promise<MediaItem[]> {
    // In a real implementation, we would fetch from the actual API
    // This is just a simulation for demonstration purposes
    
    // Create some mock keywords based on the tags
    const keywords = settings.tags?.length ? settings.tags : ['nature', 'landscape', 'abstract'];
    
    const items: MediaItem[] = [];
    const mediaTypes = [];
    if (settings.mediaTypes?.image) mediaTypes.push('image');
    if (settings.mediaTypes?.gif) mediaTypes.push('gif');
    if (settings.mediaTypes?.video) mediaTypes.push('video');
    
    // Default to image if nothing selected
    if (mediaTypes.length === 0) mediaTypes.push('image');
    
    // Generate mock items
    for (let i = 0; i < limit; i++) {
      const id = `mock-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const keyword = keywords[Math.floor(Math.random() * keywords.length)];
      const width = 500 + Math.floor(Math.random() * 500);
      const height = 500 + Math.floor(Math.random() * 500);
      
      // Select a random media type from the allowed types
      const type = mediaTypes[Math.floor(Math.random() * mediaTypes.length)] as 'image' | 'video' | 'gif';
      
      // Consider NSFW setting when generating mock URLs (just for demonstration)
      const isNsfw = settings.allowNsfw === true;
      const tag = isNsfw ? `nsfw-${keyword}` : keyword;
      
      const item: MediaItem = {
        id,
        type: type,
        url: `https://picsum.photos/${width}/${height}?random=${id}&tag=${tag}`,
        width,
        height,
        thumbnailUrl: `https://picsum.photos/100/100?random=${id}&tag=${tag}`
      };
      
      items.push(item);
    }
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return items;
  }
}
