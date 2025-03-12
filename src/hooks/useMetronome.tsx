
import { useState, useEffect, useRef } from 'react';
import { PlayerSettings } from '@/types';
import { MetronomeService } from '@/utils/metronomeService';
import { useToast } from '@/hooks/use-toast';

export const useMetronome = (settings: PlayerSettings | null) => {
  const { toast } = useToast();
  const [currentBpm, setCurrentBpm] = useState<number>(80);
  const bpmTimerRef = useRef<number | null>(null);
  const previousBpmRef = useRef<number | null>(null);

  // Initialize BPM when settings change
  useEffect(() => {
    if (!settings) return;
    
    const initialBpm = MetronomeService.getRandomBpm(
      settings.slowestBpm,
      settings.fastestBpm
    );
    
    setCurrentBpm(initialBpm);
    previousBpmRef.current = initialBpm;
  }, [settings]);

  // Set up BPM change timer
  useEffect(() => {
    if (!settings) return;
    
    // Clear any existing timer
    if (bpmTimerRef.current) {
      clearTimeout(bpmTimerRef.current);
    }
    
    // Set timer for changing BPM
    bpmTimerRef.current = window.setTimeout(() => {
      const newBpm = MetronomeService.getRandomBpm(
        settings.slowestBpm,
        settings.fastestBpm
      );
      
      setCurrentBpm(newBpm);
      
      // Show notification for BPM change
      const oldBpm = previousBpmRef.current;
      previousBpmRef.current = newBpm;
      
      if (oldBpm !== null) {
        const direction = newBpm > oldBpm ? "faster" : "slower";
        toast({
          title: "BPM Changed",
          description: `Tempo changed to ${newBpm} BPM (${direction})`,
          duration: 3000,
        });
      }
    }, settings.taskTime * 1000);
    
    // Clean up
    return () => {
      if (bpmTimerRef.current) {
        clearTimeout(bpmTimerRef.current);
      }
    };
  }, [currentBpm, settings, toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (bpmTimerRef.current) {
        clearTimeout(bpmTimerRef.current);
      }
    };
  }, []);

  return { currentBpm };
};
