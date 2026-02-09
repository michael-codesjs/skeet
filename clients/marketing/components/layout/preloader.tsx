'use client';

import { useUIStore } from '@/store/ui';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Preloader() {
  const { assetsLoaded, totalAssets, setReady } = useUIStore();
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (assetsLoaded > 0 && assetsLoaded >= totalAssets) {
      // Keep visible for a moment after loading to feel intentional
      const timer = setTimeout(() => {
        setReady(true);
        setTimeout(() => setShow(false), 800); // Fade out duration
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [assetsLoaded, totalAssets, setReady]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center pointer-events-none"
        >
          {/* Central Logo and Glow */}
          <div className="relative">
            {/* Core Glow effect */}
            <motion.div
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.4, 0.7, 0.4],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute inset-0 -m-8 bg-white/20 blur-[45px] rounded-full"
            />

            {/* Logo Text */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative z-10"
            >
              <h2 className="text-4xl md:text-5xl font-bold tracking-[0.3em] text-white">SKEET</h2>

              {/* Subtle underline decoration */}
              <motion.div
                animate={{ width: [0, 48, 0], opacity: [0, 0.5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="mt-6 h-px bg-white mx-auto overflow-hidden"
              />
            </motion.div>
          </div>

          {/* Deep Ambient Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl aspect-square bg-white/[0.03] rounded-full blur-[140px] pointer-events-none" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
