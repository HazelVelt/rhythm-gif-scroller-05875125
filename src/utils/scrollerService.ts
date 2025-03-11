
import { MediaItem, PlayerSettings } from '../types';
import { toast } from "@/hooks/use-toast";

export class ScrollerService {
  private static readonly BASE_URL = 'https://api.scrolller.com';
  private static readonly QUERY_URL = `${ScrollerService.BASE_URL}/api/v2/graphql`;
  private static readonly DEFAULT_SUBREDDIT = 'gifs';
  
  private static cachedItems: MediaItem[] = [];
  private static lastFetchTime: number = 0;
  private static isFetching: boolean = false;
  private static retryCount: number = 0;
  private static readonly MAX_RETRIES = 3;
  
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
                  isNsfw
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
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      
      if (!response.ok) {
        console.error(`HTTP error: ${response.status}`);
        toast({
          title: "API Error",
          description: `Failed to fetch media: HTTP ${response.status}`,
          variant: "destructive",
        });
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Scrolller API response:', data);
      
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
        
        if (items.length === 0) {
          toast({
            title: "No Media Found",
            description: `No media found for tags: ${settings.tags?.join(', ')}`,
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error processing Scrolller response:', error);
        toast({
          title: "Error Processing Media",
          description: "There was a problem processing the media data",
          variant: "destructive",
        });
        
        // Return empty array instead of using mock data
        return [];
      }
      
      // Reset retry count on success
      this.retryCount = 0;
      
      // Update cache with new items
      this.cachedItems = [...items];
      this.lastFetchTime = Date.now();
      return items;
    } catch (error) {
      console.error('Error fetching from Scrolller:', error);
      
      // Implement retry logic
      if (this.retryCount < this.MAX_RETRIES) {
        this.retryCount++;
        this.isFetching = false;
        
        toast({
          title: "Retrying Connection",
          description: `Attempt ${this.retryCount} of ${this.MAX_RETRIES}`,
          variant: "default",
        });
        
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.fetchMedia(settings, limit);
      } else {
        // Reset retry count and notify user
        this.retryCount = 0;
        toast({
          title: "Connection Failed",
          description: "Failed to connect to the media service after multiple attempts",
          variant: "destructive",
        });
        
        // Return empty array instead of mock data
        return [];
      }
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
      const items = await this.fetchMedia(settings, 20);
      
      if (items.length === 0) {
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
}
