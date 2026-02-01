'use client';
import { MediaItem } from '@/stores/studio';
import { Gallery, Music, Video } from 'iconsax-react';
import { useEffect, useRef } from 'react';

interface MentionListProps {
  items: MediaItem[];
  activeIndex: number;
  onSelect: (item: MediaItem) => void;
  onClose: () => void;
  // position prop is now optional as we anchor to the input container
  position?: { top: number; left: number };
}

export const MentionList = ({ items, activeIndex, onSelect, onClose }: MentionListProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const activeItem = scrollRef.current?.children[activeIndex] as HTMLElement;
    if (activeItem) {
      activeItem.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  if (items.length === 0) return null;

  return (
    <div className="absolute bottom-[calc(100%+8px)] left-0 right-0 z-100 bg-[#121212] border border-white/10 rounded-lg shadow-[0_12px_40px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-100 ease-out">
      <div
        ref={scrollRef}
        className="overflow-y-auto overflow-x-hidden flex-1 py-1 selection:bg-blue-500/30 scrollbar-hide max-h-[280px]"
      >
        {items.map((item, index) => (
          <button
            key={item.id}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect(item);
            }}
            onMouseDown={(e) => e.preventDefault()}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-none ${
              index === activeIndex
                ? 'bg-[#2A2D2E] text-white'
                : 'text-[#CCCCCC] hover:bg-[#2A2D2E]/50'
            }`}
          >
            <div className="shrink-0 w-8 h-8 rounded border border-white/10 bg-white/5 overflow-hidden flex items-center justify-center">
              {item.thumbnail ? (
                <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className={`${index === activeIndex ? 'text-blue-400' : 'text-neutral-500'}`}>
                  {item.mimeType?.includes('video') ? (
                    <Video size={14} variant={index === activeIndex ? 'Bold' : 'Outline'} />
                  ) : item.mimeType?.includes('audio') ? (
                    <Music size={14} variant={index === activeIndex ? 'Bold' : 'Outline'} />
                  ) : (
                    <Gallery size={14} variant={index === activeIndex ? 'Bold' : 'Outline'} />
                  )}
                </div>
              )}
            </div>

            <span className="text-[12.5px] font-normal truncate flex-1">{item.fileName}</span>

            <span
              className={`text-[11px] opacity-40 ml-2 font-mono ${index === activeIndex ? 'opacity-70' : ''}`}
            >
              {item.mimeType?.split('/')[1] || 'media'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
