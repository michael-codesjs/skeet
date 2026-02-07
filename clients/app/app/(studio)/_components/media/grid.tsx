'use client';

import { useDisclosure } from '@/hooks/use-disclosure';
import { useStudioStore, type MediaItem } from '@/stores/studio';
import { Add, Import } from 'iconsax-react';
import { useState } from 'react';
import { Media } from './media';
import { MediaDetailModal } from './media-detail-modal';
import { UploadModal } from './upload-modal';

interface MediaGridProps {
  items: MediaItem[];
  loading?: boolean;
}

export function MediaGrid({ items, loading }: MediaGridProps) {
  const { activeMedia, setActiveMedia, addMedia } = useStudioStore();
  const [detailItem, setDetailItem] = useState<MediaItem | null>(null);
  const uploadModal = useDisclosure();
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 flex-1 overflow-y-auto overflow-x-hidden p-1">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="aspect-video w-full rounded-lg bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 pr-2">
      {items.length === 0 ? (
        <div
          className="h-full min-h-[400px] flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl bg-white/2 hover:bg-white/4 hover:border-white/20 transition-all duration-500 gap-6 p-8 relative overflow-hidden group"
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.dataTransfer.files?.length) {
              const droppedFiles = Array.from(e.dataTransfer.files);
              setUploadFiles(droppedFiles);
              uploadModal.onOpen();
            }
          }}
        >
          {/* Subtle Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/5 blur-[80px] rounded-full pointer-events-none" />

          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-2 group-hover:scale-110 group-hover:bg-white/10 transition-all duration-500 shadow-2xl shadow-black">
              <Import
                size={34}
                color="white"
                variant="Bulk"
                className="opacity-40 group-hover:opacity-100 transition-opacity duration-500"
              />
            </div>
            {/* Pulsing indicator */}
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-white/20 rounded-full blur-sm animate-pulse" />
          </div>

          <div className="text-center space-y-2 relative z-10">
            <h3 className="text-xl font-semibold text-white tracking-tight">Drag to upload</h3>
            <p className="text-sm text-white/40 max-w-[200px] mx-auto leading-relaxed">
              Support for Video, Audio and Images
            </p>
          </div>

          <button
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.multiple = true;
              input.accept = 'image/*,video/*,audio/*';
              input.onchange = (e) => {
                const target = e.target as HTMLInputElement;
                if (target.files?.length) {
                  setUploadFiles(Array.from(target.files));
                  uploadModal.onOpen();
                }
              };
              input.click();
            }}
            className="group/btn relative mt-2 px-8 py-3 rounded-full bg-white text-black font-bold text-sm hover:bg-neutral-100 transition-all duration-300 flex items-center gap-2 overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95"
          >
            <Add size={18} color="black" className="relative z-10" />
            <span className="relative z-10">Upload Files</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 pb-4">
          {items.map((item, index) => {
            const isActive = activeMedia?.id === item.id;
            const isBusy = item.status === 'UPLOADING' || item.status === 'PROCESSING';

            return (
              <Media
                key={item.id}
                item={item}
                index={index}
                isActive={isActive}
                onClick={() => !isBusy && setActiveMedia(item)}
                onDoubleClick={() => !isBusy && setDetailItem(item)}
              />
            );
          })}
        </div>
      )}

      <MediaDetailModal item={detailItem} onClose={() => setDetailItem(null)} />

      <UploadModal
        isOpen={uploadModal.isOpen}
        onClose={() => {
          uploadModal.onClose();
          setUploadFiles([]);
        }}
        files={uploadFiles}
        onUpload={(files) => {
          const newMedia: MediaItem[] = files.map((f) => ({
            id: Math.random().toString(36).substr(2, 9),
            fileName: f.name,
            mimeType: f.file.type || '',
            status: 'READY',
            thumbnail: f.file.type.startsWith('image/') ? URL.createObjectURL(f.file) : null,
            videoUrl: URL.createObjectURL(f.file),
            duration: 0,
            s3Key: '',
            progress: 100,
          }));
          addMedia(newMedia);
          uploadModal.onClose();
          setUploadFiles([]);
        }}
      />
    </div>
  );
}
