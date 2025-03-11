
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
  
  // Primary method to fetch media using Scrolller-scraper API
  public static async fetchMedia(settings: Partial<PlayerSettings>, limit: number = 20): Promise<MediaItem[]> {
    // Avoid concurrent fetches
    if (this.isFetching) {
      return this.cachedItems.length > 0 ? this.cachedItems : this.generateFallbackItems();
    }
    
    this.isFetching = true;
    
    try {
      console.log('Fetching media with settings:', settings);
      
      // Use Scrolller-scraper API
      const subreddits = this.formatTags(settings.tags || []);
      const subreddit = subreddits[0] || this.DEFAULT_SUBREDDIT;
      
      // The Scrolller-scraper API endpoint
      const scrollerAPI = `https://api.scrolller.com/api/v2/graphql`;
      
      // The query to get posts from a subreddit
      const query = {
        query: `query SubredditQuery($url: String!, $filter: SubredditPostFilter, $iterator: String) {
          getSubreddit(url: $url) {
            children(filter: $filter, iterator: $iterator) {
              iterator
              items {
                id
                __typename
                ... on Post {
                  id
                  title
                  url
                  isVideo
                  mediaSources {
                    url
                    width
                    height
                  }
                  thumbnailSources {
                    url
                    width
                    height
                  }
                  isFavorite
                  albumSize
                  isNsfw
                }
              }
            }
          }
        }`,
        variables: {
          url: `/r/${subreddit}`,
          filter: "HOT",
          iterator: null
        }
      };
      
      const response = await fetch(scrollerAPI, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(query)
      });
      
      if (!response.ok) {
        throw new Error(`Scrolller API HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const posts = data.data?.getSubreddit?.children?.items || [];
      const items: MediaItem[] = [];
      
      for (const post of posts) {
        // Skip if not a Post type
        if (!post || post.__typename !== 'Post') continue;
        
        // Skip NSFW content if not allowed
        if (post.isNsfw && !settings.allowNsfw) continue;
        
        const isVideo = post.isVideo;
        const isGif = !isVideo && post.url?.endsWith('.gif');
        const isImage = !isVideo && !isGif;
        const mediaType = isVideo ? 'video' : (isGif ? 'gif' : 'image');
        
        // Skip if the mediaType doesn't match user settings
        if (
          (mediaType === 'image' && !settings.mediaTypes?.image) || 
          (mediaType === 'gif' && !settings.mediaTypes?.gif) ||
          (mediaType === 'video' && !settings.mediaTypes?.video)
        ) continue;
        
        // Get best media source
        const mediaSource = post.mediaSources && post.mediaSources.length > 0 
          ? post.mediaSources[0] 
          : null;
          
        // Get best thumbnail source
        const thumbnailSource = post.thumbnailSources && post.thumbnailSources.length > 0 
          ? post.thumbnailSources[0] 
          : null;
        
        if (!mediaSource) continue;
        
        // Create MediaItem
        items.push({
          id: post.id,
          type: mediaType as 'image' | 'video' | 'gif',
          url: mediaSource.url || post.url,
          width: mediaSource.width || 800,
          height: mediaSource.height || 600,
          thumbnailUrl: thumbnailSource?.url || mediaSource.url || post.url
        });
        
        // Limit to the requested number
        if (items.length >= limit) break;
      }
      
      // If we got valid items, reset retry count and update cache
      if (items.length > 0) {
        this.retryCount = 0;
        this.cachedItems = [...items];
        console.log(`Successfully fetched ${items.length} items from Scrolller`);
        this.isFetching = false;
        return items;
      }
      
      // If no items, try the backup method
      throw new Error('No suitable media items found in Scrolller response');
      
    } catch (error) {
      console.error('Error fetching from Scrolller API:', error);
      
      // Try backup method using Reddit directly
      try {
        const items = await this.fetchFromReddit(settings, limit);
        if (items.length > 0) {
          this.cachedItems = [...items];
          this.isFetching = false;
          return items;
        }
      } catch (redditError) {
        console.error('Error fetching from Reddit API:', redditError);
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
        
        toast({
          title: "All APIs Failed",
          description: "Could not fetch content after multiple attempts",
          variant: "destructive",
        });
        
        return this.generateFallbackItems();
      }
    } finally {
      this.isFetching = false;
    }
  }
  
  // Backup method using Reddit API directly
  private static async fetchFromReddit(settings: Partial<PlayerSettings>, limit: number = 20): Promise<MediaItem[]> {
    const subreddits = this.formatTags(settings.tags || []);
    const subreddit = subreddits[0] || this.DEFAULT_SUBREDDIT;
    
    try {
      // Use Reddit's JSON API directly
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
      
      if (items.length === 0) {
        toast({
          title: "No Content Found",
          description: "No suitable content found for your search criteria.",
          variant: "destructive",
        });
      }
      
      return items;
    } catch (error) {
      console.error('Error fetching from Reddit:', error);
      toast({
        title: "Reddit API Failed",
        description: "Failed to load content from Reddit.",
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
