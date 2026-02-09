'use client';

import { UPDATE_PROJECT } from '@/graphql/mutations/projects';
import { useStudioStore } from '@/stores/studio';
import { useMutation } from '@apollo/client/react';
import { useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';

export const useAutoSave = () => {
  const { project, pendingOperations, clearOperations, isSaving } = useStudioStore(
    useShallow((state) => ({
      project: state.project,
      pendingOperations: state.pendingOperations,
      clearOperations: state.clearOperations,
      isSaving: state.isSaving,
    })),
  );
  const set = useStudioStore.setState;

  const [updateProject] = useMutation(UPDATE_PROJECT);
  // const [applyOperations] = useMutation(APPLY_PROJECT_OPERATIONS);

  const timeoutRef = useRef<NodeJS.Timeout>(null);
  const lastSavedOtio = useRef<string>('');

  useEffect(() => {
    if (!project?.id) return;

    // Check for pending operations or timeline changes
    const hasOps = pendingOperations.length > 0;
    const currentTimelineStr = project.timeline ? JSON.stringify(project.timeline) : '';

    // Initial load: don't save immediately
    if (!lastSavedOtio.current && project.timeline) {
      lastSavedOtio.current = currentTimelineStr;
      return;
    }

    // If nothing changed and no ops, skip
    if (!hasOps && currentTimelineStr === lastSavedOtio.current) return;

    // Debounce saving
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    set({ isSaving: true });

    timeoutRef.current = setTimeout(async () => {
      try {
        if (hasOps) {
          // 🚀 discrete operations
          console.log('[AutoSave] Applying operations:', pendingOperations.length);
          // await applyOperations({
          //   variables: {
          //     id: project.id,
          //     operations: pendingOperations,
          //   },
          // });
          clearOperations();
        }

        lastSavedOtio.current = currentTimelineStr;
        console.log('[AutoSave] Saved project:', project.id);
      } catch (err) {
        console.error('[AutoSave] Failed to save project:', err);
      } finally {
        set({ isSaving: false });
      }
    }, 2000); // 2 second debounce

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [
    project?.timeline,
    project?.id,
    pendingOperations.length,
    updateProject,
    // applyOperations,
    clearOperations,
  ]);

  return { isSaving };
};
