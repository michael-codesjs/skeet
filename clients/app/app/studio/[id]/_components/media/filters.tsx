'use client';

import { cn } from '@/lib/utils';
import { useStudioStore } from '@/stores/studio';
import { motion } from 'framer-motion';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'photo', label: 'Photos' },
  { id: 'video', label: 'Videos' },
  { id: 'audio', label: 'Audio' },
] as const;

export function MediaFilters() {
  const { filterType, setFilterType } = useStudioStore();

  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2">
      {FILTERS.map((filter) => {
        const isActive = filterType === filter.id;
        return (
          <button
            key={filter.id}
            onClick={() => setFilterType(filter.id)}
            className={cn(
              'relative px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap',
              isActive
                ? 'text-black'
                : 'text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10',
            )}
          >
            {isActive && (
              <motion.div
                layoutId="activeFilter"
                className="absolute inset-0 rounded-full bg-white"
                initial={false}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">{filter.label}</span>
          </button>
        );
      })}
    </div>
  );
}
