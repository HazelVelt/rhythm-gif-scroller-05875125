
import React from 'react';
import { Play, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PlayerFooterProps {
  canStart: boolean;
  startPlayer: () => void;
}

const PlayerFooter: React.FC<PlayerFooterProps> = ({
  canStart,
  startPlayer
}) => {
  return (
    <>
      {!canStart && (
        <div className="flex items-center text-yellow-400 text-xs gap-1.5 w-full justify-center mb-2">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>Add at least one tag</span>
        </div>
      )}
      
      <Button 
        onClick={startPlayer} 
        disabled={!canStart}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 py-5"
      >
        <Play className="mr-2 h-5 w-5" />
        Start Experience
      </Button>
      
      <div className="text-center text-xs text-gray-500 mt-1">
        <p>Content sourced from Redgifs based on your tags</p>
      </div>
    </>
  );
};

export default PlayerFooter;
