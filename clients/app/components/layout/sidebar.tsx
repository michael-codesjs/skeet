'use client';

import { Logo } from '@/components/ui/logo';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  ArrowLeft2,
  ArrowRight2,
  Calendar,
  Flash,
  Folder,
  LogoutCurve,
  Setting2,
  VideoPlay,
} from 'iconsax-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

const NAV_ITEMS = [
  { icon: VideoPlay, label: 'Projects', href: '/projects' },
  { icon: Folder, label: 'Library', href: '/library' },
  { icon: Calendar, label: 'Schedules', href: '/schedules', comingSoon: true },
  { icon: Flash, label: 'Integrations', href: '/integrations', comingSoon: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

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

  return (
    <motion.div
      initial={{ width: 280 }}
      animate={{ width: isCollapsed ? 88 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="flex flex-col h-screen sticky top-0 border-r border-white/5 bg-[#050505] px-4 py-8 z-20 shrink-0"
    >
      {/* Background Gradient/Glow - Subtle */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-neutral-900/20 blur-[100px] pointer-events-none rounded-r-full opacity-50"></div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-12 translate-y-2 w-6 h-6 rounded-full bg-black text-white flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-neutral-800 hover:scale-110 transition-transform z-30"
      >
        {isCollapsed ? (
          <ArrowRight2 size={12} color="currentColor" />
        ) : (
          <ArrowLeft2 size={12} color="currentColor" />
        )}
      </button>

      {/* Logo */}
      <div
        className={cn(
          'flex items-center gap-3 mb-10 px-2 transition-all',
          isCollapsed ? 'justify-center' : '',
        )}
      >
        <Logo variant="timeline-slice" className="w-8 h-8 shrink-0" />

        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col overflow-hidden whitespace-nowrap"
          >
            <span className="text-2xl font-bold tracking-tight text-white leading-none pl-1">
              skeet
            </span>
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden no-scrollbar">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href);

          if (item.comingSoon) {
            return (
              <div
                key={item.href}
                className={cn(
                  'group flex items-center gap-3 px-3 py-3.5 rounded-xl transition-all duration-300 relative overflow-hidden',
                  isActive
                    ? 'bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)] border border-white/5'
                    : 'text-neutral-500',
                  isCollapsed ? 'justify-center' : '',
                  'opacity-60 cursor-not-allowed',
                )}
              >
                <item.icon size={22} variant="Linear" color="currentColor" className="shrink-0" />

                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="text-sm font-medium whitespace-nowrap flex items-center justify-between flex-1"
                  >
                    {item.label}
                    <span className="text-[10px] font-bold bg-white/5 text-neutral-500 px-1.5 py-0.5 rounded border border-white/5 uppercase tracking-wider ml-2">
                      Soon
                    </span>
                  </motion.span>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 px-3 py-3.5 rounded-xl transition-all duration-300 relative overflow-hidden',
                isActive
                  ? 'bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)] border border-white/5'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5',
                isCollapsed ? 'justify-center' : '',
              )}
            >
              {/* Active Indicator Line */}
              {isActive && !isCollapsed && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full shadow-[0_0_8px_white]"></div>
              )}

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
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="text-sm font-medium whitespace-nowrap flex items-center justify-between flex-1"
                >
                  {item.label}
                </motion.span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="mt-auto space-y-1 pt-6 border-t border-white/5">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-3 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition-all duration-300 group',
            isCollapsed ? 'justify-center' : '',
          )}
        >
          <Setting2
            size={22}
            variant="Linear"
            color="currentColor"
            className="group-hover:rotate-90 transition-transform duration-500 shrink-0"
          />
          {!isCollapsed && <span className="text-sm font-medium whitespace-nowrap">Settings</span>}
        </Link>
        <button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-400/80 hover:text-red-400 hover:bg-red-400/10 transition-all duration-300 group',
            isCollapsed ? 'justify-center' : '',
          )}
        >
          <LogoutCurve
            size={22}
            variant="Linear"
            color="currentColor"
            className="group-hover:-translate-x-1 transition-transform shrink-0"
          />
          {!isCollapsed && <span className="text-sm font-medium whitespace-nowrap">Log out</span>}
        </button>
      </div>

      {/* User Profile Snippet - Glassmorphism */}
      {isLoading ? (
        <div
          className={cn(
            'mt-6 p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md flex items-center gap-3',
            isCollapsed ? 'justify-center px-0' : '',
          )}
        >
          <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse shrink-0" />
          {!isCollapsed && (
            <div className="flex flex-col gap-2 flex-1">
              <div className="h-3 w-24 bg-white/10 rounded animate-pulse" />
              <div className="h-2 w-32 bg-white/10 rounded animate-pulse" />
            </div>
          )}
        </div>
      ) : (
        <div
          className={cn(
            'mt-6 p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md flex items-center gap-3 hover:bg-white/10 transition-colors cursor-pointer group',
            isCollapsed ? 'justify-center px-0' : '',
          )}
        >
          <div className="w-10 h-10 rounded-full bg-linear-to-tr from-neutral-700 to-neutral-600 flex items-center justify-center border border-white/10 shrink-0 overflow-hidden relative">
            {user?.profilePictureComputed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.profilePictureComputed}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs font-bold text-white">{userInitials}</span>
            )}
          </div>
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden whitespace-nowrap">
              <span className="text-sm font-semibold text-white truncate group-hover:text-neutral-200 transition-colors">
                {userName}
              </span>
              <span className="text-[10px] text-neutral-500 truncate">{user?.email}</span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
