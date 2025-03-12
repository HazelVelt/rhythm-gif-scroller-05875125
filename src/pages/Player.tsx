
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Settings, Volume2, VolumeX, Home, Maximize, SkipForward } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Metronome from '@/components/Metronome';
import { RedgifsService } from '@/utils/redgifsService';
import { MetronomeService } from '@/utils/metronomeService';
import { MediaItem, PlayerSettings } from '@/types';
import { useToast } from '@/hooks/use-toast';

const Player = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [settings, setSettings] = useState<PlayerSettings | null>(null);
  const [currentMedia, setCurrentMedia] = useState<MediaItem | null>(null);
  const [nextMedia, setNextMedia] = useState<MediaItem | null>(null);
  const [currentBpm, setCurrentBpm] = useState<number>(80);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  
  const mediaTimerRef = useRef<number | null>(null);
  const bpmTimerRef = useRef<number | null>(null);
  const loadingTimeoutRef = useRef<number | null>(null);
  const previousBpmRef = useRef<number | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  
  // Preload images for smoother transitions
  const preloadMedia = (url: string, type: 'image' | 'video' | 'gif'): Promise<void> => {
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
  };
  
  // Load settings from session storage
  useEffect(() => {
    const savedSettings = sessionStorage.getItem('playerSettings');
    
    if (!savedSettings) {
      setErrorMessage('No settings found. Please configure your experience first.');
      setIsLoading(false);
      return;
    }
    
    try {
      const parsedSettings = JSON.parse(savedSettings) as PlayerSettings;
      setSettings(parsedSettings);
      
      // Set initial BPM
      const initialBpm = MetronomeService.getRandomBpm(
        parsedSettings.slowestBpm,
        parsedSettings.fastestBpm
      );
      setCurrentBpm(initialBpm);
      previousBpmRef.current = initialBpm;
      
      // Show loading indication for at least 1 second
      loadingTimeoutRef.current = window.setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error parsing settings:', error);
      setErrorMessage('Invalid settings data. Please try again.');
      setIsLoading(false);
    }
    
    // Cleanup
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);
  
  // Load initial media when settings are loaded
  useEffect(() => {
    if (!settings || !settings.tags.length) return;
    
    const loadInitialMedia = async () => {
      try {
        // Load current and next media items
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
      } catch (error) {
        console.error('Error loading initial media:', error);
        setErrorMessage('Failed to load media. Please try again.');
      }
    };
    
    loadInitialMedia();
  }, [settings]);
  
  // Set up media rotation timer when current media is set
  useEffect(() => {
    if (!settings || !currentMedia) return;
    
    // Clear any existing timer
    if (mediaTimerRef.current) {
      clearTimeout(mediaTimerRef.current);
    }
    
    // Set timer for rotating media
    mediaTimerRef.current = window.setTimeout(async () => {
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
        const newItem = await RedgifsService.getNextItem(settings);
        if (newItem) {
          setCurrentMedia(newItem);
          
          // Start loading the next item
          const newNextItem = await RedgifsService.getNextItem(settings);
          setNextMedia(newNextItem);
        }
      }
    }, settings.slideDuration * 1000);
    
    // Clean up
    return () => {
      if (mediaTimerRef.current) {
        clearTimeout(mediaTimerRef.current);
      }
    };
  }, [currentMedia, nextMedia, settings]);
  
  // Set up BPM change timer
  useEffect(() => {
    if (!settings) return;
    
    // Clear any existing timer
    if (bpmTimerRef.current) {
      clearTimeout(bpmTimerRef.current);
    }
    
    // Set timer for changing BPM
    bpmTimerRef.current = window.setTimeout(() => {
      const newBpm = MetronomeService.getRandomBpm(
        settings.slowestBpm,
        settings.fastestBpm
      );
      setCurrentBpm(newBpm);
      
      // Show notification for BPM change
      const oldBpm = previousBpmRef.current;
      previousBpmRef.current = newBpm;
      
      if (oldBpm !== null) {
        const direction = newBpm > oldBpm ? "faster" : "slower";
        toast({
          title: "BPM Changed",
          description: `Tempo changed to ${newBpm} BPM (${direction})`,
          duration: 3000,
        });
      }
    }, settings.taskTime * 1000);
    
    // Clean up
    return () => {
      if (bpmTimerRef.current) {
        clearTimeout(bpmTimerRef.current);
      }
    };
  }, [currentBpm, settings, toast]);
  
  // Exit handler
  const handleExit = () => {
    // Clear timers
    if (mediaTimerRef.current) clearTimeout(mediaTimerRef.current);
    if (bpmTimerRef.current) clearTimeout(bpmTimerRef.current);
    
    // Exit fullscreen if needed
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => {
        console.error("Error exiting fullscreen:", err);
      });
    }
    
    // Navigate back to settings
    navigate('/');
  };
  
  // Toggle sound
  const toggleSound = () => {
    setIsMuted(!isMuted);
  };
  
  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error("Error attempting to enable fullscreen:", err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(err => {
        console.error("Error attempting to exit fullscreen:", err);
      });
    }
  };
  
  // Skip to next media
  const skipToNext = async () => {
    if (!settings) return;
    
    // Clear existing timer
    if (mediaTimerRef.current) {
      clearTimeout(mediaTimerRef.current);
    }
    
    // If we have a next item ready, use it
    if (nextMedia) {
      setCurrentMedia(nextMedia);
      setNextMedia(null);
      
      // Start loading the next item
      const newNextItem = await RedgifsService.getNextItem(settings);
      setNextMedia(newNextItem);
    } else {
      // If next item isn't ready yet, load a new one
      const newItem = await RedgifsService.getNextItem(settings);
      if (newItem) {
        setCurrentMedia(newItem);
        
        // Start loading the next item
        const newNextItem = await RedgifsService.getNextItem(settings);
        setNextMedia(newNextItem);
      }
    }
    
    toast({
      title: "Media Skipped",
      description: "Loading next content...",
      duration: 2000,
    });
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block h-12 w-12 rounded-full border-4 border-t-blue-500 border-r-transparent border-l-transparent border-b-transparent animate-spin"></div>
          <p className="mt-4 text-blue-600 dark:text-blue-400">Loading your experience...</p>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (errorMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-gray-900">
        <div className="text-center max-w-md mx-auto">
          <div className="mb-6 text-red-500">
            <X className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">Error</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{errorMessage}</p>
          <Button onClick={() => navigate('/')} className="bg-blue-600 hover:bg-blue-700 text-white">
            Return to Settings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div ref={playerContainerRef} className="min-h-screen flex flex-col overflow-hidden relative bg-gray-900">
      {/* Header toolbar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleExit}
            className="h-10 w-10 rounded-full bg-black/50 backdrop-blur-md border border-gray-800"
          >
            <Home className="h-5 w-5" />
          </Button>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={toggleSound}
            className="h-10 w-10 rounded-full bg-black/50 backdrop-blur-md border border-gray-800"
          >
            {isMuted ? 
              <VolumeX className="h-5 w-5" /> : 
              <Volume2 className="h-5 w-5" />
            }
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={skipToNext}
            className="h-10 w-10 rounded-full bg-black/50 backdrop-blur-md border border-gray-800"
          >
            <SkipForward className="h-5 w-5" />
          </Button>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={toggleFullscreen}
            className="h-10 w-10 rounded-full bg-black/50 backdrop-blur-md border border-gray-800"
          >
            <Maximize className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Media display area */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {currentMedia && (
            <motion.div
              key={currentMedia.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 flex items-center justify-center bg-black"
            >
              {currentMedia.type === 'video' ? (
                <video
                  src={currentMedia.url}
                  autoPlay
                  loop
                  muted={isMuted}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <img
                  src={currentMedia.url}
                  alt=""
                  className="max-w-full max-h-full object-contain animate-blur-in"
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Metronome fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 py-4 z-10">
        <div className="max-w-lg mx-auto rounded-lg py-3 px-6 bg-black/70 backdrop-blur-md border border-gray-800">
          <div className="flex justify-center items-center">
            <div className="px-4 py-2 bg-gray-800 rounded-lg mr-4 text-xl font-mono font-bold text-white">
              {currentBpm} <span className="text-sm text-gray-400">BPM</span>
            </div>
            <Metronome 
              bpm={currentBpm} 
              autoPlay={true} 
              showControls={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Player;
