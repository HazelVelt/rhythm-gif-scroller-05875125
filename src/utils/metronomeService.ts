
import { useState, useRef, useCallback, useEffect } from 'react';

export class MetronomeService {
  private static audioContext: AudioContext | null = null;
  private static oscillator: OscillatorNode | null = null;
  private static gainNode: GainNode | null = null;

  // Initialize the audio context
  public static initialize(): void {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  // Create a metronome click sound
  public static createClickSound(high = false): void {
    this.initialize();
    
    if (!this.audioContext) return;
    
    if (this.oscillator) {
      this.oscillator.stop();
      this.oscillator.disconnect();
    }
    
    this.oscillator = this.audioContext.createOscillator();
    this.gainNode = this.audioContext.createGain();
    
    // Configure oscillator
    this.oscillator.type = 'sine';
    this.oscillator.frequency.value = high ? 1200 : 800;
    
    // Configure gain (volume)
    this.gainNode.gain.value = 0.1;
    this.gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      this.audioContext.currentTime + 0.1
    );
    
    // Connect nodes
    this.oscillator.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);
    
    // Start and stop
    this.oscillator.start();
    this.oscillator.stop(this.audioContext.currentTime + 0.1);
  }

  // Calculate beat interval in milliseconds from BPM
  public static getBeatInterval(bpm: number): number {
    return 60000 / bpm;
  }

  // Generate a random BPM within a range
  public static getRandomBpm(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

// React hook for using the metronome
export function useMetronome(initialBpm = 60) {
  const [bpm, setBpm] = useState(initialBpm);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const lastBeatTimeRef = useRef<number>(0);
  const beatCountRef = useRef<number>(0);

  const playClick = useCallback(() => {
    const now = Date.now();
    lastBeatTimeRef.current = now;
    
    // Play different sound for first beat of each measure
    const isFirstBeat = beatCountRef.current % 4 === 0;
    MetronomeService.createClickSound(isFirstBeat);
    
    beatCountRef.current++;
  }, []);

  const startMetronome = useCallback(() => {
    if (isPlaying) return;
    
    // Initialize audio
    MetronomeService.initialize();
    
    beatCountRef.current = 0;
    setIsPlaying(true);
    
    // Schedule the first beat immediately
    playClick();
    
    // Schedule subsequent beats
    const interval = MetronomeService.getBeatInterval(bpm);
    intervalRef.current = window.setInterval(playClick, interval);
  }, [bpm, isPlaying, playClick]);

  const stopMetronome = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const changeBpm = useCallback((newBpm: number) => {
    setBpm(newBpm);
    
    // If we're currently playing, restart with the new BPM
    if (isPlaying) {
      stopMetronome();
      setTimeout(() => {
        setBpm(newBpm);
        startMetronome();
      }, 50);
    } else {
      setBpm(newBpm);
    }
  }, [isPlaying, startMetronome, stopMetronome]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    bpm,
    isPlaying,
    startMetronome,
    stopMetronome,
    changeBpm,
    lastBeatTime: lastBeatTimeRef.current
  };
}
