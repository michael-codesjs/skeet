import { useStudioStore } from '@/stores/studio';
import { ArrowLeft2, Command } from 'iconsax-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { DebugModal } from './debug-modal';

export function StudioHeader() {
  const project = useStudioStore((state) => state.project);
  const pathname = usePathname();
  const [isDebugOpen, setIsDebugOpen] = useState(false);

  if (!project) return null;

  const isEditActive = pathname === `/studio/${project.id}`;
  const isExportActive = pathname === `/studio/${project.id}/export`;

  return (
    <header className="h-14 border-b border-b-white/10 flex items-center justify-between p-6 shrink-0 z-50">
      <div className="flex items-center gap-4">
        <Link href="/projects" className="text-neutral-400 hover:text-white transition-colors">
          <ArrowLeft2 size={14} color="currentColor" />
        </Link>
        <div className="flex items-center gap-2">
          <h1 className="text-white truncate max-w-[200px]">{project.title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-6 text-sm">
        <Link
          href={`/studio/${project.id}`}
          className={`transition-colors ${
            isEditActive ? 'text-white font-medium' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Edit
        </Link>
        <Link
          href={`/studio/${project.id}/export`}
          className={`transition-colors ${
            isExportActive ? 'text-white font-medium' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Export
        </Link>
        <button
          onClick={() => setIsDebugOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white transition-all ml-2"
          title="Open OTIO Debugger"
        >
          <Command size={16} color="currentColor" />
        </button>
      </div>

      <DebugModal isOpen={isDebugOpen} onClose={() => setIsDebugOpen(false)} />
    </header>
  );
}
