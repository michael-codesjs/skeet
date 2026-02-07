'use client';

import { cn } from '@/lib/utils';
import { useStudioStore } from '@/stores/studio';
import { motion } from 'framer-motion';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'photo', label: 'Photos' },
  { id: 'video', label: 'Videos' },
  { id: 'audio', label: 'Audio' },
  { id: 'effects', label: 'Effects' },
] as const;

export function MediaFilters() {
  const { filterType, setFilterType } = useStudioStore();

  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2 pt-1 px-1">
      {FILTERS.map((filter) => {
        const isActive = filterType === filter.id;
        return (
          <button
            key={filter.id}
            onClick={() => setFilterType(filter.id)}
            className={cn(
              'relative px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 whitespace-nowrap',
              isActive
                ? 'text-black'
                : 'text-white/40 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10',
            )}
          >
            {isActive && (
              <motion.div
                layoutId="activeFilter"
                className="absolute inset-0 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                initial={false}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 text-[11px] tracking-tight">{filter.label}</span>
          </button>
        );
      })}
    </div>
  );
}
