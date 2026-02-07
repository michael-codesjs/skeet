'use client';

import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { Add } from 'iconsax-react';
import React, { useEffect } from 'react';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  backdropBlur?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
};

const maxWithClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-[95vw]',
};

const blurClasses = {
  none: 'backdrop-blur-none',
  sm: 'backdrop-blur-sm',
  md: 'backdrop-blur-md',
  lg: 'backdrop-blur-lg',
  xl: 'backdrop-blur-xl',
  '2xl': 'backdrop-blur-2xl',
  '3xl': 'backdrop-blur-3xl',
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
  backdropBlur = 'sm',
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={cn('fixed inset-0 bg-black/60 transition-all', blurClasses[backdropBlur])}
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
            {(title || description) && (
              <div className="flex shrink-0 items-center justify-between border-b border-white/5 py-4 px-5">
                <div>
                  {title && typeof title === 'string' ? (
                    <h3 className="text-base font-semibold text-white">{title}</h3>
                  ) : (
                    title && title
                  )}
                  {description && <p className="mt-1 text-xs text-neutral-400">{description}</p>}
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full p-1 text-neutral-400 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <Add className="rotate-45" size={20} color="currentColor" />
                </button>
              </div>
            )}

            {!title && !description && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-50 rounded-full p-1 text-neutral-400 transition-colors hover:bg-white/5 hover:text-white"
              >
                <Add className="rotate-45" size={24} color="currentColor" />
              </button>
            )}

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
