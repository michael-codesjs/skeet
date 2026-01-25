'use client';

import { cn } from '@/lib/utils';
import { useStudioStore } from '@/stores/studio';
import { AnimatePresence, motion } from 'framer-motion';
import { CloseCircle, SearchNormal1 } from 'iconsax-react';
import { useEffect, useRef, useState } from 'react';

export function Search() {
  const { searchQuery, setSearchQuery } = useStudioStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Keyboard shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape' && isFocused) {
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocused]);

  return (
    <div className="relative group w-full">
      {/* Search Container */}
      <motion.div
        animate={{
          scale: isFocused ? 1.02 : 1,
          backgroundColor: isFocused ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.04)',
        }}
        className={cn(
          'relative flex items-center w-full rounded-2xl border transition-all duration-300 overflow-hidden',
          isFocused
            ? 'border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.05)]'
            : 'border-white/5 hover:border-white/10',
        )}
      >
        {/* Icon Section */}
        <div className="pl-4 pr-3 flex items-center justify-center text-neutral-500 group-hover:text-neutral-400 transition-colors">
          <SearchNormal1
            size={16}
            color="currentColor"
            variant={isFocused ? 'Bold' : 'Linear'}
            className={cn('transition-all duration-300', isFocused && 'text-white scale-110')}
          />
        </div>

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Scout moments, tags, vibes..."
          className="flex-1 bg-transparent py-3 text-[13px] text-white placeholder:text-neutral-600 focus:outline-none focus:ring-0 w-full"
        />

        {/* Action Section (Clear or Shortcut Hint) */}
        <div className="pr-4 flex items-center">
          <AnimatePresence mode="wait">
            {searchQuery ? (
              <motion.button
                key="clear"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setSearchQuery('')}
                className="text-neutral-600 hover:text-white transition-colors p-1"
              >
                <CloseCircle size={16} color="currentColor" variant="Bulk" />
              </motion.button>
            ) : (
              <motion.div
                key="hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                className={cn(
                  'flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-white/10 bg-white/5 text-[9px] font-mono text-white/50 tracking-tighter transition-opacity',
                  isFocused && 'opacity-0 pointer-events-none',
                )}
              >
                <span className="text-[10px]">/</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Focus Glow Effect */}
      <AnimatePresence>
        {isFocused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute -inset-px rounded-2xl bg-linear-to-r from-white/10 via-white/5 to-white/10 -z-10 blur-[2px]"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
