'use client';

import { useAuthStore } from '@/store/auth';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Command,
  Cpu,
  Flash,
  Grammerly,
  MagicStar,
  Maximize4,
  Music,
  Record,
  VideoSquare,
  VolumeHigh,
} from 'iconsax-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

const VIBES = [
  {
    id: 'cinematic',
    label: 'Cinematic Thriller',
    color: 'from-neutral-200 to-neutral-400',
    icon: <Flash size={14} color="currentColor" />,
  },
  {
    id: 'documentary',
    label: 'Raw Documentary',
    color: 'from-neutral-200 to-neutral-400',
    icon: <Record size={14} color="currentColor" />,
  },
  {
    id: 'commercial',
    label: 'High-Energy Ad',
    color: 'from-neutral-200 to-neutral-400',
    icon: <Maximize4 size={14} color="currentColor" />,
  },
];

const METADATA_NODES = [
  { label: 'Emotion: Melancholic', x: '10%', y: '20%' },
  { label: 'Pacing: 124 BPM', x: '80%', y: '15%' },
  { label: 'Format: 8K RAW', x: '15%', y: '75%' },
  { label: 'Lighting: Golden Hour', x: '75%', y: '80%' },
];

export const HeroFilter = () => {
  const { launchDemo, isLoading, session } = useAuthStore();
  const [activeVibe, setActiveVibe] = useState(VIBES[0]);
  const [isAssembling, setIsAssembling] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isAssembling) {
      const timer = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            clearInterval(timer);
            setTimeout(() => {
              setIsAssembling(false);
              setIsComplete(true);
            }, 600);
            return 100;
          }
          return p + 2;
        });
      }, 50);
      return () => clearInterval(timer);
    }
  }, [isAssembling]);

  const handleAssemble = () => {
    setIsComplete(false);
    setIsAssembling(true);
    setProgress(0);
  };

  return (
    <section className="relative w-full py-40 bg-[#050505] overflow-hidden flex flex-col items-center">
      {/* Background radial atmosphere */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-white/5 rounded-full blur-[150px] transition-colors duration-1000 ${isAssembling ? 'opacity-100' : 'opacity-40'}`}
      />

      <div className="relative z-10 w-full max-w-6xl px-6">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/5 bg-white/2 mb-6"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em]">
              Neural Engine v2.0
            </span>
          </motion.div>
          <h2 className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-6">
            The{' '}
            <span className="text-transparent bg-clip-text bg-linear-to-b from-white to-white/40">
              Editor's Mind.
            </span>
          </h2>
          <p className="text-neutral-500 max-w-xl mx-auto text-lg font-light leading-relaxed">
            Skeet watches your footage, understands the vibe, and handles the cut. You just keep
            filming.
          </p>
        </div>

        {/* The Main Console */}
        <div className="relative aspect-16/10 md:aspect-21/9 w-full rounded-[48px] border border-white/10 bg-black/40 backdrop-blur-3xl overflow-hidden group shadow-2xl">
          {/* Internal Grid Overlay */}
          <div className="absolute inset-0 bg-grid-white/[0.02] mask-[radial-gradient(white,transparent)]" />

          <AnimatePresence mode="wait">
            {!isComplete && !isAssembling && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95, filter: 'blur(20px)' }}
                className="absolute inset-0 flex flex-col items-center justify-center p-12"
              >
                {/* Floating Media Nodes */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {METADATA_NODES.map((node, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="absolute flex items-center gap-3 px-4 py-2 rounded-2xl border border-white/5 bg-white/2 backdrop-blur-md"
                      style={{ left: node.x, top: node.y }}
                    >
                      <div className="w-1 h-1 rounded-full bg-white" />
                      <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
                        {node.label}
                      </span>
                    </motion.div>
                  ))}
                </div>

                <div className="relative z-10 text-center max-w-md">
                  <div className="w-24 h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-8 shadow-inner shadow-white/5">
                    <Cpu size={48} color="currentColor" className="text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">
                    Set Narrative Intent
                  </h3>

                  <div className="flex flex-wrap justify-center gap-3 mb-10">
                    {VIBES.map((vibe) => (
                      <button
                        key={vibe.id}
                        onClick={() => setActiveVibe(vibe)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 ${activeVibe.id === vibe.id ? 'bg-white text-black border-white' : 'bg-white/5 text-white/50 border-white/5 hover:border-white/20'}`}
                      >
                        {vibe.icon}
                        <span className="text-xs font-bold uppercase tracking-tight">
                          {vibe.label}
                        </span>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleAssemble}
                    className="group relative px-10 py-5 bg-white text-black rounded-2xl font-bold shadow-2xl transition-all hover:scale-105 active:scale-95 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-black/5 -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
                    <span className="flex items-center gap-3">
                      <MagicStar size={20} variant="Bold" color="currentColor" />
                      Assemble Master Cut
                    </span>
                  </button>
                </div>
              </motion.div>
            )}

            {isAssembling && (
              <motion.div
                key="assembling"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xl"
              >
                <div className="relative w-64 h-64 flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0 rounded-full border border-dashed border-white/20"
                  />
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-4 rounded-full border border-dashed border-white/10"
                  />
                  <div className="text-center relative z-10">
                    <div className="text-5xl font-mono font-bold text-white mb-2">{progress}%</div>
                    <div className="text-[10px] font-mono text-white/50 uppercase tracking-[0.3em] animate-pulse">
                      Syncing Narrative
                    </div>
                  </div>
                </div>

                <div className="mt-12 w-full max-w-xs space-y-4">
                  <div className="flex justify-between text-[9px] font-mono text-neutral-500 uppercase tracking-widest">
                    <span>Luma Analysis</span>
                    <span>{progress > 40 ? 'Done' : 'Processing'}</span>
                  </div>
                  <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className="h-full bg-white"
                    />
                  </div>
                  <div className="flex justify-between text-[9px] font-mono text-neutral-500 uppercase tracking-widest">
                    <span>Audio Stem Alignment</span>
                    <span>{progress > 70 ? 'Done' : 'Processing'}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {isComplete && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0"
              >
                {/* Visual Assembly Preview */}
                <div className="relative w-full h-full p-8 md:p-12 flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div
                        className={`px-4 py-1.5 rounded-lg bg-linear-to-r ${activeVibe.color} text-white text-[10px] font-bold uppercase tracking-widest`}
                      >
                        {activeVibe.label}
                      </div>
                      <div className="h-px w-12 bg-white/10" />
                      <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
                        Master Sequence Ready
                      </span>
                    </div>
                    <button
                      onClick={() => setIsComplete(false)}
                      className="text-[10px] font-bold text-neutral-500 hover:text-white uppercase tracking-widest transition-colors"
                    >
                      Re-Edit
                    </button>
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-8">
                    {/* Big Preview */}
                    <div className="md:col-span-8 relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl group/preview">
                      <Image
                        src="/assets/hero/landscape.png"
                        alt="Cinematic Master Cut"
                        fill
                        className="object-cover transition-transform duration-[20s] linear group-hover/preview:scale-125"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent opacity-60" />

                      {/* Playback Controls Overlay */}
                      <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-full bg-white text-black">
                            <Record size={18} variant="Bold" color="currentColor" />
                          </div>
                          <div>
                            <div className="text-[11px] font-bold text-white tracking-tight">
                              Sequence Alpha
                            </div>
                            <div className="text-[9px] text-white/50 font-mono">00:14 / 00:48</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <div className="p-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/10">
                            <VolumeHigh size={16} color="currentColor" className="text-white" />
                          </div>
                          <div className="p-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/10">
                            <Maximize4 size={16} color="currentColor" className="text-white" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Analysis Column */}
                    <div className="md:col-span-4 space-y-4">
                      <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
                        <div className="text-[10px] text-white font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                          <Flash size={14} variant="Bold" color="currentColor" /> AI Decisions
                        </div>
                        <div className="space-y-4">
                          {[
                            {
                              icon: <VideoSquare size={14} color="currentColor" />,
                              label: 'Visual Pacing',
                              value: 'Dynamic',
                            },
                            {
                              icon: <Music size={14} color="currentColor" />,
                              label: 'Sound Grade',
                              value: 'Submerged',
                            },
                            {
                              icon: <Grammerly size={14} color="currentColor" />,
                              label: 'Vibe Match',
                              value: '98.4%',
                            },
                          ].map((stat, i) => (
                            <div key={i} className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-neutral-400">
                                {stat.icon}
                                <span className="text-[10px] uppercase font-medium">
                                  {stat.label}
                                </span>
                              </div>
                              <span className="text-[10px] font-bold text-white">{stat.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-6 rounded-3xl bg-white/2 border border-dashed border-white/10">
                        <div className="text-[9px] text-neutral-500 uppercase tracking-widest mb-3">
                          Narrative Output
                        </div>
                        <p className="text-[11px] text-neutral-400 leading-relaxed italic">
                          "Sequence optimized for high emotional impact. Color grade shifted toward
                          cool shadows to emphasize isolation."
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer info for the console */}
        <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-6 px-4">
          <div className="flex items-center gap-8">
            <div className="flex flex-col">
              <span className="text-[9px] text-neutral-600 uppercase font-bold tracking-[0.2em] mb-1">
                Compute Cost
              </span>
              <span className="text-xs font-mono text-neutral-400">0.04s / frame</span>
            </div>
            <div className="h-8 w-px bg-white/5" />
            <div className="flex flex-col">
              <span className="text-[9px] text-neutral-600 uppercase font-bold tracking-[0.2em] mb-1">
                Model Arch
              </span>
              <span className="text-xs font-mono text-neutral-400">Skeet-AudioVisual-L</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-medium">
              Ready to take control?
            </span>
            <button
              onClick={launchDemo}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-3 rounded-full border border-white/10 hover:bg-white hover:text-black transition-all group disabled:opacity-50"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest">
                {isLoading ? 'Loading...' : session ? 'Open App' : 'Launch Demo'}
              </span>
              <Command size={14} color="currentColor" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
