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
          className="h-full flex flex-col items-center justify-center border-2 border-dashed border-neutral-800 rounded-xl bg-neutral-900/20 text-neutral-500 hover:text-neutral-400 hover:border-neutral-700 hover:bg-neutral-900/40 transition-all duration-300 gap-4"
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
          <div className="w-20 h-20 rounded-full bg-neutral-800/50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300">
            <Import
              size={40}
              color="currentColor"
              variant="Bulk"
              className="opacity-50 group-hover:opacity-100"
            />
          </div>
          <div className="text-center space-y-1">
            <p className="text-lg font-medium text-neutral-300">Drag to upload</p>
            <p className="text-xs text-neutral-600">Support for Video, Audio and Images</p>
          </div>

          <button
            onClick={() => {
              // Trigger file input click
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
            className="mt-4 px-6 py-2.5 rounded-full bg-white text-black font-semibold text-sm hover:bg-neutral-200 transition-colors flex items-center gap-2 shadow-lg shadow-white/5"
          >
            <Add size={18} color="currentColor" />
            <span>Upload Files</span>
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
          }));
          addMedia(newMedia);
          uploadModal.onClose();
          setUploadFiles([]);
        }}
      />
    </div>
  );
}
