'use client';

import { useUIStore } from '@/store/ui';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Preloader() {
  const { assetsLoaded, totalAssets, isReady, setReady } = useUIStore();
  const [show, setShow] = useState(true);

  const progress = totalAssets > 0 ? (assetsLoaded / totalAssets) * 100 : 0;

  useEffect(() => {
    if (assetsLoaded > 0 && assetsLoaded >= totalAssets) {
      // Small delay for the "complete" feeling
      const timer = setTimeout(() => {
        setReady(true);
        setTimeout(() => setShow(false), 1000); // Fade out duration
      }, 500);
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
          className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center p-6"
        >
          <div className="w-full max-w-md space-y-8">
            {/* Logo or Brand Name */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h2 className="text-4xl font-bold tracking-tighter text-white mb-2">SKEET</h2>
              <p className="text-neutral-500 text-sm tracking-widest uppercase">
                Logic Meets Feeling
              </p>
            </motion.div>

            {/* Progress Container */}
            <div className="space-y-4">
              <div className="h-px w-full bg-white/10 relative overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="absolute top-0 left-0 h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                />
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
                <span>Initializing Engine</span>
                <span className="text-white">{Math.round(progress)}%</span>
              </div>
            </div>
          </div>

          {/* Background Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-[100px] pointer-events-none" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
