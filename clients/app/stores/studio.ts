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
  s3Key: string;
};

// Simplified Timeline Type Definitions
export type TimelineEffect = {
  effect_name: string;
  metadata?: Record<string, any>;
};

export type TimelineClip = {
  id: string;
  type: 'Clip';
  start: number; // ms
  duration: number; // ms
  sourceStart: number; // ms
  mediaId: string;
  metadata?: Record<string, any>;
  effects?: TimelineEffect[];
};

export type TimelineGap = {
  id: string;
  type: 'Gap';
  start: number; // ms
  duration: number; // ms
  metadata?: Record<string, any>;
};

export type TimelineEffectClip = {
  id: string;
  type: 'Effect';
  name: string;
  start: number; // ms
  duration: number; // ms
  effectType: 'Grayscale' | 'Blur' | 'Sepia' | 'Glitch' | 'Pixelate' | 'Zoom';
  parameters?: Record<string, number>;
  metadata?: Record<string, any>;
};

export type TimelineItem = TimelineClip | TimelineGap | TimelineEffectClip;

export type TimelineTrack = {
  name: string;
  kind: 'Video' | 'Audio';
  children: TimelineItem[];
  metadata?: Record<string, any>;
};

export type TimelineData = {
  name: string;
  tracks: TimelineTrack[];
  metadata?: Record<string, any>;
};

export type Project = {
  id: string;
  title: string;
  description: string;
  status: 'DRAFT' | 'PROCESSING' | 'READY' | 'FAILED';
  finalVideoUrl?: string | null;
  timeline?: TimelineData;
  media: MediaItem[];
};

// Dummy Timeline Generator
const getDefaultTimeline = (projectName: string): TimelineData => ({
  name: `${projectName} Timeline`,
  tracks: [
    {
      name: 'Main Visuals',
      kind: 'Video',
      children: [],
      metadata: {},
    },
    {
      name: 'Soundtrack',
      kind: 'Audio',
      children: [],
      metadata: {},
    },
    {
      name: 'FX & Overlays',
      kind: 'Video',
      children: [],
      metadata: {},
    },
    {
      name: 'Sound Effects',
      kind: 'Audio',
      children: [],
      metadata: {},
    },
  ],
});

export type MessageStep = {
  id: string;
  type: 'thought' | 'tool' | 'text';
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

export type EditOperation = {
  type: 'APPEND' | 'INSERT' | 'OVERLAY' | 'TRIM' | 'EFFECT' | 'DELETE';
  mediaId: string;
  trackId?: number;
  sourceStart?: number; // ms
  duration?: number; // ms
  start?: number; // ms (timeline handle)
  effectType?: string;
  parameters?: Record<string, any>;
};

type StudioState = {
  // State
  project: Project | null;
  projects: Project[]; // Local projects list
  activeProjectId: string | null;
  activeMedia: MediaItem | null;
  isLoading: boolean;
  searchQuery: string;
  filterType: 'all' | 'photo' | 'video' | 'audio' | 'effects';
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
  isExportOpen: boolean;
  isSaving: boolean;
  isDirty: boolean; // Tracking manual changes
  pendingOperations: EditOperation[];

  // Manual Editing State
  selectedClip: { trackIndex: number; itemIndex: number } | null;

  // Actions
  setSelectedClip: (selection: { trackIndex: number; itemIndex: number } | null) => void;
  updateClip: (trackIndex: number, itemIndex: number, updates: Partial<TimelineItem>) => void;
  deleteClip: (trackIndex: number, itemIndex: number) => void;
  splitClip: (trackIndex: number, itemIndex: number, timeInSeconds: number) => void;
  moveClip: (
    trackIndex: number,
    itemIndex: number,
    newStartTime: number,
    targetTrackIndex?: number,
  ) => void;
  addClipToTrack: (trackIndex: number, mediaId: string) => void;
  saveProjectTimeline: (
    saveFn: (id: string, timeline: TimelineData) => Promise<any>,
  ) => Promise<void>;
  setProject: (project: Project) => void;
  setProjects: (projects: Project[]) => void;
  setActiveProjectId: (id: string | null) => void;
  setIsCreatingProject: (isOpen: boolean) => void;
  setActiveMedia: (media: MediaItem | null) => void;
  setSearchQuery: (query: string) => void;
  setFilterType: (type: 'all' | 'photo' | 'video' | 'audio' | 'effects') => void;
  setIsLoading: (isLoading: boolean) => void;
  updateProjectTitle: (title: string) => void;
  addMedia: (media: MediaItem[]) => void;
  updateMedia: (id: string, updates: Partial<MediaItem>) => void;
  setMedia: (media: MediaItem[]) => void;
  addTrack: (kind?: 'Video' | 'Audio') => void;
  deleteTrack: (trackIndex: number) => void;
  updateTrack: (trackIndex: number, updates: Partial<TimelineTrack>) => void;
  emptyTrack: (trackIndex: number) => void;
  setTime: (time: number) => void;
  setPlaying: (playing: boolean) => void;
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  setThreads: (threads: Thread[]) => void;
  addThread: (thread: Thread) => void;
  setActiveThreadId: (id: string | null) => void;
  setIsMessagesLoading: (isMessagesLoading: boolean) => void;
  setIsExportOpen: (isOpen: boolean) => void;
  applyEditOperations: (operations: any[]) => void;
  pushOperation: (operation: EditOperation) => void;
  clearOperations: () => void;
  addEffectToTrack: (
    trackIndex: number,
    effectType: 'Grayscale' | 'Blur' | 'Sepia' | 'Glitch' | 'Pixelate' | 'Zoom',
  ) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
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

const ZOOM_KEY = 'skeet_timeline_zoom';

const saveZoomToLocal = (zoom: number) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ZOOM_KEY, String(zoom));
  }
};

