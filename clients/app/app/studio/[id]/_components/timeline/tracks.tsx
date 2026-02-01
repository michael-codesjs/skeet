import { OTIOClip, OTIOTrack } from '@/stores/studio';

interface TracksProps {
  tracks: OTIOTrack[];
  zoom: number;
}

export function Tracks({ tracks, zoom }: TracksProps) {
  const getTrackColor = (kind: string) => {
    return kind === 'Video'
      ? 'bg-blue-500/20 border-blue-500/50'
      : 'bg-green-500/20 border-green-500/50';
  };

  return (
    <div className="flex flex-col">
      {tracks.map((track, i) => {
        let currentTimeOffset = 0;

        return (
          <div
            key={`${track.name}-${i}-content`}
            className="group relative h-14 w-full border-b border-white/5 bg-transparent"
          >
            {/* Render Clips */}
            {track.children.map((item, j) => {
              const durationSeconds =
                item.source_range.duration.value / item.source_range.duration.rate;
              const startSeconds = currentTimeOffset;
              currentTimeOffset += durationSeconds;

              // Only render visual for Clips, but both Clips and Gaps consume time
              if (!item.OTIO_SCHEMA?.startsWith('Clip.')) return null;
              const clip = item as OTIOClip;

              return (
                <div
                  key={`${item.name}-${j}`}
                  className={`absolute top-2 bottom-2 rounded border-l-2 ${getTrackColor(track.kind)} shadow-lg group-hover:brightness-125 transition-all cursor-pointer overflow-hidden`}
                  style={{
                    left: `${startSeconds * zoom}px`,
                    width: `${durationSeconds * zoom}px`,
                  }}
                >
                  {/* Render Effects */}
                  {clip.effects?.map((effect, k) => {
                    const start = effect.start_offset || 0;
                    const duration = effect.duration || 0;
                    const left = start * zoom;
                    const width = duration * zoom;

                    let colorClass = 'bg-white/20';
                    if (effect.effect_name === 'Zoom')
                      colorClass = 'bg-purple-500/40 border-purple-400/50';
                    if (effect.effect_name === 'Glitch')
                      colorClass = 'bg-red-500/40 border-red-400/50';
                    if (effect.effect_name === 'Grayscale')
                      colorClass = 'bg-gray-500/40 border-gray-400/50';

                    return (
                      <div
                        key={`${effect.effect_name}-${k}`}
                        className={`absolute top-0 bottom-0 border-l border-r ${colorClass} backdrop-blur-[1px]`}
                        style={{ left: `${left}px`, width: `${width}px` }}
                        title={`${effect.effect_name} (${duration}s)`}
                      >
                        <span className="absolute top-0 left-1 text-[8px] font-mono opacity-80 text-white truncate w-full">
                          {effect.effect_name}
                        </span>
                      </div>
                    );
                  })}

                  {track.kind === 'Audio' && (
                    <div className="absolute inset-x-0 bottom-0 top-1/2 opacity-30 pointer-events-none">
                      <svg width="100%" height="100%" preserveAspectRatio="none">
                        <path
                          d="M0 10 L5 2 L10 12 L15 5 L20 15 L25 8 L30 18"
                          stroke="currentColor"
                          fill="none"
                          strokeWidth="1"
                          className="text-green-400"
                        />
                      </svg>
                    </div>
                  )}
                  <div className="relative flex h-full items-center px-2 text-[10px] font-medium text-white/80 line-clamp-1 z-10 pointer-events-none">
                    {item.name}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
