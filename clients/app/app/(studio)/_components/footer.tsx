'use client';

import { cn } from '@/lib/utils';
import { useStudioStore } from '@/stores/studio';
import { Cpu, Flash, InfoCircle, Record } from 'iconsax-react';

export function StudioFooter() {
  const project = useStudioStore((state) => state.project);
  const isPlaying = useStudioStore((state) => state.isPlaying);

  return (
    <footer className="h-8 shrink-0 bg-black border-t border-white/5 px-4 flex items-center justify-between text-[10px] text-neutral-500 select-none">
      {/* Left: Project Context */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 min-w-[120px]">
          <div
            className={cn(
              'w-1.5 h-1.5 rounded-full animate-pulse',
              project?.status === 'READY' ? 'bg-green-500' : 'bg-yellow-500',
            )}
          />
          <span className="font-medium text-neutral-400 truncate max-w-[100px]">
            {project?.title || 'No Project'}
          </span>
          <span className="text-neutral-600">/</span>
          <span className="uppercase tracking-wider font-bold text-[9px]">
            {project?.status || 'IDLE'}
          </span>
        </div>

        <div className="flex items-center gap-3 border-l border-white/5 pl-4">
          <div className="flex items-center gap-1 min-w-[120px]">
            <Record
              size={12}
              className={cn(isPlaying ? 'text-red-500' : 'text-neutral-600')}
              variant="Bulk"
            />
            <span>{isPlaying ? 'Live playback' : 'Standby'}</span>
          </div>
        </div>
      </div>

      {/* Center: Hints */}
      <div className="hidden lg:flex items-center gap-6">
        <div className="flex items-center gap-2">
          <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-[9px] font-mono text-neutral-400">
            SPACE
          </kbd>
          <span>Play/Pause</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-[9px] font-mono text-neutral-400">
            /
          </kbd>
          <span>Search Media</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-[9px] font-mono text-neutral-400">
            ⌘K
          </kbd>
          <span>Command</span>
        </div>
      </div>

      {/* Right: Engine Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-blue-400/70">
            <Flash size={12} variant="Bulk" />
            <span className="font-medium">AI Director Online</span>
          </div>
          <div className="flex items-center gap-1 text-neutral-600">
            <Cpu size={12} variant="Bulk" />
            <span>v0.1.0-beta</span>
          </div>
        </div>

        <div className="h-3 w-px bg-white/5" />

        <button className="hover:text-white transition-colors">
          <InfoCircle size={14} variant="Linear" />
        </button>
      </div>
    </footer>
  );
}
