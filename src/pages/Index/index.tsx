
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { ScrollArea } from "@/components/ui/scroll-area";
import TagInput from '@/components/TagInput';
import { PlayerSettings } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { ScrollerService } from '@/utils/scrollerService';

// Import our component files
import MediaTypeSelector from './components/MediaTypeSelector';
import TimingSettings from './components/TimingSettings';
import MetronomeSettings from './components/MetronomeSettings';
import PlayerFooter from './components/PlayerFooter';

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [settings, setSettings] = useState<PlayerSettings>({
    tags: [],
    slideDuration: 5,
    minDuration: 300, // 5 minutes in seconds
    maxDuration: 900, // 15 minutes in seconds
    taskTime: 30,
    slowestBpm: 60,
    fastestBpm: 120,
    mediaTypes: {
      image: false, // Off by default as requested
      gif: true,
      video: true // On by default as requested
    },
    allowNsfw: true // On by default as requested
  });
  
  // Update specific setting
  const updateSetting = <K extends keyof PlayerSettings>(key: K, value: PlayerSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Update media type toggles
  const toggleMediaType = (type: 'image' | 'gif' | 'video') => {
    setSettings(prev => ({
      ...prev,
      mediaTypes: {
        ...prev.mediaTypes,
        [type]: !prev.mediaTypes[type]
      }
    }));
  };
  
  // Start the player with current settings
  const startPlayer = () => {
    // Clear Scroller cache to ensure fresh content with new settings
    ScrollerService.clearCache();
    
    // Validate settings before proceeding
    if (!canStart) {
      toast({
        title: "Cannot Start",
        description: settings.tags.length === 0 
          ? "Please add at least one tag" 
          : "Select at least one media type",
        variant: "destructive",
      });
      return;
    }
    
    // Store settings in sessionStorage
    sessionStorage.setItem('playerSettings', JSON.stringify(settings));
    
    // Notify user
    toast({
      title: "Starting Experience",
      description: "Loading your content...",
      variant: "default",
    });
    
    // Navigate to player
    navigate('/player');
  };
  
  // Validate if we can start
  const canStart = settings.tags.length > 0 && 
                  (settings.mediaTypes.image || settings.mediaTypes.gif || settings.mediaTypes.video);

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-900 to-black overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md mx-auto"
      >
        <Card className="overflow-hidden backdrop-blur-md bg-black/40 border border-gray-800 shadow-xl">
          <CardHeader className="bg-gradient-to-br from-gray-800 to-gray-900 py-5 border-b border-gray-700">
            <CardTitle className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
              Rhythm Scroller
            </CardTitle>
          </CardHeader>
          
          <ScrollArea className="h-[calc(100vh-250px)] max-h-[450px]">
            <CardContent className="p-4 space-y-6">
              {/* Tags Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium flex items-center gap-1.5 text-purple-300">
                    <Settings className="h-3.5 w-3.5 text-purple-400" />
                    Content Tags
                  </h3>
                </div>
                
                <TagInput
                  value={settings.tags}
                  onChange={(tags) => updateSetting('tags', tags)}
                  placeholder="Add tags..."
                  maxTags={5}
                  className="w-full"
                  autoFocus
                />
              </div>
              
              {/* Media Type & NSFW Toggles */}
              <MediaTypeSelector 
                mediaTypes={settings.mediaTypes}
                allowNsfw={settings.allowNsfw}
                toggleMediaType={toggleMediaType}
                updateSetting={updateSetting}
              />
              
              {/* Timing Settings */}
              <TimingSettings 
                slideDuration={settings.slideDuration}
                minDuration={settings.minDuration}
                maxDuration={settings.maxDuration}
                taskTime={settings.taskTime}
                updateSetting={updateSetting}
              />
              
              {/* Metronome Settings */}
              <MetronomeSettings 
                slowestBpm={settings.slowestBpm}
                fastestBpm={settings.fastestBpm}
                updateSetting={updateSetting}
              />
            </CardContent>
          </ScrollArea>
          
          <CardFooter>
            <PlayerFooter 
              canStart={canStart}
              tagsEmpty={settings.tags.length === 0}
              onStart={startPlayer}
            />
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default Index;
