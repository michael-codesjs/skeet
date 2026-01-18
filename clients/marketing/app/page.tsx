'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowRight, Colorfilter, MagicStar, Play, Scissor, Setting4 } from 'iconsax-react';

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
          <span className="text-neutral-600 font-medium">minus the</span>{' '}
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
          className="mt-24 w-full aspect-[16/10] glass-card rounded-2xl flex items-center justify-center relative overflow-hidden ring-1 ring-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]"
          style={{ perspective: '1000px' }}
        >
          {/* Screenshot Placeholder */}
          <div className="absolute inset-0 bg-neutral-900/50 flex items-center justify-center">
            <span className="text-neutral-500 font-mono text-sm">App Screenshot Container</span>
          </div>
        </motion.div>
      </section>

      {/* Team Section - Direct Reports */}
      <section className="px-6 py-32 max-w-7xl mx-auto w-full z-10">
        <div className="mb-32 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-7xl font-bold mb-8 tracking-tighter"
          >
            Meet the <span className="text-gradient">Crew.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-neutral-400 max-w-2xl mx-auto font-light"
          >
            You’re the Director. Skeet is everyone else.
          </motion.p>
        </div>

        <div className="space-y-32">
          {/* 1. The Director Agent */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center group">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <div className="glass-card aspect-square rounded-[3rem] overflow-hidden relative border border-white/10 flex items-center justify-center group-hover:border-purple-500/30 transition-colors duration-500">
                {/* Radar Background */}
                <div className="absolute inset-0 bg-radial-gradient from-purple-500/10 to-transparent opacity-50" />
                <div className="absolute inset-0 bg-grid-pattern opacity-30" />

                {/* Scanning Line */}
                <motion.div
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  className="absolute left-0 right-0 h-[2px] bg-linear-to-r from-transparent via-purple-500/50 to-transparent z-10 blur-sm"
                />

                {/* Abstract Eye/Lens */}
                <div className="relative w-64 h-64 flex items-center justify-center">
                  {/* Outer Ring - Spinning */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0 rounded-full border border-white/10 border-dashed"
                  />
                  {/* Inner Ring - Spinning Reverse */}
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-4 rounded-full border border-white/10 border-dotted"
                  />

                  {/* Core */}
                  <motion.div
                    animate={{ scale: [1, 0.95, 1] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-32 h-32 rounded-full border border-white/20 flex items-center justify-center bg-white/5 backdrop-blur-sm z-20 shadow-[0_0_30px_rgba(168,85,247,0.2)]"
                  >
                    <MagicStar
                      size={48}
                      color="currentColor"
                      className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]"
                      variant="Bulk"
                    />
                  </motion.div>

                  {/* Pulsing Glow */}
                  <motion.div
                    animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.2, 1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute inset-0 bg-purple-500/20 rounded-full blur-3xl -z-10"
                  />
                </div>

                {/* Dynamic Status Bar */}
                <div className="absolute bottom-8 left-8 right-8 bg-black/80 backdrop-blur-md rounded-xl p-4 border border-white/10 flex items-center gap-4 shadow-lg">
                  <motion.div
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-green-500"
                  />
                  <div className="flex-1 overflow-hidden relative h-8 flex items-center">
                    {/* Simulated Text Scroller */}
                    <motion.div
                      animate={{ y: [0, -32, -64, -96, 0] }}
                      transition={{ duration: 8, repeat: Infinity, ease: [0, 1, 0, 1] }} // Step-like jump
                    >
                      {[
                        'ANALYZING_SCENE',
                        'DETECTING_FACES',
                        'CHECKING_FOCUS',
                        'GRADING_COLORS',
                        'ANALYZING_SCENE', // Loop back
                      ].map((text, i) => (
                        <div key={i} className="h-8 flex items-center">
                          <span className="text-xs font-mono text-neutral-400 tracking-widest">
                            {text}
                          </span>
                        </div>
                      ))}
                    </motion.div>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ height: ['4px', '12px', '4px'] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                        className="w-1 bg-white/20 rounded-full"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                <Setting4 size={16} color="currentColor" className="text-purple-400" />
                <span className="text-xs font-medium text-purple-200 tracking-wide uppercase">
                  Chief of Staff
                </span>
              </div>
              <h3 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                The Director Agent.
              </h3>
              <p className="text-lg text-neutral-400 leading-relaxed mb-8">
                Powered by Gemini 3. It doesn't just see pixels; it understands humor, tension, and
                beauty. It watches your footage like a human would, tagging hero shots and
                discarding the junk.
              </p>
              <ul className="space-y-4">
                {[
                  "Recognizes 'Golden Hour' lighting",
                  'Identifies genuine smiles vs. forced ones',
                  'Filters out shaky or accidental floor shots',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-4 text-neutral-300">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* 2. The Rhythm Editor */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center group">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                <Scissor size={16} color="currentColor" className="text-blue-400" />
                <span className="text-xs font-medium text-blue-200 tracking-wide uppercase">
                  Lead Editor
                </span>
              </div>
              <h3 className="text-4xl md:text-5xl font-bold mb-6 text-white">The Rhythm Editor.</h3>
              <p className="text-lg text-neutral-400 leading-relaxed mb-8">
                No more manual beat-matching. Skeet analyzes audio transients and connects visuals
                to the pulse of your soundtrack. It knows when to hold a shot and when to cut fast.
              </p>
              <ul className="space-y-4">
                {[
                  'Transient-aware cutting engine',
                  'Automatic silence removal',
                  "Pacing directed by prompts (e.g. 'Slow', 'Frantic')",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-4 text-neutral-300">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="glass-card aspect-square rounded-[3rem] overflow-hidden relative border border-white/10 flex items-center justify-center">
                <div className="absolute inset-0 bg-radial-gradient from-blue-500/10 to-transparent opacity-50" />

                {/* Waveform Viz */}
                <div className="flex items-center gap-2 h-32 w-full px-12 justify-center">
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-3 rounded-full bg-white"
                      initial={{ height: '20%' }}
                      animate={{ height: ['20%', '80%', '20%'] }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: i * 0.05,
                      }}
                      style={{ opacity: i % 2 === 0 ? 0.8 : 0.4 }}
                    />
                  ))}
                </div>

                <div className="absolute bottom-12 w-full text-center">
                  <span className="text-xs font-mono text-blue-300/50 tracking-[0.2em] uppercase">
                    Audio_Sync_Locked
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* 3. The Colorist */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center group">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <div className="glass-card aspect-square rounded-[3rem] overflow-hidden relative border border-white/10 flex items-center justify-center group-hover:border-orange-500/30 transition-colors duration-500">
                {/* Dynamic Background Gradient */}
                <div className="absolute inset-0 bg-linear-to-br from-orange-900/20 via-neutral-900 to-blue-900/20" />

                <div className="relative w-full h-full">
                  {/* Floating Palette 1 (Top Right - Warm) */}
                  <motion.div
                    animate={{ y: [0, -15, 0], rotate: [0, 3, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute top-[22%] right-[15%] w-28 h-28 rounded-3xl bg-[#7C3A2B] border border-white/5 shadow-2xl z-10 backdrop-blur-sm"
                  />

                  {/* Floating Palette 2 (Bottom Left - Cool) */}
                  <motion.div
                    animate={{ y: [0, 15, 0], rotate: [0, -3, 0] }}
                    transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                    className="absolute bottom-[22%] left-[15%] w-32 h-32 rounded-3xl bg-[#3B3B6D] border border-white/5 shadow-2xl z-10 backdrop-blur-sm"
                  />

                  {/* Center Lens Assembly */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                    {/* Thin Ring */}
                    <div className="w-48 h-48 rounded-full border border-white/10 absolute" />

                    {/* Center Group */}
                    <div className="relative">
                      {/* Main Dot */}
                      <motion.div
                        animate={{
                          scale: [1, 1.05, 1],
                          filter: ['blur(0px)', 'blur(1px)', 'blur(0px)'],
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                        className="w-10 h-10 rounded-full bg-white relative z-20 shadow-[0_0_30px_rgba(255,255,255,0.4)]"
                      />
                      {/* Offset Ghost Dots */}
                      <motion.div
                        animate={{ x: [0, 5, 0], opacity: [0.3, 0.5, 0.3] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        className="w-10 h-10 rounded-full bg-white/30 absolute top-2 -left-3 z-10 blur-sm mix-blend-overlay"
                      />
                      <motion.div
                        animate={{ x: [0, -5, 0], opacity: [0.3, 0.5, 0.3] }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: 'easeInOut',
                          delay: 1.5,
                        }}
                        className="w-10 h-10 rounded-full bg-white/30 absolute top-2 -right-3 z-10 blur-sm mix-blend-overlay"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                <Colorfilter size={16} color="currentColor" className="text-orange-400" />
                <span className="text-xs font-medium text-orange-200 tracking-wide uppercase">
                  Senior Colorist
                </span>
              </div>
              <h3 className="text-4xl md:text-5xl font-bold mb-6 text-white">The Vibe Colorist.</h3>
              <p className="text-lg text-neutral-400 leading-relaxed mb-8">
                Describe the look you want. ""Cinematic"", ""Vintage 90s"", or ""Cyberpunk"". Skeet
                applies consistent, high-quality LUTs across all your clips, automatically matching
                color spaces between different cameras.
              </p>
              <ul className="space-y-4">
                {[
                  "Natural Language Looks (e.g. 'Make it gloomy')",
                  'Multi-camera color matching',
                  'Film grain & texture emulation',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-4 text-neutral-300">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-32 border-t border-white/5 bg-neutral-900/30">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-12 tracking-tighter">
              What creators say
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote:
                  "I haven't touched a timeline in weeks. Skeet just gets the vibe I'm going for instantly.",
                author: 'Sarah J.',
                role: 'Travel Vlogger',
              },
              {
                quote:
                  'The audio sync is terrifyingly good. It cuts exactly where I would have cut manually.',
                author: 'Marcus D.',
                role: 'Indie Filmmaker',
              },
              {
                quote:
                  "Finally, an AI tool that doesn't feel like a toy. This is actual post-production power.",
                author: 'Alex R.',
                role: 'Content Creator',
              },
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-8 rounded-2xl border border-white/5 bg-black/40"
              >
                <div className="mb-6 text-neutral-500">
                  <span className="text-4xl font-serif">"</span>
                </div>
                <p className="text-lg text-neutral-300 mb-6 leading-relaxed">{testimonial.quote}</p>
                <div>
                  <div className="font-bold text-white">{testimonial.author}</div>
                  <div className="text-sm text-neutral-500">{testimonial.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Built By Section */}
      <section className="py-24 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
          <p className="text-neutral-500 text-sm uppercase tracking-widest mb-4">
            Crafted with precision
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mb-8">
            Built by <span className="text-white border-b border-white/20 pb-1">Directors</span> &{' '}
            <span className="text-white border-b border-white/20 pb-1">Engineers</span>.
          </h2>
          <p className="text-neutral-400 text-lg leading-relaxed mb-10">
            We got tired of editing vlogs at 2AM. So we built an agent to do it for us. Designed in
            San Francisco for the Gemini API Competition.
          </p>

          <div className="flex justify-center gap-6">
            <a href="#" className="text-neutral-500 hover:text-white transition-colors">
              Twitter
            </a>
            <a href="#" className="text-neutral-500 hover:text-white transition-colors">
              GitHub
            </a>
            <a href="#" className="text-neutral-500 hover:text-white transition-colors">
              Discord
            </a>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="mt-auto px-6 py-12 border-t border-white/5 text-center">
        <p className="text-neutral-600 text-sm font-medium tracking-wide">
          &copy; 2026 SKEET INC. // GEMINI API COMPETITION
        </p>
      </footer>
    </div>
  );
}
