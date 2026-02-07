'use client';

import { cn } from '@/lib/utils';
import { useStudioStore } from '@/stores/studio';
import { Blur, Cd, Ghost, InfoCircle, Magicpen, Maximize3, RepeateOne } from 'iconsax-react';

const EFFECTS = [
  {
    id: 'Grayscale',
    label: 'Noir',
    description: 'B&W Cinema',
    icon: Ghost,
    color: 'text-zinc-400',
    bg: 'bg-zinc-400/5',
    border: 'hover:border-zinc-400/30',
  },
  {
    id: 'Sepia',
    label: 'Vintage',
    description: 'Warm Film',
    icon: Magicpen,
    color: 'text-amber-500',
    bg: 'bg-amber-500/5',
    border: 'hover:border-amber-500/30',
  },
  {
    id: 'Blur',
    label: 'Dream',
    description: 'Soft Focus',
    icon: Blur,
    color: 'text-blue-500',
    bg: 'bg-blue-500/5',
    border: 'hover:border-blue-500/30',
  },
  {
    id: 'Glitch',
    label: 'Glitch',
    description: 'Digital Warp',
    icon: Cd,
    color: 'text-purple-500',
    bg: 'bg-purple-500/5',
    border: 'hover:border-purple-500/30',
  },
  {
    id: 'Pixelate',
    label: '8-Bit',
    description: 'Retro Mosaic',
    icon: RepeateOne,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/5',
    border: 'hover:border-emerald-500/30',
  },
  {
    id: 'Zoom',
    label: 'Zoom',
    description: 'Camera Push',
    icon: Maximize3,
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/5',
    border: 'hover:border-yellow-500/30',
  },
] as const;

export function EffectsLibrary() {
  const { addEffectToTrack, project } = useStudioStore();

  const handleAddEffect = (effectType: (typeof EFFECTS)[number]['id']) => {
    if (!project?.timeline?.tracks) return;
    const videoTrackIndex = project.timeline.tracks.findIndex((t) => t.kind === 'Video');
    if (videoTrackIndex !== -1) {
      addEffectToTrack(videoTrackIndex, effectType);
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="grid grid-cols-2 gap-2 px-1">
        {EFFECTS.map((effect) => (
          <button
            key={effect.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('effecttype', effect.id);
              e.dataTransfer.effectAllowed = 'copy';
            }}
            onClick={() => handleAddEffect(effect.id)}
            className={cn(
              'group relative flex flex-col items-start p-3 rounded-xl border border-white/5 transition-all duration-300',
              'bg-neutral-900/40 hover:bg-neutral-800/80 active:scale-[0.96]',
              effect.border,
            )}
          >
            {/* Compact Icon */}
            <div
              className={cn(
                'flex items-center justify-center w-8 h-8 rounded-lg mb-2 transition-transform duration-300 group-hover:scale-110',
                effect.bg,
                effect.color,
              )}
            >
              <effect.icon size={18} variant="Bulk" color="currentColor" />
            </div>

            {/* Content */}
            <div className="w-full text-left">
              <p className="text-[11px] font-semibold text-white truncate">{effect.label}</p>
              <p className="text-[9px] text-neutral-500 truncate group-hover:text-neutral-400 transition-colors">
                {effect.description}
              </p>
            </div>

            {/* Subtle Hover Indicator */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className={cn('w-1 h-1 rounded-full', effect.color.replace('text-', 'bg-'))} />
            </div>
          </button>
        ))}
      </div>

      {/* Modern Tooltip / Tip Section */}
      <div className="mt-auto px-1 pb-4">
        <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
          <div className="flex items-center gap-2 mb-1">
            <InfoCircle size={14} className="text-blue-400" variant="Bulk" />
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter">
              Editor Pro Tip
            </span>
          </div>
          <p className="text-[9px] text-neutral-500 leading-tight">
            Drag these filters directly onto the timeline to create dedicated adjustment layers for
            your sequence.
          </p>
        </div>
      </div>
    </div>
  );
}
