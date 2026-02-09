import { create } from 'zustand';

interface UIState {
  totalAssets: number;
  assetsLoaded: number;
  isReady: boolean;
  registerAssets: (count: number) => void;
  incrementLoaded: () => void;
  setReady: (ready: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  totalAssets: 0,
  assetsLoaded: 0,
  isReady: false,
  registerAssets: (count) => set((state) => ({ totalAssets: state.totalAssets + count })),
  incrementLoaded: () =>
    set((state) => {
      const nextLoaded = state.assetsLoaded + 1;
      // If we've reached the total, we might consider ready,
      // but we'll let the loader handle the final transition
      return { assetsLoaded: nextLoaded };
    }),
  setReady: (ready) => set({ isReady: ready }),
}));
