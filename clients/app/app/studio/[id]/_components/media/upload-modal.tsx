'use client';

import { Modal } from '@/components/ui/modal';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { Add, CloseCircle, DocumentUpload, Edit2 } from 'iconsax-react';
import { useEffect, useRef, useState } from 'react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: File[];
  onUpload: (files: { file: File; name: string }[]) => void;
}

export function UploadModal({ isOpen, onClose, files, onUpload }: UploadModalProps) {
  const [fileData, setFileData] = useState<{ file: File; name: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (files.length > 0) {
      setFileData(files.map((f) => ({ file: f, name: f.name.split('.')[0] })));
    }
  }, [files]);

  const handleNameChange = (index: number, newName: string) => {
    setFileData((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], name: newName };
      return next;
    });
  };

  const handleRemove = (index: number) => {
    setFileData((prev) => prev.filter((_, i) => i !== index));
    if (fileData.length <= 1) {
      // If it was the last one and we are removing it
      // Maybe close modal? or just let user see empty list
    }
  };

  const handlUploadClick = () => {
    onUpload(fileData);
    onClose();
  };

  const handleAddFiles = (newFiles: File[]) => {
    const newFileData = newFiles.map((f) => ({ file: f, name: f.name.split('.')[0] }));
    setFileData((prev) => [...prev, ...newFileData]);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Media" maxWidth="md">
      <div
        className={cn(
          'p-6 flex flex-col gap-6 transition-colors duration-200 rounded-b-xl',
          isDragging && 'bg-blue-500/5 ring-1 ring-blue-500/20',
        )}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
          if (e.dataTransfer.files?.length) {
            handleAddFiles(Array.from(e.dataTransfer.files));
          }
        }}
      >
        <input
          type="file"
          multiple
          className="hidden"
          ref={fileInputRef}
          onChange={(e) => {
            if (e.target.files?.length) {
              handleAddFiles(Array.from(e.target.files));
              // safe to clear value so same file can be selected again if needed
              e.target.value = '';
            }
          }}
        />

        <div className="flex items-center justify-between p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-200">
          <div className="flex items-center gap-3">
            <DocumentUpload size={24} variant="Bulk" color="currentColor" />
            <p className="text-sm">
              Ready to upload <span className="font-bold">{fileData.length}</span> items. You can
              rename them before uploading.
            </p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors text-blue-200"
            title="Add more files"
          >
            <Add size={20} color="currentColor" />
          </button>
        </div>

        <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2">
          <AnimatePresence mode="popLayout">
            {fileData.map((item, index) => (
              <motion.div
                key={`${item.name}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 group hover:border-white/10 transition-colors"
                layout
              >
                <div className="w-10 h-10 rounded-lg bg-neutral-900 flex items-center justify-center shrink-0">
                  {/* Preview if image? */}
                  {item.file.type.startsWith('image/') ? (
                    <img
                      src={URL.createObjectURL(item.file)}
                      className="w-full h-full object-cover rounded-lg opacity-80"
                      alt=""
                    />
                  ) : (
                    <div className="text-neutral-500 font-bold text-xs">
                      {item.file.name.split('.').pop()?.toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="relative group/input">
                    <input
                      value={item.name}
                      onChange={(e) => handleNameChange(index, e.target.value)}
                      className="w-full bg-transparent border-none p-0 text-sm font-medium text-white focus:ring-0 placeholder:text-neutral-600 focus:outline-none"
                      placeholder="Filename"
                    />
                    <Edit2
                      size={12}
                      color="currentColor"
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-neutral-600 opacity-0 group-hover/input:opacity-100 transition-opacity pointer-events-none"
                    />
                  </div>
                  <p className="text-[10px] text-neutral-500 truncate">
                    {(item.file.size / 1024 / 1024).toFixed(2)} MB • {item.file.type || 'Unknown'}
                  </p>
                </div>

                <button
                  onClick={() => handleRemove(index)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-neutral-500 hover:text-white transition-colors"
                >
                  <CloseCircle size={14} color="currentColor" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {fileData.length === 0 && (
            <div className="text-center py-8 text-neutral-500 text-sm flex flex-col items-center gap-2">
              <p>No files selected.</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Add files
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlUploadClick}
            disabled={fileData.length === 0}
            className="px-6 py-2 rounded-lg bg-white text-black text-xs font-bold hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Upload {fileData.length > 0 && `(${fileData.length})`}
          </button>
        </div>
      </div>
    </Modal>
  );
}
