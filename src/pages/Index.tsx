
import React, { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import TagInput from '@/components/TagInput';
import RangeSlider from '@/components/RangeSlider';
import Metronome from '@/components/Metronome';
import { PlayerSettings } from '@/types';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [settings, setSettings] = useState<PlayerSettings>({
    tags: [],
    slideDuration: 5,
    minDuration: 300, // 5 minutes in seconds (5 * 60)
    maxDuration: 900, // 15 minutes in seconds (15 * 60)
    taskTime: 30,
    slowestBpm: 60,
    fastestBpm: 120,
    mediaTypes: {
      image: false, // Changed to false by default
      gif: true,
      video: true // Changed to true by default
    },
    allowNsfw: true // Changed to true by default
  });
  
  const [metronomePreviewBpm, setMetronomePreviewBpm] = useState(80);
  const [manualBpm, setManualBpm] = useState<string>('80');
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
    // Store settings in sessionStorage
    sessionStorage.setItem('playerSettings', JSON.stringify(settings));
    navigate('/player');
  };
  
  // Test BPM
  const testMetronome = () => {
    const bpm = parseInt(manualBpm);
    if (!isNaN(bpm) && bpm >= 30 && bpm <= 240) {
      setMetronomePreviewBpm(bpm);
      setIsPlayingMetronome(!isPlayingMetronome);
    }
  };
  
  // Handle manual BPM input change
  const handleManualBpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setManualBpm(e.target.value);
    // Immediately update the metronome BPM, but don't start playing
    const bpm = parseInt(e.target.value);
    if (!isNaN(bpm) && bpm >= 30 && bpm <= 240) {
      setMetronomePreviewBpm(bpm);
    }
  };
  
  // Validate if we can start
  const canStart = settings.tags.length > 0 && 
                   (settings.mediaTypes.image || settings.mediaTypes.gif || settings.mediaTypes.video);

  // Convert seconds to minutes for display
  const secondsToMinutes = (seconds: number) => Math.round(seconds / 60);

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center px-3 py-5 bg-gradient-to-b from-gray-900 to-black overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm mx-auto"
      >
        <Card className="overflow-hidden border-0 bg-transparent shadow-none">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-t-xl p-4 border border-gray-700">
            <CardTitle className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
              Rhythm Scroller
            </CardTitle>
            <CardDescription className="text-center text-gray-400 text-sm mt-2">
              Visual metronome with content from Scrolller
            </CardDescription>
          </div>
          
          <CardContent className="space-y-5 bg-black/50 backdrop-blur-xl p-4 rounded-b-xl border-x border-b border-gray-800">
            {/* Tags Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium flex items-center gap-1.5 text-purple-300">
                  <Settings className="h-3.5 w-3.5 text-purple-400" />
                  Content Tags
                </h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Info className="h-3.5 w-3.5 text-gray-400" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">
                        Add tags to define what content you'd like to see. 
                        Content will be fetched from Scrolller based on these tags.
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
                    checked={settings.mediaTypes.image}
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
                    checked={settings.mediaTypes.gif}
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
                    checked={settings.mediaTypes.video}
                    onCheckedChange={() => toggleMediaType('video')}
                    className="data-[state=checked]:bg-amber-500"
                  />
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <span className="text-xs text-gray-200">Allow NSFW</span>
                  <Switch 
                    checked={settings.allowNsfw}
                    onCheckedChange={(checked) => updateSetting('allowNsfw', checked)}
                    className="data-[state=checked]:bg-pink-500"
                  />
                </div>
              </div>
            </div>
            
            <Separator className="bg-gray-800" />
            
            {/* Timing Settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center gap-1.5 text-purple-300">
                <Settings className="h-3.5 w-3.5 text-purple-400" />
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
                    min={300}
                    max={settings.maxDuration}
                    step={60}
                    value={settings.minDuration}
                    onChange={(value) => updateSetting('minDuration', value)}
                    label="Min Duration"
                    displayUnit=" min"
                    displayValue={secondsToMinutes(settings.minDuration)}
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
            
            <Separator className="bg-gray-800" />
            
            {/* BPM Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium flex items-center gap-1.5 text-purple-300">
                  <Settings className="h-3.5 w-3.5 text-purple-400" />
                  Metronome Settings
                </h3>
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
              
              <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                <div className="flex flex-col items-center mb-3">
                  <Input
                    type="number"
                    min={30}
                    max={240}
                    value={manualBpm}
                    onChange={handleManualBpmChange}
                    className="w-full h-16 text-4xl text-center font-bold bg-gray-800 border-gray-700 mb-3"
                  />
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testMetronome}
                    className="w-full py-2 h-auto text-md bg-gray-800 hover:bg-gray-700 border-gray-700"
                  >
                    {isPlayingMetronome ? "Stop Test" : "Test BPM"}
                  </Button>
                </div>
                
                <div className="flex justify-center">
                  <Metronome 
                    bpm={metronomePreviewBpm} 
                    autoPlay={isPlayingMetronome} 
                    showControls={false}
                  />
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-3 pt-2 bg-black/50 backdrop-blur-xl p-4 rounded-b-xl border-x border-b border-gray-800">
            {!canStart && (
              <div className="flex items-center text-yellow-400 text-xs gap-1.5 w-full justify-center mb-2">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{settings.tags.length === 0 ? "Add at least one tag" : "Select at least one media type"}</span>
              </div>
            )}
            
            <Button 
              onClick={startPlayer} 
              disabled={!canStart}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 py-5"
            >
              <Play className="mr-2 h-4 w-4" />
              Start Experience
            </Button>
          </CardFooter>
        </Card>
        
        <div className="text-center mt-3 text-xs text-gray-500">
          <p>Content sourced from Scrolller based on your tags</p>
        </div>
      </motion.div>
    </div>
  );
};

export default Index;
