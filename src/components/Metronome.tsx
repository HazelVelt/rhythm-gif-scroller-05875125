
import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMetronome } from '@/utils/metronomeService';

interface MetronomeProps {
  bpm: number;
  autoPlay?: boolean;
  showControls?: boolean;
  variant?: 'minimal' | 'full';
  onBpmChange?: (bpm: number) => void;
  className?: string;
}

const Metronome = ({
  bpm,
  autoPlay = false,
  showControls = true,
  variant = 'full',
  onBpmChange,
  className = ''
}: MetronomeProps) => {
  const { 
    bpm: currentBpm, 
    isPlaying, 
    startMetronome, 
    stopMetronome, 
    changeBpm,
    lastBeatTime
  } = useMetronome(bpm);
  
  const [showBeat, setShowBeat] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const needleRef = useRef<HTMLDivElement>(null);
  
  // Update BPM if it changes externally
  useEffect(() => {
    if (bpm !== currentBpm) {
      changeBpm(bpm);
      
      if (onBpmChange) {
        onBpmChange(bpm);
      }
    }
  }, [bpm, currentBpm, changeBpm, onBpmChange]);
  
  // Start metronome automatically if autoPlay is true
  useEffect(() => {
    if (autoPlay && !isPlaying) {
      startMetronome();
    }
    
    // Cleanup on unmount
    return () => {
      if (isPlaying) {
        stopMetronome();
      }
    };
  }, [autoPlay, isPlaying, startMetronome, stopMetronome]);
  
  // Visual beat effect
  useEffect(() => {
    if (lastBeatTime) {
      setShowBeat(true);
      const timer = setTimeout(() => {
        setShowBeat(false);
      }, 150);
      
      return () => clearTimeout(timer);
    }
  }, [lastBeatTime]);
  
  // Update animation speed based on BPM
  useEffect(() => {
    if (needleRef.current) {
      const swingDuration = (60 / currentBpm).toFixed(2);
      document.documentElement.style.setProperty('--swing-duration', `${swingDuration}s`);
    }
  }, [currentBpm]);
  
  // Toggle metronome play/pause
  const toggleMetronome = () => {
    if (isPlaying) {
      stopMetronome();
    } else {
      startMetronome();
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`metronome-container ${className} ${variant === 'minimal' ? 'max-w-[100px]' : 'max-w-xs'}`}
    >
      {variant === 'full' && (
        <div className="text-center mb-2">
          <div className={`text-2xl font-bold transition-all ${showBeat ? 'text-primary scale-105' : 'text-primary/80'}`}>
            {currentBpm} <span className="text-sm font-normal text-muted-foreground">BPM</span>
          </div>
        </div>
      )}
      
      <div className="relative h-16 flex items-center justify-center">
        {/* Metronome base */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-3 w-12 bg-secondary rounded-t-sm"></div>
        
        {/* Metronome needle */}
        <div 
          ref={needleRef}
          className={`metronome-needle absolute bottom-1 w-0.5 h-14 bg-primary/80 rounded-full 
                     ${isPlaying ? 'animate-metronome-swing' : ''}`}
        >
          {/* Needle weight */}
          <div className={`absolute -left-2 top-2 w-4 h-4 rounded-full bg-primary 
                          transition-all duration-150 ${showBeat ? 'scale-110 bg-primary' : 'scale-100 bg-primary/90'}`}>
          </div>
        </div>
        
        {/* Metronome ticks */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-16 h-1 flex justify-between">
          <div className="w-0.5 h-1 bg-muted-foreground/30"></div>
          <div className="w-0.5 h-1 bg-muted-foreground/30"></div>
          <div className="w-0.5 h-1 bg-muted-foreground/30"></div>
        </div>
      </div>
      
      {showControls && (
        <div className="mt-3 flex justify-center">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleMetronome}
            className={`glass h-8 w-8 p-0 rounded-full ${isPlaying ? 'bg-secondary/50' : 'bg-primary/10'}`}
          >
            {isPlaying ? 
              <Pause className="h-4 w-4" /> : 
              <Play className="h-4 w-4" />
            }
          </Button>
        </div>
      )}
    </div>
  );
};

export default Metronome;
