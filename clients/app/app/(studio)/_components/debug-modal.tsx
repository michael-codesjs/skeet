'use client';

import { useStudioStore } from '@/stores/studio';
import { CloseCircle, Command } from 'iconsax-react';
import { useEffect, useState } from 'react';

interface DebugModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DebugModal({ isOpen, onClose }: DebugModalProps) {
  const project = useStudioStore((state) => state.project);
  const setProject = useStudioStore((state) => state.setProject);
  const [timelineJson, setTimelineJson] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (project?.timeline) {
      setTimelineJson(JSON.stringify(project.timeline, null, 2));
    }
  }, [project?.timeline, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    try {
      const parsed = JSON.parse(timelineJson);
      if (project) {
        setProject({
          ...project,
          timeline: parsed,
        });
      }
      setError(null);
      onClose();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-md p-10">
      <div className="w-full h-full max-w-5xl rounded-2xl border border-white/10 bg-neutral-900 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 p-6 bg-neutral-900/50">
          <div className="flex items-center gap-3 text-white">
            <Command size={20} variant="Bold" />
            <h2 className="text-xl font-bold">Debug: Timeline Editor</h2>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">
            <CloseCircle size={24} />
          </button>
        </div>

        {/* Editor Area */}
        <div className="flex-1 min-h-0 p-6 flex flex-col gap-4">
          <p className="text-sm text-neutral-400">
            Directly edit the Timeline JSON. Useful for debugging playback or effect issues.
          </p>

          <div className="flex-1 relative font-mono text-sm">
            <textarea
              value={timelineJson}
              onChange={(e) => setTimelineJson(e.target.value)}
              className="w-full h-full bg-black/40 border border-white/10 rounded-xl p-4 text-neutral-300 focus:outline-none focus:border-blue-500/50 resize-none"
              spellCheck={false}
            />
            {error && (
              <div className="absolute bottom-4 left-4 right-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-500 text-xs">
                Invalid JSON: {error}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/5 p-6 bg-neutral-900/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-white/10 text-neutral-400 font-medium hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-8 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)]"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}
