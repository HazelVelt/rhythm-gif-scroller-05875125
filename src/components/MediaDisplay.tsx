
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { MediaItem } from '@/types';

interface MediaDisplayProps {
  currentMedia: MediaItem | null;
  loadingMedia: boolean;
  isMuted: boolean;
  onSkipNext: () => void;
}

const MediaDisplay: React.FC<MediaDisplayProps> = ({
  currentMedia,
  loadingMedia,
  isMuted,
  onSkipNext
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = useState<boolean>(false);

  // Animations for media transitions
  const fadeInOut = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.5 }
  };

  // Effect to handle video playback whenever the media changes
  useEffect(() => {
    if (currentMedia?.type === 'video' && videoRef.current) {
      console.log('Attempting to play video:', currentMedia.url);
      setVideoError(false);
      
      // Reset video element
      videoRef.current.pause();
      videoRef.current.load();
      
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Error playing video:', error);
          setVideoError(true);
        });
      }
    }
  }, [currentMedia]);

  // Debug output
  useEffect(() => {
    if (currentMedia) {
      console.log('Current media for display:', {
        id: currentMedia.id,
        type: currentMedia.type,
        url: currentMedia.url,
        thumbnail: currentMedia.thumbnailUrl || 'none'
      });
    } else {
      console.log('No current media to display');
    }
  }, [currentMedia]);

  if (loadingMedia) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="inline-block h-12 w-12 rounded-full border-4 border-t-blue-500 border-r-transparent border-l-transparent border-b-transparent animate-spin"></div>
          <p className="mt-4 text-gray-400">Loading media...</p>
        </div>
      </div>
    );
  }

  if (!currentMedia) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        <div className="text-center p-8">
          <p className="text-gray-400">No media to display. Try skipping to the next item.</p>
          <Button 
            onClick={onSkipNext} 
            className="mt-4 bg-blue-600 hover:bg-blue-700"
          >
            Load Next Item
          </Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      key={currentMedia.id}
      {...fadeInOut}
      className="absolute inset-0 flex items-center justify-center bg-black"
    >
      {currentMedia.type === 'video' ? (
        <div className="relative w-full h-full flex items-center justify-center">
          <video
            ref={videoRef}
            src={currentMedia.url}
            poster={currentMedia.thumbnailUrl}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            controls={false}
            className="max-w-full max-h-full object-contain"
            onError={(e) => {
              console.error('Video loading error:', e);
              setVideoError(true);
            }}
          />
          
          {videoError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="text-center p-6 bg-gray-900/90 rounded-lg">
                <p className="text-red-400 mb-3">This video could not be played</p>
                <Button
                  onClick={onSkipNext}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Skip to Next
                </Button>
              </div>
            </div>
          )}

          {/* Control button */}
          <Button
            onClick={onSkipNext}
            className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-700 opacity-70 hover:opacity-100"
          >
            Skip
          </Button>
        </div>
      ) : (
        <div className="relative w-full h-full flex items-center justify-center">
          <img
            src={currentMedia.url}
            alt=""
            className="max-w-full max-h-full object-contain"
            onError={(e) => {
              console.error('Image loading error for URL:', currentMedia.url);
              onSkipNext();
            }}
          />
          
          {/* Control button for images too */}
          <Button
            onClick={onSkipNext}
            className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-700 opacity-70 hover:opacity-100"
          >
            Skip
          </Button>
        </div>
      )}
    </motion.div>
  );
};

export default MediaDisplay;
