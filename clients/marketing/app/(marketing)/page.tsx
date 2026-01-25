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

      {/* How it Works Section */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tighter">
              A collaborative <span className="text-gradient">creative engine.</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-linear-to-r from-transparent via-white/10 to-transparent z-0" />

            {[
              {
                step: '01',
                title: 'Connect',
                desc: 'Ingest any format instantly.',
              },
              {
                step: '02',
                title: 'Direct',
                desc: 'Tell Skeet what you want.',
              },
              {
                step: '03',
                title: 'Refine',
                desc: 'Perfect the cut in real-time.',
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative z-10 flex flex-col items-center text-center group"
              >
                <div className="w-24 h-24 rounded-full bg-black border border-white/10 flex items-center justify-center text-2xl font-bold font-mono text-white/30 group-hover:text-white group-hover:border-white/30 group-hover:bg-white/5 transition-all duration-300 mb-8 shadow-[0_0_30px_-10px_rgba(255,255,255,0.1)]">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-white mb-4">{item.title}</h3>
                <p className="text-neutral-400 font-light leading-relaxed max-w-xs mx-auto">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      {/* Testimonials Section */}
      <section className="py-32 border-t border-white/5 bg-neutral-900/30 relative overflow-hidden">
        {/* Ambient background for section */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tighter">
              Loved by <span className="text-gradient">creators.</span>
            </h2>
            <p className="text-neutral-400 text-lg">The new standard for modern storytelling.</p>
          </motion.div>

          {/* Marquee Container */}
          <div className="flex overflow-hidden relative w-full mask-[linear-gradient(to_right,transparent,white_10%,white_90%,transparent)] group">
            {/* Inner Moving Track - Duplicated functionality for seamless loop */}
            <div className="flex gap-6 w-max animate-infinite-scroll group-hover:[animation-play-state:paused] px-3">
              {[...Array(4)].map((_, loopIndex) => (
                <div key={loopIndex} className="flex gap-6">
                  {[
                    {
                      quote:
                        "I haven't touched a timeline in weeks. Skeet just gets the vibe I'm going for instantly.",
                      author: 'Sarah Jenkins',
                      role: 'Travel Vlogger',
                      image:
                        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces',
                    },
                    {
                      quote:
                        'The audio sync is terrifyingly good. It cuts exactly where I would have cut, but in seconds.',
                      author: 'Marcus Davis',
                      role: 'Indie Filmmaker',
                      image:
                        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces',
                    },
                    {
                      quote:
                        "Finally, an AI tool that doesn't feel like a toy. This is actual post-production power.",
                      author: 'Alex Rivera',
                      role: 'Content Creator',
                      image:
                        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces',
                    },
                    {
                      quote:
                        "It understands pacing better than most human editors I've hired. A total game changer.",
                      author: 'Emily Chen',
                      role: 'Documentary Director',
                      image:
                        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=faces',
                    },
                  ].map((testimonial, i) => (
                    <div
                      key={`${loopIndex}-${i}`}
                      className="glass-card p-6 rounded-3xl border border-white/10 bg-white/2 hover:bg-white/4 transition-all duration-300 group/card min-w-[320px] max-w-[320px] flex flex-col justify-between"
                    >
                      <div>
                        {/* 5 Stars */}
                        <div className="flex gap-1 mb-6">
                          {[...Array(5)].map((_, s) => (
                            <MagicStar
                              key={s}
                              size={14}
                              variant="Bold"
                              className="text-yellow-500"
                              color="currentColor"
                            />
                          ))}
                        </div>

                        <p className="text-base text-neutral-200 mb-8 leading-relaxed font-light">
                          "{testimonial.quote}"
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/10">
                          <img
                            src={testimonial.image}
                            alt={testimonial.author}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">{testimonial.author}</div>
                          <div className="text-xs text-neutral-500">{testimonial.role}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
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
