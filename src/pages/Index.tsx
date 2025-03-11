
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, AlertCircle, Settings, Info, ImageIcon, Film, FileVideo2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import TagInput from '@/components/TagInput';
import RangeSlider from '@/components/RangeSlider';
import Metronome from '@/components/Metronome';
import { PlayerSettings } from '@/types';

const Index = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<PlayerSettings>({
    tags: [],
    slideDuration: 5,
    minDuration: 3,
    maxDuration: 10,
    taskTime: 30,
    slowestBpm: 60,
    fastestBpm: 120,
    mediaTypes: {
      image: true,
      gif: true,
      video: false
    },
    allowNsfw: false
  });
  
  const [metronomePreviewBpm, setMetronomePreviewBpm] = useState(80);
  
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
    // Store settings in sessionStorage
    sessionStorage.setItem('playerSettings', JSON.stringify(settings));
    navigate('/player');
  };
  
  // Calculate random BPM for preview
  const randomizeBpm = () => {
    const randomBpm = Math.floor(
      Math.random() * (settings.fastestBpm - settings.slowestBpm + 1)
    ) + settings.slowestBpm;
    setMetronomePreviewBpm(randomBpm);
  };
  
  // Validate if we can start
  const canStart = settings.tags.length > 0 && 
                   (settings.mediaTypes.image || settings.mediaTypes.gif || settings.mediaTypes.video);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-3">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md mx-auto"
      >
        <Card className="neo overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl font-bold text-center">Rhythm Image Scroller</CardTitle>
            <CardDescription className="text-center text-muted-foreground text-xs">
              Set your preferences for the visual metronome experience
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-5">
            {/* Tags Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium flex items-center gap-1.5">
                  <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                  Content Tags
                </h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">
                        Add tags to define what content you'd like to see. 
                        Content will be fetched based on these tags.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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
            <div className="space-y-3">
              <h3 className="text-sm font-medium flex items-center gap-1.5">
                <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                Media Settings
              </h3>
              
              <div className="grid grid-cols-2 gap-3 rounded-md glass p-3">
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex items-center space-x-2">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs">Photos</span>
                  </div>
                  <Switch 
                    checked={settings.mediaTypes.image}
                    onCheckedChange={() => toggleMediaType('image')}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex items-center space-x-2">
                    <Film className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs">GIFs</span>
                  </div>
                  <Switch 
                    checked={settings.mediaTypes.gif}
                    onCheckedChange={() => toggleMediaType('gif')}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex items-center space-x-2">
                    <FileVideo2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs">Videos</span>
                  </div>
                  <Switch 
                    checked={settings.mediaTypes.video}
                    onCheckedChange={() => toggleMediaType('video')}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <span className="text-xs">Allow NSFW</span>
                  <Switch 
                    checked={settings.allowNsfw}
                    onCheckedChange={(checked) => updateSetting('allowNsfw', checked)}
                    className="data-[state=checked]:bg-destructive"
                  />
                </div>
              </div>
            </div>
            
            <Separator className="bg-border/50" />
            
            {/* Timing Settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center gap-1.5">
                <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                Timing Settings
              </h3>
              
              <div className="space-y-4">
                <RangeSlider
                  min={1}
                  max={15}
                  step={1}
                  value={settings.slideDuration}
                  onChange={(value) => updateSetting('slideDuration', value)}
                  label="Slide Duration"
                  displayUnit=" sec"
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <RangeSlider
                    min={1}
                    max={settings.maxDuration}
                    step={1}
                    value={settings.minDuration}
                    onChange={(value) => updateSetting('minDuration', value)}
                    label="Min Duration"
                    displayUnit=" sec"
                  />
                  
                  <RangeSlider
                    min={settings.minDuration}
                    max={3600}
                    step={settings.maxDuration < 60 ? 1 : 10}
                    value={settings.maxDuration}
                    onChange={(value) => updateSetting('maxDuration', value)}
                    label="Max Duration"
                    displayUnit={settings.maxDuration >= 60 ? " min" : " sec"}
                    displayValue={settings.maxDuration >= 60 ? Math.round(settings.maxDuration / 60) : settings.maxDuration}
                  />
                </div>
                
                <RangeSlider
                  min={10}
                  max={300}
                  step={5}
                  value={settings.taskTime}
                  onChange={(value) => updateSetting('taskTime', value)}
                  label="Task Time"
                  displayUnit={settings.taskTime >= 60 ? " min" : " sec"}
                  displayValue={settings.taskTime >= 60 ? Math.round(settings.taskTime / 60) : settings.taskTime}
                />
              </div>
            </div>
            
            <Separator className="bg-border/50" />
            
            {/* BPM Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium flex items-center gap-1.5">
                  <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                  Metronome Settings
                </h3>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={randomizeBpm}
                  className="h-7 px-2 text-xs"
                >
                  Test Random BPM
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <RangeSlider
                  min={30}
                  max={settings.fastestBpm}
                  step={1}
                  value={settings.slowestBpm}
                  onChange={(value) => updateSetting('slowestBpm', value)}
                  label="Slowest BPM"
                />
                
                <RangeSlider
                  min={settings.slowestBpm}
                  max={240}
                  step={1}
                  value={settings.fastestBpm}
                  onChange={(value) => updateSetting('fastestBpm', value)}
                  label="Fastest BPM"
                />
              </div>
              
              <div className="flex justify-center mt-2">
                <Metronome bpm={metronomePreviewBpm} />
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-3 pt-2">
            {!canStart && (
              <div className="flex items-center text-yellow-500 text-xs gap-1.5 w-full justify-center mb-2">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{settings.tags.length === 0 ? "Add at least one tag" : "Select at least one media type"}</span>
              </div>
            )}
            
            <Button 
              onClick={startPlayer} 
              disabled={!canStart}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Play className="mr-2 h-4 w-4" />
              Start Experience
            </Button>
          </CardFooter>
        </Card>
        
        <div className="text-center mt-4 text-xs text-muted-foreground">
          <p>Content sourced from Scrolller based on your tags</p>
        </div>
      </motion.div>
    </div>
  );
};

export default Index;
