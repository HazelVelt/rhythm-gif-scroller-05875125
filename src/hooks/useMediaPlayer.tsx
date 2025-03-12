
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

  // Preload media for smoother transitions
  const preloadMedia = useCallback((url: string, type: 'image' | 'video' | 'gif'): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (type === 'image' || type === 'gif') {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject();
        img.src = url;
      } else if (type === 'video') {
        const video = document.createElement('video');
        video.preload = 'auto';
        video.oncanplaythrough = () => resolve();
        video.onerror = () => reject();
        video.src = url;
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
        
        if (firstItem) {
          console.log("Got first media item:", firstItem.url);
          
          // Preload the media
          if (firstItem.url) {
            await preloadMedia(firstItem.url, firstItem.type).catch(() => {
              console.warn('Failed to preload media:', firstItem.url);
            });
          }
          
          setCurrentMedia(firstItem);
          
          // Start loading the next item immediately
          console.log("Fetching second media item");
          const secondItem = await RedgifsService.getNextItem(settings);
          if (secondItem && secondItem.url) {
            preloadMedia(secondItem.url, secondItem.type).catch(() => {
              console.warn('Failed to preload next media:', secondItem.url);
            });
          }
          setNextMedia(secondItem);
        } else {
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
  }, [settings, preloadMedia]);

  // Set up media rotation timer
  useEffect(() => {
    if (!settings || !currentMedia) return;
    
    // Clear any existing timer
    if (mediaTimerRef.current) {
      clearTimeout(mediaTimerRef.current);
    }
    
    // Set timer for rotating media
    mediaTimerRef.current = window.setTimeout(async () => {
      await rotateMedia();
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
    
    // If we have a next item ready, use it
    if (nextMedia) {
      setCurrentMedia(nextMedia);
      setNextMedia(null);
      
      // Start loading the next item
      const newNextItem = await RedgifsService.getNextItem(settings);
      if (newNextItem && newNextItem.url) {
        preloadMedia(newNextItem.url, newNextItem.type).catch(() => {
          console.warn('Failed to preload next media:', newNextItem.url);
        });
      }
      setNextMedia(newNextItem);
    } else {
      // If next item isn't ready yet, load a new one
      setLoadingMedia(true);
      const newItem = await RedgifsService.getNextItem(settings);
      
      if (newItem) {
        setCurrentMedia(newItem);
        
        // Start loading the next item
        const newNextItem = await RedgifsService.getNextItem(settings);
        setNextMedia(newNextItem);
      } else {
        // If we couldn't get a new item, show error
        setErrorMessage('Unable to load more media. Please try different tags.');
      }
      
      setLoadingMedia(false);
    }
  };

  // Skip to next media
  const skipToNext = async () => {
    if (!settings) return;
    
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
    
    setLoadingMedia(false);
  };

  // Retry loading media
  const retryLoading = () => {
    setErrorMessage(null);
    
    // Clear the cache to ensure fresh data
    RedgifsService.clearCache();
    
    // Reload media if we have settings
    if (settings) {
      const loadMedia = async () => {
        setLoadingMedia(true);
        const firstItem = await RedgifsService.getNextItem(settings);
        
        if (firstItem) {
          setCurrentMedia(firstItem);
          const secondItem = await RedgifsService.getNextItem(settings);
          setNextMedia(secondItem);
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
