export function StudioSkeleton() {
  return (
    <div className="relative flex h-screen w-full flex-col bg-black text-white overflow-hidden">
      {/* Header Skeleton */}
      <div className="h-14 border-b border-white/5 flex items-center justify-between px-4 bg-neutral-950">
        <div className="w-32 h-6 bg-white/5 rounded-md animate-pulse" />
        <div className="flex items-center gap-4">
          <div className="w-24 h-8 bg-white/5 rounded-full animate-pulse" />
          <div className="w-8 h-8 bg-white/5 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 flex min-h-0 overflow-hidden bg-neutral-950/50">
        {/* Left Sidebar (Media) Skeleton */}
        <div className="w-80 border-r border-white/5 p-5 flex flex-col gap-4">
          {/* Search */}
          <div className="h-10 w-full bg-white/5 rounded-2xl animate-pulse" />
          {/* Filters */}
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-6 w-16 bg-white/5 rounded-full animate-pulse" />
            ))}
          </div>
          {/* Grid */}
          <div className="grid grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-video w-full rounded-lg bg-white/5 animate-pulse" />
            ))}
          </div>
        </div>

        {/* Center Column */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Monitor Area */}
          <div className="flex-1 p-8 flex items-center justify-center border-b border-white/5">
            <div className="aspect-video w-full max-w-3xl bg-white/5 rounded-xl animate-pulse" />
          </div>
          {/* Timeline Area */}
          <div className="h-1/3 bg-neutral-900/50 p-4 flex flex-col gap-2">
            <div className="h-8 w-full border-b border-white/5 mb-2 flex items-center gap-2">
              <div className="h-6 w-20 bg-white/5 rounded animate-pulse" />
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 h-12">
                <div className="w-24 h-full bg-white/5 rounded animate-pulse" />
                <div className="flex-1 h-full bg-white/5 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar (Chat) Skeleton */}
        <div className="w-80 border-l border-white/5 flex flex-col">
          <div className="h-14 border-b border-white/5 px-4 flex items-center">
            <div className="h-5 w-24 bg-white/5 rounded animate-pulse" />
          </div>
          <div className="flex-1 p-4 flex flex-col gap-4 justify-end">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`flex flex-col gap-2 ${i % 2 === 0 ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`h-16 w-3/4 rounded-2xl bg-white/5 animate-pulse ${
                    i % 2 === 0 ? 'rounded-tr-none' : 'rounded-tl-none'
                  }`}
                />
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-white/5">
            <div className="h-10 w-full bg-white/5 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
