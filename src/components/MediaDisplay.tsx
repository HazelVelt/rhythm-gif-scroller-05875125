
import React from 'react';
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
  // Animations for media transitions
  const fadeInOut = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.5 }
  };

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
        <video
          src={currentMedia.url}
          autoPlay
          loop
          muted={isMuted}
          className="max-w-full max-h-full object-contain"
          playsInline
        />
      ) : (
        <img
          src={currentMedia.url}
          alt=""
          className="max-w-full max-h-full object-contain animate-blur-in"
        />
      )}
    </motion.div>
  );
};

export default MediaDisplay;
