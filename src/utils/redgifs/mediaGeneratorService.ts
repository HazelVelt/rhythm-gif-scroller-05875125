
import { MediaItem } from '@/types';

/**
 * Service for generating sample media items
 */
class MediaGeneratorServiceClass {
  /**
   * Generate sample items for testing
   * In a real implementation, this would be data from the API
   */
  public generateSampleItems(tags: string[]): MediaItem[] {
    // Generate 5 sample items
    const items: MediaItem[] = [];
    
    // Add a mix of videos and images
    const videoUrls = [
      'https://thumbs2.redgifs.com/WelloffDarkHatchetfish.mp4',
      'https://thumbs2.redgifs.com/ImprobableAdeptBobolink.mp4',
      'https://thumbs2.redgifs.com/ConcernedExcitableLice.mp4',
      'https://thumbs2.redgifs.com/QueasyWildBasil.mp4'
    ];
    
    const imageUrls = [
      'https://i.imgur.com/3vDRl5r.jpg',
      'https://i.imgur.com/JlVKy6L.jpg'
    ];
    
    // Mix video and image types
    for (let i = 0; i < 5; i++) {
      const isVideo = i % 3 !== 0; // Make most items videos
      const id = `sample-${tags.join('-')}-${i}`;
      
      if (isVideo) {
        const videoIndex = i % videoUrls.length;
        items.push({
          id,
          type: 'video',
          url: videoUrls[videoIndex],
          thumbnailUrl: imageUrls[i % imageUrls.length], // Use an image as thumbnail
          width: 480,
          height: 848
        });
      } else {
        const imageIndex = i % imageUrls.length;
        items.push({
          id,
          type: 'image',
          url: imageUrls[imageIndex],
          width: 1200,
          height: 800
        });
      }
    }
    
    console.log('Generated sample items:', items);
    return items;
  }
}

// Export singleton
export const MediaGeneratorService = new MediaGeneratorServiceClass();
