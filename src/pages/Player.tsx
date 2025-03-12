
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { PlayerSettings } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useMediaPlayer } from '@/hooks/useMediaPlayer';
import { useMetronome } from '@/hooks/useMetronome';
import MediaDisplay from '@/components/MediaDisplay';
import PlayerToolbar from '@/components/PlayerToolbar';
import MetronomeDisplay from '@/components/MetronomeDisplay';

const Player = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State
  const [settings, setSettings] = useState<PlayerSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  
  // Refs
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const loadingTimeoutRef = useRef<number | null>(null);
  
  // Initialize settings from sessionStorage
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
  
  // Use our custom hooks
  const {
    currentMedia,
    loadingMedia,
    errorMessage: mediaError,
    skipToNext,
    retryLoading
  } = useMediaPlayer(settings);
  
  const { currentBpm } = useMetronome(settings);
  
  // Update error message from media player
  useEffect(() => {
    if (mediaError) {
      setErrorMessage(mediaError);
    }
  }, [mediaError]);
  
  // Handler functions
  const handleExit = () => {
    // Exit fullscreen if needed
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => {
        console.error("Error exiting fullscreen:", err);
      });
    }
    
    // Navigate back to settings
    navigate('/');
  };
  
  const toggleSound = () => {
    setIsMuted(!isMuted);
  };
  
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
  
  const handleRetryLoading = () => {
    setErrorMessage(null);
    setIsLoading(true);
    
    // Use the retry function from our hook
    retryLoading();
    
    // Restart the loading timeout
    loadingTimeoutRef.current = window.setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center neo p-8 rounded-xl">
          <div className="inline-block h-12 w-12 rounded-full border-4 border-t-blue-500 border-r-transparent border-l-transparent border-b-transparent animate-spin"></div>
          <p className="mt-4 text-blue-400">Loading your experience...</p>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (errorMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-black text-white">
        <div className="text-center max-w-md mx-auto neo p-8 rounded-xl">
          <div className="mb-6 text-red-500">
            <X className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold mb-2 text-white">Error</h2>
          <p className="text-gray-400 mb-6">{errorMessage}</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={handleRetryLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
              Retry
            </Button>
            <Button onClick={() => navigate('/')} variant="outline" className="border-gray-700 text-gray-300">
              Return to Settings
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={playerContainerRef} className="min-h-screen flex flex-col overflow-hidden relative bg-gray-950">
      {/* Header toolbar */}
      <PlayerToolbar
        onExit={handleExit}
        onToggleSound={toggleSound}
        onToggleFullscreen={toggleFullscreen}
        onSkipNext={skipToNext}
        isMuted={isMuted}
        loadingMedia={loadingMedia}
      />
      
      {/* Media display area */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <MediaDisplay
            currentMedia={currentMedia}
            loadingMedia={loadingMedia}
            isMuted={isMuted}
            onSkipNext={skipToNext}
          />
        </AnimatePresence>
      </div>
      
      {/* Metronome */}
      <MetronomeDisplay currentBpm={currentBpm} />
    </div>
  );
};

export default Player;
