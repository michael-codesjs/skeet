'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const segments = pathname?.split('/').filter(Boolean) || [];
  const isStudio = segments[0] === 'projects' && segments.length > 1 && segments[1] !== 'new';

  return (
    <div className={`flex h-screen bg-black text-white overflow-hidden`}>
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className={`flex-1 overflow-y-auto no-scrollbar scroll-smooth`}>
          <div className="relative z-10 h-full">{children}</div>
        </main>
        {/* <Footer /> */}
      </div>
    </div>
  );
}
