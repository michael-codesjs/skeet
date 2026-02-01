import { create } from 'zustand';

// Define types based on what we know of the project schema
export type MediaItem = {
  id: string;
  thumbnail: string | null;
  fileName: string;
  duration?: number;
  tags?: string[];
  status?: string;
  summary?: string;
  videoUrl?: string | null;
  proxyUrl?: string | null;
  shotBreakdown?: any[];
  mimeType?: string; // Added to help distinguish types
  progress?: number; // 0-100 for uploads
};

// Basic OTIO Type Definitions
export type OTIORationalTime = {
  OTIO_SCHEMA: 'RationalTime';
  value: number;
  rate: number;
};

export type OTIOTimeRange = {
  OTIO_SCHEMA: 'TimeRange.1';
  start_time: OTIORationalTime;
  duration: OTIORationalTime;
};

export type OTIOEffect = {
  name?: string;
  effect_name: 'Glitch' | 'Zoom' | 'Grayscale';
  // Custom timing relative to clip start (in seconds for simplicity in this MVP)
  // Standard OTIO would imply the effect covers the whole item unless structured differently.
  start_offset?: number;
  duration?: number;
  metadata?: {
    intensity?: number;
    scale?: number; // Target scale for zoom
    mode?: 'in' | 'out' | 'bounce';
  };
};

export type OTIOClip = {
  OTIO_SCHEMA: 'Clip.1';
  name: string;
  source_range: OTIOTimeRange;
  media_reference?: {
    OTIO_SCHEMA: 'ExternalReference.1';
    target_url: string;
    available_range?: OTIOTimeRange;
    metadata?: Record<string, any>;
  };
  transition?: {
    type: 'crossfade' | 'slide_left' | 'glitch';
    duration: number;
  };
  effects?: OTIOEffect[];
  metadata?: {
    mediaId?: string;
    s3Key?: string;
    proxyS3Key?: string;
    glitch?: boolean;
    filter?: 'grayscale' | 'sepia' | 'none';
  };
};

export type OTIOGap = {
  OTIO_SCHEMA: 'Gap.1';
  name: string;
  source_range: OTIOTimeRange;
};

export type OTIOItem = OTIOClip | OTIOGap;

export type OTIOTrack = {
  OTIO_SCHEMA: 'Track.1';
  name: string;
  kind: 'Video' | 'Audio';
  children: OTIOItem[];
};

export type OTIOTimeline = {
  OTIO_SCHEMA: 'Timeline.1';
  name: string;
  tracks: {
    OTIO_SCHEMA: 'Stack.1';
    children: OTIOTrack[];
  };
};

export type Project = {
  id: string;
  title: string;
  description: string;
  status: 'DRAFT' | 'PROCESSING' | 'READY' | 'FAILED';
  finalVideoUrl?: string | null;
  otio?: OTIOTimeline;
  media: MediaItem[];
};

// Dummy OTIO Generator
const getDefaultOTIO = (projectName: string): OTIOTimeline => ({
  OTIO_SCHEMA: 'Timeline.1',
  name: `${projectName} Timeline`,
  tracks: {
    OTIO_SCHEMA: 'Stack.1',
    children: [
      {
        OTIO_SCHEMA: 'Track.1',
        name: 'Main Video',
        kind: 'Video',
        children: [],
      },
      {
        OTIO_SCHEMA: 'Track.1',
        name: 'Main Audio',
        kind: 'Audio',
        children: [],
      },
    ],
  },
});

export type MessageStep = {
  id: string;
  type: 'thought' | 'tool';
  toolName?: string;
  content?: string;
  status: 'running' | 'done' | 'error';
  result?: any;
  duration?: number;
  startTime?: number;
};

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  steps?: MessageStep[];
  timestamp: Date;
  status: 'sending' | 'sent' | 'error' | 'loading';
  toolCalls?: any[];
};

export type Thread = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  resourceId?: string;
  metadata?: Record<string, any>;
};

