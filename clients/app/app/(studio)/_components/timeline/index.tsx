'use client';

import { useStudioStore } from '@/stores/studio';
import { useEffect, useMemo } from 'react';
import { Ruler } from './ruler';
import { TimelineToolbar } from './toolbar';
import { TrackHeaders } from './track-headers';
import { Tracks } from './tracks';

export function Timeline() {
  const zoom = useStudioStore((state) => state.zoom);
  const setZoom = useStudioStore((state) => state.setZoom);
  const project = useStudioStore((state) => state.project);
  const currentTime = useStudioStore((state) => state.currentTime);
  const setTime = useStudioStore((state) => state.setTime);

  // Derived from store
  const playheadPos = currentTime * zoom;

  const handleSetPlayheadPos = (newPos: number) => {
    setTime(newPos / zoom);
  };

  const tracks = useMemo(() => {
    const rawTracks = project?.timeline?.tracks || [];
    const CORE_TRACKS = [
      { name: 'Main Visuals', kind: 'Video' as const },
      { name: 'Soundtrack', kind: 'Audio' as const },
      { name: 'FX & Overlays', kind: 'Video' as const },
      { name: 'Sound Effects', kind: 'Audio' as const },
    ];

    // Ensure we always have exactly 4 tracks shown in the UI
    const finalTracks = CORE_TRACKS.map((core, i) => {
      const existing = rawTracks[i];
      if (existing) {
        return {
          ...existing,
          name: core.name, // Force standard names
          kind: core.kind, // Force standard kinds
        };
      }
      return {
        ...core,
        children: [],
        metadata: {},
      };
    });

    return finalTracks;
  }, [project?.timeline]);

  const selectedClip = useStudioStore((state) => state.selectedClip);
  const deleteClip = useStudioStore((state) => state.deleteClip);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedClip) return;

      // Ignore if typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.key === 'Backspace' || e.key === 'Delete') {
        deleteClip(selectedClip.trackIndex, selectedClip.itemIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedClip, deleteClip]);

  const formatTimecode = (pos: number) => {
    const totalSeconds = pos / zoom;
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    const frames = Math.floor((totalSeconds % 1) * 24);
    return `00:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
  };

  return (
    <div className="flex h-72 shrink-0 flex-col border-t border-white/10 bg-neutral-950">
      <TimelineToolbar
        playheadPos={playheadPos}
        zoom={zoom}
        setZoom={setZoom}
        formatTimecode={formatTimecode}
      />

      {/* Main Timeline Area */}
      <div className="relative flex-1 overflow-auto bg-neutral-950/40 custom-scrollbar">
        <div className="flex min-w-max">
          <TrackHeaders tracks={tracks} />

          {/* Track Content Area */}
          <div className="relative flex-1">
            <Ruler zoom={zoom} playheadPos={playheadPos} setPlayheadPos={handleSetPlayheadPos} />

            {/* Grid Overlay & Playhead Content */}
            <div className="relative">
              {/* Vertical Grid Lines */}
              <div
                className="pointer-events-none absolute inset-0 z-0 opacity-10"
                style={{
                  backgroundImage: `linear-gradient(to right, white 1px, transparent 1px)`,
                  backgroundSize: `${zoom}px 100%`,
                }}
              />

              <Tracks tracks={tracks} zoom={zoom} />

              {/* Playhead */}
              <div
                className="absolute top-[-32px] bottom-0 w-px bg-red-500 z-50 pointer-events-none transition-all duration-75 ease-out"
                style={{ left: `${playheadPos}px` }}
              >
                <div className="absolute -top-1 -left-2 flex flex-col items-center">
                  <div className="w-4 h-5 bg-red-500 rounded-sm clip-playhead shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .clip-playhead {
          clip-path: polygon(0% 0%, 100% 0%, 100% 60%, 50% 100%, 0% 60%);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
