
import React from 'react';
import RangeSlider from '@/components/RangeSlider';
import { PlayerSettings } from '@/types';

interface TimingSettingsProps {
  slideDuration: number;
  minDuration: number;
  maxDuration: number;
  taskTime: number;
  updateSetting: <K extends keyof PlayerSettings>(key: K, value: PlayerSettings[K]) => void;
  secondsToMinutes: (seconds: number) => number;
}

const TimingSettings: React.FC<TimingSettingsProps> = ({
  slideDuration,
  minDuration,
  maxDuration,
  taskTime,
  updateSetting,
  secondsToMinutes
}) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-purple-300">
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
