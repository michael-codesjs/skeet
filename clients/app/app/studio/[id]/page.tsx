'use client';

import { useToast } from '@/components/ui/toast';
import { GET_PROJECT_DETAILS } from '@/graphql/queries/projects';
import { AssetStatus, useAssetManager } from '@/hooks/use-asset-manager';
import { useProjectUpdates } from '@/hooks/use-project-updates';
import { useStudioStore } from '@/stores/studio';
import { useQuery } from '@apollo/client/react';
import { MagicStar } from 'iconsax-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DirectorChat } from './_components/chat';
import { StudioHeader } from './_components/header';
import { Media } from './_components/media';
import { MissingAssetsModal } from './_components/missing-assets-modal';
import { ProgramMonitor } from './_components/program-monitor';
import { StudioSkeleton } from './_components/skeleton';
import { Timeline } from './_components/timeline';

export default function ProjectStudioPage() {
  const { id } = useParams();
  const setProject = useStudioStore((state) => state.setProject);
  const updateMedia = useStudioStore((state) => state.updateMedia);
  const project = useStudioStore((state) => state.project);

  const { checkAssets, syncAssets, isSyncing, progress } = useAssetManager();
  const [missingAssets, setMissingAssets] = useState<AssetStatus[]>([]);

  const { data, loading, error } = useQuery<{ project: any }>(GET_PROJECT_DETAILS, {
    variables: { id },
    skip: !id,
  });

  useEffect(() => {
    if (data?.project) {
      setProject(data.project);
    }
  }, [data, setProject]);

  // Check for missing assets when project OTIO changes
  useEffect(() => {
    if (project?.otio) {
      const mediaIds = new Set<string>();
      project.otio.tracks.children.forEach((track) => {
        track.children.forEach((item) => {
          if (item.OTIO_SCHEMA.startsWith('Clip.')) {
            const mediaId = (item as any).media_reference?.metadata?.mediaId;
            if (mediaId) mediaIds.add(mediaId);
          }
        });
      });

      if (mediaIds.size > 0) {
        checkAssets(Array.from(mediaIds)).then((statuses) => {
          setMissingAssets(statuses.filter((s) => !s.isLocal));
        });
      }
    }
  }, [project?.otio, checkAssets]);

  const handleSync = async () => {
    if (!project?.media) return;

    const assetsToSync = missingAssets
      .map((asset) => {
        const media = project.media.find((m) => m.id === asset.mediaId);
        return {
          mediaId: asset.mediaId,
          url: (media?.proxyUrl || media?.videoUrl) as string,
        };
      })
      .filter((a) => !!a.url);

    if (assetsToSync.length > 0) {
      await syncAssets(assetsToSync);
      // Re-check
      const mediaIds = missingAssets.map((a) => a.mediaId);
      const statuses = await checkAssets(mediaIds);
      setMissingAssets(statuses.filter((s) => !s.isLocal));
    }
  };

  const { toast, success, error: toastError } = useToast();

  useProjectUpdates(id as string, (data) => {
    // If it's a full project update (e.g. OTIO timeline ready)
    if (data.projectId && data.otio) {
      console.log('[Studio] Received project-updated notification:', data);

      // Update the whole project object in the store
      // We need to fetch the full project details or just partial update
      // For now, let's assume we can merge the OTIO into the current project
      const currentProject = useStudioStore.getState().project;
      if (currentProject) {
        setProject({
          ...currentProject,
          otio: data.otio,
        });
        success('Timeline updated!');
      }
    }

    if (data.mediaId) {
      const updates: any = {};

      if (data.status) updates.status = data.status;
      if (data.thumbnailUrl) {
        updates.thumbnail = data.thumbnailUrl;
        updates.thumbnailReady = true;
      }
      if (data.proxyUrl) updates.videoUrl = data.proxyUrl;
      if (data.analysisReady) updates.analysisReady = true;
      if (data.summary) updates.summary = data.summary;
      if (data.tags) updates.tags = data.tags;

      updateMedia(data.mediaId, updates);

      // Handle AI Status Toasts
      if (data.aiStatus === 'SUCCESS') {
        success(`AI analysis complete for asset.`);
      } else if (data.aiStatus === 'FAILED') {
        toastError(`AI analysis failed: ${data.error || 'Unknown error'}`);
      }
    }
  });

  if (loading) {
    return <StudioSkeleton />;
  }

  if (error || !data?.project) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black text-white">
        <div className="flex max-w-md flex-col items-center text-center">
          <MagicStar size={32} color="currentColor" className="mb-4 text-red-500" variant="Bulk" />
          <h1 className="mb-2 text-xl font-bold">Project Load Failed</h1>
          <p className="text-neutral-500">We couldn't load the studio context.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-black text-white overflow-hidden">
      <StudioHeader />

      <MissingAssetsModal
        missingAssets={missingAssets}
        onSync={handleSync}
        isSyncing={isSyncing}
        progress={progress}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex min-h-0 overflow-hidden bg-neutral-950/50">
        <Media />

        <div className="w-px bg-white/5" />

        {/* Center Column: Monitor + Timeline */}
        <div className="flex-1 flex flex-col min-w-0">
          <ProgramMonitor />
          <Timeline />
        </div>

        <div className="w-px bg-white/5" />

        <DirectorChat />
      </div>
    </div>
  );
}
