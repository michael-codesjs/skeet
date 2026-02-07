'use client';

import { useStudioStore } from '@/stores/studio';
import { Command, User } from 'iconsax-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { DebugModal } from '../debug-modal';
import { ProjectSelector } from './project-selector';

export const StudioHeader = () => {
  const project = useStudioStore((state) => state.project);
  const isExportOpen = useStudioStore((state) => state.isExportOpen);
  const setIsExportOpen = useStudioStore((state) => state.setIsExportOpen);
  const pathname = usePathname();
  const [isDebugOpen, setIsDebugOpen] = useState(false);

  // Check if we are on edit/export pages
  const isEditActive =
    !pathname || pathname === '/' || (project && pathname?.startsWith(`/studio/${project.id}`));

  return (
    <header className="h-14 border-b border-b-white/10 flex items-center justify-between p-5 shrink-0 z-50">
      <div className="flex items-center gap-1.5">
        {/* User Profile Placeholder */}
        <div className="h-7 w-7 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500 shadow-inner ring-1 ring-white/5">
          <User size={11} variant="Bulk" color="currentColor" />
        </div>
        <ProjectSelector />
      </div>

      <div className="flex items-center gap-4">
        {project && (
          <div className="flex items-center gap-6 text-xs mr-4">
            <Link
              href="/"
              className={`transition-colors ${
                isEditActive && !isExportOpen
                  ? 'text-white font-medium'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Edit
            </Link>
            <button
              onClick={() => setIsExportOpen(true)}
              className={`transition-colors ${
                isExportOpen ? 'text-white font-medium' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Export
            </button>
            <button
              onClick={() => setIsDebugOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white transition-all ml-2"
              title="Open Timeline Debugger"
            >
              <Command size={16} color="currentColor" />
            </button>
          </div>
        )}
      </div>

      <DebugModal isOpen={isDebugOpen} onClose={() => setIsDebugOpen(false)} />
    </header>
  );
};
