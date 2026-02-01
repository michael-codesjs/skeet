import { useStudioStore } from '@/stores/studio';
import { useEffect, useMemo, useRef, useState } from 'react';

interface RulerProps {
  zoom: number;
  playheadPos: number;
  setPlayheadPos: (pos: number) => void;
}

export function Ruler({ zoom, playheadPos, setPlayheadPos }: RulerProps) {
  const rulerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const project = useStudioStore((state) => state.project);

  const totalDuration = useMemo(() => {
    if (!project?.otio) return 60; // Default 60 seconds for empty
    let maxTime = 0;
    project.otio.tracks.children.forEach((track) => {
      let trackTime = 0;
      track.children.forEach((item) => {
        trackTime += item.source_range.duration.value / item.source_range.duration.rate;
      });
      if (trackTime > maxTime) maxTime = trackTime;
    });
    return Math.max(60, Math.ceil(maxTime + 10)); // Ensure at least 60s, plus 10s padding
  }, [project?.otio]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !rulerRef.current) return;
      const rect = rulerRef.current.getBoundingClientRect();
      const newPos = Math.max(0, e.clientX - rect.left);
      setPlayheadPos(newPos);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, setPlayheadPos]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    if (rulerRef.current) {
      const rect = rulerRef.current.getBoundingClientRect();
      setPlayheadPos(Math.max(0, e.clientX - rect.left));
    }
  };

  return (
    <div
      ref={rulerRef}
      className="sticky top-0 z-40 flex h-8 border-b border-white/5 bg-black/40 cursor-crosshair group/ruler"
      onMouseDown={handleMouseDown}
    >
      {Array.from({ length: totalDuration }).map((_, i) => (
        <div
          key={i}
          className="flex h-full border-l border-white/5 px-1 pt-2 text-[9px] font-mono text-neutral-600 select-none group-hover/ruler:text-neutral-400 transition-colors shrink-0"
          style={{ width: `${zoom}px` }}
        >
          {String(Math.floor(i / 60)).padStart(2, '0')}:{String(i % 60).padStart(2, '0')}
        </div>
      ))}
    </div>
  );
}
