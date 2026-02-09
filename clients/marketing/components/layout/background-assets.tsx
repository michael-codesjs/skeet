'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

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
        <Image src="/assets/3d/reel.png" alt="" fill className="object-contain mix-blend-screen" />
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
        <Image
          src="/assets/3d/scissors.png"
          alt=""
          fill
          className="object-contain invert mix-blend-screen"
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
        className="absolute top-[1%] right-[5%] w-72 h-72 opacity-25"
      >
        <Image
          src="/assets/3d/camera.png"
          alt=""
          fill
          className="object-contain mix-blend-screen"
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
        <Image src="/assets/3d/note.png" alt="" fill className="object-contain mix-blend-screen" />
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
        <Image
          src="/assets/3d/transition.png"
          alt=""
          fill
          className="object-contain mix-blend-screen hue-rotate-180"
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
        <Image
          src="/assets/3d/wand.png"
          alt=""
          fill
          className="object-contain mix-blend-screen hue-rotate-180"
        />
      </motion.div>

      {/* 7. Extra Clapboard - Mid Left */}
      <motion.div
        animate={{
          rotate: [-5, 5, -5],
        }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[31%] left-[14%] w-64 h-64 opacity-20"
      >
        <Image src="/assets/3d/scout.png" alt="" fill className="object-contain mix-blend-screen" />
      </motion.div>

      {/* 8. Clapboard - Floating Left */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          x: [0, -15, 0],
          rotate: [0, 12, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[36%] right-[10%] w-62 h-62 opacity-25"
      >
        <Image
          src="/assets/3d/clapboard.png"
          alt=""
          fill
          className="object-contain mix-blend-screen"
        />
      </motion.div>

      {/* 9. Director - Floating Left */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          x: [0, 15, 0],
          rotate: [10, -10, 10],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[40%] left-[10%] w-62 h-62 opacity-25"
      >
        <Image
          src="/assets/3d/director.png"
          alt=""
          fill
          className="object-contain mix-blend-screen"
        />
      </motion.div>

      {/* 10. Assembly - Floating Left */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          x: [0, 15, 0],
          rotate: [10, 20, 10],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[46%] right-[10%] w-62 h-62 opacity-25"
      >
        <Image
          src="/assets/3d/assembly.png"
          alt=""
          fill
          className="object-contain mix-blend-screen"
        />
      </motion.div>

      {/* 11. Assembly Alt - Floating Left */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          x: [0, 15, 0],
          rotate: [10, 20, 10],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[50%] left-[10%] w-62 h-62 opacity-25"
      >
        <Image
          src="/assets/3d/assembly_alt.png"
          alt=""
          fill
          className="object-contain mix-blend-screen"
        />
      </motion.div>

      {/* 12. Another Camera - Far Bottom Left */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          rotate: [5, -5, 5],
        }}
        transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[88%] left-[12%] w-52 h-52 opacity-20 blur-sm"
      >
        <Image
          src="/assets/3d/camera.png"
          alt=""
          fill
          className="object-contain mix-blend-screen"
        />
      </motion.div>

      {/* 13. Extra Scissors - Far Bottom Right */}
      <motion.div
        animate={{
          y: [0, 25, 0],
          rotate: [0, 15, 0],
        }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[92%] right-[8%] w-48 h-48 opacity-15 blur-md"
      >
        <Image
          src="/assets/3d/scissors.png"
          alt=""
          fill
          className="object-contain mix-blend-screen invert hue-rotate-180"
        />
      </motion.div>
    </div>
  );
}
