'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowRight, MagicStar, Play } from 'iconsax-react';

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
          className="mt-24 w-full aspect-16/10 glass-card rounded-2xl flex items-center justify-center relative overflow-hidden ring-1 ring-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]"
          style={{ perspective: '1000px' }}
        >
          {/* Studio UI Placeholder */}
          <div className="absolute inset-0 bg-[#0A0A0A] flex items-center justify-center">
            <span className="text-neutral-600 font-mono text-sm">Studio UI Placeholder</span>
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
          <div className="absolute left-1/2 top-8 bottom-8 w-0.5 -translate-x-1/2 bg-linear-to-b from-purple-500/30 via-blue-500/30 to-orange-500/30 hidden md:block" />

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
              <div className="absolute inset-0 bg-purple-500/10 blur-xl rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Content */}
            <div className="relative z-10 bg-black/40 backdrop-blur-sm p-4 rounded-2xl border border-white/0">
              <h3 className="text-3xl font-bold text-white mb-4">The Scout</h3>
              <p className="text-xl text-neutral-400 leading-relaxed font-light max-w-lg mx-auto">
                It starts with raw data. Skeet watches hours of your footage, identifying hero
                shots, filtering out shaky takes, and tagging every moment with semantic context.
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
              <Play size={36} className="text-blue-400" variant="Bold" color="currentColor" />
              <div className="absolute inset-0 bg-blue-500/10 blur-xl rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Content */}
            <div className="relative z-10 bg-black/40 backdrop-blur-sm p-4 rounded-2xl border border-white/0">
              <h3 className="text-3xl font-bold text-white mb-4">The Director</h3>
              <p className="text-xl text-neutral-400 leading-relaxed font-light max-w-lg mx-auto">
                You provide the intent. Describe the "vibe", specify the pacing, or reference a
                style. The Director agent interprets your vision and converts it into editing
                decisions.
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
              <div className="absolute inset-0 bg-orange-500/10 blur-xl rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
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

      {/* Testimonials Section */}
      {/* Testimonials Section */}
      <section className="py-32 border-t border-white/5 bg-[#000000] relative overflow-hidden">
        {/* Floating 3D Assets for this section */}
        <div className="absolute top-32 left-40 w-32 h-32 opacity-80 pointer-events-none animate-float-slow hidden lg:block">
          <img
            src="/assets/3d/quote.png"
            alt=""
            className="w-full h-full object-contain mix-blend-lighten"
          />
        </div>
        <div className="absolute bottom-40 right-10 w-40 h-40 opacity-80 pointer-events-none animate-float hidden lg:block">
          <img
            src="/assets/3d/heart.png"
            alt=""
            className="w-full h-full object-contain mix-blend-lighten"
          />
        </div>
        <div className="absolute top-40 right-[20%] w-32 h-32 opacity-60 pointer-events-none animate-float-delayed hidden lg:block">
          <img
            src="/assets/3d/star.png"
            alt=""
            className="w-full h-full object-contain mix-blend-lighten"
          />
        </div>
        <div className="absolute top-[40%] left-[5%] w-28 h-28 opacity-70 pointer-events-none animate-float-slow hidden lg:block">
          <img
            src="/assets/3d/bolt.png"
            alt=""
            className="w-full h-full object-contain mix-blend-lighten"
          />
        </div>
        <div className="absolute bottom-20 left-[20%] w-36 h-36 opacity-60 pointer-events-none animate-float hidden lg:block">
          <img
            src="/assets/3d/thumb.png"
            alt=""
            className="w-full h-full object-contain mix-blend-lighten"
          />
        </div>
        <div className="absolute top-[55%] right-[5%] w-32 h-32 opacity-70 pointer-events-none animate-float-delayed hidden lg:block">
          <img
            src="/assets/3d/play.png"
            alt=""
            className="w-full h-full object-contain mix-blend-lighten invert"
          />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-24"
          >
            <h2 className="text-4xl md:text-7xl font-bold mb-8 tracking-tighter">
              Loved by <span className="text-gradient">creators.</span>
            </h2>
            <p className="text-neutral-400 text-xl font-light max-w-2xl mx-auto">
              The new standard for modern storytelling. Trusted by the world's most innovative
              teams.
            </p>
          </motion.div>

          {/* Masonry-style Grid - Minimalist / No Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-20">
            {/* Column 1 */}
            <div className="space-y-12 md:space-y-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="group"
              >
                <div className="flex gap-1 mb-6 opacity-50 group-hover:opacity-100 transition-opacity">
                  {[...Array(5)].map((_, i) => (
                    <MagicStar
                      key={i}
                      size={14}
                      variant="Bold"
                      className="text-white"
                      color="currentColor"
                    />
                  ))}
                </div>
                <p className="text-xl md:text-2xl text-neutral-200 mb-8 leading-relaxed font-light">
                  "I haven't touched a timeline in weeks. Skeet just gets the vibe I'm going for
                  instantly. It's like having a pro editor in my pocket."
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full grayscale group-hover:grayscale-0 transition-all duration-500 overflow-hidden bg-neutral-900">
                    <img
                      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces"
                      alt="Sarah"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-bold text-white text-lg">Sarah Jenkins</div>
                    <div className="text-sm text-neutral-500">Travel Vlogger</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="group"
              >
                <p className="text-xl text-neutral-300 mb-6 leading-relaxed font-light">
                  "The audio sync is terrifyingly good. It cuts exactly where I would have cut, but
                  in seconds."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full grayscale group-hover:grayscale-0 transition-all duration-500 overflow-hidden bg-neutral-900">
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces"
                      alt="Marcus"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="font-medium text-white">Marcus Davis</div>
                </div>
              </motion.div>
            </div>

            {/* Column 2 */}
            <div className="space-y-12 md:space-y-20 pt-0 md:pt-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="group"
              >
                <div className="flex gap-1 mb-6 opacity-50 group-hover:opacity-100 transition-opacity">
                  {[...Array(5)].map((_, i) => (
                    <MagicStar
                      key={i}
                      size={14}
                      variant="Bold"
                      className="text-white"
                      color="currentColor"
                    />
                  ))}
                </div>
                <p className="text-xl md:text-2xl text-white font-normal mb-6 leading-relaxed">
                  "It understands pacing better than most human editors I've hired. A total game
                  changer for our daily workflow."
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full grayscale group-hover:grayscale-0 transition-all duration-500 overflow-hidden bg-neutral-900">
                    <img
                      src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=faces"
                      alt="Emily"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-bold text-white text-lg">Emily Chen</div>
                    <div className="text-sm text-neutral-500">Documentary Director</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="group"
              >
                <p className="text-xl text-neutral-300 mb-6 leading-relaxed font-light">
                  "Finally, an AI tool that doesn't feel like a toy. This is actual post-production
                  power."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full grayscale group-hover:grayscale-0 transition-all duration-500 overflow-hidden bg-neutral-900">
                    <img
                      src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces"
                      alt="Alex"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="font-medium text-white">Alex Rivera</div>
                </div>
              </motion.div>
            </div>

            {/* Column 3 */}
            <div className="space-y-12 md:space-y-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="group"
              >
                <div className="mb-6">
                  <div className="text-5xl md:text-6xl font-bold text-white mb-2 tracking-tighter">
                    3x
                  </div>
                  <div className="text-neutral-500 uppercase tracking-widest text-xs font-semibold">
                    Faster Turnaround
                  </div>
                </div>
                <p className="text-xl text-neutral-200 leading-relaxed font-light">
                  "We're shipping 3x more content since adopting Skeet. The 'Refine' step is where
                  the magic happens."
                </p>
                <div className="mt-8 pt-8 border-t border-white/5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full grayscale group-hover:grayscale-0 transition-all duration-500 overflow-hidden bg-neutral-900">
                    <img
                      src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=faces"
                      alt="David"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-bold text-white text-lg">David Park</div>
                    <div className="text-sm text-neutral-500">Creative Lead</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="p-8 rounded-3xl border border-white/5 flex items-center justify-center text-center h-64 bg-neutral-900/20 backdrop-blur-sm"
              >
                <div>
                  <h3 className="text-3xl font-bold text-white mb-2">10k+</h3>
                  <p className="text-neutral-400">Creators building with Skeet</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-900/5 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-8xl font-bold mb-8 tracking-tighter"
          >
            Ready to cut <br />
            <span className="text-neutral-500">the noise?</span>
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <Button
              size="lg"
              className="group h-20 px-12 text-xl rounded-full bg-white text-black hover:bg-neutral-200 hover:scale-105 transition-all duration-300 shadow-[0_0_50px_-10px_rgba(255,255,255,0.3)]"
            >
              Get Early Access
              <ArrowRight
                size={24}
                className="ml-3 group-hover:translate-x-1 transition-transform"
              />
            </Button>
            <p className="mt-8 text-neutral-500 text-sm">
              No credit card required • Limited spots available
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
