
import React from 'react';
import { X, Settings, Volume2, VolumeX, Home, Maximize, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PlayerToolbarProps {
  onExit: () => void;
  onToggleSound: () => void;
  onToggleFullscreen: () => void;
  onSkipNext: () => void;
  isMuted: boolean;
  loadingMedia: boolean;
}

const PlayerToolbar: React.FC<PlayerToolbarProps> = ({
  onExit,
  onToggleSound,
  onToggleFullscreen,
  onSkipNext,
  isMuted,
  loadingMedia
}) => {
  return (
    <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center p-4 bg-gradient-to-b from-black/80 to-transparent">
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={onExit}
          className="h-10 w-10 rounded-full bg-black/50 backdrop-blur-md border border-gray-800"
        >
          <Home className="h-5 w-5" />
        </Button>
        
        <Button 
          variant="outline" 
          size="icon" 
          onClick={onToggleSound}
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
          onClick={onSkipNext}
          className="h-10 w-10 rounded-full bg-black/50 backdrop-blur-md border border-gray-800"
          disabled={loadingMedia}
        >
          <SkipForward className="h-5 w-5" />
        </Button>
        
        <Button 
          variant="outline" 
          size="icon" 
          onClick={onToggleFullscreen}
          className="h-10 w-10 rounded-full bg-black/50 backdrop-blur-md border border-gray-800"
        >
          <Maximize className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default PlayerToolbar;
