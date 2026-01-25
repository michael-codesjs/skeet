import { useStudioStore } from '@/stores/studio';
import { ArrowLeft2 } from 'iconsax-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function StudioHeader() {
  const project = useStudioStore((state) => state.project);
  const pathname = usePathname();

  if (!project) return null;

  const isEditActive = pathname === `/projects/${project.id}`;
  const isExportActive = pathname === `/projects/${project.id}/export`;

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
          href={`/projects/${project.id}`}
          className={`transition-colors ${
            isEditActive ? 'text-white font-medium' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Edit
        </Link>
        <Link
          href={`/projects/${project.id}/export`}
          className={`transition-colors ${
            isExportActive ? 'text-white font-medium' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Export
        </Link>
      </div>
    </header>
  );
}
