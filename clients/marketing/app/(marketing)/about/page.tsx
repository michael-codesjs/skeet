'use client';

import { Button } from '@/components/ui/button';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'iconsax-react';
import { useRef } from 'react';

export default function AboutPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  return (
    <div
      ref={containerRef}
      className="flex flex-col min-h-screen bg-black overflow-x-hidden selection:bg-white/20 relative"
    >
      {/* Global Timeline Line */}
      <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-white/5 -translate-x-1/2 hidden md:block">
        <motion.div
          style={{ height: lineHeight }}
          className="w-full bg-linear-to-b from-white/50 to-transparent"
        />
      </div>

      <div className="fixed inset-0 -z-20 bg-black" />
      <div className="fixed inset-0 -z-10 bg-grid-pattern opacity-10 pointer-events-none" />

      {/* Hero */}
      <section className="pt-40 pb-32 px-6 max-w-7xl mx-auto flex flex-col items-center text-center z-10 w-full relative">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <span className="text-neutral-500 text-xs font-mono uppercase tracking-[0.4em] border-b border-white/10 pb-2">
            Manifesto
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-6xl md:text-9xl font-bold tracking-tighter mb-12 leading-[0.85]"
        >
          Cut the <br /> <span className="text-neutral-700">noise.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-neutral-400 max-w-lg mx-auto text-lg md:text-xl font-light leading-relaxed"
        >
          We are building the end of manual editing. Not because we hate it, but because we've
          outgrown it.
        </motion.p>
      </section>

      {/* The Problem */}
      <section className="py-32 px-6 relative z-10">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="text-right md:pr-12 space-y-2">
            <h3 className="text-3xl font-bold text-white">2:00 AM</h3>
            <p className="text-neutral-500 font-mono text-sm">THE USUAL TIME</p>
          </div>
          <div className="md:pl-12 border-l border-white/10 pl-6 md:border-none">
            <p className="text-xl md:text-2xl text-neutral-300 font-light leading-relaxed">
              Every creator knows the struggle. The high of capturing the shot is immediately
              followed by the comedown of the timeline. Hours of scrubbing. Tweeaking. Matching.
            </p>
          </div>
        </div>
      </section>

      {/* The Solution */}
      <section className="py-32 px-6 relative z-10 bg-black">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="order-2 md:order-1 md:pr-12 md:text-right border-l border-white/10 pl-6 md:border-none md:border-r">
            <p className="text-xl md:text-2xl text-white font-light leading-relaxed">
              We built Skeet to replace the mouse with the mouth. <br />
              <span className="text-neutral-500">You speak. It cuts. You direct. It executes.</span>
            </p>
          </div>
          <div className="order-1 md:order-2 md:pl-12 space-y-2">
            <h3 className="text-3xl font-bold text-white">Flow State</h3>
            <p className="text-neutral-500 font-mono text-sm">THE OBJECTIVE</p>
          </div>
        </div>
      </section>

      {/* Credits / DNA */}
      <section className="py-40 px-6 relative z-10">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-center text-xs font-mono tracking-[0.3em] text-neutral-500 mb-20 uppercase">
            Production Credits
          </h2>

          <div className="space-y-0 divide-y divide-white/5 border-t border-b border-white/5">
            {[
              { role: 'Executive Producer', name: 'Gemini 3.0 Multimodal' },
              { role: 'Director of Photography', name: 'Skeet Vision Engine' },
              { role: 'Editor', name: 'Autonomous Agent 01' },
              { role: 'Colorist', name: 'Semantic Grading API' },
              { role: 'Sound Design', name: 'Transient Audio Sync' },
            ].map((credit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="py-8 flex justify-between items-center group hover:bg-white/5 transition-colors px-4"
              >
                <span className="text-neutral-500 font-mono text-xs md:text-sm uppercase tracking-widest">
                  {credit.role}
                </span>
                <span className="text-white text-lg md:text-xl font-medium">{credit.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 text-center relative z-10">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-4xl md:text-7xl font-bold mb-10 tracking-tighter">
            Your chair is waiting.
          </h2>
          <div className="flex justify-center gap-4">
            <a href="/sign-up">
              <Button
                size="lg"
                className="rounded-full px-12 h-16 text-lg bg-white text-black hover:bg-neutral-200 transition-all"
              >
                Start Directing <ArrowRight className="ml-2 w-5 h-5" color="black" />
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
