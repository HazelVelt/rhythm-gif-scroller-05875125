
import { MediaItem, PlayerSettings } from '../types';
import { toast } from "@/hooks/use-toast";

export class ScrollerService {
  private static readonly DEFAULT_SUBREDDIT = 'gifs';
  private static cachedItems: MediaItem[] = [];
  private static isFetching: boolean = false;
  private static retryCount: number = 0;
  private static readonly MAX_RETRIES = 3;
  
  // Format tags into subreddits
  private static formatTags(tags: string[]): string[] {
    return tags.length > 0 
      ? tags.map(tag => tag.toLowerCase().trim().replace(/\s+/g, ''))
      : [this.DEFAULT_SUBREDDIT];
  }
  
  // Generate fallback content when all API requests fail
  private static generateFallbackItems(): MediaItem[] {
    const fallbackItems: MediaItem[] = [
      {
        id: `fallback-${Date.now()}-1`,
        type: 'image',
        url: 'https://i.imgur.com/jxQXOFE.jpg',
        width: 800,
        height: 600,
        thumbnailUrl: 'https://i.imgur.com/jxQXOFE.jpg'
      },
      {
        id: `fallback-${Date.now()}-2`,
        type: 'image',
        url: 'https://i.imgur.com/5yeBVeM.jpg',
        width: 800,
        height: 600,
        thumbnailUrl: 'https://i.imgur.com/5yeBVeM.jpg'
      }
    ];
    
    console.log('Using fallback content due to API failures');
    toast({
      title: "API Connection Failed",
      description: "Failed to load content from all sources. Using fallback content.",
      variant: "destructive",
    });
    
    return fallbackItems;
  }
  
