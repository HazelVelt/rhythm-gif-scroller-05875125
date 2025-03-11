
import React from 'react';
import { Play, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PlayerFooterProps {
  canStart: boolean;
  tagsEmpty: boolean;
  onStart: () => void;
}

const PlayerFooter: React.FC<PlayerFooterProps> = ({ canStart, tagsEmpty, onStart }) => {
  return (
    <div className="flex flex-col gap-3 pt-2 p-4 border-t border-gray-800 bg-gray-900/30">
      {!canStart && (
        <div className="flex items-center text-yellow-400 text-xs gap-1.5 w-full justify-center mb-2">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>{tagsEmpty ? "Add at least one tag" : "Select at least one media type"}</span>
        </div>
      )}
      
      <Button 
        onClick={onStart} 
        disabled={!canStart}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 py-5"
      >
        <Play className="mr-2 h-5 w-5" />
        Start Experience
      </Button>
      
      <div className="text-center text-xs text-gray-500 mt-1">
        <p>Content sourced based on your tags</p>
      </div>
    </div>
  );
};

export default PlayerFooter;
