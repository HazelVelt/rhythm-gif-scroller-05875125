
import { useState, useEffect, useRef, useCallback } from 'react';
import { MediaItem, PlayerSettings } from '@/types';
import { RedgifsService } from '@/utils/redgifsService';
import { useToast } from '@/hooks/use-toast';

export const useMediaPlayer = (initialSettings: PlayerSettings | null) => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<PlayerSettings | null>(initialSettings);
  const [currentMedia, setCurrentMedia] = useState<MediaItem | null>(null);
  const [nextMedia, setNextMedia] = useState<MediaItem | null>(null);
  const [loadingMedia, setLoadingMedia] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const mediaTimerRef = useRef<number | null>(null);
  const fetchAttemptsRef = useRef<number>(0);

  // Preload media for smoother transitions
  const preloadMedia = useCallback((url: string, type: 'image' | 'video' | 'gif'): Promise<void> => {
    console.log(`Preloading ${type}:`, url);
    return new Promise((resolve, reject) => {
      if (type === 'image' || type === 'gif') {
        const img = new Image();
        img.onload = () => {
          console.log('Image preloaded successfully:', url);
          resolve();
        };
        img.onerror = (error) => {
          console.error('Failed to preload image:', url, error);
          reject();
        };
        img.src = url;
      } else if (type === 'video') {
        const video = document.createElement('video');
        video.preload = 'auto';
        video.oncanplaythrough = () => {
          console.log('Video preloaded successfully:', url);
          resolve();
        };
        video.onerror = (error) => {
          console.error('Failed to preload video:', url, error);
          reject();
        };
        video.src = url;
        
        // Set timeout to resolve anyway if it takes too long
        setTimeout(() => {
          if (video.readyState < 3) { // HAVE_FUTURE_DATA = 3
            console.log('Video preload timed out, continuing anyway:', url);
            resolve();
          }
        }, 5000);
      }
    });
  }, []);

  // Load initial media when settings are available
  useEffect(() => {
    if (!settings || !settings.tags.length) return;
    
    const loadInitialMedia = async () => {
      try {
        setLoadingMedia(true);
        setErrorMessage(null);
        
        console.log("Fetching first media item with tags:", settings.tags);
        const firstItem = await RedgifsService.getNextItem(settings);
        
        if (firstItem && firstItem.url) {
          console.log("Got first media item:", firstItem);
          
          try {
            // Preload the media
            await preloadMedia(firstItem.url, firstItem.type).catch(() => {
              console.warn('First item preload failed but continuing:', firstItem.url);
            });
          } catch (e) {
            console.warn('Error during preload but continuing:', e);
          }
          
          setCurrentMedia(firstItem);
          
          // Start loading the next item immediately
          console.log("Fetching second media item");
          fetchNextMediaItem();
        } else {
          console.error('No valid media found');
          setErrorMessage('No media found for the provided tags. Please try different tags.');
        }
        
        setLoadingMedia(false);
      } catch (error) {
        console.error('Error loading initial media:', error);
        setErrorMessage('Failed to load media. Please try again with different tags.');
        setLoadingMedia(false);
      }
    };
    
    loadInitialMedia();
    
    // Clear any existing fetching state
    fetchAttemptsRef.current = 0;
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]); // Intentionally exclude preloadMedia to avoid re-runs

  // Fetch the next media item
  const fetchNextMediaItem = useCallback(async () => {
    if (!settings) return null;
    
    console.log("Fetching next media item");
    try {
      const nextItem = await RedgifsService.getNextItem(settings);
      
      if (nextItem && nextItem.url) {
        console.log("Got next media item:", nextItem);
        
        // Try to preload in background
        preloadMedia(nextItem.url, nextItem.type).catch(() => {
          console.warn('Next item preload failed but continuing');
        });
        
        setNextMedia(nextItem);
        return nextItem;
      } else {
        console.warn('Got empty next item');
        return null;
      }
    } catch (error) {
      console.error('Error fetching next item:', error);
      return null;
    }
  }, [settings, preloadMedia]);

  // Set up media rotation timer
  useEffect(() => {
    if (!settings || !currentMedia) return;
    
    // Clear any existing timer
    if (mediaTimerRef.current) {
      clearTimeout(mediaTimerRef.current);
    }
    
    // Set timer for rotating media
    mediaTimerRef.current = window.setTimeout(() => {
      console.log("Timer triggered for next media");
      rotateMedia();
    }, settings.slideDuration * 1000);
    
    // Clean up
    return () => {
      if (mediaTimerRef.current) {
        clearTimeout(mediaTimerRef.current);
      }
    };
  }, [currentMedia, settings]);

  // Function to rotate to next media
  const rotateMedia = async () => {
    if (!settings) return;
    
    console.log("Rotating to next media");
    setLoadingMedia(true);
    
    // If we have a next item ready, use it
    if (nextMedia) {
      console.log("Using preloaded next item:", nextMedia.id);
      setCurrentMedia(nextMedia);
      setNextMedia(null);
      
      // Start loading the next item for future use
      fetchNextMediaItem();
    } else {
      console.log("No preloaded item, fetching new one");
      // If next item isn't ready yet, load a new one
      const newItem = await RedgifsService.getNextItem(settings);
      
      if (newItem && newItem.url) {
        console.log("Got new current item:", newItem.id);
        setCurrentMedia(newItem);
        
        // Start loading the next item for future use
        fetchNextMediaItem();
      } else {
        console.error("Failed to get new media item");
        // If we couldn't get a new item, show error
        setErrorMessage('Unable to load more media. Please try different tags.');
        
        // Attempt to retry
        if (fetchAttemptsRef.current < 3) {
          fetchAttemptsRef.current++;
          console.log(`Retry attempt ${fetchAttemptsRef.current}/3`);
          RedgifsService.clearCache();
          setTimeout(() => rotateMedia(), 1000);
          return;
        }
      }
    }
    
    setLoadingMedia(false);
  };

  // Skip to next media
  const skipToNext = async () => {
    if (!settings) return;
    
    console.log("User skipped to next media");
    setLoadingMedia(true);
    
    // Clear existing timer
    if (mediaTimerRef.current) {
      clearTimeout(mediaTimerRef.current);
    }
    
    await rotateMedia();
    
    toast({
      title: "Media Skipped",
      description: "Loading next content...",
      duration: 2000,
    });
  };

  // Retry loading media
  const retryLoading = () => {
    console.log("Retrying media loading");
    setErrorMessage(null);
    
    // Clear the cache to ensure fresh data
    RedgifsService.clearCache();
    fetchAttemptsRef.current = 0;
    
    // Reload media if we have settings
    if (settings) {
      const loadMedia = async () => {
        setLoadingMedia(true);
        const firstItem = await RedgifsService.getNextItem(settings);
        
        if (firstItem && firstItem.url) {
          setCurrentMedia(firstItem);
          fetchNextMediaItem();
        } else {
          setErrorMessage('Still unable to load media. Please try different tags.');
        }
        
        setLoadingMedia(false);
      };
      
      loadMedia();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaTimerRef.current) {
        clearTimeout(mediaTimerRef.current);
      }
    };
  }, []);

  return {
    currentMedia,
    nextMedia,
    loadingMedia,
    errorMessage,
    skipToNext,
    retryLoading
  };
};
