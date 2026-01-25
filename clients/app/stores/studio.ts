import { create } from 'zustand';

// Define types based on what we know of the project schema
export type Clip = {
  id: string;
  thumbnail: string | null;
  fileName: string;
  duration?: number;
  tags?: string[];
  status?: string;
  summary?: string;
  videoUrl?: string | null;
  shotBreakdown?: any[];
};

export type Project = {
  id: string;
  title: string;
  prompt: string;
  status: 'DRAFT' | 'PROCESSING' | 'READY' | 'FAILED';
  finalVideoUrl?: string | null;
  clips: Clip[];
};

type StudioState = {
  // State
  project: Project | null;
  activeClip: Clip | null;
  isLoading: boolean;
  searchQuery: string;
  filteredClips: Clip[];

  // Actions
  setProject: (project: Project) => void;
  setActiveClip: (clip: Clip | null) => void;
  setSearchQuery: (query: string) => void;
  setIsLoading: (isLoading: boolean) => void;
  updateProjectTitle: (title: string) => void;
};

const filterClips = (clips: Clip[], query: string) => {
  if (!query) return clips;
  const lowerQuery = query.toLowerCase();
  return clips.filter(
    (clip) =>
      clip.fileName.toLowerCase().includes(lowerQuery) ||
      clip.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery)),
  );
};

export const useStudioStore = create<StudioState>((set, get) => ({
  project: null,
  activeClip: null,
  searchQuery: '',
  filteredClips: [],
  isLoading: false,

  setProject: (project) => {
    const { searchQuery } = get();
    set({
      project,
      filteredClips: filterClips(project.clips, searchQuery),
    });
  },
  setActiveClip: (clip) => set({ activeClip: clip }),
  setSearchQuery: (query) => {
    const { project } = get();
    set({
      searchQuery: query,
      filteredClips: project ? filterClips(project.clips, query) : [],
    });
  },
  setIsLoading: (isLoading) => set({ isLoading }),
  updateProjectTitle: (title) =>
    set((state) => ({
      project: state.project ? { ...state.project, title } : null,
    })),
}));