  // Primary method to fetch media from Reddit API
  public static async fetchMedia(settings: Partial<PlayerSettings>, limit: number = 20): Promise<MediaItem[]> {
    // Avoid concurrent fetches
    if (this.isFetching) {
      return this.cachedItems.length > 0 ? this.cachedItems : this.generateFallbackItems();
    }
    
    this.isFetching = true;
    
    try {
      console.log('Fetching media with settings:', settings);
      
      // Use Reddit's JSON API directly - more reliable than Scrolller
      const subreddits = this.formatTags(settings.tags || []);
      const subreddit = subreddits[0] || this.DEFAULT_SUBREDDIT;
      
      // Try to fetch from Reddit directly
      const response = await fetch(`https://www.reddit.com/r/${subreddit}.json?limit=${limit}&t=day`);
      
      if (!response.ok) {
        throw new Error(`Reddit API HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const posts = data.data?.children || [];
      const items: MediaItem[] = [];
      
      for (const post of posts) {
        const postData = post.data;
        
        // Skip non-media posts
        if (!postData?.url_overridden_by_dest || postData.is_self) continue;
        
        const url = postData.url_overridden_by_dest;
        const isImage = /\.(jpg|jpeg|png|gif)$/i.test(url);
        const isGif = /\.gif$/i.test(url);
        const isVideo = /\.(mp4|webm)$/i.test(url) || postData.is_video;
        const mediaType = isGif ? 'gif' : (isVideo ? 'video' : 'image');
        
        // Skip if the mediaType doesn't match user settings
        if (
          (mediaType === 'image' && !settings.mediaTypes?.image) || 
          (mediaType === 'gif' && !settings.mediaTypes?.gif) ||
          (mediaType === 'video' && !settings.mediaTypes?.video)
        ) continue;
        
        // Skip NSFW content if not allowed
        if (postData.over_18 && !settings.allowNsfw) continue;
        
        // Get the right URL for videos
        let finalUrl = url;
        if (isVideo && postData.is_video && postData.media?.reddit_video?.fallback_url) {
          finalUrl = postData.media.reddit_video.fallback_url;
        }
        
        // Create MediaItem
        items.push({
          id: postData.id,
          type: mediaType as 'image' | 'video' | 'gif',
          url: finalUrl,
          width: postData.preview?.images[0]?.source?.width || 800,
          height: postData.preview?.images[0]?.source?.height || 600,
          thumbnailUrl: postData.thumbnail !== 'nsfw' ? postData.thumbnail : finalUrl
        });
      }
      
      // If we got valid items, reset retry count and update cache
      if (items.length > 0) {
        this.retryCount = 0;
        this.cachedItems = [...items];
        console.log(`Successfully fetched ${items.length} items from Reddit`);
        this.isFetching = false;
        return items;
      }
      
      // If no items, try the backup method
      throw new Error('No suitable media items found in Reddit response');
      
    } catch (error) {
      console.error('Error fetching from Reddit API:', error);
      
      // Try backup method if first method fails
      try {
        const items = await this.fetchFromImgur(settings, limit);
        if (items.length > 0) {
          this.cachedItems = [...items];
          this.isFetching = false;
          return items;
        }
      } catch (imgurError) {
        console.error('Error fetching from backup source:', imgurError);
      }
      
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
        // Reset retry count and use fallback
        this.retryCount = 0;
        this.isFetching = false;
        return this.generateFallbackItems();
      }
    } finally {
      this.isFetching = false;
    }
  }
  
  // Backup method using Imgur API
  private static async fetchFromImgur(settings: Partial<PlayerSettings>, limit: number = 20): Promise<MediaItem[]> {
    const tags = settings.tags || [];
    const searchTerm = tags.length > 0 ? tags[0] : 'random';
    
    try {
      // Use a CORS proxy for Imgur API
      const proxyUrl = 'https://corsproxy.io/?';
      const targetUrl = encodeURIComponent(`https://api.imgur.com/3/gallery/search/?q=${searchTerm}`);
      
      const response = await fetch(`${proxyUrl}${targetUrl}`, {
        headers: {
          'Authorization': 'Client-ID 546c25a59c58ad7'  // Public Imgur API client ID
        }
      });
      
      if (!response.ok) {
        throw new Error(`Imgur API HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const items: MediaItem[] = [];
      
      if (data.data && Array.isArray(data.data)) {
        for (const item of data.data) {
          // Skip albums, we want single images
          if (item.is_album || !item.link) continue;
          
          const isImage = /\.(jpg|jpeg|png)$/i.test(item.link);
          const isGif = /\.gif$/i.test(item.link);
          const isVideo = /\.(mp4|webm)$/i.test(item.link);
          const mediaType = isGif ? 'gif' : (isVideo ? 'video' : 'image');
          
          // Skip if the mediaType doesn't match user settings
          if (
            (mediaType === 'image' && !settings.mediaTypes?.image) || 
            (mediaType === 'gif' && !settings.mediaTypes?.gif) ||
            (mediaType === 'video' && !settings.mediaTypes?.video)
          ) continue;
          
          // Skip NSFW content if not allowed
          if (item.nsfw && !settings.allowNsfw) continue;
          
          items.push({
            id: item.id,
            type: mediaType as 'image' | 'video' | 'gif',
            url: item.link,
            width: item.width || 800,
            height: item.height || 600,
            thumbnailUrl: item.link
          });
          
          // Limit to the requested number
          if (items.length >= limit) break;
        }
      }
      
      if (items.length === 0) {
        toast({
          title: "No Content Found",
          description: "No suitable content found for your search criteria.",
          variant: "destructive",
        });
      }
      
      return items;
    } catch (error) {
      console.error('Error fetching from Imgur:', error);
      toast({
        title: "Backup API Failed",
        description: "Failed to load content from backup source.",
        variant: "destructive",
      });
      return [];
    }
  }
  
  // Public method to get media items from cache or fetch new ones
  public static async getMediaItems(settings: Partial<PlayerSettings>, limit: number = 20): Promise<MediaItem[]> {
    if (this.cachedItems.length >= limit) {
      return this.cachedItems.slice(0, limit);
    }
    
    const newItems = await this.fetchMedia(settings, limit);
    return newItems;
  }
  
  // Get next item (typically used for player)
  public static async getNextItem(settings: Partial<PlayerSettings>): Promise<MediaItem | null> {
    if (this.cachedItems.length === 0) {
      toast({
        title: "Loading Content",
        description: "Fetching fresh content for you...",
        variant: "default",
      });
      
      const items = await this.fetchMedia(settings, 20);
      
      if (items.length === 0) {
        toast({
          title: "No Content Available",
          description: "Unable to find content matching your criteria.",
          variant: "destructive",
        });
        return null;
      }
    }
    
    const item = this.cachedItems.shift() || null;
    
    // If cache is getting low, fetch more items in the background
    if (this.cachedItems.length < 5 && !this.isFetching) {
      setTimeout(() => {
        this.fetchMedia(settings, 20);
      }, 100);
    }
    
    return item;
  }
  
  // Clear cache (useful when settings change)
  public static clearCache(): void {
    this.cachedItems = [];
  }
}
