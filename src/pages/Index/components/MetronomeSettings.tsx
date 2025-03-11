
import React, { useState } from 'react';
import { Settings, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import RangeSlider from '@/components/RangeSlider';
import Metronome from '@/components/Metronome';

interface MetronomeSettingsProps {
  slowestBpm: number;
  fastestBpm: number;
  updateSetting: <K extends string>(key: K, value: number) => void;
}

const MetronomeSettings: React.FC<MetronomeSettingsProps> = ({
  slowestBpm,
  fastestBpm,
  updateSetting
}) => {
  const [metronomePreviewBpm, setMetronomePreviewBpm] = useState(80);
  const [isPlayingMetronome, setIsPlayingMetronome] = useState(false);
  
  // Toggle metronome test playback
  const toggleMetronome = () => {
    setIsPlayingMetronome(!isPlayingMetronome);
  };
  
  // Handle manual BPM input change
  const handleBpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = parseInt(value);
    
    if (!isNaN(numValue) && numValue >= 30 && numValue <= 240) {
      setMetronomePreviewBpm(numValue);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium flex items-center gap-1.5 text-purple-300">
        <Settings className="h-3.5 w-3.5 text-purple-400" />
        Metronome Settings
      </h3>
      
      <div className="space-y-3">
        <RangeSlider
          min={30}
          max={fastestBpm}
          step={1}
          value={slowestBpm}
          onChange={(value) => updateSetting('slowestBpm', value)}
          label="Slowest BPM"
          compact={true}
        />
        
        <RangeSlider
          min={slowestBpm}
          max={240}
          step={1}
          value={fastestBpm}
          onChange={(value) => updateSetting('fastestBpm', value)}
          label="Fastest BPM"
          compact={true}
        />
      </div>
      
      <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <Input
            type="number"
            min={30}
            max={240}
            value={metronomePreviewBpm}
            onChange={handleBpmChange}
            className="w-24 h-9 text-lg text-center font-bold bg-gray-800 border-gray-700"
          />
          
          <Button
            variant="outline"
            size="sm"
            onClick={toggleMetronome}
            className="h-9 px-3 py-0 bg-gray-800 hover:bg-gray-700 border-gray-700 flex items-center justify-center gap-2"
          >
            {isPlayingMetronome ? "Stop" : "Test"}
            <Volume2 className={`h-4 w-4 ${isPlayingMetronome ? 'text-green-400' : 'text-gray-400'}`} />
          </Button>
        </div>
        
        <div className="flex justify-center">
          <Metronome 
            bpm={metronomePreviewBpm} 
            autoPlay={isPlayingMetronome} 
            showControls={false}
            variant="compact"
          />
        </div>
      </div>
    </div>
  );
};

export default MetronomeSettings;