const loadZoomFromLocal = (): number => {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem(ZOOM_KEY);
    return data ? Number(data) : 100;
  }
  return 100;
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
  isExportOpen: false,
  isSaving: false,
  isDirty: false,
  selectedClip: null,
  pendingOperations: [],
  zoom: loadZoomFromLocal(),

  setZoom: (zoom) => {
    saveZoomToLocal(zoom);
    set({ zoom });
  },

  setSelectedClip: (selection) => set({ selectedClip: selection }),

  pushOperation: (op) =>
    set((state) => ({
      pendingOperations: [...state.pendingOperations, op],
    })),

  clearOperations: () => set({ pendingOperations: [] }),

  saveProjectTimeline: async (saveFn) => {
    const { project, isSaving } = get();
    if (!project || !project.timeline || isSaving) return;

    set({ isSaving: true });
    try {
      await saveFn(project.id, project.timeline);
      set({ isDirty: false });
    } catch (err) {
      console.error('[StudioStore] Failed to save project:', err);
    } finally {
      set({ isSaving: false });
    }
  },

  updateClip: (trackIndex, itemIndex, updates) =>
    set((state) => {
      if (!state.project || !state.project.timeline) return {};

      // Deep clone Timeline
      const newTimeline: TimelineData = JSON.parse(JSON.stringify(state.project.timeline));

      const track = newTimeline.tracks[trackIndex];
      if (!track || !track.children[itemIndex]) return {};

      // Update the item
      track.children[itemIndex] = {
        ...track.children[itemIndex],
        ...updates,
      } as TimelineItem;

      const updatedProject = { ...state.project, timeline: newTimeline };
      // Local persistence of modified state
      const updatedProjects = state.projects.map((p) =>
        p.id === updatedProject.id ? updatedProject : p,
      );
      saveToLocal(updatedProjects);

      return {
        project: updatedProject,
        projects: updatedProjects,
        isDirty: true,
      };
    }),

  deleteClip: (trackIndex, itemIndex) =>
    set((state) => {
      if (!state.project || !state.project.timeline) return {};

      const newTimeline: TimelineData = JSON.parse(JSON.stringify(state.project.timeline));
      const track = newTimeline.tracks[trackIndex];
      if (!track) return {};

      const item = track.children[itemIndex];
      if (item?.type === 'Clip') {
        const mediaId = item.mediaId;
        const timelineStartTime = item.start / 1000;

        if (mediaId) {
          state.pendingOperations.push({
            type: 'DELETE',
            mediaId,
            trackId: trackIndex,
            start: item.start,
          });
        }
      }

      // Remove the item
      track.children.splice(itemIndex, 1);

      const updatedProject = { ...state.project, timeline: newTimeline };
      const updatedProjects = state.projects.map((p) =>
        p.id === updatedProject.id ? updatedProject : p,
      );
      saveToLocal(updatedProjects);

      return {
        project: updatedProject,
        projects: updatedProjects,
        selectedClip: null, // Deselect
        isDirty: true,
      };
    }),

  splitClip: (trackIndex, itemIndex, timeInSeconds) =>
    set((state) => {
      if (!state.project || !state.project.timeline) return {};

      const newTimeline: TimelineData = JSON.parse(JSON.stringify(state.project.timeline));
      const track = newTimeline.tracks[trackIndex];
      if (!track || !track.children[itemIndex]) return {};

      const item = track.children[itemIndex];
      if (item?.type !== 'Clip') return {};

      const relativeSplitTimeMs = timeInSeconds * 1000 - item.start;
      const durationMs = item.duration;

      // Validate split point
      if (relativeSplitTimeMs <= 100 || relativeSplitTimeMs >= durationMs - 100) {
        return {}; // Too close to edges
      }

      // Create two new clips
      const clip1 = JSON.parse(JSON.stringify(item));
      const clip2 = JSON.parse(JSON.stringify(item));

      // Update Clip 1 (First half)
      clip1.duration = relativeSplitTimeMs;

      // Update Clip 2 (Second half)
      clip2.start = item.start + relativeSplitTimeMs;
      clip2.sourceStart = item.sourceStart + relativeSplitTimeMs;
      clip2.duration = durationMs - relativeSplitTimeMs;

      // Replace original clip with the two new ones
      track.children.splice(itemIndex, 1, clip1, clip2);

      const updatedProject = { ...state.project, timeline: newTimeline };
      const updatedProjects = state.projects.map((p) =>
        p.id === updatedProject.id ? updatedProject : p,
      );
      saveToLocal(updatedProjects);

      return {
        project: updatedProject,
        projects: updatedProjects,
        selectedClip: null, // Deselect after split
        isDirty: true,
      };
    }),

  moveClip: (trackIndex, itemIndex, newStartTime, targetTrackIndex) =>
    set((state) => {
      if (!state.project || !state.project.timeline) return {};

      // If no target track specified, use current track
      const destTrackIndex = targetTrackIndex ?? trackIndex;

      const newTimeline: TimelineData = JSON.parse(JSON.stringify(state.project.timeline));
      const srcTrack = newTimeline.tracks[trackIndex];
      const destTrack = newTimeline.tracks[destTrackIndex];

      if (!srcTrack || !destTrack || !srcTrack.children[itemIndex]) return {};

      const item = srcTrack.children[itemIndex];
      if (item.type !== 'Clip') return {};

      // Compatibility Check
      // Audio tracks only accept Audio
      // Video tracks accept Video and Image
      // We need to know media type. We can infer from track kind or metadata?
      // Since we don't have media type easily on the clip itself without looking up media...
      // Let's rely on basic track kind logic for now.
      // Rule: Audio Clips -> Audio Tracks only. Video/Image Clips -> Video Tracks only.

      // Compatibility Rules:
      // 1. Audio Media -> Audio Tracks ONLY.
      // 2. Video/Image Media -> Video OR Audio Tracks.

      const mediaItem = state.project.media.find((m) => m.id === (item as TimelineClip).mediaId);
      const isAudioMedia = mediaItem?.mimeType?.startsWith('audio/');
      const isDestAudio = destTrack.kind === 'Audio';

      // Block Audio Media -> Video Track
      if (isAudioMedia && !isDestAudio) {
        return {};
      }

      const duration = item.duration;

      // 1. Basic Boundary Check
      if (newStartTime < 0) newStartTime = 0;

      // 2. Collision Detection on DESTINATION track
      let hasCollision = false;
      for (let i = 0; i < destTrack.children.length; i++) {
        // If moving on same track, skip self
        if (trackIndex === destTrackIndex && i === itemIndex) continue;

        const other = destTrack.children[i];
        const otherStart = other.start;
        const otherEnd = other.start + other.duration;
        const myStart = newStartTime;
        const myEnd = newStartTime + duration;

        if (myStart < otherEnd && myEnd > otherStart) {
          hasCollision = true;
          break;
        }
      }

      if (hasCollision) return {};

      // 3. Move the Item
      // Remove from source
      srcTrack.children.splice(itemIndex, 1);

      // Update Start Time
      item.start = newStartTime;

      // Add to destination
      destTrack.children.push(item);

      const updatedProject = { ...state.project, timeline: newTimeline };
      const updatedProjects = state.projects.map((p) =>
        p.id === updatedProject.id ? updatedProject : p,
      );
      saveToLocal(updatedProjects);

      return {
        project: updatedProject,
        projects: updatedProjects,
        isDirty: true,
        // Update selection to match new location?
        // Finding the new index might be tricky if not sorted, but usually we push to end.
        // It's safer to deselect or just let it be for now.
        selectedClip: null,
      };
    }),

  addEffectToTrack: (trackIndex, effectType) =>
    set((state) => {
      if (!state.project || !state.project.timeline) return {};

      const newTimeline: TimelineData = JSON.parse(JSON.stringify(state.project.timeline));
      const track = newTimeline.tracks[trackIndex];
      if (!track) return {};

      // Only allow effects on Video tracks for now (visual effects)
      if (track.kind === 'Audio') return {};

      const durationMs = 5000; // Default 5 seconds for effects
      const lastChild = track.children[track.children.length - 1];
      const startMs = lastChild ? lastChild.start + lastChild.duration : 0;

      track.children.push({
        type: 'Effect',
        name: effectType,
        start: startMs,
        duration: durationMs,
        effectType,
        parameters: {},
        metadata: {},
      } as TimelineEffectClip);

      const updatedProject = { ...state.project, timeline: newTimeline };
      const updatedProjects = state.projects.map((p) =>
        p.id === updatedProject.id ? updatedProject : p,
      );
      saveToLocal(updatedProjects);

      return {
        project: updatedProject,
        projects: updatedProjects,
        isDirty: true,
      };
    }),

  addClipToTrack: (trackIndex, mediaId) =>
    set((state) => {
      if (!state.project || !state.project.timeline) return {};
      const media = state.project.media.find((m) => m.id === mediaId);
      if (!media) return {};

      const newTimeline: TimelineData = JSON.parse(JSON.stringify(state.project.timeline));
      const track = newTimeline.tracks[trackIndex];
      if (!track) return {};

      const durationMs = (media.duration || 5) * 1000;
      const lastChild = track.children[track.children.length - 1];
      const startMs = lastChild ? lastChild.start + lastChild.duration : 0;

      track.children.push({
        id: Math.random().toString(36).substring(2, 10),
        type: 'Clip',
        start: startMs,
        duration: durationMs,
        sourceStart: 0,
        mediaId: media.id,
        metadata: { mediaId: media.id },
      } as TimelineClip);

      const op: EditOperation = {
        type: 'APPEND',
        mediaId: media.id,
        trackId: trackIndex,
        sourceStart: 0,
        duration: durationMs,
      };

      const updatedProject = { ...state.project, timeline: newTimeline };
      const updatedProjects = state.projects.map((p) =>
        p.id === updatedProject.id ? updatedProject : p,
      );
      saveToLocal(updatedProjects);

      return {
        project: updatedProject,
        projects: updatedProjects,
        pendingOperations: [...state.pendingOperations, op],
        isDirty: true,
      };
    }),

  setProject: (project) => {
    // Ensure we have a timeline structure to work with
    const projectWithTimeline = {
      ...project,
      timeline: project.timeline || getDefaultTimeline(project.title),
      media: project.media || [],
    };

    set((state) => {
      // Sync project update to projects list
      const updatedProjects = state.projects.map((p) =>
        p.id === project.id ? { ...p, ...projectWithTimeline } : p,
      );
      if (!updatedProjects.find((p) => p.id === project.id)) {
        updatedProjects.push(projectWithTimeline);
      }
      saveToLocal(updatedProjects);
      saveActiveIdToLocal(project.id);

      return {
        project: projectWithTimeline,
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
  setIsExportOpen: (isOpen) => set({ isExportOpen: isOpen }),
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
      if (!state.project || !state.project.timeline) return {};

      const currentTracks = state.project.timeline.tracks;
      const trackCount = currentTracks.filter((t) => t.kind === kind).length;

      const newTrack: TimelineTrack = {
        name: `${kind} ${trackCount + 1}`,
        kind,
        children: [],
        metadata: {},
      };

      const updatedTimeline: TimelineData = {
        ...state.project.timeline,
        tracks: [...currentTracks, newTrack],
      };

      const updatedProject = { ...state.project, timeline: updatedTimeline };
      const updatedProjects = state.projects.map((p) =>
        p.id === updatedProject.id ? updatedProject : p,
      );
      saveToLocal(updatedProjects);

      return {
        project: updatedProject,
        projects: updatedProjects,
        isDirty: true,
      };
    }),
  deleteTrack: (trackIndex) =>
    set((state) => {
      if (!state.project || !state.project.timeline) return {};

      // Deep clone Timeline
      const newTimeline: TimelineData = JSON.parse(JSON.stringify(state.project.timeline));

      // Remove the track
      newTimeline.tracks.splice(trackIndex, 1);

      // Adjust selection
      let newSelectedClip = state.selectedClip;
      if (state.selectedClip) {
        if (state.selectedClip.trackIndex === trackIndex) {
          newSelectedClip = null;
        } else if (state.selectedClip.trackIndex > trackIndex) {
          newSelectedClip = {
            ...state.selectedClip,
            trackIndex: state.selectedClip.trackIndex - 1,
          };
        }
      }

      const updatedProject = { ...state.project, timeline: newTimeline };
      const updatedProjects = state.projects.map((p) =>
        p.id === updatedProject.id ? updatedProject : p,
      );
      saveToLocal(updatedProjects);

      return {
        project: updatedProject,
        projects: updatedProjects,
        selectedClip: newSelectedClip,
        isDirty: true,
      };
    }),
  updateTrack: (trackIndex, updates) =>
    set((state) => {
      if (!state.project || !state.project.timeline) return {};

      const newTimeline: TimelineData = JSON.parse(JSON.stringify(state.project.timeline));
      const track = newTimeline.tracks[trackIndex];
      if (!track) return {};

      newTimeline.tracks[trackIndex] = {
        ...track,
        ...updates,
        metadata: {
          ...(track.metadata || {}),
          ...(updates.metadata || {}),
        },
      };

      const updatedProject = { ...state.project, timeline: newTimeline };
      const updatedProjects = state.projects.map((p) =>
        p.id === updatedProject.id ? updatedProject : p,
      );
      saveToLocal(updatedProjects);

      return {
        project: updatedProject,
        projects: updatedProjects,
        isDirty: true,
      };
    }),
  emptyTrack: (trackIndex) =>
    set((state) => {
      if (!state.project || !state.project.timeline) return {};

      const newTimeline: TimelineData = JSON.parse(JSON.stringify(state.project.timeline));
      const track = newTimeline.tracks[trackIndex];
      if (!track) return {};

      // Clear all children
      track.children = [];

      const updatedProject = { ...state.project, timeline: newTimeline };
      const updatedProjects = state.projects.map((p) =>
        p.id === updatedProject.id ? updatedProject : p,
      );
      saveToLocal(updatedProjects);

      return {
        project: updatedProject,
        projects: updatedProjects,
        // Clear selection if it was on this track
        selectedClip: state.selectedClip?.trackIndex === trackIndex ? null : state.selectedClip,
        isDirty: true,
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
  addThread: (thread) => set((state) => ({ threads: [thread, ...state.threads] })),
  setActiveThreadId: (id) => set({ activeThreadId: id }),
  setIsMessagesLoading: (isMessagesLoading) => set({ isMessagesLoading }),
  applyEditOperations: (operations) =>
    set((state) => {
      if (!state.project || !state.project.timeline) return {};

      // Deep clone Timeline
      const newTimeline: TimelineData = JSON.parse(JSON.stringify(state.project.timeline));

      operations.forEach((op) => {
        const trackIndex = op.trackId || 0;
        let track = newTimeline.tracks[trackIndex];

        // Create track if it doesn't exist
        if (!track) {
          const kind = trackIndex === 1 ? 'Audio' : 'Video';
          track = {
            name: trackIndex === 1 ? 'Main Audio' : `Video ${trackIndex + 1}`,
            kind: kind,
            children: [],
            metadata: {},
          };
          newTimeline.tracks[trackIndex] = track;
        }

        const media = state.project?.media.find((m: any) => m.id === op.mediaId);

        switch (op.type) {
          case 'APPEND':
          case 'INSERT': {
            if (!media) break;
            const durationMs = (op.sourceDuration || media.duration || 5) * 1000;
            const startMs = (op.timelineStartTime || 0) * 1000;
            track.children.push({
              id: Math.random().toString(36).substring(2, 10),
              type: 'Clip',
              start: startMs,
              duration: durationMs,
              sourceStart: (op.sourceStartTime || 0) * 1000,
              mediaId: media.id,
              metadata: { mediaId: media.id },
            } as TimelineClip);
            break;
          }
          case 'EFFECT': {
            const timeMs = (op.timelineStartTime || 0) * 1000;
            const clip = track.children.find((item) => {
              if (item.type !== 'Clip') return false;
              return timeMs >= item.start && timeMs < item.start + item.duration;
            }) as TimelineClip;

            if (clip) {
              if (!clip.effects) clip.effects = [];
              clip.effects.push({
                effect_name: op.effectType || 'Unknown',
                metadata: op.parameters,
              });
            }
            break;
          }
        }
      });

      return { project: { ...state.project, timeline: newTimeline } };
    }),
}));
