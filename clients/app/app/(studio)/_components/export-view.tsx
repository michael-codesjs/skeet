'use client';

import { Button } from '@/components/ui/button';
import { useStudioStore } from '@/stores/studio';
import { AnimatePresence, motion } from 'framer-motion';
import { CloseCircle, DirectDown, ExportCurve, TickCircle, VideoOctagon } from 'iconsax-react';
import { useEffect, useState } from 'react';

export const ExportView = () => {
  const { project, isExportOpen, setIsExportOpen } = useStudioStore();
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    if (project?.finalVideoUrl) {
      setDownloadUrl(project.finalVideoUrl);
    }
  }, [project?.finalVideoUrl]);

  if (!isExportOpen || !project) return null;

  const isProcessing = project.status === 'PROCESSING';
  const isReady = project.status === 'READY';
  const isFailed = project.status === 'FAILED';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-6"
      >
        <div className="relative w-full max-w-4xl bg-neutral-900 rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-b-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
                <ExportCurve size={20} variant="Bulk" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Project Export</h2>
                <p className="text-xs text-neutral-400">Assemble and render your final video</p>
              </div>
            </div>
            <button
              onClick={() => setIsExportOpen(false)}
              className="text-neutral-500 hover:text-white transition-colors"
            >
              <CloseCircle size={24} variant="Bulk" />
            </button>
          </div>

          <div className="p-8">
            {isProcessing && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="relative h-20 w-20 mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-white/5" />
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-blue-400">
                    <VideoOctagon size={32} variant="Bulk" />
                  </div>
                </div>
                <h3 className="text-xl font-medium text-white mb-2">
                  Rendering your masterpiece...
                </h3>
                <p className="text-sm text-neutral-400 max-w-md">
                  We are assembling your timeline into a high-quality video file. This may take a
                  few minutes depending on the complexity of your project.
                </p>
              </div>
            )}

            {isFailed && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="h-20 w-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-6 font-bold shadow-inner ring-1 ring-red-500/20 text-xl">
                  !
                </div>
                <h3 className="text-xl font-medium text-white mb-2">Export Failed</h3>
                <p className="text-sm text-neutral-400 max-w-md">
                  Something went wrong during the rendering process. Please try again or check your
                  media library for missing assets.
                </p>
                <Button
                  onClick={() => setIsExportOpen(false)}
                  className="mt-8 rounded-xl"
                  variant="outline"
                >
                  Close and Try Again
                </Button>
              </div>
            )}

            {isReady && project.finalVideoUrl && (
              <div className="flex flex-col gap-8">
                <div className="relative aspect-[9/16] max-h-[50vh] mx-auto rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black">
                  <video src={project.finalVideoUrl} controls className="w-full h-full" autoPlay />
                </div>

                <div className="flex flex-col items-center gap-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="flex items-center gap-2 text-green-400 mb-2">
                      <TickCircle size={20} variant="Bold" />
                      <span className="text-sm font-medium">Export Complete!</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-1">{project.title}</h3>
                    <p className="text-xs text-neutral-500">
                      Rendered in high definition (1080x1920)
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <a
                      href={project.finalVideoUrl}
                      download
                      className="inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-black cursor-pointer rounded-2xl h-12 px-8 gap-2 bg-white text-black hover:bg-neutral-200"
                    >
                      <DirectDown size={20} variant="Bulk" />
                      <span>Download Video</span>
                    </a>
                    <Button
                      onClick={() => setIsExportOpen(false)}
                      className="rounded-2xl h-12 px-8"
                      variant="secondary"
                    >
                      Back to Editor
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
