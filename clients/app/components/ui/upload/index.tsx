'use client';

import { cn } from '@/lib/utils';
import { DocumentUpload, Eye, TickCircle } from 'iconsax-react';
import React, { useRef, useState } from 'react';

type UploadProps = {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  className?: string;
  title?: string;
  description?: string;
  uploadingTitle?: string;
  isUploading?: boolean;
  uploadedFilesCount?: number;
  totalFilesCount?: number;
};

export const Upload = ({
  onFilesSelected,
  accept = 'video/*',
  multiple = true,
  className,
  title = 'Click or drag file to upload',
  description = 'Supports: MP4, MOV, WEBM',
  uploadingTitle = 'Uploading footage...',
  isUploading = false,
  uploadedFilesCount = 0,
  totalFilesCount = 0,
}: UploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFilesSelected(files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      onFilesSelected(files);
    }
  };

  const progress = totalFilesCount > 0 ? (uploadedFilesCount / totalFilesCount) * 100 : 0;

  return (
    <div
      className={cn(
        'group relative flex aspect-video w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-300 bg-brand-card',
        isDragging
          ? 'border-white bg-white/5'
          : 'border-white/10 hover:border-white/20 hover:bg-white/2',
        isUploading && 'pointer-events-none',
        className,
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white/5 transition-transform duration-300 group-hover:scale-110">
          {uploadedFilesCount === totalFilesCount && totalFilesCount > 0 ? (
            <TickCircle size={32} color="#4ade80" variant="Bold" />
          ) : isUploading ? (
            <Eye size={32} color="#ffffff" className="animate-pulse" />
          ) : (
            <DocumentUpload
              size={32}
              color="#ffffff"
              className="opacity-60 group-hover:opacity-100 transition-opacity"
            />
          )}
        </div>

        <h4 className="text-lg font-medium text-white">{isUploading ? uploadingTitle : title}</h4>
        <p className="mt-3 text-sm text-brand-secondary">{description}</p>

        {isUploading && (
          <div className="mt-6 w-full max-w-xs">
            <div className="overflow-hidden rounded-full bg-white/5">
              <div
                className="h-1 bg-white transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-brand-secondary">
              Uploading files... {uploadedFilesCount} / {totalFilesCount}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
