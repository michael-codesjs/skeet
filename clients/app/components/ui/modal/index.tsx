'use client';

import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { Add } from 'iconsax-react';
import React, { useEffect } from 'react';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
};

const maxWithClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-[95vw]',
};

export const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  maxWidth = 'md',
}: ModalProps) => {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'glass-card relative flex w-full flex-col overflow-hidden rounded-2xl border-white/10 bg-neutral-900/90 shadow-2xl max-h-[80vh]',
              maxWithClasses[maxWidth],
              className,
            )}
          >
            {/* Header - Fixed height */}
            <div className="flex shrink-0 items-start justify-between border-b border-white/5 p-6">
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

            {/* Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-0 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
              {children}
            </div>

            {/* Optional Footer - Fixed height */}
            {footer && (
              <div className="flex shrink-0 items-center justify-end border-t border-white/5 p-4 bg-black/20">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
