
import { MediaItem } from '../types';

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
  
  // Construct GraphQL query for Scrolller
  private static buildQuery(subreddits: string[], limit: number = 20): string {
    const subredditsStr = JSON.stringify(subreddits);
    return `
      query {
        reddit {
          subreddits(names: ${subredditsStr}) {
            items {
              mediaItems(
                first: ${limit}
                mediaType: IMAGE
              ) {
                items {
                  id
                  type
                  url
                  width
                  height
                }
              }
            }
          }
        }
      }
    `;
  }
  
  // Fetch media from Scrolller
  public static async fetchMedia(tags: string[], limit: number = 20): Promise<MediaItem[]> {
    // Don't allow multiple concurrent fetches
    if (this.isFetching) {
      return this.cachedItems;
    }
    
    this.isFetching = true;
    
    try {
      console.log('Fetching media for tags:', tags);
      const subreddits = this.formatTags(tags);
      const query = this.buildQuery(subreddits, limit);
      
      // In a real app, we would actually make the fetch request here
      // However, since we're mocking this for demo purposes, let's simulate a response
      // This is a simulated response that mimics what would come from the real API
      const mockItems = await this.getMockMediaItems(tags, limit);
      
      this.cachedItems = [...this.cachedItems, ...mockItems];
      this.lastFetchTime = Date.now();
      return mockItems;
    } catch (error) {
      console.error('Error fetching from Scrolller:', error);
      return [];
    } finally {
      this.isFetching = false;
    }
  }
  
  // Get items from cache or fetch new ones
  public static async getMediaItems(tags: string[], limit: number = 20): Promise<MediaItem[]> {
    // Check if we have enough cached items
    if (this.cachedItems.length >= limit) {
      return this.cachedItems.slice(0, limit);
    }
    
    // If cache is stale or insufficient, fetch new items
    const newItems = await this.fetchMedia(tags, limit);
    return newItems;
  }
  
  // Get a specific item from cache or fetch it if needed
  public static async getNextItem(tags: string[]): Promise<MediaItem | null> {
    // If cache is empty, fetch new items
    if (this.cachedItems.length === 0) {
      await this.fetchMedia(tags, 20);
      
      if (this.cachedItems.length === 0) {
        return null;
      }
    }
    
    // Get and remove the first item from cache
    const item = this.cachedItems.shift() || null;
    
    // If cache is getting low, fetch more items in the background
    if (this.cachedItems.length < 5) {
      setTimeout(() => {
        this.fetchMedia(tags, 20);
      }, 100);
    }
    
    return item;
  }
  
  // For demo purposes only - simulates Scrolller API responses with mock data
  private static async getMockMediaItems(tags: string[], limit: number): Promise<MediaItem[]> {
    // In a real implementation, we would fetch from the actual API
    // This is just a simulation for demonstration purposes
    
    // Create some mock keywords based on the tags
    const keywords = tags.length > 0 
      ? tags 
      : ['nature', 'landscape', 'abstract'];
    
    const items: MediaItem[] = [];
    
    // Generate mock items
    for (let i = 0; i < limit; i++) {
      const id = `mock-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const keyword = keywords[Math.floor(Math.random() * keywords.length)];
      const width = 500 + Math.floor(Math.random() * 500);
      const height = 500 + Math.floor(Math.random() * 500);
      
      // In a real app, we would get actual URLs from the API
      // For this demo, we're using placeholders
      const type = Math.random() > 0.3 ? 'image' : 'gif';
      
      const item: MediaItem = {
        id,
        type: type as 'image' | 'video' | 'gif',
        url: `https://picsum.photos/${width}/${height}?random=${id}`,
        width,
        height,
        // For a real implementation, we would need to handle thumbnails properly
        thumbnailUrl: `https://picsum.photos/100/100?random=${id}`
      };
      
      items.push(item);
    }
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return items;
  }
}
