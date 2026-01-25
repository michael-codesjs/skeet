'use client';

import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { Add } from 'iconsax-react';
import React, { useEffect } from 'react';

type DrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  side?: 'left' | 'right' | 'top' | 'bottom';
};

const sideVariants = {
  right: {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '100%' },
    className: 'right-0 inset-y-0 h-full w-full max-w-md border-l',
  },
  left: {
    initial: { x: '-100%' },
    animate: { x: 0 },
    exit: { x: '-100%' },
    className: 'left-0 inset-y-0 h-full w-full max-w-md border-r',
  },
  bottom: {
    initial: { y: '100%' },
    animate: { y: 0 },
    exit: { y: '100%' },
    className: 'bottom-0 inset-x-0 w-full h-auto max-h-[90vh] border-t',
  },
  top: {
    initial: { y: '-100%' },
    animate: { y: 0 },
    exit: { y: '-100%' },
    className: 'top-0 inset-x-0 w-full h-auto max-h-[90vh] border-b',
  },
};

export const Drawer = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  side = 'right',
}: DrawerProps) => {
  const variant = sideVariants[side];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer Content */}
          <motion.div
            initial={variant.initial}
            animate={variant.animate}
            exit={variant.exit}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={cn(
              'glass-card fixed flex flex-col border-white/10 bg-neutral-900/90 shadow-2xl',
              variant.className,
              className,
            )}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-white/5 p-6">
              <div>
                {title && <h3 className="text-xl font-semibold text-white">{title}</h3>}
                {description && <p className="mt-1 text-sm text-neutral-400">{description}</p>}
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-1 text-neutral-400 transition-colors hover:bg-white/5 hover:text-white"
              >
                <Add className="rotate-45" size={24} color="currentColor" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
