import { Modal } from '@/components/ui/modal';
import { VideoPlayer } from '@/components/ui/video-player';
import { type MediaItem } from '@/stores/studio';
import { Music, VideoSquare } from 'iconsax-react';
import { formatDuration, isAudio, isImage, isVideo } from './media';

interface MediaDetailModalProps {
  item: MediaItem | null;
  onClose: () => void;
}

export function MediaDetailModal({ item, onClose }: MediaDetailModalProps) {
  return (
    <Modal isOpen={!!item} onClose={onClose} title={item?.fileName} maxWidth="lg">
      <div className="flex flex-col p-6 gap-6">
        {/* Player/Preview Section */}
        <div className="aspect-video w-full bg-black overflow-hidden relative group/player rounded-xl border border-white/5 flex items-center justify-center">
          {item && isVideo(item) && item.videoUrl ? (
            <VideoPlayer src={item.videoUrl} autoPlay />
          ) : item && isImage(item) && (item.videoUrl || item.thumbnail) ? (
            <img
              src={item.videoUrl || item.thumbnail || ''}
              alt=""
              className="w-full h-full object-contain"
            />
          ) : item && isAudio(item) ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-900 gap-4">
              <Music size={64} variant="Bulk" className="text-neutral-700" color="currentColor" />
              {item.videoUrl && <audio controls src={item.videoUrl} className="w-3/4" />}
            </div>
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
                {formatDuration(item?.duration) || '--:--'}
              </p>
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-medium">
                Status
              </p>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <p className="text-white text-sm capitalize">
                  {item?.status?.toLowerCase() || 'Ready'}
                </p>
              </div>
            </div>
          </div>

          {item?.summary && (
            <div className="space-y-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-medium font-mono">
                AI Analysis Summary
              </p>
              <p className="text-sm text-neutral-300 leading-relaxed italic border-l-2 border-white/10 pl-5 py-1">
                "{item.summary}"
              </p>
            </div>
          )}

          {item?.tags && item.tags.length > 0 && (
            <div className="space-y-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-medium">
                Detected Scenes
              </p>
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag) => (
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
  );
}
