import { Footer } from '@/components/layout/footer';
import { Sidebar } from '@/components/layout/sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar />
      <div className="flex flex-1 flex-col min-h-screen">
        <main className="flex-1 p-8">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
