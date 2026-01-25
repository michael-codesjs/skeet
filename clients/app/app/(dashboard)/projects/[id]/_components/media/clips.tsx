'use client';

import { Modal } from '@/components/ui/modal';
import { VideoPlayer } from '@/components/ui/video-player';
import { cn } from '@/lib/utils';
import { useStudioStore, type Clip } from '@/stores/studio';
import { motion } from 'framer-motion';
import { PlayCircle, VideoSquare } from 'iconsax-react';
import { useState } from 'react';

export function Clips() {
  const { activeClip, setActiveClip, filteredClips } = useStudioStore();
  const [detailClip, setDetailClip] = useState<Clip | null>(null);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
      <div className="grid grid-cols-2 gap-4">
        {filteredClips.map((clip, index) => {
          const isActive = activeClip?.id === clip.id;

          return (
            <motion.div
              key={clip.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setActiveClip(clip)}
              onDoubleClick={() => setDetailClip(clip)}
              className={cn(
                'group relative aspect-video bg-neutral-900 rounded-xl overflow-hidden transition-all duration-300 cursor-grab active:cursor-grabbing',
                isActive
                  ? 'ring-2 ring-white shadow-[0_0_20px_rgba(255,255,255,0.1)] z-10'
                  : 'ring-1 ring-white/5 hover:ring-white/20 hover:bg-neutral-800',
              )}
              draggable
            >
              {/* Thumbnail */}
              <div className="absolute inset-0 z-0">
                {clip.thumbnail ? (
                  <img
                    src={clip.thumbnail}
                    alt={clip.fileName}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-700 bg-neutral-900/50">
                    <VideoSquare size={32} color="currentColor" variant="Bulk" />
                  </div>
                )}
                {/* Subtle dark gradient overlay */}
                <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent opacity-60 transition-opacity" />

                {/* File Info */}
                <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col justify-end gap-0.5">
                  <p className="text-[10px] font-medium text-white/90 truncate leading-tight">
                    {clip.fileName}
                  </p>
                  <p className="text-[9px] font-mono text-white/50">
                    {formatDuration(clip.duration)}
                  </p>
                </div>
              </div>
              {/* Quick Info Button (on hover) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDetailClip(clip);
                }}
                className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10"
              >
                <div className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white transform scale-90 group-hover:scale-100 transition-all hover:bg-white/20 hover:border-white/40 shadow-xl">
                  <PlayCircle size={24} color="currentColor" variant="Bulk" />
                </div>
              </button>

              {/* Active Indicator Dot */}
              {isActive && (
                <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] z-20" />
              )}
            </motion.div>
          );
        })}
      </div>

      <Modal
        isOpen={!!detailClip}
        onClose={() => setDetailClip(null)}
        title={detailClip?.fileName}
        maxWidth="lg"
      >
        <div className="flex flex-col p-6 gap-6">
          {/* Player Section */}
          <div className="aspect-video w-full bg-black overflow-hidden relative group/player rounded-xl border border-white/5">
            {detailClip?.videoUrl ? (
              <VideoPlayer src={detailClip.videoUrl} autoPlay />
            ) : detailClip?.thumbnail ? (
              <img src={detailClip.thumbnail} alt="" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-800">
                <VideoSquare size={48} variant="Bulk" color="currentColor" />
              </div>
            )}
          </div>

          {/* Metadata Section */}
          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-medium">
                  Duration
                </p>
                <p className="text-white font-mono text-sm">
                  {formatDuration(detailClip?.duration)}
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-medium">
                  Status
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <p className="text-white text-sm capitalize">
                    {detailClip?.status?.toLowerCase() || 'Ready'}
                  </p>
                </div>
              </div>
            </div>

            {detailClip?.summary && (
              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-medium font-mono">
                  AI Analysis Summary
                </p>
                <p className="text-sm text-neutral-300 leading-relaxed italic border-l-2 border-white/10 pl-5 py-1">
                  "{detailClip.summary}"
                </p>
              </div>
            )}

            {detailClip?.tags && detailClip.tags.length > 0 && (
              <div className="space-y-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-medium">
                  Detected Scenes
                </p>
                <div className="flex flex-wrap gap-2">
                  {detailClip.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] text-white/70 hover:bg-white/10 hover:border-white/20 transition-colors cursor-default"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
