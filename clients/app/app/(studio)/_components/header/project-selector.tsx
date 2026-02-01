'use client';

import { Popover } from '@/components/ui/popover';
import { useStudioStore } from '@/stores/studio';
import { Add, ArrowDown2, TickCircle } from 'iconsax-react';
import { useState } from 'react';

export function ProjectSelector() {
  const { projects, activeProjectId, setActiveProjectId, setIsCreatingProject } = useStudioStore();
  const [isOpen, setIsOpen] = useState(false);

  const activeProject = projects.find((p) => p.id === activeProjectId);

  const handleSelect = (id: string) => {
    setActiveProjectId(id);
    setIsOpen(false);
  };

  const handleCreate = () => {
    setIsCreatingProject(true);
    setIsOpen(false);
  };

  return (
    <Popover
      isOpen={isOpen}
      onToggle={() => setIsOpen(!isOpen)}
      onClose={() => setIsOpen(false)}
      width={240}
      offset={{ y: 8 }}
      trigger={
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors group">
          <div className="flex flex-col items-start text-left">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-white truncate max-w-[220px]">
                {activeProject ? activeProject.title : 'Select Project'}
              </span>
              <ArrowDown2
                size={14}
                className={`text-neutral-500 transition-transform duration-200 ${
                  isOpen ? 'rotate-180' : ''
                }`}
                variant="Linear"
                color="currentColor"
              />
            </div>
          </div>
        </button>
      }
    >
      <div className="flex flex-col p-2">
        <div className="max-h-[300px] overflow-y-auto scrollbar-hide flex flex-col gap-0.5">
          {projects.length === 0 ? (
            <div className="px-3 py-4 text-center text-xs text-neutral-500">No projects yet</div>
          ) : (
            projects.map((project) => (
              <button
                key={project.id}
                onClick={() => handleSelect(project.id)}
                className={`
                  flex items-center justify-between w-full px-3 py-2 text-left rounded-lg text-sm transition-colors
                  ${
                    project.id === activeProjectId
                      ? 'bg-blue-500/10 text-blue-200'
                      : 'text-neutral-300 hover:bg-white/5 hover:text-white'
                  }
                `}
              >
                <span className="truncate text-[10px]">{project.title}</span>
                {project.id === activeProjectId && (
                  <TickCircle size={16} variant="Bold" color="currentColor" />
                )}
              </button>
            ))
          )}
        </div>

        <div className="h-px bg-white/5 my-2" />

        <button
          onClick={handleCreate}
          className="flex items-center gap-2 w-full px-3 py-2 text-left rounded-lg text-sm text-neutral-300 hover:bg-white/5 hover:text-white transition-colors"
        >
          <div className="flex items-center justify-center w-5 h-5 rounded-md bg-white/10 text-white">
            <Add size={12} color="currentColor" />
          </div>
          <span className="text-xs">Create New Project</span>
        </button>
      </div>
    </Popover>
  );
}
