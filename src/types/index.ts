
export interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video' | 'gif';
  width?: number;
  height?: number;
  thumbnailUrl?: string;
}

export interface PlayerSettings {
  tags: string[];
  slideDuration: number;
  minDuration: number;
  maxDuration: number;
  taskTime: number;
  slowestBpm: number;
  fastestBpm: number;
  mediaTypes: {
    image: boolean;
    gif: boolean;
    video: boolean;
  };
  allowNsfw: boolean;
}

export interface MetronomeState {
  bpm: number;
  isPlaying: boolean;
  lastBeatTime: number;
}
