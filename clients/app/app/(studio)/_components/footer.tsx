'use client';

import { SAVE_PROJECT_TIMELINE } from '@/graphql/mutations/projects';
import { cn } from '@/lib/utils';
import { useStudioStore } from '@/stores/studio';
import { useMutation } from '@apollo/client/react';
import { Cpu, Flash, InfoCircle, Record } from 'iconsax-react';

export function StudioFooter() {
  const project = useStudioStore((state) => state.project);
  const isPlaying = useStudioStore((state) => state.isPlaying);
  const isSaving = useStudioStore((state) => state.isSaving);
  const isDirty = useStudioStore((state) => state.isDirty);
  const saveProjectTimeline = useStudioStore((state) => state.saveProjectTimeline);

  const [saveTimelineMutation] = useMutation(SAVE_PROJECT_TIMELINE);

  const handleManualSave = async () => {
    await saveProjectTimeline(async (id, timeline) => {
      return saveTimelineMutation({
        variables: { id, timeline },
      });
    });
  };

  return (
    <footer className="h-8 shrink-0 bg-black border-t border-white/5 px-4 flex items-center justify-between text-[10px] text-neutral-500 select-none">
      {/* Left: Project Context */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 border-l border-white/5 pl-4">
          <div className="flex items-center gap-2 min-w-[100px] text-[10px]">
            {isSaving ? (
              <span className="text-neutral-400 italic">Saving...</span>
            ) : isDirty ? (
              <button
                onClick={handleManualSave}
                className="text-emerald-500 font-medium hover:text-emerald-400 transition-colors flex items-center gap-1.5"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Save Changes
              </button>
            ) : (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-600" />
                <span>All changes saved</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 border-l border-white/5">
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
          <div className="flex items-center gap-1 text-neutral-400/70">
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
