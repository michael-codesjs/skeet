'use client';

import { Logo } from '@/components/ui/logo';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Calendar, Flash, Folder, Setting2, VideoPlay } from 'iconsax-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const NAV_ITEMS = [
  { icon: VideoPlay, label: 'Projects', href: '/projects' },
  { icon: Folder, label: 'Library', href: '/library' },
  { icon: Calendar, label: 'Schedules', href: '/schedules', comingSoon: true },
  { icon: Flash, label: 'Integrations', href: '/integrations', comingSoon: true },
];

const SIDEBAR_STORAGE_KEY = 'skeet-sidebar-collapsed';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [hasMounted, setHasMounted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Read from localStorage after mount to avoid SSR mismatch
  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (stored === 'true') {
      setIsCollapsed(true);
    }
    setHasMounted(true);
  }, []);

  // Persist to localStorage on change (only after initial mount)
  useEffect(() => {
    if (hasMounted) {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isCollapsed));
    }
  }, [isCollapsed, hasMounted]);

  // Mock auth state
  const user = {
    name: 'Michael Phiri',
    email: 'michael@skeet.ai',
    profilePictureComputed: null,
  };
  const isLoading = false;
  const isLoggingOut = false;

  const handleLogout = async () => {
    // await signOut();
    router.push('/');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const userInitials = user?.name ? getInitials(user.name) : 'U';
  const userName = user?.name || 'User';

  // Determine width - use final state immediately if not yet mounted to avoid flash
  const segments = pathname?.split('/').filter(Boolean) || [];
  const isStudio = segments[0] === 'projects' && segments.length > 1 && segments[1] !== 'new';

  const sidebarWidth = isStudio ? 0 : isCollapsed ? 88 : 280;

  return (
    <motion.div
      initial={false}
      animate={{
        width: sidebarWidth,
        opacity: isStudio ? 0 : 1,
        marginLeft: 0,
        paddingLeft: isStudio ? 0 : 16,
        paddingRight: isStudio ? 0 : 16,
        borderWidth: isStudio ? 0 : 1,
      }}
      transition={hasMounted ? { duration: 0.3, ease: 'easeInOut' } : { duration: 0 }}
      className="flex flex-col h-full rounded-[32px] border-white/5 bg-neutral-900/40 backdrop-blur-xl py-8 z-20 shrink-0 relative overflow-hidden"
    >
      {/* Background Gradient/Glow - Subtle */}
      <div className="absolute top-0 left-0 w-full h-[300px] bg-white/2 blur-[80px] pointer-events-none rounded-t-[32px] opacity-30"></div>

      {/* Logo */}
      <div
        className={cn(
          'flex items-center gap-3 mb-8 px-2 transition-all relative z-10',
          isCollapsed ? 'justify-center' : '',
        )}
      >
        <Logo variant="timeline-slice" className="w-8 h-8 shrink-0" />
        {!isCollapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-2xl font-bold tracking-tight text-white pl-1"
          >
            skeet
          </motion.span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar relative z-10">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 relative',
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5',
                isCollapsed ? 'justify-center' : '',
                item.comingSoon && 'opacity-60 cursor-not-allowed',
              )}
            >
              <item.icon
                size={22}
                variant={isActive ? 'Bold' : 'Linear'}
                color="currentColor"
                className={cn(
                  'transition-transform duration-300 group-hover:scale-110 shrink-0',
                  isActive && 'text-white',
                )}
              />

              {!isCollapsed && (
                <div className="flex items-center justify-between flex-1">
                  <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                  {item.comingSoon && (
                    <span className="text-[8px] font-bold bg-white/5 text-neutral-600 px-1 border border-white/5 rounded uppercase">
                      Soon
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="mt-auto space-y-1 pt-6 border-t border-white/5 relative z-10">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-neutral-500 hover:text-white hover:bg-white/5 transition-all duration-300 group',
            isCollapsed ? 'justify-center' : '',
          )}
        >
          <Setting2
            size={20}
            variant="Linear"
            color="currentColor"
            className="group-hover:rotate-90 transition-transform duration-500 shrink-0"
          />
          {!isCollapsed && <span className="text-sm font-medium whitespace-nowrap">Settings</span>}
        </Link>
      </div>

      {/* User Profile Snippet - Glassmorphism */}
      <div
        className={cn(
          'mt-4 p-2 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md flex items-center gap-3 hover:bg-white/10 transition-colors cursor-pointer group relative z-10',
          isCollapsed ? 'justify-center px-0' : '',
        )}
      >
        <div className="w-9 h-9 rounded-full bg-linear-to-tr from-neutral-700 to-neutral-600 flex items-center justify-center border border-white/10 shrink-0 overflow-hidden relative">
          <span className="text-[10px] font-bold text-white uppercase">{userInitials}</span>
        </div>
        {!isCollapsed && (
          <div className="flex flex-col overflow-hidden whitespace-nowrap">
            <span className="text-xs font-semibold text-white truncate">{userName}</span>
            <span className="text-[9px] text-neutral-500 truncate">{user?.email}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
