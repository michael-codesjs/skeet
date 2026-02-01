import { useStudioStore } from '@/stores/studio';
import { Flash, Scissor, Setting4 } from 'iconsax-react';
import { useMemo } from 'react';

interface TimelineToolbarProps {
  playheadPos: number;
  zoom: number;
  setZoom: (zoom: number) => void;
  formatTimecode: (pos: number) => string;
}

export function TimelineToolbar({
  playheadPos,
  zoom,
  setZoom,
  formatTimecode,
}: TimelineToolbarProps) {
  const project = useStudioStore((state) => state.project);
  const addTrack = useStudioStore((state) => state.addTrack);

  const totalDuration = useMemo(() => {
    if (!project?.otio) return 0;
    let maxTime = 0;
    project.otio.tracks.children.forEach((track) => {
      let trackTime = 0;
      track.children.forEach((item) => {
        trackTime += item.source_range.duration.value / item.source_range.duration.rate;
      });
      if (trackTime > maxTime) maxTime = trackTime;
    });
    return maxTime;
  }, [project?.otio]);

  return (
    <div className="flex h-10 items-center justify-between border-b border-white/5 px-4 w-full bg-neutral-950">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 text-xs font-mono text-white/90">
          <span className="w-[80px] text-center cursor-pointer hover:text-white">
            {formatTimecode(playheadPos)}
          </span>
          <div className="h-3 w-px bg-white/10" />
          <span className="text-neutral-500">Duration: {formatTimecode(totalDuration * zoom)}</span>
        </div>

        <div className="flex items-center gap-1 rounded-md bg-white/5 p-0.5">
          <button className="flex h-7 w-7 items-center justify-center rounded bg-white/10 text-white transition-colors hover:bg-white/15">
            <Flash size={14} variant="Bold" color="currentColor" />
          </button>
          <button className="flex h-7 w-7 items-center justify-center rounded text-neutral-400 transition-colors hover:bg-white/10 hover:text-white">
            <Scissor size={14} color="currentColor" />
          </button>
          <button className="flex h-7 w-7 items-center justify-center rounded text-neutral-400 transition-colors hover:bg-white/10 hover:text-white">
            <Setting4 size={14} color="currentColor" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">
            Zoom
          </span>
          <div className="relative h-1 w-32 rounded-full bg-white/10">
            <div className="absolute h-full w-1/3 rounded-full bg-white/40" />
            <input
              type="range"
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
              min="50"
              max="300"
              value={zoom}
              onChange={(e) => setZoom(parseInt(e.target.value))}
            />
          </div>
        </div>
        <button
          onClick={() => addTrack()}
          className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-bold text-white transition-all hover:bg-white/10"
        >
          + Add Track
        </button>
      </div>
    </div>
  );
}
