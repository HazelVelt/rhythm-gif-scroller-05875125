
import React from 'react';
import { Settings } from 'lucide-react';
import RangeSlider from '@/components/RangeSlider';
import { PlayerSettings } from '@/types';

interface TimingSettingsProps {
  slideDuration: number;
  minDuration: number;
  maxDuration: number;
  taskTime: number;
  updateSetting: <K extends keyof PlayerSettings>(key: K, value: PlayerSettings[K]) => void;
}

// Convert seconds to minutes for display
const secondsToMinutes = (seconds: number) => Math.round(seconds / 60);

const TimingSettings: React.FC<TimingSettingsProps> = ({
  slideDuration,
  minDuration,
  maxDuration,
  taskTime,
  updateSetting
}) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium flex items-center gap-1.5 text-purple-300">
        <Settings className="h-3.5 w-3.5 text-purple-400" />
        Timing Settings
      </h3>
      
      <div className="space-y-3">
        <RangeSlider
          min={1}
          max={15}
          step={1}
          value={slideDuration}
          onChange={(value) => updateSetting('slideDuration', value)}
          label="Slide Duration"
          displayUnit=" sec"
          compact={true}
        />
        
        <RangeSlider
          min={300}
          max={maxDuration}
          step={60}
          value={minDuration}
          onChange={(value) => updateSetting('minDuration', value)}
          label="Min Duration"
          displayUnit=" min"
          displayValue={secondsToMinutes(minDuration)}
          compact={true}
        />
        
        <RangeSlider
          min={minDuration}
          max={3600}
          step={60}
          value={maxDuration}
          onChange={(value) => updateSetting('maxDuration', value)}
          label="Max Duration"
          displayUnit=" min"
          displayValue={secondsToMinutes(maxDuration)}
          compact={true}
        />
        
        <RangeSlider
          min={10}
          max={300}
          step={5}
          value={taskTime}
          onChange={(value) => updateSetting('taskTime', value)}
          label="Task Time"
          displayUnit={taskTime >= 60 ? " min" : " sec"}
          displayValue={taskTime >= 60 ? Math.round(taskTime / 60) : taskTime}
          compact={true}
        />
      </div>
    </div>
  );
};

export default TimingSettings;
