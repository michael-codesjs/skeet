'use client';

import { useToast } from '@/components/ui/toast';
import { GET_PROJECTS, GET_PROJECT_DETAILS } from '@/graphql/queries/projects';
import { AssetStatus, useAssetManager } from '@/hooks/use-asset-manager';
import { useProjectUpdates } from '@/hooks/use-project-updates';
import { cn } from '@/lib/utils';
import { useStudioStore } from '@/stores/studio';
import { useQuery } from '@apollo/client/react';
import { useEffect, useState } from 'react';
import { DirectorChat } from './_components/chat';
import { CreateProject } from './_components/create-project';
import { ExportView } from './_components/export-view';
import { StudioHeader } from './_components/header';
import { Media } from './_components/media';
import { MissingAssetsModal } from './_components/missing-assets-modal';
import { ProgramMonitor } from './_components/program-monitor';
import { StudioSkeleton } from './_components/skeleton';
import { Timeline } from './_components/timeline';

export default function ProjectStudioPage() {
  const setProject = useStudioStore((state) => state.setProject);
  const setProjects = useStudioStore((state) => state.setProjects);
  const updateMedia = useStudioStore((state) => state.updateMedia);
  const project = useStudioStore((state) => state.project);
  const activeProjectId = useStudioStore((state) => state.activeProjectId);
  const projects = useStudioStore((state) => state.projects);
  const isCreatingProject = useStudioStore((state) => state.isCreatingProject);
  const setIsCreatingProject = useStudioStore((state) => state.setIsCreatingProject);

  const { checkAssets, syncAssets, isSyncing, progress } = useAssetManager();
  const [missingAssets, setMissingAssets] = useState<AssetStatus[]>([]);
  const [mounted, setMounted] = useState(false);

  const { success, error: toastError } = useToast();

  // Fetch list of projects for the selector
  const { data: projectsData } = useQuery<{ projects: any[] }>(GET_PROJECTS);

  const { data, loading } = useQuery<{ project: any }>(GET_PROJECT_DETAILS, {
    variables: { id: activeProjectId },
    skip: !activeProjectId,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (projectsData?.projects) {
      setProjects(projectsData.projects);
    }
  }, [projectsData, setProjects]);

  useEffect(() => {
    if (data?.project) {
      setProject(data.project);
    }
  }, [data, setProject]);

  // Check for missing assets when project media changes
  useEffect(() => {
    if (project?.media && project.media.length > 0) {
      const mediaIds = project.media.map((m: any) => m.id);
      checkAssets(mediaIds).then((statuses) => {
        setMissingAssets(statuses.filter((s) => !s.isLocal));
      });
    } else {
      setMissingAssets([]);
    }
  }, [project?.media, checkAssets]);

  const handleSync = async () => {
    if (!project?.media) return;

    const assetsToSync = missingAssets
      .map((asset: AssetStatus) => {
        const media = project.media.find((m: any) => m.id === asset.mediaId);
        return {
          mediaId: asset.mediaId,
          url: (media?.proxyUrl || media?.videoUrl) as string,
        };
      })
      .filter((a: { url: string }) => !!a.url);

    if (assetsToSync.length > 0) {
      await syncAssets(assetsToSync);
      // Re-check
      const mediaIds = missingAssets.map((a: AssetStatus) => a.mediaId);
      const statuses = await checkAssets(mediaIds);
      setMissingAssets(statuses.filter((s: AssetStatus) => !s.isLocal));
    }
  };

  useProjectUpdates(activeProjectId || '', (data) => {
    // If it's a full project update (e.g. timeline ready)
    if (data.projectId && data.timeline) {
      console.log('[Studio] Received project-updated notification:', data);

      const currentProject = useStudioStore.getState().project;
      if (currentProject) {
        setProject({
          ...currentProject,
          timeline: data.timeline,
        });
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

  if (!mounted) return null;

  if (loading && activeProjectId) {
    return <StudioSkeleton />;
  }

  return (
    <div className="relative flex h-screen w-full flex-col bg-black text-white overflow-hidden">
      {/* Studio UI Background */}
      <div className={cn('flex flex-col h-full w-full transition-all duration-700')}>
        <StudioHeader />
        <ExportView />

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

        {/* <StudioFooter /> */}
      </div>

      {(isCreatingProject || (mounted && projects.length === 0)) && (
        <CreateProject onClose={() => setIsCreatingProject(false)} />
      )}
    </div>
  );
}
