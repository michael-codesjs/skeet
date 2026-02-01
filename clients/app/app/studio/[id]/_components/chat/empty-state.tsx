import { Logo } from '@/components/ui/logo';
import { motion } from 'framer-motion';

export const ChatEmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 p-10 text-center">
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <Logo variant="star" className="w-12 h-12 text-white" />
      </motion.div>

      <div className="space-y-1.5">
        <h3 className="text-white/90 text-sm font-medium tracking-tight">Skeet Assistant</h3>
        <p className="text-white/30 text-[11px] font-light leading-relaxed">
          I'm your creative partner. Ask me to scout clips, apply effects, or orchestrate a sequence
          from your library.
        </p>
      </div>
    </div>
  );
};
