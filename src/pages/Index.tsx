
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, AlertCircle, Settings, ImageIcon, Film, FileVideo2, Volume2, MonitorIcon, GithubIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { ScrollArea } from "@/components/ui/scroll-area";
import TagInput from '@/components/TagInput';
import RangeSlider from '@/components/RangeSlider';
import Metronome from '@/components/Metronome';
import { PlayerSettings } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { ScrollerService } from '@/utils/scrollerService';

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
  
  const [metronomePreviewBpm, setMetronomePreviewBpm] = useState(80);
  const [isPlayingMetronome, setIsPlayingMetronome] = useState(false);
  
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
  
  // Test BPM
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
  const canStart = settings.tags.length > 0 && 
                   (settings.mediaTypes.image || settings.mediaTypes.gif || settings.mediaTypes.video);

  // Convert seconds to minutes for display
  const secondsToMinutes = (seconds: number) => Math.round(seconds / 60);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-gray-900 to-black dark:from-[#1A1A1E] dark:to-black overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-5xl mx-auto flex flex-col lg:flex-row gap-6"
      >
        {/* Main Card */}
        <Card className="overflow-hidden border border-gray-800 shadow-neo flex-1 bg-[#1A1A1E] text-gray-100">
          <CardHeader className="bg-[#1E1E24] py-5 border-b border-gray-800">
            <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
              <MonitorIcon className="w-6 h-6 text-blue-400" />
              <span className="text-gray-100">The Goons Game</span>
              <span className="text-sm bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded-full ml-2">
                PC Edition
              </span>
            </CardTitle>
          </CardHeader>
          
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/2 border-r border-gray-800">
              <ScrollArea className="h-[500px] md:h-[600px]">
                <CardContent className="p-6 space-y-6">
                  {/* Tags Section */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium flex items-center gap-2 text-gray-200">
                      <Settings className="h-4 w-4 text-blue-400" />
                      Content Tags
                    </h3>
                    
                    <TagInput
                      value={settings.tags}
                      onChange={(tags) => updateSetting('tags', tags)}
                      placeholder="Add tags for content..."
                      maxTags={5}
                      className="w-full"
                      autoFocus
                    />
                    
                    <p className="text-xs text-gray-400">
                      Add up to 5 tags to find content. More specific tags yield better results.
                    </p>
                  </div>
                  
                  {/* Media Type & NSFW Toggles */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium flex items-center gap-2 text-gray-200">
                      <Settings className="h-4 w-4 text-blue-400" />
                      Media Settings
                    </h3>
                    
                    <div className="grid grid-cols-1 gap-3 rounded-md bg-gray-900/50 p-4 border border-gray-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <ImageIcon className="h-5 w-5 text-blue-400" />
                          <span className="text-sm text-gray-300">Photos</span>
                        </div>
                        <Switch 
                          checked={settings.mediaTypes.image}
                          onCheckedChange={() => toggleMediaType('image')}
                          className="data-[state=checked]:bg-blue-500"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Film className="h-5 w-5 text-green-400" />
                          <span className="text-sm text-gray-300">GIFs</span>
                        </div>
                        <Switch 
                          checked={settings.mediaTypes.gif}
                          onCheckedChange={() => toggleMediaType('gif')}
                          className="data-[state=checked]:bg-green-500"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FileVideo2 className="h-5 w-5 text-amber-400" />
                          <span className="text-sm text-gray-300">Videos</span>
                        </div>
                        <Switch 
                          checked={settings.mediaTypes.video}
                          onCheckedChange={() => toggleMediaType('video')}
                          className="data-[state=checked]:bg-amber-500"
                        />
                      </div>
                      
                      <Separator className="my-2 bg-gray-700" />
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Allow NSFW Content</span>
                        <Switch 
                          checked={settings.allowNsfw}
                          onCheckedChange={(checked) => updateSetting('allowNsfw', checked)}
                          className="data-[state=checked]:bg-pink-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Timing Settings */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium flex items-center gap-2 text-gray-200">
                      <Settings className="h-4 w-4 text-blue-400" />
                      Timing Settings
                    </h3>
                    
                    <div className="space-y-4 bg-gray-900/50 p-4 rounded-md border border-gray-800">
                      <RangeSlider
                        min={1}
                        max={15}
                        step={1}
                        value={settings.slideDuration}
                        onChange={(value) => updateSetting('slideDuration', value)}
                        label="Slide Duration"
                        displayUnit=" sec"
                        compact={true}
                      />
                      
                      <RangeSlider
                        min={300}
                        max={settings.maxDuration}
                        step={60}
                        value={settings.minDuration}
                        onChange={(value) => updateSetting('minDuration', value)}
                        label="Min Duration"
                        displayUnit=" min"
                        displayValue={secondsToMinutes(settings.minDuration)}
                        compact={true}
                      />
                      
                      <RangeSlider
                        min={settings.minDuration}
                        max={3600}
                        step={60}
                        value={settings.maxDuration}
                        onChange={(value) => updateSetting('maxDuration', value)}
                        label="Max Duration"
                        displayUnit=" min"
                        displayValue={secondsToMinutes(settings.maxDuration)}
                        compact={true}
                      />
                      
                      <RangeSlider
                        min={10}
                        max={300}
                        step={5}
                        value={settings.taskTime}
                        onChange={(value) => updateSetting('taskTime', value)}
                        label="Task Time"
                        displayUnit={settings.taskTime >= 60 ? " min" : " sec"}
                        displayValue={settings.taskTime >= 60 ? Math.round(settings.taskTime / 60) : settings.taskTime}
                        compact={true}
                      />
                    </div>
                  </div>
                </CardContent>
              </ScrollArea>
            </div>
            
            <div className="md:w-1/2">
              <ScrollArea className="h-[500px] md:h-[600px]">
                <CardContent className="p-6 space-y-6">
                  {/* Metronome Settings */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium flex items-center gap-2 text-gray-200">
                      <Settings className="h-4 w-4 text-blue-400" />
                      Metronome Settings
                    </h3>
                    
                    <div className="space-y-4 bg-gray-900/50 p-4 rounded-md border border-gray-800">
                      <RangeSlider
                        min={30}
                        max={settings.fastestBpm}
                        step={1}
                        value={settings.slowestBpm}
                        onChange={(value) => updateSetting('slowestBpm', value)}
                        label="Slowest BPM"
                        compact={true}
                      />
                      
                      <RangeSlider
                        min={settings.slowestBpm}
                        max={240}
                        step={1}
                        value={settings.fastestBpm}
                        onChange={(value) => updateSetting('fastestBpm', value)}
                        label="Fastest BPM"
                        compact={true}
                      />
                      
                      <div className="p-4 bg-[#1A1A1E] rounded-lg border border-gray-800 mt-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min={30}
                              max={240}
                              value={metronomePreviewBpm}
                              onChange={handleBpmChange}
                              className="w-24 h-9 text-lg text-center font-bold bg-gray-800 border-gray-700 text-gray-200"
                            />
                            <span className="text-sm text-gray-400">BPM</span>
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={toggleMetronome}
                            className="h-9 bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700"
                          >
                            {isPlayingMetronome ? "Stop" : "Test"}
                            <Volume2 className={`h-4 w-4 ml-1 ${isPlayingMetronome ? 'text-green-400' : 'text-gray-400'}`} />
                          </Button>
                        </div>
                        
                        <div className="flex justify-center p-4 bg-gray-800/50 rounded-lg">
                          <Metronome 
                            bpm={metronomePreviewBpm} 
                            autoPlay={isPlayingMetronome} 
                            showControls={false}
                            variant="compact"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Help Section */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium flex items-center gap-2 text-gray-200">
                      <AlertCircle className="h-4 w-4 text-amber-400" />
                      Tips & Information
                    </h3>
                    
                    <div className="space-y-3 p-4 bg-blue-900/20 text-blue-200 rounded-md text-sm border border-blue-900/50">
                      <p>• Add at least one tag to start the experience</p>
                      <p>• Content is sourced from Redgifs based on your tags</p>
                      <p>• Tasks change on the interval you set (Task Time)</p>
                      <p>• The experience runs for the duration you choose</p>
                      <p>• Test the metronome to find comfortable BPM ranges</p>
                    </div>
                  </div>
                </CardContent>
              </ScrollArea>
            </div>
          </div>
          
          <CardFooter className="flex flex-col gap-3 pt-4 p-6 border-t border-gray-800 bg-gray-800/30">
            {!canStart && (
              <div className="flex items-center text-amber-400 text-sm gap-1.5 w-full justify-center mb-2">
                <AlertCircle className="h-4 w-4" />
                <span>{settings.tags.length === 0 ? "Add at least one tag" : "Select at least one media type"}</span>
              </div>
            )}
            
            <div className="grid grid-cols-1 gap-4 w-full">
              <Button 
                onClick={startPlayer} 
                disabled={!canStart}
                className="w-full py-6 text-lg bg-blue-700 hover:bg-blue-800 text-white"
              >
                <Play className="mr-2 h-5 w-5" />
                Start Experience
              </Button>
            </div>
            
            <div className="text-center text-xs text-gray-500 mt-2 flex items-center justify-center gap-2">
              <span>The Goons Game</span>
              <Separator orientation="vertical" className="h-3 bg-gray-700" />
              <span>v1.0.0</span>
              <Separator orientation="vertical" className="h-3 bg-gray-700" />
              <a href="#" className="flex items-center gap-1 hover:text-gray-300">
                <GithubIcon className="h-3 w-3" />
                <span>Source</span>
              </a>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default Index;
