import { Magicpen, Send } from 'iconsax-react';

export function DirectorChat() {
  return (
    <div className="flex flex-col h-full w-80 shrink-0">
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <h2 className="text-sm font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
          <Magicpen size={16} color="currentColor" />
          Director Logic
        </h2>
        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse" />
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">{/* Messages will appear here */}</div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/5 bg-black/20">
        <div className="relative">
          <input
            type="text"
            placeholder="Give instructions..."
            className="w-full bg-neutral-800 border-none rounded-xl py-3 pl-4 pr-10 text-sm text-white placeholder-neutral-500 focus:ring-1 focus:ring-white/20"
          />
          <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white text-black rounded-lg hover:scale-105 transition-transform">
            <Send size={14} color="currentColor" variant="Bold" />
          </button>
        </div>
      </div>
    </div>
  );
}
