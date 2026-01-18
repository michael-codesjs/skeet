'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowRight, AudioSquare, Colorfilter, MagicStar } from 'iconsax-react';

export default function FeaturesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-black overflow-x-hidden selection:bg-white/20">
      {/* Background Ambience - Strict Monochrome */}
      <div className="fixed inset-0 -z-20 bg-black" />
      <div className="fixed inset-0 -z-10 bg-grid-pattern opacity-20 pointer-events-none" />
      {/* Subtle white glow instead of color */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-white/5 blur-[120px] rounded-full -z-10 pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 px-6 max-w-7xl mx-auto flex flex-col items-center text-center z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <span className="text-neutral-400 text-xs font-mono uppercase tracking-[0.3em] border border-white/10 px-6 py-3 rounded-full backdrop-blur-md bg-white/5">
            System Architecture
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-8xl font-bold tracking-tighter mb-10"
        >
          The Engine <span className="text-gradient">Revealed.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl md:text-2xl text-neutral-400 max-w-3xl leading-relaxed font-light"
        >
          Skeet isn't just a wrapper. It's a vertically integrated post-production agent powered by
          Gemini 3.0 multimodal reasoning.
        </motion.p>
      </section>

      {/* Feature 1: The Director Agent */}
      <section className="py-32 px-6 relative border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="mb-8">
              <MagicStar size={40} variant="Bulk" color="white" className="text-white" />
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-8 tracking-tight text-white">
              Multimodal Context Window.
            </h2>
            <p className="text-neutral-400 text-lg leading-relaxed mb-10 font-light">
              Traditional auto-editors cut indiscriminately. Skeet watches the entire footage first.
              It builds a semantic map of tension, humor, and narrative value before making a single
              cut.
            </p>
            <ul className="space-y-6">
              {[
                'Facial micro-expression analysis',
                'Narrative arc detection',
                'B-roll relevance scoring',
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-4 text-neutral-300">
                  <div className="w-px h-6 bg-white/20" />
                  <span className="text-lg">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Visual: Abstract Interface Representation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="aspect-square glass-card rounded-none border border-white/10 relative overflow-hidden flex flex-col p-8"
          >
            {/* Fake Interface Header */}
            <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
              <div className="text-xs font-mono text-neutral-500 tracking-widest">
                ANALYSIS_BUFFER
              </div>
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-white/20" />
                <div className="w-2 h-2 rounded-full bg-white/20" />
              </div>
            </div>

            {/* Scanning Logic Visual */}
            <div className="flex-1 relative">
              <div className="absolute inset-x-0 top-0 h-px bg-white/50 animate-pulse shadow-[0_0_20px_white]" />

              <div className="space-y-4 mt-8 opacity-50">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-white/5 border border-white/10" />
                    <div className="flex-1 space-y-2">
                      <div className="h-2 bg-white/10 w-3/4" />
                      <div className="h-2 bg-white/5 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/5 backdrop-blur-md border border-white/10">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-white">DETECTING_NARRATIVE</span>
                  <span className="text-neutral-500">98% CONFIDENCE</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature 2: Audio Sync */}
      <section className="py-32 px-6 relative border-t border-white/5 bg-white/1">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center lg:flex-row-reverse">
          {/* Visual: Audio Waveform */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="aspect-square glass-card rounded-none border border-white/10 relative overflow-hidden flex flex-col justify-center items-center lg:order-last p-12"
          >
            {/* Dynamic Waveform */}
            <div className="flex gap-1 items-center justify-center h-48 w-full">
              {[...Array(40)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 4 }}
                  animate={{ height: [4, Math.random() * 100 + 10, 4] }}
                  transition={{
                    duration: 1 + Math.random(),
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.05,
                  }}
                  className="w-1.5 bg-white opacity-40 hover:opacity-100 transition-opacity"
                />
              ))}
            </div>

            <div className="absolute bottom-8 text-center">
              <div className="text-xs font-mono text-neutral-500 tracking-[0.2em] uppercase">
                Audio Transient Sync
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="mb-8">
              <AudioSquare size={40} variant="Bulk" color="white" className="text-white" />
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-8 tracking-tight text-white">
              Audio-Reactive Cuts.
            </h2>
            <p className="text-neutral-400 text-lg leading-relaxed mb-10 font-light">
              Bad editing feels disjointed. Skeet aligns visual cuts with audio transients—beats,
              pauses, and dialogue breaks—creating a flow that feels invisible.
            </p>
            <ul className="space-y-6">
              {['Transient detection', 'Silence removal', 'Music beat-matching'].map((item, i) => (
                <li key={i} className="flex items-center gap-4 text-neutral-300">
                  <div className="w-px h-6 bg-white/20" />
                  <span className="text-lg">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Feature 3: Semantic Color */}
      <section className="py-32 px-6 relative border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="mb-8">
              <Colorfilter size={40} variant="Bulk" color="white" className="text-white" />
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-8 tracking-tight text-white">
              Semantic Color Grading.
            </h2>
            <p className="text-neutral-400 text-lg leading-relaxed mb-10 font-light">
              Stop fiddling with curves. Describe the mood ("Golden Hour in Miami", "Cyberpunk
              Noir") and Skeet applies a grade that respects skin tones while selling the vibe.
            </p>
            <ul className="space-y-6">
              {['Natural Language Prompts', 'Skin Tone Protection', 'Multi-Cam Matching'].map(
                (item, i) => (
                  <li key={i} className="flex items-center gap-4 text-neutral-300">
                    <div className="w-px h-6 bg-white/20" />
                    <span className="text-lg">{item}</span>
                  </li>
                ),
              )}
            </ul>
          </motion.div>

          {/* Visual: Color Cards */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="aspect-square glass-card rounded-none border border-white/10 relative overflow-hidden flex items-center justify-center bg-black"
          >
            {/* Monochrome Gradient to signify color without breaking aesthetic too much */}
            <div className="absolute inset-0 bg-white/5" />
            <div className="w-full h-full bg-linear-to-br from-neutral-800 via-black to-neutral-900 opacity-80" />

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 space-y-4">
                <div className="flex gap-4 p-4 glass-card border-white/5 items-center">
                  <div className="w-8 h-8 rounded-full bg-white/10" />
                  <div className="font-mono text-xs text-neutral-400">"Cinematic Noir"</div>
                </div>
                <div className="flex gap-4 p-4 glass-card border-white/5 items-center translate-x-4 border-l-2 border-l-white">
                  <div className="w-8 h-8 rounded-full bg-white/30" />
                  <div className="font-mono text-xs text-white">"Golden Hour"</div>
                </div>
                <div className="flex gap-4 p-4 glass-card border-white/5 items-center">
                  <div className="w-8 h-8 rounded-full bg-white/10" />
                  <div className="font-mono text-xs text-neutral-400">"90s Retro"</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 text-center border-t border-white/5">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-4xl md:text-6xl font-bold mb-8 tracking-tighter">Ready to direct?</h2>
          <div className="flex justify-center gap-4">
            <a href="/sign-up">
              <Button
                size="lg"
                className="rounded-full px-10 h-16 text-lg bg-white text-black hover:bg-neutral-200"
              >
                Get Started <ArrowRight className="ml-2 w-5 h-5" color="black" />
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
