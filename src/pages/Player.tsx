
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Settings, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Metronome from '@/components/Metronome';
import { ScrollerService } from '@/utils/scrollerService';
import { MetronomeService } from '@/utils/metronomeService';
import { MediaItem, PlayerSettings } from '@/types';

const Player = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<PlayerSettings | null>(null);
  const [currentMedia, setCurrentMedia] = useState<MediaItem | null>(null);
  const [nextMedia, setNextMedia] = useState<MediaItem | null>(null);
  const [currentBpm, setCurrentBpm] = useState<number>(80);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const mediaTimerRef = useRef<number | null>(null);
  const bpmTimerRef = useRef<number | null>(null);
  const loadingTimeoutRef = useRef<number | null>(null);
  
  // Preload images for smoother transitions
  const preloadImage = (url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject();
      img.src = url;
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
        const firstItem = await ScrollerService.getNextItem(settings.tags);
        
        if (firstItem) {
          // Preload the image
          if (firstItem.url) {
            await preloadImage(firstItem.url).catch(() => {
              console.warn('Failed to preload image:', firstItem.url);
            });
          }
          
          setCurrentMedia(firstItem);
          
          // Start loading the next item immediately
          const secondItem = await ScrollerService.getNextItem(settings.tags);
          if (secondItem && secondItem.url) {
            preloadImage(secondItem.url).catch(() => {
              console.warn('Failed to preload next image:', secondItem.url);
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
        const newNextItem = await ScrollerService.getNextItem(settings.tags);
        if (newNextItem && newNextItem.url) {
          preloadImage(newNextItem.url).catch(() => {
            console.warn('Failed to preload next image:', newNextItem.url);
          });
        }
        setNextMedia(newNextItem);
      } else {
        // If next item isn't ready yet, load a new one
        const newItem = await ScrollerService.getNextItem(settings.tags);
        if (newItem) {
          setCurrentMedia(newItem);
          
          // Start loading the next item
          const newNextItem = await ScrollerService.getNextItem(settings.tags);
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
    }, settings.taskTime * 1000);
    
    // Clean up
    return () => {
      if (bpmTimerRef.current) {
        clearTimeout(bpmTimerRef.current);
      }
    };
  }, [currentBpm, settings]);
  
  // Exit handler
  const handleExit = () => {
    // Clear timers
    if (mediaTimerRef.current) clearTimeout(mediaTimerRef.current);
    if (bpmTimerRef.current) clearTimeout(bpmTimerRef.current);
    
    // Navigate back to settings
    navigate('/');
  };
  
  // Toggle sound
  const toggleSound = () => {
    setIsMuted(!isMuted);
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse-subtle inline-block h-12 w-12 rounded-full border-2 border-t-primary border-r-transparent border-l-transparent border-b-transparent animate-spin"></div>
          <p className="mt-4 text-muted-foreground">Preparing your experience...</p>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (errorMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="mb-6 text-destructive">
            <X className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-muted-foreground mb-6">{errorMessage}</p>
          <Button onClick={() => navigate('/')}>
            Return to Settings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col overflow-hidden relative">
      {/* Exit button */}
      <div className="absolute top-4 right-4 z-20">
        <Button 
          variant="secondary" 
          size="icon" 
          onClick={handleExit}
          className="glass h-10 w-10 rounded-full bg-black/30 backdrop-blur-md"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Sound toggle */}
      <div className="absolute top-4 left-4 z-20">
        <Button 
          variant="secondary" 
          size="icon" 
          onClick={toggleSound}
          className="glass h-10 w-10 rounded-full bg-black/30 backdrop-blur-md"
        >
          {isMuted ? 
            <VolumeX className="h-5 w-5" /> : 
            <Volume2 className="h-5 w-5" />
          }
        </Button>
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
              className="absolute inset-0 flex items-center justify-center bg-background"
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
        <div className="glass max-w-lg mx-auto rounded-full py-3 px-6">
          <Metronome 
            bpm={currentBpm} 
            autoPlay={true} 
            showControls={false}
          />
        </div>
      </div>
    </div>
  );
};

export default Player;
