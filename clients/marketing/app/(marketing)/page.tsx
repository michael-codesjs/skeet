'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowRight, MagicStar, Play } from 'iconsax-react';
import Image from 'next/image';
import { HeroFilter } from './_components/hero-filter';

import { useAuthStore } from '@/store/auth';
import { useEffect } from 'react';

export default function Home() {
  const { session, fetchSession } = useAuthStore();

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return (
    <div className="flex flex-col min-h-screen bg-black overflow-x-hidden selection:bg-white/20">
      {/* Background Ambience */}
      <div className="fixed inset-0 -z-20 bg-black" />
      <div className="fixed inset-0 -z-10 bg-grid-pattern opacity-40 pointer-events-none" />
      <div className="fixed top-[-20%] left-[10%] w-[80%] h-[80%] hero-glow rounded-full opacity-40 mix-blend-screen pointer-events-none animate-float" />

      {/* Additional ambient glow for depth */}

      {/* Hero Section */}
      <section className="relative px-6 pt-12 pb-20 flex flex-col items-center text-center max-w-7xl mx-auto z-10">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-8 leading-[0.9]"
        >
          Post-production
          <br />
          minus the{' '}
          <span className="relative inline-block">
            <span className="text-gradient drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
              timeline.
            </span>
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xl md:text-2xl text-neutral-400 max-w-2xl mb-14 leading-relaxed font-light"
        >
          Skeet watches your footage, understands the vibe, and handles the cut. You just keep
          filming.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-6"
        >
          {session ? (
            <a href={process.env.NEXT_PUBLIC_APP_CLIENT_URL || '/'}>
              <Button
                size="lg"
                className="group h-16 px-10 text-lg rounded-full hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all duration-300"
              >
                Launch Skeet
                <ArrowRight
                  size={20}
                  color="currentColor"
                  className="ml-2 group-hover:translate-x-1 transition-transform"
                />
              </Button>
            </a>
          ) : (
            <Button
              size="lg"
              className="group h-16 px-10 text-lg rounded-full hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all duration-300"
            >
              Get Early Access
              <ArrowRight
                size={20}
                color="currentColor"
                className="ml-2 group-hover:translate-x-1 transition-transform"
              />
            </Button>
          )}

          <Button
            variant="outline"
            size="lg"
            className="h-16 px-10 text-lg rounded-full border-white/20 hover:bg-white/5 hover:border-white/40 active:scale-95 transition-all"
          >
            <Play size={20} color="currentColor" className="mr-2" variant="Bold" />
            Watch the Demo
          </Button>
        </motion.div>

        {/* Dynamic Interface Visualization */}
        <motion.div
          initial={{ opacity: 0, y: 40, rotateX: 10 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 1, delay: 0.5, type: 'spring', stiffness: 40 }}
          className="mt-24 w-full aspect-3024/1646 glass-card rounded-2xl flex items-center justify-center relative overflow-hidden ring-1 ring-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] group"
          style={{ perspective: '1000px' }}
        >
          {/* Studio UI Visualization */}
          <div className="relative w-full h-full">
            <Image
              src="/assets/studio/studio.png"
              alt="Skeet Studio Interface"
              fill
              className="object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-700"
              priority
            />
          </div>
        </motion.div>
      </section>

      {/* Manifesto Section - derived from branding.md */}
      <section className="relative px-6 py-32 max-w-7xl mx-auto w-full z-10">
        <div className="mb-24 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block mb-6 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-sm font-medium text-neutral-300 backdrop-blur-md"
          >
            Zero-Timeline Editing
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-7xl font-bold mb-8 tracking-tighter"
          >
            Stop <span className="text-neutral-600 line-through decoration-red-500">Editing.</span>{' '}
            <br />
            Start <span className="text-gradient">Directing.</span>
          </motion.h2>
        </div>

        <div className="relative max-w-3xl mx-auto mt-20 space-y-32">
          {/* Central Vertical Track connecting the story */}
          <div className="absolute left-1/2 top-8 bottom-8 w-0.5 -translate-x-1/2 bg-white/10 hidden md:block" />

          {/* 1. The Scout */}
          {/* 1. The Scout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative flex flex-col items-center text-center group"
          >
            {/* Icon Marker */}
            <div className="shrink-0 relative z-10 w-24 h-24 rounded-3xl bg-[#0A0A0A] border border-white/10 flex items-center justify-center shadow-[0_0_50px_-10px_rgba(168,85,247,0.25)] group-hover:scale-110 transition-transform duration-500 mb-8">
              <MagicStar
                size={36}
                className="text-purple-400"
                variant="Bold"
                color="currentColor"
              />
              <div className="absolute inset-0 bg-white/5 blur-xl rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Content */}
            <div className="relative z-10 bg-black/40 backdrop-blur-sm p-4 rounded-2xl border border-white/0">
              <h3 className="text-3xl font-bold text-white mb-4">The Scout</h3>
              <p className="text-xl text-neutral-400 leading-relaxed font-light max-w-lg mx-auto">
                The Scout identifies hero shots, tags context, and organizes your library
                semantically, making every moment instantly searchable.
              </p>
            </div>
          </motion.div>

          {/* 2. The Director */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="relative flex flex-col items-center text-center group"
          >
            {/* Icon Marker */}
            <div className="shrink-0 relative z-10 w-24 h-24 rounded-3xl bg-[#0A0A0A] border border-white/10 flex items-center justify-center shadow-[0_0_50px_-10px_rgba(59,130,246,0.25)] group-hover:scale-110 transition-transform duration-500 mb-8">
              <Play size={36} className="text-white" variant="Bold" color="currentColor" />
              <div className="absolute inset-0 bg-white/5 blur-xl rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Content */}
            <div className="relative z-10 bg-black/40 backdrop-blur-sm p-4 rounded-2xl border border-white/0">
              <h3 className="text-3xl font-bold text-white mb-4">The Assistant</h3>
              <p className="text-xl text-neutral-400 leading-relaxed font-light max-w-lg mx-auto">
                Your creative partner. Describe your vision or specify the pacing; the Assistant
                orchestrates your clips into a cohesive sequence on the timeline.
              </p>
            </div>
          </motion.div>

          {/* 3. The Assembly */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="relative flex flex-col items-center text-center group"
          >
            {/* Icon Marker */}
            <div className="shrink-0 relative z-10 w-24 h-24 rounded-3xl bg-[#0A0A0A] border border-white/10 flex items-center justify-center shadow-[0_0_50px_-10px_rgba(249,115,22,0.25)] group-hover:scale-110 transition-transform duration-500 mb-8">
              <ArrowRight
                size={36}
                className="text-orange-400"
                variant="Bold"
                color="currentColor"
              />
              <div className="absolute inset-0 bg-white/5 blur-xl rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Content */}
            <div className="relative z-10 bg-black/40 backdrop-blur-sm p-4 rounded-2xl border border-white/0">
              <h3 className="text-3xl font-bold text-white mb-4">The Assembly</h3>
              <p className="text-xl text-neutral-400 leading-relaxed font-light max-w-lg mx-auto">
                The final cut is rendered instantly. Every beat is synced, every color is graded to
                your prompt, and the sequence is exported, ready for the world.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <HeroFilter />
    </div>
  );
}
