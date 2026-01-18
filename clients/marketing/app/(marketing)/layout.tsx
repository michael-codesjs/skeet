import { Footer } from '@/components/layout/footer';
import { Navbar } from '@/components/layout/navbar';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24">{children}</main>
      <Footer />
    </>
  );
}
