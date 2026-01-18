'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowRight, Colorfilter, MagicStar, Play } from 'iconsax-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-black overflow-x-hidden selection:bg-white/20">
      {/* Background Ambience */}
      <div className="fixed inset-0 -z-20 bg-black" />
      <div className="fixed inset-0 -z-10 bg-grid-pattern opacity-40 pointer-events-none" />
      <div className="fixed top-[-20%] left-[10%] w-[80%] h-[80%] hero-glow rounded-full opacity-40 mix-blend-screen pointer-events-none animate-float" />

      {/* Additional ambient glow for depth */}
      <div className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

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
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <svg
                viewBox="0 0 100 30"
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
              >
                <defs>
                  <filter id="brush-stroke" x="-50%" y="-50%" width="200%" height="200%">
                    <feTurbulence
                      type="fractalNoise"
                      baseFrequency="0.05 0.5"
                      numOctaves="3"
                      result="noise"
                    />
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
                  </filter>
                </defs>
                <motion.path
                  d="M 95 14 Q 50 12 5 16"
                  fill="transparent"
                  stroke="white"
                  strokeWidth="8"
                  strokeLinecap="round"
                  filter="url(#brush-stroke)"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.4, ease: 'easeOut' }}
                />
              </svg>
            </div>
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
          {/* Screenshot Placeholder */}
          <div className="absolute inset-0 bg-neutral-900/50 flex items-center justify-center">
            <span className="text-neutral-500 font-mono text-sm">App Screenshot Container</span>
          </div>
        </motion.div>
      </section>

      {/* Features Section - Simplified */}
      <section className="px-6 py-32 max-w-7xl mx-auto w-full z-10">
        <div className="mb-32 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-7xl font-bold mb-8 tracking-tighter"
          >
            Direct. <span className="text-gradient">Don't edit.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-neutral-400 max-w-2xl mx-auto font-light"
          >
            Focus on the story. Let Skeet handle the cut, color, and sync.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 1. Multimodal Intelligence */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-8 rounded-4xl border border-white/10 hover:border-purple-500/30 transition-colors duration-300 group"
          >
            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-8 group-hover:bg-purple-500/10 transition-colors">
              <MagicStar
                size={28}
                color="currentColor"
                className="text-purple-400"
                variant="Bulk"
              />
            </div>

            <h3 className="text-2xl font-bold text-white mb-4">Multimodal Intelligence</h3>
            <p className="text-neutral-400 leading-relaxed mb-8 h-24">
              It doesn't just see pixels; it understands humor, tension, and beauty. Skeet watches
              your footage like a human would.
            </p>

            <ul className="space-y-3">
              {['Scene understanding', 'Technical quality scoring', 'Highlight detection'].map(
                (item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-neutral-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500/50" />
                    {item}
                  </li>
                ),
              )}
            </ul>
          </motion.div>

          {/* 2. Audio-Reactive Editing */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="glass-card p-8 rounded-4xl border border-white/10 hover:border-blue-500/30 transition-colors duration-300 group"
          >
            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-8 group-hover:bg-blue-500/10 transition-colors">
              {/* Using Play/Audio related icon */}
              <Play size={28} color="currentColor" className="text-blue-400" variant="Bulk" />
            </div>

            <h3 className="text-2xl font-bold text-white mb-4">Audio-Reactive Sync</h3>
            <p className="text-neutral-400 leading-relaxed mb-8 h-24">
              Analyzes audio transients to perfectly align cuts with the rhythm. It removes silence
              and creates flow automatically.
            </p>

            <ul className="space-y-3">
              {['Transient-aware cutting', 'Automatic silence removal', 'Pacing via prompts'].map(
                (item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-neutral-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
                    {item}
                  </li>
                ),
              )}
            </ul>
          </motion.div>

          {/* 3. Semantic Color Grading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="glass-card p-8 rounded-4xl border border-white/10 hover:border-orange-500/30 transition-colors duration-300 group"
          >
            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-8 group-hover:bg-orange-500/10 transition-colors">
              <Colorfilter
                size={28}
                color="currentColor"
                className="text-orange-400"
                variant="Bulk"
              />
            </div>

            <h3 className="text-2xl font-bold text-white mb-4">Semantic Color</h3>
            <p className="text-neutral-400 leading-relaxed mb-8 h-24">
              Describe the look you want—'Cyberpunk', 'Vintage', 'Gloomy'—and Skeet matches the
              grade instantly.
            </p>

            <ul className="space-y-3">
              {['Natural Language Looks', 'Multi-camera matching', 'Grain & texture emulation'].map(
                (item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-neutral-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500/50" />
                    {item}
                  </li>
                ),
              )}
            </ul>
          </motion.div>
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
          <div className="flex overflow-hidden relative w-full [mask-image:linear-gradient(to_right,transparent,white_10%,white_90%,transparent)] group">
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
    </div>
  );
}
