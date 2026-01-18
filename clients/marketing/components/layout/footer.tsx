'use client';

import { Logo } from '@/components/ui/logo';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="relative border-t border-white/5 bg-black/50 backdrop-blur-xl mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start justify-between">
          {/* Brand Column */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-2xl font-bold tracking-tighter text-white">
              <Logo variant="timeline-slice" className="w-6 h-6" />
              skeet
            </div>
            <p className="text-neutral-400 max-w-sm leading-relaxed">
              We got tired of editing vlogs at 2AM. So we built an agent to do it for us. Built by
              creators, for creators.
            </p>
            <div className="flex gap-6 pt-4">
              <a
                href="https://www.linkedin.com/in/michael-phiri/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-500 hover:text-white transition-colors uppercase text-xs tracking-widest font-medium"
              >
                LinkedIn
              </a>
              <a
                href="https://github.com/michael-codesjs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-500 hover:text-white transition-colors uppercase text-xs tracking-widest font-medium"
              >
                GitHub
              </a>
            </div>
          </div>

          {/* Links Column */}
          <div className="grid grid-cols-2 gap-8 md:justify-items-end">
            <div className="space-y-4">
              <h4 className="text-white font-bold">Product</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li>
                  <Link href="/features" className="hover:text-white transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Changelog
                  </a>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-white font-bold">Company</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li>
                  <Link href="/about" className="hover:text-white transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-24 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-neutral-600 text-sm font-medium tracking-wide">
            &copy; 2026 SKEET INC.
          </p>
          <div className="flex items-center gap-2 text-neutral-600 text-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            All systems nominal
          </div>
        </div>
      </div>
    </footer>
  );
}