type StudioState = {
  // State
  project: Project | null;
  projects: Project[]; // Local projects list
  activeProjectId: string | null;
  activeMedia: MediaItem | null;
  isLoading: boolean;
  searchQuery: string;
  filterType: 'all' | 'photo' | 'video' | 'audio';
  filteredMedia: MediaItem[];
  // Playback State
  currentTime: number; // in seconds
  isPlaying: boolean;
  // Chat State
  messages: Message[];
  threads: Thread[];
  activeThreadId: string | null;
  isMessagesLoading: boolean;
  isCreatingProject: boolean;

  // Actions
  setProject: (project: Project) => void;
  setProjects: (projects: Project[]) => void;
  setActiveProjectId: (id: string | null) => void;
  setIsCreatingProject: (isOpen: boolean) => void;
  setActiveMedia: (media: MediaItem | null) => void;
  setSearchQuery: (query: string) => void;
  setFilterType: (type: 'all' | 'photo' | 'video' | 'audio') => void;
  setIsLoading: (isLoading: boolean) => void;
  updateProjectTitle: (title: string) => void;
  addMedia: (media: MediaItem[]) => void;
  updateMedia: (id: string, updates: Partial<MediaItem>) => void;
  setMedia: (media: MediaItem[]) => void;
  addTrack: (kind?: 'Video' | 'Audio') => void;
  setTime: (time: number) => void;
  setPlaying: (playing: boolean) => void;
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  setThreads: (threads: Thread[]) => void;
  setActiveThreadId: (id: string | null) => void;
  setIsMessagesLoading: (isMessagesLoading: boolean) => void;
  applyEditOperations: (operations: any[]) => void;
};

const STORAGE_KEY = 'skeet_projects';

const saveToLocal = (projects: Project[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }
};

const loadFromLocal = (): Project[] => {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }
  return [];
};

const ACTIVE_PROJECT_KEY = 'skeet_active_project_id';

const saveActiveIdToLocal = (id: string | null) => {
  if (typeof window !== 'undefined') {
    if (id) {
      localStorage.setItem(ACTIVE_PROJECT_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_PROJECT_KEY);
    }
  }
};

const loadActiveIdFromLocal = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(ACTIVE_PROJECT_KEY);
  }
  return null;
};

