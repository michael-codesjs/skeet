import { OTIOTrack } from '@/stores/studio';
import { Eye, Lock, Music, VideoSquare } from 'iconsax-react';

interface TrackHeadersProps {
  tracks: OTIOTrack[];
}

export function TrackHeaders({ tracks }: TrackHeadersProps) {
  return (
    <div className="sticky left-0 z-50 w-48 border-r border-white/5 bg-neutral-950 shadow-xl box-border">
      {/* Header Spacer for Ruler */}
      <div className="h-8 border-b border-white/5 bg-black/40" />

      <div className="flex flex-col">
        {tracks.map((track, i) => (
          <div
            key={`${track.name}-${i}`}
            className="group flex h-14 w-full items-center justify-between border-b border-white/5 px-3 transition-colors hover:bg-white/2"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center">
                {track.kind === 'Video' ? (
                  <VideoSquare
                    size={18}
                    className="text-blue-500"
                    variant="Bulk"
                    color="currentColor"
                  />
                ) : (
                  <Music
                    size={18}
                    className="text-emerald-500"
                    variant="Bulk"
                    color="currentColor"
                  />
                )}
              </div>
              <span className="text-[12px] font-semibold text-white/90 group-hover:text-white transition-colors">
                {track.name}
              </span>
            </div>

            <div className="flex items-center gap-1 opacity-30 transition-opacity group-hover:opacity-100">
              <button className="rounded p-1 text-neutral-500 hover:bg-white/10 hover:text-white">
                <Eye size={12} color="currentColor" />
              </button>
              <button className="rounded p-1 text-neutral-500 hover:bg-white/10 hover:text-white">
                <Lock size={12} color="currentColor" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
