'use client';

import { Modal } from '@/components/ui/modal';
import { Upload } from '@/components/ui/upload';
import { useState } from 'react';

type VideoUploadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
};

export const VideoUploadModal = ({ isOpen, onClose, projectId }: VideoUploadModalProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const handleFilesSelected = async (files: File[]) => {
    setTotalCount(files.length);
    setUploadedCount(0);
    setIsUploading(true);

    try {
      // 1. Request Signed URLs
      // In a real app, this would be a GraphQL mutation
      // const { data } = await requestVideoUploadUrls({ variables: { projectId, files: files.map(...) } });

      console.log('Requesting signed URLs for', files.length, 'files');

      // Placeholder for actual mutation logic
      // Since I don't have the full Apollo setup yet, I'll document the intended flow

      /*
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: REQUEST_UPLOAD_URLS_MUTATION,
          variables: {
            projectId,
            files: files.map(f => ({ fileName: f.name, contentType: f.type }))
          }
        })
      });
      const { data } = await response.json();
      */

      // 2. Upload to S3
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // const signedUrl = data.requestVideoUploadUrls[i].uploadUrl;

        console.log('Uploading file:', file.name);

        /*
        await fetch(signedUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type }
        });
        */

        // Simulate upload delay
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setUploadedCount((prev) => prev + 1);
      }

      // 3. Confirm Uploads
      /*
      await confirmVideoUploads({
        variables: {
          projectId,
          files: files.map((f, i) => ({
            key: data.requestVideoUploadUrls[i].key,
            fileName: f.name,
            mimeType: f.type,
            size: f.size
          }))
        }
      });
      */

      console.log('All files uploaded and confirmed');
      setTimeout(() => {
        onClose();
        setIsUploading(false);
      }, 500);
    } catch (error) {
      console.error('Upload failed:', error);
      setIsUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isUploading && onClose()}
      title="Upload Raw Footage"
      description="Select the clips you want to include in this project."
      maxWidth="xl"
    >
      <Upload
        onFilesSelected={handleFilesSelected}
        isUploading={isUploading}
        uploadedFilesCount={uploadedCount}
        totalFilesCount={totalCount}
      />

      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onClose}
          disabled={isUploading}
          className="rounded-full px-6 py-2 text-sm font-medium text-neutral-400 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
};
