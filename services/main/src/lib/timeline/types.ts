export type EditOperation = {
  type:
    | 'APPEND'
    | 'INSERT'
    | 'OVERLAY'
    | 'TRIM'
    | 'EFFECT'
    | 'DELETE'
    | 'ADD_TRACK'
    | 'EMPTY_TRACK'
    | 'UPDATE'
    | 'RIPPLE';
  id?: string; // Target specific clip for UPDATE/DELETE
  mediaId?: string;
  trackId: number;
  sourceStart?: number; // ms
  duration?: number; // ms
  start?: number; // ms (timeline handle)
  effectType?: string;
  parameters?: Record<string, any>;
  kind?: 'Video' | 'Audio'; // For adding tracks
  fromTime?: number; // For RIPPLE: start shifting from this time
  delta?: number; // For RIPPLE: amount to shift (positive = right, negative = left)
};

export type TimelineClip = {
  id: string;
  type: 'Clip';
  start: number;
  duration: number;
  mediaId: string;
  sourceStart: number;
  metadata?: Record<string, any>;
  effects?: any[];
};

export type Gap = {
  id: string;
  type: 'Gap';
  name: string;
  start: number;
  duration: number;
  metadata?: Record<string, any>;
};

export type TimelineEffectClip = {
  id: string;
  type: 'Effect';
  name: string;
  start: number;
  duration: number;
  effectType: 'Grayscale' | 'Blur' | 'Sepia' | 'Glitch' | 'Pixelate' | 'Zoom';
  parameters?: Record<string, number>;
  metadata?: Record<string, any>;
};

export type TimelineTrackChild = TimelineClip | Gap | TimelineEffectClip;

export type TimelineTrack = {
  name: string;
  children: TimelineTrackChild[];
  kind: 'Video' | 'Audio';
  metadata: Record<string, any>;
};

export type Timeline = {
  name: string;
  tracks: TimelineTrack[];
  metadata: Record<string, any>;
};
