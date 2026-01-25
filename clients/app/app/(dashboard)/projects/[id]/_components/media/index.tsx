'use client';

import { useStudioStore } from '@/stores/studio';
import { Clips } from './clips';
import { Search } from './search';

export function Media() {
  const { filteredClips } = useStudioStore();

  return (
    <div className="flex flex-col space-y-4 h-full w-80 border-r border-white/5 overflow-hidden p-5">
      <Search />
      <Clips />
    </div>
  );
}
