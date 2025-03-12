
import { MediaItem } from '@/types';
import { REDGIFS_CONFIG } from './config';
import { TokenService } from './tokenService';
import { MediaGeneratorService } from './mediaGeneratorService';

/**
 * Service for making API calls to RedGifs
 */
class ApiServiceClass {
  /**
   * Fetch media based on tags
   */
  public async fetchMedia(tags: string[], includeNsfw: boolean): Promise<MediaItem[]> {
    if (!tags || tags.length === 0) {
      console.error('No tags provided for fetchMedia');
      return this.fetchTrendingMedia(); // Fallback to trending
    }
    
    try {
      // Generate a direct URL to RedGifs search
      const searchParams = new URLSearchParams();
      searchParams.append('search_text', tags.join(' '));
      searchParams.append('order', 'trending');
      searchParams.append('count', '30');
      
      if (includeNsfw) {
        searchParams.append('type', 'g'); // Include explicit content
      }
      
      // Direct fetch from RedGifs
      const directUrl = `https://redgifs.com/browse?${searchParams.toString()}`;
      console.log('Generated direct URL:', directUrl);
      
      // For demonstration, we'll use some sample data structure
      // This simulates what we'd get from RedGifs
      return MediaGeneratorService.generateSampleItems(tags);
    } catch (error) {
      console.error('Error fetching media:', error);
      return this.fetchTrendingMedia(); // Fallback to trending
    }
  }
  
  /**
   * Fetch trending media as fallback
   */
  public async fetchTrendingMedia(): Promise<MediaItem[]> {
    console.log('Fetching trending as fallback');
    
    // For demonstration, return sample trending items
    return MediaGeneratorService.generateSampleItems(['trending']);
  }
}

// Export singleton
export const ApiService = new ApiServiceClass();
