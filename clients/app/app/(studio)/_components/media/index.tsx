'use client';

import { CONFIRM_MEDIA_UPLOADS, CREATE_MEDIA } from '@/graphql/mutations/media';
import { GET_PROJECT_MEDIA } from '@/graphql/queries/projects';
import { cn } from '@/lib/utils';
import { useStudioStore, type MediaItem } from '@/stores/studio';
import { useMutation, useQuery } from '@apollo/client/react';
import { Add, DocumentUpload } from 'iconsax-react';
import { useCallback, useEffect, useState } from 'react';
import { MediaFilters } from './filters';
import { MediaGrid } from './grid';
import { Search } from './search';
import { UploadModal } from './upload-modal';

interface CreateMediaData {
  createMedia: {
    id: string;
    uploadUrl: string;
  }[];
}

interface CreateMediaVars {
  projectId: string;
  files: {
    fileName: string;
    contentType: string;
    size: number;
  }[];
}

interface ConfirmMediaData {
  confirmMediaUploads: boolean;
}

interface ConfirmMediaVars {
  projectId: string;
  ids: string[];
}

interface ProjectMediaData {
  project: {
    id: string;
    media: MediaItem[];
  };
}

export function Media() {
  const {
    addMedia,
    updateMedia,
    setMedia,
    searchQuery,
    filterType,
    filteredMedia,
    activeProjectId,
  } = useStudioStore();

  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  // Removed global progress states: uploadProgress, uploadPhase

  const { data: mediaData, loading: mediaLoading } = useQuery<ProjectMediaData>(GET_PROJECT_MEDIA, {
    variables: {
      projectId: activeProjectId,
      search: searchQuery,
      type: filterType,
    },
    skip: !activeProjectId,
    fetchPolicy: 'cache-and-network',
  });

  // Sync Apollo data to store whenever it changes
  useEffect(() => {
    if (mediaData?.project?.media) {
      setMedia(mediaData.project.media);
    }
  }, [mediaData, setMedia]);

  const [createMedia] = useMutation<CreateMediaData, CreateMediaVars>(CREATE_MEDIA);
  const [confirmMediaUploads] = useMutation<ConfirmMediaData, ConfirmMediaVars>(
    CONFIRM_MEDIA_UPLOADS,
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setFilesToUpload(files);
      setUploadModalOpen(true);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFilesToUpload(Array.from(e.target.files));
      setUploadModalOpen(true);
    }
  };

  const uploadFileToS3 = (file: File, url: string, onProgress: (loaded: number) => void) => {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', url, true);
      xhr.setRequestHeader('Content-Type', file.type);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(e.loaded);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network Error'));
      xhr.send(file);
    });
  };

  const performUpload = async (files: { file: File; name: string }[]) => {
    if (!activeProjectId) return;
    setIsUploading(true);

    try {
      // 1. Create Media Entries
      const mediaInput = files.map((f) => ({
        fileName: f.name, // The user-edited name
        contentType: f.file.type || 'application/octet-stream',
        size: f.file.size,
      }));

      const { data: createData } = await createMedia({
        variables: {
          projectId: activeProjectId,
          files: mediaInput,
        },
        refetchQueries: [
          {
            query: GET_PROJECT_MEDIA,
            variables: { projectId: activeProjectId, search: searchQuery, type: filterType },
          },
        ],
      });

      if (!createData?.createMedia) {
        throw new Error('Failed to initiate upload');
      }

      const uploadConfigs = createData.createMedia; // [{ id, uploadUrl }]

      // 1.5 Add initial placeholders to the grid
      const newMediaItems: MediaItem[] = files.map((f, i) => ({
        id: uploadConfigs[i].id,
        fileName: f.name,
        mimeType: f.file.type,
        status: 'UPLOADING', // New status we'll handle in Grid
        thumbnail: f.file.type.startsWith('image/') ? URL.createObjectURL(f.file) : null,
        videoUrl: null,
        progress: 0,
      }));
      addMedia(newMediaItems);

      // 2. Upload to S3 with Per-Item Progress
      await Promise.all(
        uploadConfigs.map(async (config: any, index: number) => {
          await uploadFileToS3(files[index].file, config.uploadUrl, (loaded) => {
            const percent = Math.round((loaded / files[index].file.size) * 100);
            updateMedia(config.id, { progress: percent });
          });
          return config.id;
        }),
      );

      // Mark all as processing / 100%
      uploadConfigs.forEach((c) => {
        updateMedia(c.id, { status: 'PROCESSING', progress: 100 });
      });

      // 3. Confirm Uploads
      const { data: confirmData } = await confirmMediaUploads({
        variables: {
          projectId: activeProjectId,
          ids: uploadConfigs.map((c) => c.id),
        },
      });

      if (!confirmData?.confirmMediaUploads) {
        throw new Error('Failed to confirm uploads');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      // Ideally show toast
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      className={cn(
        'relative flex flex-col space-y-4 h-full w-80 border-r border-white/5 overflow-hidden p-5 transition-colors duration-200',
        isDragOver && 'bg-blue-500/10 border-blue-500/30',
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header with Upload Button */}
      <div className="flex items-center gap-2">
        <Search />
        <div className="relative">
          <input
            type="file"
            multiple
            accept="image/*,video/*,audio/*"
            onChange={handleFileSelect}
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
          />
          <button className="p-3 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 transition-colors text-white">
            <Add size={16} color="currentColor" />
          </button>
        </div>
      </div>

      <MediaFilters />

      <MediaGrid loading={mediaLoading && filteredMedia.length === 0} items={filteredMedia} />

      {/* Drag Overlay Hint */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm border-2 border-white/50 border-dashed m-4 rounded-xl pointer-events-none">
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <DocumentUpload size={48} variant="Bulk" />
            <p className="font-medium text-lg">Drop files here to upload</p>
          </div>
        </div>
      )}

      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        files={filesToUpload}
        onUpload={performUpload}
      />
    </div>
  );
}
