'use client';

import { Logo } from '@/components/ui/logo';
import { useAuthStore } from '@/store/auth';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect } from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { session, fetchSession } = useAuthStore();

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    if (session) {
      window.location.href = process.env.NEXT_PUBLIC_APP_CLIENT_URL || '/';
    }
  }, [session]);

  if (session) {
    return null; // Or a loading spinner
  }
  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor - Removed purple, sticking to white/gray glow */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Brand */}
        <div className="flex justify-center mb-10">
          <Link href="/" className="group">
            <div className="flex items-center gap-3 text-2xl font-bold tracking-tighter">
              <Logo
                variant="timeline-slice"
                className="w-8 h-8 group-hover:scale-110 transition-transform duration-300"
              />
              skeet
            </div>
          </Link>
        </div>

        {/* Content */}
        {children}
      </motion.div>
    </div>
  );
}