export const useStudioStore = create<StudioState>((set, get) => ({
  project: null,
  projects: loadFromLocal(),
  activeProjectId: loadActiveIdFromLocal(),
  activeMedia: null,
  searchQuery: '',
  filterType: 'all',
  filteredMedia: [],
  isLoading: false,
  currentTime: 0,
  isPlaying: false,
  messages: [],
  threads: [],
  activeThreadId: null,
  isMessagesLoading: false,
  isCreatingProject: false,

  setProject: (project) => {
    // Ensure we have an OTIO structure to work with
    const projectWithOTIO = {
      ...project,
      otio: project.otio || getDefaultOTIO(project.title),
      media: project.media || [],
    };

    set((state) => {
      // Sync project update to projects list
      const updatedProjects = state.projects.map((p) =>
        p.id === project.id ? { ...p, ...projectWithOTIO } : p,
      );
      if (!updatedProjects.find((p) => p.id === project.id)) {
        updatedProjects.push(projectWithOTIO);
      }
      saveToLocal(updatedProjects);
      saveActiveIdToLocal(project.id);

      return {
        project: projectWithOTIO,
        projects: updatedProjects,
        activeProjectId: project.id,
        filteredMedia: project.media || [],
      };
    });
  },
  setProjects: (projects) => {
    saveToLocal(projects);
    set({ projects });
  },
  setActiveProjectId: (id) => {
    saveActiveIdToLocal(id);
    set({ activeProjectId: id });
  },
  setIsCreatingProject: (isOpen) => set({ isCreatingProject: isOpen }),
  setActiveMedia: (media) => set({ activeMedia: media }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilterType: (type) => set({ filterType: type }),
  setIsLoading: (isLoading) => set({ isLoading }),
  updateProjectTitle: (title) =>
    set((state) => ({
      project: state.project ? { ...state.project, title } : null,
    })),
  addMedia: (newMedia) =>
    set((state) => {
      if (!state.project) return {};
      const currentMedia = state.project.media || [];
      const updatedMedia = [...currentMedia, ...newMedia];
      return {
        project: { ...state.project, media: updatedMedia },
        filteredMedia: updatedMedia,
      };
    }),
  updateMedia: (id, updates) =>
    set((state) => {
      if (!state.project) return {};
      const currentMedia = state.project.media || [];
      const updatedMedia = currentMedia.map((m) => (m.id === id ? { ...m, ...updates } : m));

      // Also update activeMedia if it's the one being updated
      const activeMedia =
        state.activeMedia?.id === id ? { ...state.activeMedia, ...updates } : state.activeMedia;

      return {
        project: { ...state.project, media: updatedMedia },
        filteredMedia: updatedMedia,
        activeMedia,
      };
    }),
  setMedia: (media) =>
    set((state) => {
      if (!state.project) return {};
      const currentMedia = state.project.media || [];
      const uploadingItems = currentMedia.filter((m) => m.status === 'UPLOADING');

      // Avoid duplicates if any uploading items have since moved to READY/PROCESSING in backend
      const newIds = new Set(media.map((m) => m.id));
      const uniqueUploading = uploadingItems.filter((m) => !newIds.has(m.id));

      const updatedMedia = [...uniqueUploading, ...media];
      return {
        project: { ...state.project, media: updatedMedia },
        filteredMedia: updatedMedia,
      };
    }),
  addTrack: (kind = 'Video') =>
    set((state) => {
      if (!state.project || !state.project.otio) return {};

      const currentTracks = state.project.otio.tracks.children;
      const trackCount = currentTracks.filter((t) => t.kind === kind).length;

      const newTrack: OTIOTrack = {
        OTIO_SCHEMA: 'Track.1',
        name: `${kind} ${trackCount + 1}`,
        kind,
        children: [],
      };

      const updatedOTIO = {
        ...state.project.otio,
        tracks: {
          ...state.project.otio.tracks,
          children: [...currentTracks, newTrack],
        },
      };

      return {
        project: { ...state.project, otio: updatedOTIO },
      };
    }),
  setTime: (time) => set({ currentTime: time }),
  setPlaying: (playing) => set({ isPlaying: playing }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setMessages: (messages) => set((state) => ({ messages })),
  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    })),
  setThreads: (threads) => set({ threads }),
  setActiveThreadId: (id) => set({ activeThreadId: id }),
  setIsMessagesLoading: (isMessagesLoading) => set({ isMessagesLoading }),
  applyEditOperations: (operations) =>
    set((state) => {
      if (!state.project || !state.project.otio) return {};

      // Deep clone OTIO
      const newOtio: OTIOTimeline = JSON.parse(JSON.stringify(state.project.otio));

      operations.forEach((op) => {
        const trackIndex = op.trackId || 0;
        let track = newOtio.tracks.children[trackIndex];

        // Create track if it doesn't exist
        if (!track) {
          const kind = trackIndex === 1 ? 'Audio' : 'Video';
          track = {
            OTIO_SCHEMA: 'Track.1',
            name: trackIndex === 1 ? 'Main Audio' : `Video ${trackIndex + 1}`,
            kind: kind,
            children: [],
          };
          newOtio.tracks.children[trackIndex] = track;
        }

        const media = state.project?.media.find((m: any) => m.id === op.mediaId);

        switch (op.type) {
          case 'APPEND': {
            if (!media) break;
            const duration = op.sourceDuration || media.duration || 5;
            track.children.push({
              OTIO_SCHEMA: 'Clip.1',
              name: media.fileName,
              source_range: {
                OTIO_SCHEMA: 'TimeRange.1',
                start_time: {
                  OTIO_SCHEMA: 'RationalTime',
                  value: (op.sourceStartTime || 0) * 30,
                  rate: 30,
                },
                duration: {
                  OTIO_SCHEMA: 'RationalTime',
                  value: duration * 30,
                  rate: 30,
                },
              },
            } as OTIOClip);
            break;
          }
          case 'INSERT': {
            if (!media) break;
            const duration = op.sourceDuration || media.duration || 5;
            track.children.push({
              OTIO_SCHEMA: 'Clip.1',
              name: media.fileName,
              source_range: {
                OTIO_SCHEMA: 'TimeRange.1',
                start_time: {
                  OTIO_SCHEMA: 'RationalTime',
                  value: (op.sourceStartTime || 0) * 30,
                  rate: 30,
                },
                duration: {
                  OTIO_SCHEMA: 'RationalTime',
                  value: duration * 30,
                  rate: 30,
                },
              },
            } as OTIOClip);
            break;
          }
          case 'EFFECT': {
            // Find clip at timelineStartTime
            const clip = track.children.find((item) => {
              if (!item.OTIO_SCHEMA.startsWith('Clip.')) return false;
              // In reality we'd check cumulative duration, but for MVP we'll match by name or context
              return true; // Apply to last for now if not found
            }) as OTIOClip;

            if (clip) {
              if (!clip.effects) clip.effects = [];
              clip.effects.push({
                effect_name:
                  op.effectType === 'GLITCH'
                    ? 'Glitch'
                    : op.effectType === 'ZOOM'
                      ? 'Zoom'
                      : 'Grayscale',
                start_offset: op.timelineStartTime,
                duration: op.duration,
              });
            }
            break;
          }
        }
      });

      return { project: { ...state.project, otio: newOtio } };
    }),
}));
