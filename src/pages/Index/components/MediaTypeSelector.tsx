
import React from 'react';
import { ImageIcon, Film, FileVideo2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { PlayerSettings } from '@/types';

interface MediaTypeSelectorProps {
  mediaTypes: {
    image: boolean;
    gif: boolean;
    video: boolean;
  };
  allowNsfw: boolean;
  toggleMediaType: (type: 'image' | 'gif' | 'video') => void;
  updateSetting: <K extends keyof PlayerSettings>(key: K, value: PlayerSettings[K]) => void;
}

const MediaTypeSelector: React.FC<MediaTypeSelectorProps> = ({
  mediaTypes,
  allowNsfw,
  toggleMediaType,
  updateSetting
}) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium flex items-center gap-1.5 text-purple-300">
        <Settings className="h-3.5 w-3.5 text-purple-400" />
        Media Settings
      </h3>
      
      <div className="grid grid-cols-2 gap-3 rounded-md glass p-3 bg-gray-900/50 border border-gray-700">
        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center space-x-2">
            <ImageIcon className="h-4 w-4 text-blue-400" />
            <span className="text-xs text-gray-200">Photos</span>
          </div>
          <Switch 
            checked={mediaTypes.image}
            onCheckedChange={() => toggleMediaType('image')}
            className="data-[state=checked]:bg-blue-500"
          />
        </div>
        
        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center space-x-2">
            <Film className="h-4 w-4 text-green-400" />
            <span className="text-xs text-gray-200">GIFs</span>
          </div>
          <Switch 
            checked={mediaTypes.gif}
            onCheckedChange={() => toggleMediaType('gif')}
            className="data-[state=checked]:bg-green-500"
          />
        </div>
        
        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center space-x-2">
            <FileVideo2 className="h-4 w-4 text-amber-400" />
            <span className="text-xs text-gray-200">Videos</span>
          </div>
          <Switch 
            checked={mediaTypes.video}
            onCheckedChange={() => toggleMediaType('video')}
            className="data-[state=checked]:bg-amber-500"
          />
        </div>
        
        <div className="flex items-center justify-between space-x-2">
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
