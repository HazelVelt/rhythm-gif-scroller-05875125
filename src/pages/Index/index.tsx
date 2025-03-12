
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from "@/components/ui/scroll-area";
import TagInput from '@/components/TagInput';
import { PlayerSettings } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { RedgifsService } from '@/utils/redgifsService';

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
      image: false,
      gif: false,
      video: true // Only videos from Redgifs
    },
    allowNsfw: true // On by default as requested
  });
  
  const [metronomePreviewBpm, setMetronomePreviewBpm] = useState(80);
  const [isPlayingMetronome, setIsPlayingMetronome] = useState(false);
  
  // Update specific setting
  const updateSetting = <K extends keyof PlayerSettings>(key: K, value: PlayerSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };
  
  // Start the player with current settings
  const startPlayer = () => {
    // Clear Redgifs cache to ensure fresh content with new settings
    RedgifsService.clearCache();
    
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
  
  // Toggle metronome preview
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
  
  // Validate if we can start
  const canStart = settings.tags.length > 0;

  // Convert seconds to minutes for display
  const secondsToMinutes = (seconds: number) => Math.round(seconds / 60);

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
              Redgifs Rhythm
            </CardTitle>
          </CardHeader>
          
          <ScrollArea className="h-[calc(100vh-250px)] max-h-[450px]">
            <CardContent className="p-4 space-y-6">
              {/* Tags Section */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-purple-300">
                  Content Tags
                </h3>
                
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
                allowNsfw={settings.allowNsfw}
                updateSetting={updateSetting}
              />
              
              {/* Timing Settings */}
              <TimingSettings
                slideDuration={settings.slideDuration}
                minDuration={settings.minDuration}
                maxDuration={settings.maxDuration}
                taskTime={settings.taskTime}
                updateSetting={updateSetting}
                secondsToMinutes={secondsToMinutes}
              />
              
              {/* Metronome Settings */}
              <MetronomeSettings
                slowestBpm={settings.slowestBpm}
                fastestBpm={settings.fastestBpm}
                metronomePreviewBpm={metronomePreviewBpm}
                isPlayingMetronome={isPlayingMetronome}
                updateSetting={updateSetting}
                handleBpmChange={handleBpmChange}
                toggleMetronome={toggleMetronome}
              />
            </CardContent>
          </ScrollArea>
          
          <CardFooter className="flex flex-col gap-3 pt-2 p-4 border-t border-gray-800 bg-gray-900/30">
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
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default Index;
