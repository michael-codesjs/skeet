import { cn } from '@/lib/utils';
import { type MediaItem } from '@/stores/studio';
import { motion } from 'framer-motion';
import { Gallery, Music, PlayCircle, VideoSquare } from 'iconsax-react';

export const formatDuration = (seconds?: number) => {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const isVideo = (item: MediaItem) =>
  item.mimeType?.startsWith('video/') ||
  (item.fileName ? !!item.fileName.match(/\.(mp4|mov|webm)$/i) : false);
export const isImage = (item: MediaItem) =>
  item.mimeType?.startsWith('image/') ||
  (item.fileName ? !!item.fileName.match(/\.(jpg|jpeg|png|webp|gif)$/i) : false);
export const isAudio = (item: MediaItem) =>
  item.mimeType?.startsWith('audio/') ||
  (item.fileName ? !!item.fileName.match(/\.(mp3|wav|m4a)$/i) : false);

export const getIcon = (item: MediaItem) => {
  if (isVideo(item)) return <VideoSquare size={32} color="currentColor" variant="Bulk" />;
  if (isImage(item)) return <Gallery size={32} color="currentColor" variant="Bulk" />;
  if (isAudio(item)) return <Music size={32} color="currentColor" variant="Bulk" />;
  return <VideoSquare size={32} color="currentColor" variant="Bulk" />;
};

interface MediaProps {
  item: MediaItem;
  index: number;
  isActive: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
}

export function Media({ item, index, isActive, onClick, onDoubleClick }: MediaProps) {
  const isUploading = item.status === 'UPLOADING';
  const isProcessing = item.status === 'PROCESSING';
  const showPlayButton = !isUploading && !isProcessing && (isVideo(item) || isAudio(item));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={cn(
        'group relative aspect-video bg-neutral-900 rounded-xl overflow-hidden transition-all duration-300',
        !isUploading && !isProcessing && 'cursor-grab active:cursor-grabbing',
        isActive
          ? 'ring-2 ring-white shadow-[0_0_20px_rgba(255,255,255,0.1)] z-10'
          : 'ring-1 ring-white/5 hover:ring-white/20 hover:bg-neutral-800',
      )}
      draggable={!isUploading && !isProcessing}
    >
      {/* Thumbnail */}
      <div className="absolute inset-0 z-0">
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={item.fileName}
            className={cn(
              'w-full h-full object-cover transition-transform duration-700',
              !isUploading && !isProcessing && 'group-hover:scale-110',
              (isUploading || isProcessing) && 'opacity-50 blur-[2px]',
            )}
          />
        ) : isImage(item) && item.videoUrl ? (
          <img
            src={item.videoUrl}
            alt={item.fileName}
            className={cn(
              'w-full h-full object-cover transition-transform duration-700',
              !isUploading && !isProcessing && 'group-hover:scale-110',
              (isUploading || isProcessing) && 'opacity-50 blur-[2px]',
            )}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-700 bg-neutral-900/50">
            {getIcon(item)}
          </div>
        )}
        {/* Subtle dark gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent opacity-60 transition-opacity" />

        {/* Upload/Processing Overlay */}
        {(isUploading || isProcessing) && (
          <>
            <div className="absolute inset-0 bg-black/40 z-20" />
            <div className="absolute bottom-0 left-0 right-0 h-0.5 z-30 bg-white/10">
              <div
                className={cn(
                  'h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] transition-all duration-300',
                  isProcessing && 'animate-pulse',
                )}
                style={{ width: `${item.progress || 0}%` }}
              />
            </div>
          </>
        )}

        {/* File Info */}
        <div className="absolute bottom-0 left-0 right-0 p-2 flex flex-col justify-end gap-0.5">
          <p className="text-[8px] max-w-[80%] font-medium text-white/80 truncate leading-tight">
            {item.fileName}
          </p>
          {!isUploading && !isProcessing && (item.duration || isAudio(item)) && (
            <p className="text-[9px] font-mono text-white/50">{formatDuration(item.duration)}</p>
          )}
        </div>
      </div>

      {/* Quick Info Button (on hover) */}
      {showPlayButton && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDoubleClick();
          }}
          className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10"
        >
          <div className="p-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white transform scale-90 group-hover:scale-100 transition-all hover:bg-white/20 hover:border-white/40 shadow-xl">
            <PlayCircle size={24} color="currentColor" variant="Bulk" />
          </div>
        </button>
      )}

      {/* Active Indicator Dot */}
      {isActive && (
        <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] z-20" />
      )}
    </motion.div>
  );
}
