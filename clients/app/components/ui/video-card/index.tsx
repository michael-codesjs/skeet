import { motion } from 'framer-motion';
import { Eye, Gallery, Play, Trash, VideoSquare } from 'iconsax-react';
import React from 'react';

interface VideoCardProps {
  clip: any;
  isPending: boolean;
  isSelected: boolean;
  statusInfo: { bg: string; text: string; border: string; label: string };
  onSelect: (clip: any) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
}

export const VideoCard = ({
  clip,
  isPending,
  isSelected,
  statusInfo,
  onSelect,
  onDelete,
}: VideoCardProps) => {
  const formatDuration = (seconds: number) => {
    if (!seconds) return '0:00';
    const numParams = Math.round(seconds);
    const m = Math.floor(numParams / 60);
    const s = numParams % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      onClick={() => !isPending && onSelect(clip)}
      className={`group relative aspect-video md:aspect-4/3 bg-brand-card border border-white/5 rounded-xl overflow-hidden cursor-pointer hover:border-brand-primary/50 transition-colors ${
        isSelected ? 'ring-2 ring-brand-primary' : ''
      }`}
    >
      {/* Thumbnail or Placeholder */}
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        {clip.thumbnail ? (
          <img
            src={clip.thumbnail}
            alt={clip.fileName}
            className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500 opacity-80 group-hover:opacity-100"
          />
        ) : clip.status === 'UPLOADING' || clip.status === 'PROCESSING' ? (
          <div className="flex flex-col items-center gap-2">
            <Eye size={32} className="text-neutral-500 animate-pulse" />
          </div>
        ) : clip.mimeType?.startsWith('image') ? (
          <Gallery size={32} className="text-neutral-600" />
        ) : (
          <VideoSquare size={32} className="text-neutral-600" />
        )}
      </div>

      {/* Duration Chip (YouTube Style) */}
      {clip.duration && (
        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-white text-[10px] font-medium font-mono z-10 flex items-center gap-1">
          {formatDuration(clip.duration)}
        </div>
      )}

      {/* Tech Badges */}
      {clip.technical && (
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end z-10">
          {clip.technical.stability >= 8 && (
            <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[8px] font-bold uppercase backdrop-blur-md">
              Steady
            </span>
          )}
          {clip.technical.lighting >= 8 && (
            <span className="px-1.5 py-0.5 rounded-md bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-[8px] font-bold uppercase backdrop-blur-md">
              Lit
            </span>
          )}
          {clip.cameraMovement && clip.cameraMovement !== 'static' && (
            <span className="px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[8px] font-bold uppercase backdrop-blur-md max-w-[60px] truncate">
              {clip.cameraMovement.replace('_', ' ')}
            </span>
          )}
        </div>
      )}

      {/* Play Button Overlay (On Hover) */}
      {!isPending && clip.status === 'READY' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100">
          <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-xl">
            <Play size={24} color="#ffffff" variant="Bold" className="ml-1" />
          </div>
        </div>
      )}

      {/* Status Badge - Floating Repositioned */}
      <div className="absolute top-2 left-2 flex gap-1 z-10">
        {isPending && (
          <span
            className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border} border`}
          >
            {statusInfo.label}
          </span>
        )}
      </div>

      {/* Actions Overlay */}
      <div className="absolute inset-0 z-30 flex flex-col justify-between p-3 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/90 via-black/20 to-transparent">
        <div className="flex justify-end">
          {!isPending && (
            <button
              onClick={(e) => onDelete(e, clip.id)}
              className="p-1.5 rounded-full bg-red-500/20 text-red-400 hover:bg-white hover:text-red-500 transition-colors backdrop-blur-md"
              title="Delete Asset"
            >
              <Trash size={16} variant="Bold" color="currentColor" />
            </button>
          )}
        </div>

        <div className="mt-auto pr-12">
          {!isPending && (
            <p className="text-[11px] text-white/90 font-medium truncate drop-shadow-md">
              {clip.fileName}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};
