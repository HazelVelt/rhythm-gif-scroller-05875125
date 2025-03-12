
import React from 'react';
import Metronome from '@/components/Metronome';

interface MetronomeDisplayProps {
  currentBpm: number;
}

const MetronomeDisplay: React.FC<MetronomeDisplayProps> = ({ currentBpm }) => {
  return (
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
  );
};

export default MetronomeDisplay;
