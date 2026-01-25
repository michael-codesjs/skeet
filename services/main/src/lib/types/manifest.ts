export interface FrameManifest {
  // Granular time-series data (e.g., every 100ms)
  activeTimeline: TimeSeriesData[];

  // High-level semantic understanding (Gemini)
  semantic: SceneSemantic;

  // Technical metadata
  technical: {
    resolution: [number, number];
    fps: number;
    duration: number;
    codec: string;
  };
}

// Detailed frame-level metrics from SignalStats & Motion Vectors
export interface TimeSeriesData {
  timestamp: number; // in seconds
  motionScore: number; // 0.0 (static) to 1.0 (chaos) - Derived from magnitude of vectors

  // Motion Vector Flow (Topological Flow Matcher)
  flowDx: number; // Average horizontal motion vector (pixels/frame)
  flowDy: number; // Average vertical motion vector (pixels/frame)

  // Audio Features
  audioEnergy: number; // 0.0 to 1.0
  istransient: boolean; // Beat detection

  // Signal Statistics (Visual)
  luminance: number; // YAVG (0-255)
  colorBalance: {
    u: number; // UAVG
    v: number; // VAVG
  };
  saturation: number; // SATAVG
}

export interface SceneSemantic {
  dominantColors: string[]; // Hex codes
  aestheticScore: number; // 0.0 - 1.0 (Lighting/Composition)

  momentum: {
    direction: 'N' | 'S' | 'E' | 'W' | 'Static' | 'Omni';
    velocity: number; // 0-10
  };

  subject: {
    label: string;
    box?: [number, number, number, number]; // [ymin, xmin, ymax, xmax]
    aesthetic?: string;
    tracking?: {
      start: [number, number]; // [y, x]
      end: [number, number]; // [y, x]
    };
  };

  impactMoments: number[]; // Timestamps (ms) of sudden shifts/flashes
  description: string;
  vibeTags: string[]; // Moods
}
