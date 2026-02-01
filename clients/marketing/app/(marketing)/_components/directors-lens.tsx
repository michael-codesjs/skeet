'use client';

import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import { MouseEvent, useState } from 'react';

const IMG_URL = '/assets/branding/cinematic_hero.png';

export const DirectorsLens = () => {
  const [isHovered, setIsHovered] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const { left, top } = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  };

  const maskImage = useMotionTemplate`radial-gradient(circle 250px at ${mouseX}px ${mouseY}px, black, transparent)`;

  return (
    <section className="relative w-full py-40 bg-black overflow-hidden flex flex-col items-center">
      <div className="mb-20 text-center z-10 px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-block mb-4 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-[10px] font-bold uppercase tracking-[0.2em] text-purple-400 backdrop-blur-md"
        >
          Vision Intelligence v2.1
        </motion.div>
        <h2 className="text-5xl md:text-7xl font-bold mb-8 tracking-tighter">
          The <span className="text-gradient">Director's Eye.</span>
        </h2>
        <p className="text-neutral-400 max-w-2xl mx-auto text-xl font-light leading-relaxed">
          Skeet doesn't just process pixels; it perceives narrative. Our computer vision engine
          identifies emotional weight, spatial depth, and technical fidelity in real-time.
        </p>
      </div>

      <div
        className="relative w-full max-w-7xl aspect-video rounded-[32px] overflow-hidden cursor-none border border-white/10 shadow-[0_0_100px_-20px_rgba(168,85,247,0.15)] group"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Layer 1: The "Raw" Dimmed View */}
        <div className="absolute inset-0 bg-neutral-950">
          <img
            src={IMG_URL}
            alt="Raw Footage"
            className="w-full h-full object-cover opacity-10 grayscale filter blur-md transition-opacity duration-1000"
          />
        </div>

        {/* Layer 2: The "Lens" View (Revealed by Mask) */}
        <motion.div
          className="absolute inset-0 bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.4 }}
          style={{ maskImage, WebkitMaskImage: maskImage }}
        >
          <img
            src={IMG_URL}
            alt="Analyzed Footage"
            className="w-full h-full object-cover brightness-110"
          />

          {/* AI OVERLAYS */}
          <div className="absolute inset-0 p-12">
            {/* Subject Tracking */}
            <div className="absolute top-[22%] left-[45%] w-[18%] h-[55%] border-2 border-white/40 rounded-2xl backdrop-blur-[2px]">
              <div className="absolute -top-12 left-0 flex flex-col gap-1">
                <div className="bg-white text-black text-[10px] font-black px-2 py-0.5 rounded-xs uppercase tracking-tighter">
                  Object: ENTITY_01
                </div>
                <div className="bg-black/80 text-white text-[8px] font-mono px-2 py-0.5 rounded-sm border border-white/10 uppercase">
                  Status: CHARACTER_ARC_PRIMARY
                </div>
              </div>
              {/* Corner accents for the box */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-white" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-white" />
            </div>

            {/* Face Analysis Card */}
            <div className="absolute top-12 left-12 w-64 glass-card p-4 rounded-2xl border-white/10 shadow-2xl">
              <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                  Face Analysis
                </span>
                <span className="text-[10px] text-green-400 font-mono font-bold">ACTIVE</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-neutral-500 uppercase">Emotion</span>
                  <span className="text-white">Melancholy 84%</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: '84%' }}
                    className="h-full bg-blue-500"
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-neutral-500 uppercase">Lighting</span>
                  <span className="text-white">Rembrandt (Key)</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-neutral-500 uppercase">Focus_Dist</span>
                  <span className="text-white">1.8m</span>
                </div>
              </div>
            </div>

            {/* Spatial Depth Card */}
            <div className="absolute bottom-12 right-12 w-64 glass-card p-4 rounded-2xl border-white/10 shadow-2xl">
              <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                  Spatial Depth
                </span>
                <span className="text-[10px] text-purple-400 font-mono font-bold">SCANNING</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-[9px] text-neutral-500 font-mono">
                  FOREGROUND
                  <div className="text-white font-bold text-[10px] mt-1">RECOGNIZED</div>
                </div>
                <div className="text-[9px] text-neutral-500 font-mono text-right">
                  BACKGROUND
                  <div className="text-purple-400 font-bold text-[10px] mt-1 italic">
                    DE-FOCUSED
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5">
                <div className="text-[9px] text-neutral-500 font-mono uppercase mb-2">
                  Compositional Balance
                </div>
                <div className="flex gap-1">
                  {[...Array(10)].map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 h-3 rounded-xs ${i < 7 ? 'bg-purple-500' : 'bg-white/5'}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Technical Overlay Summary */}
            <div className="absolute top-12 right-12 text-right font-mono text-[9px] tracking-widest text-white/50 space-y-1">
              <div>ENCODER: SKEET_NEURAL_v4</div>
              <div>BIT_DEPTH: 12-BIT LINEAR</div>
              <div>SYNC_CLOCK: INTERNAL_GEN</div>
              <div>LATENCY: 1.2ms</div>
            </div>
          </div>

          {/* Grid Overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[40px_40px] pointer-events-none" />
        </motion.div>

        {/* The Actual "Cursor" Visual */}
        <motion.div
          className="absolute pointer-events-none z-50 transition-all duration-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          style={{ x: mouseX, y: mouseY, translateX: '-50%', translateY: '-50%' }}
        >
          <div className="relative w-16 h-16 flex items-center justify-center">
            {/* Minimal Crosshair */}
            <div className="absolute w-px h-3 bg-white/40 top-0" />
            <div className="absolute w-px h-3 bg-white/40 bottom-0" />
            <div className="absolute h-px w-3 bg-white/40 left-0" />
            <div className="absolute h-px w-3 bg-white/40 right-0" />

            <div className="absolute top-10 left-10 whitespace-nowrap bg-white/10 backdrop-blur-md text-white/60 text-[8px] font-bold px-1.5 py-0.5 rounded-xs tracking-widest border border-white/5 uppercase">
              SCANNING
            </div>
          </div>
        </motion.div>

        <div className="absolute bottom-8 left-12 flex items-center gap-4 z-20">
          <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">
              Live Metadata Stream
            </span>
          </div>
          <div className="text-[10px] font-mono text-white/30 uppercase tracking-[0.3em]">
            V.2.4.0 Engine
          </div>
        </div>
      </div>
    </section>
  );
};
