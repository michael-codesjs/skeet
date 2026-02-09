'use client';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAuthStore } from '@/store/auth';
import { useEffect } from 'react';

export function Navbar() {
  const pathname = usePathname();
  const { session, fetchSession, launchDemo, isLoading } = useAuthStore();

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center py-6 px-4">
      <div className="glass-card bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl rounded-full px-6 py-3 flex items-center gap-8 ring-1 ring-white/5">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold tracking-tight hover:scale-105 transition-transform"
        >
          <Logo variant="timeline-slice" className="w-5 h-5" />
          <span className="text-gradient">skeet</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          <Link href="/features">
            <Button
              variant="ghost"
              size="sm"
              className={pathname === '/features' ? 'bg-white/10' : ''}
            >
              Features
            </Button>
          </Link>
          <Link href="/about">
            <Button
              variant="ghost"
              size="sm"
              className={pathname === '/about' ? 'bg-white/10' : ''}
            >
              About
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {session ? (
            <a href={process.env.NEXT_PUBLIC_APP_CLIENT_URL || '/'}>
              <Button variant="primary" size="sm">
                Dashboard
              </Button>
            </a>
          ) : (
            <>
              <Button onClick={launchDemo} disabled={isLoading} variant="primary" size="sm">
                Get Started
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
