'use client';

import { useStudioStore } from '@/stores/studio';
import { useMemo, useState } from 'react';
import { Ruler } from './ruler';
import { TimelineToolbar } from './toolbar';
import { TrackHeaders } from './track-headers';
import { Tracks } from './tracks';

export function Timeline() {
  const [zoom, setZoom] = useState(100); // px per second
  const project = useStudioStore((state) => state.project);
  const currentTime = useStudioStore((state) => state.currentTime);
  const setTime = useStudioStore((state) => state.setTime);

  // Derived from store
  const playheadPos = currentTime * zoom;

  const handleSetPlayheadPos = (newPos: number) => {
    setTime(newPos / zoom);
  };

  const tracks = useMemo(() => {
    const otioTracks = project?.otio?.tracks.children || [];
    otioTracks.forEach((track, i) => {
      console.log(`[Timeline] Track ${i} (${track.kind}):`, track);
      track.children?.forEach((clip, j) => {
        console.log(`  Clip ${j}:`, clip);
        if (clip.media_reference) {
          console.log(`    target_url:`, clip.media_reference.target_url);
        }
      });
    });
    return otioTracks;
  }, [project?.otio]);

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
