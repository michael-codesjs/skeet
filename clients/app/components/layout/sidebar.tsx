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

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Mock auth state
  const user = {
    name: 'Michael Phiri',
    email: 'michael@skeet.ai',
    profilePictureComputed: null,
  };

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
  const sidebarWidth = 220;

  return (
    <motion.div
      initial={false}
      animate={{
        width: sidebarWidth,
        opacity: 1,
      }}
      transition={hasMounted ? { duration: 0.3, ease: 'easeInOut' } : { duration: 0 }}
      className="flex flex-col space-y-8 h-full border-r border-white/5 bg-black/40 backdrop-blur-xl py-6 px-4 z-20 shrink-0 relative overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 transition-all relative z-10">
        <Logo variant="timeline-slice" className="w-8 h-8 shrink-0" />
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-md font-bold tracking-tight text-white pl-1"
        >
          skeet
        </motion.span>
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
                'group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative',
                isActive
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5',
                item.comingSoon && 'opacity-60 cursor-not-allowed',
              )}
            >
              <item.icon
                size={20}
                variant={isActive ? 'Bold' : 'Linear'}
                color="currentColor"
                className={cn(
                  'transition-transform duration-300 group-hover:scale-110 shrink-0',
                  isActive && 'text-white',
                )}
              />

              <div className="flex items-center justify-between flex-1">
                <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                {item.comingSoon && (
                  <span className="text-[10px] font-bold bg-white/5 text-neutral-500 px-1.5 py-0.5 border border-white/5 rounded uppercase">
                    Soon
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="mt-auto space-y-1 pt-6 border-t border-white/5 relative z-10">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition-all duration-200 group',
          )}
        >
          <Setting2
            size={20}
            variant="Linear"
            color="currentColor"
            className="group-hover:rotate-90 transition-transform duration-500 shrink-0"
          />
          <span className="text-sm font-medium whitespace-nowrap">Settings</span>
        </Link>
      </div>

      {/* User Profile Snippet */}
      <div
        className={cn(
          'mt-4 p-2 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md flex items-center gap-3 hover:bg-white/10 transition-colors cursor-pointer group relative z-10',
        )}
      >
        <div className="w-8 h-8 rounded-full bg-linear-to-tr from-neutral-700 to-neutral-600 flex items-center justify-center border border-white/10 shrink-0 overflow-hidden relative shadow-inner">
          {/* Placeholder avatar logic or image */}
          {user.profilePictureComputed ? (
            <img
              src={user.profilePictureComputed}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-[10px] font-bold text-white uppercase">{userInitials}</span>
          )}
        </div>
        <div className="flex flex-col overflow-hidden whitespace-nowrap">
          <span className="text-xs font-semibold text-white truncate">{userName}</span>
          <span className="text-[10px] text-neutral-500 truncate">{user?.email}</span>
        </div>
      </div>
    </motion.div>
  );
}
