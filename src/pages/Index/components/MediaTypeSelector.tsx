
import React from 'react';
import { FileVideo2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { PlayerSettings } from '@/types';

interface MediaTypeSelectorProps {
  allowNsfw: boolean;
  updateSetting: <K extends keyof PlayerSettings>(key: K, value: PlayerSettings[K]) => void;
}

const MediaTypeSelector: React.FC<MediaTypeSelectorProps> = ({
  allowNsfw,
  updateSetting
}) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium flex items-center gap-1.5 text-purple-300">
        Media Settings
      </h3>
      
      <div className="rounded-md glass p-3 bg-gray-900/50 border border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileVideo2 className="h-4 w-4 text-amber-400" />
          <span className="text-xs text-gray-200">Redgifs Videos</span>
        </div>
        
        <div className="flex items-center justify-between space-x-4">
          <span className="text-xs text-gray-200">Allow NSFW</span>
          <Switch 
            checked={allowNsfw}
            onCheckedChange={(checked) => updateSetting('allowNsfw', checked)}
            className="data-[state=checked]:bg-pink-500"
          />
        </div>
      </div>
    </div>
  );
};

export default MediaTypeSelector;
