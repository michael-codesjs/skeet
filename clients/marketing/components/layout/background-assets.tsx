'use client';

import { motion } from 'framer-motion';

export function BackgroundAssets() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 h-full">
      {/* Scattered 3D Assets - Absolute positioning so they scroll with site */}

      {/* Distributed 3D Assets with depth effects */}

      {/* 1. Cinema Camera - Top Left */}
      <motion.div
        animate={{
          y: [0, -15, 0],
          rotate: [0, 12, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[2%] left-[3%] w-64 h-64 opacity-30"
      >
        <img
          src="/assets/3d/reel.png"
          alt=""
          className="w-full h-full object-contain mix-blend-screen"
        />
      </motion.div>

      {/* 2. Note - Top Left 2 */}
      <motion.div
        animate={{
          y: [0, -30, 0],
          rotate: [0, -12, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[9%] left-[4%] w-64 h-64 opacity-30"
      >
        <img
          src="/assets/3d/scissors.png"
          alt=""
          className="w-full h-full object-contain invert mix-blend-screen"
        />
      </motion.div>

      {/* 3. Reel - Top Right 1 */}
      <motion.div
        animate={{
          y: [0, -30, 0],
          // x: [0, -10, 0],
          rotate: [0, -12, 0],
        }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[1%] right-[5%] w72 h-72 opacity-25"
      >
        <img
          src="/assets/3d/camera.png"
          alt=""
          className="w-full h-full object-contain mix-blend-screen hue-rotate-180"
        />
      </motion.div>

      {/* 4. Scissors - Top Right 2 */}
      <motion.div
        animate={{
          y: [0, -30, 0],
          rotate: [0, 12, 0],
        }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[8%] right-[10%] w-64 h-64 opacity-25"
      >
        <img
          src="/assets/3d/note.png"
          alt=""
          className="w-full h-full object-contain mix-blend-screen"
        />
      </motion.div>

      {/* 5. Transition - Mid Right */}

      <motion.div
        animate={{
          y: [0, -35, 0],
          x: [0, -1, 0],
        }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[16%] right-[3%] w-62 h-62 opacity-25"
      >
        <img
          src="/assets/3d/transition.png"
          alt=""
          className="w-full h-full object-contain mix-blend-screen hue-rotate-180"
        />
      </motion.div>

      {/* 6. Wand - Mid Left */}
      <motion.div
        animate={{
          y: [0, -35, 0],
          x: [0, -1, 0],
        }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[20%] left-[3%] w-62 h-62 opacity-25"
      >
        <img
          src="/assets/3d/wand.png"
          alt=""
          className="w-full h-full object-contain mix-blend-screen hue-rotate-180"
        />
      </motion.div>

      {/* 3. Musical Note - Floating Left */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          x: [0, 15, 0],
          rotate: [10, -10, 10],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[35%] left-[10%] w-40 h-40 opacity-25"
      >
        <img
          src="/assets/3d/note.png"
          alt=""
          className="w-full h-full object-contain mix-blend-screen"
        />
      </motion.div>

      {/* 4. Scissors - Lower Left */}
      <motion.div
        animate={{
          y: [0, 30, 0],
          rotate: [-15, 5, -15],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[58%] left-[5%] w-56 h-56 opacity-30 blur-xs"
      >
        <img
          src="/assets/3d/scissors.png"
          alt=""
          className="w-full h-full object-contain mix-blend-screen invert hue-rotate-180"
        />
      </motion.div>

      {/* 9. Extra Clapboard - Mid Left */}
      <motion.div
        animate={{
          rotate: [-5, 5, -5],
        }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[28%] left-[14%] w-58 h-58 opacity-20"
      >
        <img
          src="/assets/3d/clapboard.png"
          alt=""
          className="w-full h-full object-contain mix-blend-screen"
        />
      </motion.div>

      {/* 5. Clapboard - Bottom Right */}
      <motion.div
        animate={{
          y: [0, -40, 0],
          rotate: [10, -10, 10],
        }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[72%] right-[5%] w-60 h-60 opacity-25"
      >
        <img
          src="/assets/3d/clapboard.png"
          alt=""
          className="w-full h-full object-contain mix-blend-screen"
        />
      </motion.div>

      {/* 6. Another Reel - Deep Background Right */}
      <motion.div
        animate={{
          y: [0, 50, 0],
          rotate: [0, 20, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[45%] right-[15%] w-48 h-48 opacity-15 blur-md grayscale"
      >
        <img
          src="/assets/3d/reel.png"
          alt=""
          className="w-full h-full object-contain mix-blend-screen"
        />
      </motion.div>

      {/* 7. Another Camera - Far Bottom Left */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          rotate: [5, -5, 5],
        }}
        transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[88%] left-[12%] w-52 h-52 opacity-20 blur-sm"
      >
        <img
          src="/assets/3d/camera.png"
          alt=""
          className="w-full h-full object-contain mix-blend-screen"
        />
      </motion.div>

      {/* 10. Extra Scissors - Far Bottom Right */}
      <motion.div
        animate={{
          y: [0, 25, 0],
          rotate: [0, 15, 0],
        }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[92%] right-[8%] w-48 h-48 opacity-15 blur-md"
      >
        <img
          src="/assets/3d/scissors.png"
          alt=""
          className="w-full h-full object-contain mix-blend-screen invert hue-rotate-180"
        />
      </motion.div>
    </div>
  );
}
