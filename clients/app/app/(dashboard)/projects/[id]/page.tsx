'use client';

import { DirectorChat } from '@/app/(dashboard)/projects/[id]/_components/director-chat';
import { StudioHeader } from '@/app/(dashboard)/projects/[id]/_components/header';
import { ProgramMonitor } from '@/app/(dashboard)/projects/[id]/_components/program-monitor';
import { Timeline } from '@/app/(dashboard)/projects/[id]/_components/timeline';
import { GET_PROJECT } from '@/graphql/queries/projects';
import { useStudioStore } from '@/stores/studio';
import { useQuery } from '@apollo/client/react';
import { MagicStar } from 'iconsax-react';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { Media } from './_components/media';

export default function ProjectStudioPage() {
  const { id } = useParams();
  const setProject = useStudioStore((state) => state.setProject);
  const project = useStudioStore((state) => state.project);

  const { data, loading, error } = useQuery<{ project: any }>(GET_PROJECT, {
    variables: { id },
    skip: !id,
  });

  useEffect(() => {
    if (data?.project) {
      setProject(data.project);
    }
  }, [data, setProject]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          <p className="font-mono text-xs text-neutral-500">Loading Studio...</p>
        </div>
      </div>
    );
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
