import type { Metadata } from 'next';
import { Geist, Geist_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta',
  subsets: ['latin'],
  weight: ['400', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Skeet - The AI Video Engine',
  description: 'Logic meets Feeling. The most advanced video engine.',
};

import { BackgroundAssets } from '@/components/layout/background-assets';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${plusJakarta.variable} antialiased selection:bg-white/20 selection:text-white bg-black text-white relative font-sans`}
      >
        <BackgroundAssets />
        {children}
      </body>
    </html>
  );
}
