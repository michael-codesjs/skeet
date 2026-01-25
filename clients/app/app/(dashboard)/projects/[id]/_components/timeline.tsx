export function Timeline() {
  return (
    <div className="h-72 bg-neutral-950 border-t border-white/10 shrink-0 flex flex-col">
      {/* Timeline Toolbar */}
      <div className="h-10 border-b border-white/5 flex items-center px-4 justify-between">
        <div className="flex items-center gap-4 text-xs text-neutral-400">
          <span className="hover:text-white cursor-pointer">00:00:00:00</span>
          <div className="w-px h-3 bg-white/10" />
          <span className="hover:text-white cursor-pointer">+ Add Track</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls placeholder */}
          <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="w-1/3 h-full bg-white/30 rounded-full" />
          </div>
        </div>
      </div>

      {/* Track Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
        {/* Playhead */}
        <div className="absolute top-0 bottom-0 left-[100px] w-px bg-red-500 z-50">
          <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-500 rotate-45" />
        </div>

        {/* Time Ruler */}
        <div className="h-6 bg-black border-b border-white/5 sticky top-0 z-40 flex items-end pb-1 pl-[100px]">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 border-l border-white/10 h-2 px-1 text-[9px] font-mono text-neutral-600"
            >
              00:0{i}
            </div>
          ))}
        </div>

        {/* Tracks */}
        <div className="p-4 space-y-1 text-center text-neutral-600 text-xs py-10">
          No tracks yet
        </div>
      </div>
    </div>
  );
}
