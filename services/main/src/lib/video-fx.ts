export type StyleProfileType =
  | 'cinematic_noir'
  | 'high_energy_cyber'
  | 'minimalist_luxury'
  | 'music_video_dynamic';

export type StyleProfile = {
  name: string;
  speedFactor: number; // Global speed bias
  transitionDefault: string;
  transitionDuration: number;
  filters: {
    clip?: (clipId: string, i: number) => string[]; // Per-clip filters (zoom, shift)
    master?: string[]; // Global mastering filters (grain, glow)
  };
  audio?: {
    mixType: 'sharp' | 'smooth';
  };
};

// 1. Cinematic Noir: Moody, slow, grainy, B&W
const CINEMATIC_NOIR: StyleProfile = {
  name: 'cinematic_noir',
  speedFactor: 0.8, // Slightly slower
  transitionDefault: 'fade',
  transitionDuration: 1.0,
  filters: {
    clip: () => [], // Clean clips, let global do the work
    master: [
      // B&W High Contrast
      'eq=saturation=0:contrast=1.3:brightness=-0.05',
      // Film Grain (subtle)
      'noise=c0s=7:allf=t+u',
      // Vignette
      'vignette=PI/4',
    ],
  },
};

// 2. High-Energy Cyber: Fast, glitchy, vibrant, pulsing
const HIGH_ENERGY_CYBER: StyleProfile = {
  name: 'high_energy_cyber',
  speedFactor: 1.2, // Faster
  transitionDefault: 'pixelize', // Glitchy transitions
  transitionDuration: 0.4, // Fast cuts
  filters: {
    clip: (id, i) => {
      // Alternating zoom pulse for energy
      // Zoom from 1.0 to 1.1 every 25 frames
      const pulse = `zoompan=z='min(zoom+0.002,1.1)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30`;
      // Chromatic Aberration (RGB Shift) on every 3rd clip
      // rgbashift doesn't support expressions like 'sin(t)', so we use a static shift
      // that varies per clip based on index 'i' to create variety.
      const shiftAmount = ((i * 7) % 20) + 5; // Result between 5 and 24
      const glitch = i % 3 === 0 ? `rgbashift=rh=${shiftAmount}:bh=${-shiftAmount}` : '';

      return [pulse, glitch].filter(Boolean);
    },
    master: [
      // High Saturation
      'eq=saturation=1.5:contrast=1.1',
      // Sharpness
      'unsharp=5:5:1.0:5:5:0.0',
    ],
  },
};

// 3. Minimalist Luxury: Clean, warm, steady
const MINIMALIST_LUXURY: StyleProfile = {
  name: 'minimalist_luxury',
  speedFactor: 1.0,
  transitionDefault: 'distance', // Smooth geometric transition
  transitionDuration: 0.8,
  filters: {
    clip: () => [
      // Slow, steady push-in (Ken Burns extremely subtle)
      "zoompan=z='min(zoom+0.0005,1.05)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30",
    ],
    master: [
      // Teal & Orange (Simulated with EQ for safety)
      'eq=gamma_r=0.95:gamma_b=1.1:saturation=1.1',
      // Slight glow (simulated with bloom-like curve)
      // Actually, standard EQ is safer.
    ],
  },
};

// 4. Music Video Dynamic: Rhythmic, flash, mix of everything
const MUSIC_VIDEO_DYNAMIC: StyleProfile = {
  name: 'music_video_dynamic',
  speedFactor: 1.0,
  transitionDefault: 'crosszoom',
  transitionDuration: 0.5,
  filters: {
    clip: (id, i) => {
      // Randomly apply speed ramps or zooms?
      // For now, keep it simple but varied
      return i % 2 === 0
        ? [
            "zoompan=z='min(zoom+0.003,1.15)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30",
          ]
        : [];
    },
    master: [
      // Slight grain
      'noise=c0s=3:allf=t+u',
      // Modern contrast
      'eq=contrast=1.1:saturation=1.2',
    ],
  },
};

export const PROFILES: Record<string, StyleProfile> = {
  cinematic_noir: CINEMATIC_NOIR,
  high_energy_cyber: HIGH_ENERGY_CYBER,
  minimalist_luxury: MINIMALIST_LUXURY,
  music_video_dynamic: MUSIC_VIDEO_DYNAMIC,
};

// Heuristic to pick profile based on user prompt/vibe
export const getStyleProfile = (vibe: string): StyleProfile => {
  const v = vibe.toLowerCase();
  if (v.includes('dark') || v.includes('noir') || v.includes('moody') || v.includes('cinema'))
    return CINEMATIC_NOIR;
  if (
    v.includes('cyber') ||
    v.includes('tech') ||
    v.includes('fast') ||
    v.includes('glitch') ||
    v.includes('hype')
  )
    return HIGH_ENERGY_CYBER;
  if (v.includes('luxury') || v.includes('clean') || v.includes('minimal'))
    return MINIMALIST_LUXURY;
  return MUSIC_VIDEO_DYNAMIC; // Default
};
