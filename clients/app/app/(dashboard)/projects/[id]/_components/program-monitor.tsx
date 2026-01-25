import { Backward10Seconds, Forward10Seconds, Maximize2, Play } from 'iconsax-react';

export function ProgramMonitor() {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-black relative group">
      {/* Video Placeholder */}
      <div className="flex-1 flex items-center justify-center bg-dots-pattern">
        <div className="relative aspect-video w-[90%] max-h-[90%] bg-neutral-900 rounded-lg border border-white/10 shadow-2xl flex items-center justify-center overflow-hidden">
          {/* Simulating "No Signal" or Empty State */}
          <div className="text-center space-y-2">
            <div className="w-16 h-1 bg-white/10 mx-auto rounded-full mb-4" />
            <p className="text-neutral-600 font-mono text-xs tracking-widest uppercase">
              Program Monitor
            </p>
            <p className="text-neutral-700 text-[10px]">No Active Sequence</p>
          </div>

          {/* Safe Margins Overlay (Optional detail) */}
          <div className="absolute inset-8 border border-white/5 border-dashed pointer-events-none rounded-sm opacity-50" />
        </div>
      </div>

      {/* Floating Controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 bg-neutral-900/80 backdrop-blur-md rounded-full border border-white/10 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
        <button className="text-neutral-400 hover:text-white transition-colors">
          <Backward10Seconds size={20} color="currentColor" variant="Bold" />
        </button>

        <button className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform">
          <Play size={24} color="currentColor" variant="Bold" className="ml-1" />
        </button>

        <button className="text-neutral-400 hover:text-white transition-colors">
          <Forward10Seconds size={20} color="currentColor" variant="Bold" />
        </button>

        <div className="w-px h-6 bg-white/10 mx-2" />

        <button className="text-neutral-400 hover:text-white transition-colors">
          <Maximize2 size={18} color="currentColor" />
        </button>
      </div>
    </div>
  );
}
