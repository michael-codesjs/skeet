'use client';

import { Popover } from '@/components/ui/popover';
import { TimelineTrack, useStudioStore } from '@/stores/studio';
import { Edit, Eye, EyeSlash, Lock, Lock1, Music, Trash, VideoSquare } from 'iconsax-react';
import { useEffect, useRef, useState } from 'react';

interface TrackHeadersProps {
  tracks: TimelineTrack[];
}

export function TrackHeaders({ tracks }: TrackHeadersProps) {
  const deleteTrack = useStudioStore((state) => state.deleteTrack);
  const updateTrack = useStudioStore((state) => state.updateTrack);
  const emptyTrack = useStudioStore((state) => state.emptyTrack);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    trackIndex: number;
  } | null>(null);

  const [editingTrackIndex, setEditingTrackIndex] = useState<number | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingTrackIndex !== null && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingTrackIndex]);

  const handleRename = (index: number, newName: string) => {
    if (newName.trim()) {
      updateTrack(index, { name: newName });
    }
    setEditingTrackIndex(null);
  };

  const handleContextMenu = (e: React.MouseEvent, trackIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      trackIndex,
    });
  };

  return (
    <div className="sticky left-0 z-50 w-48 border-r border-white/5 bg-neutral-950 shadow-xl box-border">
      {/* Header Spacer for Ruler */}
      <div className="h-8 border-b border-white/5 bg-black/40" />

      <div className="flex flex-col">
        {tracks.map((track, i) => (
          <div
            key={`${track.name}-${i}`}
            className="group flex h-14 w-full items-center justify-between border-b border-white/5 px-3 transition-colors hover:bg-white/2"
            onContextMenu={(e) => handleContextMenu(e, i)}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center">
                {track.kind === 'Video' ? (
                  <VideoSquare
                    size={18}
                    className={
                      track.metadata?.enabled === false ? 'text-neutral-600' : 'text-blue-500'
                    }
                    variant="Bulk"
                    color="currentColor"
                  />
                ) : (
                  <Music
                    size={18}
                    className={
                      track.metadata?.enabled === false ? 'text-neutral-600' : 'text-emerald-500'
                    }
                    variant="Bulk"
                    color="currentColor"
                  />
                )}
              </div>

              {editingTrackIndex === i ? (
                <input
                  ref={editInputRef}
                  type="text"
                  defaultValue={track.name}
                  className="h-6 w-full rounded bg-white/10 px-1 text-[12px] text-white outline-none ring-1 ring-blue-500"
                  onBlur={(e) => handleRename(i, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename(i, e.currentTarget.value);
                    if (e.key === 'Escape') setEditingTrackIndex(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <div className="flex items-center gap-2 overflow-hidden">
                  <span
                    className={`text-[12px] font-semibold transition-colors truncate ${
                      track.metadata?.enabled === false
                        ? 'text-neutral-600'
                        : 'text-white/90 group-hover:text-white'
                    }`}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setEditingTrackIndex(i);
                    }}
                  >
                    {track.name}
                  </span>
                  {track.metadata?.locked && (
                    <Lock1 size={10} className="text-amber-500/80 shrink-0" variant="Bold" />
                  )}
                  {track.metadata?.enabled === false && (
                    <EyeSlash size={10} className="text-neutral-600 shrink-0" variant="Bold" />
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-neutral-600">
              {/* Icons moved to name area for better visibility as requested */}
            </div>
          </div>
        ))}
      </div>

      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 50,
          }}
        >
          <Popover
            isOpen={true}
            onClose={() => setContextMenu(null)}
            width={180}
            trigger={<div className="w-1 h-1" />}
          >
            <div className="p-1 flex flex-col gap-1">
              <button
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-white/90 hover:bg-white/10 transition-colors"
                onClick={() => {
                  const track = tracks[contextMenu.trackIndex];
                  const isEnabled = track.metadata?.enabled !== false;
                  updateTrack(contextMenu.trackIndex, {
                    metadata: { ...track.metadata, enabled: !isEnabled },
                  });
                  setContextMenu(null);
                }}
              >
                <Eye size={14} color="currentColor" />
                <span>
                  {tracks[contextMenu.trackIndex].metadata?.enabled === false
                    ? 'Show Track'
                    : 'Hide Track'}
                </span>
              </button>
              <button
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-white/90 hover:bg-white/10 transition-colors"
                onClick={() => {
                  const track = tracks[contextMenu.trackIndex];
                  const isLocked = track.metadata?.locked === true;
                  updateTrack(contextMenu.trackIndex, {
                    metadata: { ...track.metadata, locked: !isLocked },
                  });
                  setContextMenu(null);
                }}
              >
                <Lock size={14} color="currentColor" />
                <span>
                  {tracks[contextMenu.trackIndex].metadata?.locked ? 'Unlock Track' : 'Lock Track'}
                </span>
              </button>

              <button
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-white/90 hover:bg-white/10 transition-colors"
                onClick={() => {
                  setEditingTrackIndex(contextMenu.trackIndex);
                  setContextMenu(null);
                }}
              >
                <Edit size={14} color="currentColor" />
                <span>Rename Track</span>
              </button>

              <div className="h-px bg-white/5 my-1" />

              <button
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-white/90 hover:bg-white/10 transition-colors"
                onClick={() => {
                  emptyTrack(contextMenu.trackIndex);
                  setContextMenu(null);
                }}
              >
                <Trash size={14} color="currentColor" />
                <span>Empty Track</span>
              </button>

              {contextMenu.trackIndex > 3 && (
                <>
                  <div className="h-px bg-white/5 my-1" />

                  <button
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-white/90 hover:bg-white/10 transition-colors"
                    onClick={() => {
                      const track = tracks[contextMenu.trackIndex];
                      updateTrack(contextMenu.trackIndex, {
                        kind: track.kind === 'Video' ? 'Audio' : 'Video',
                      });
                      setContextMenu(null);
                    }}
                  >
                    {tracks[contextMenu.trackIndex].kind === 'Video' ? (
                      <Music size={14} color="currentColor" />
                    ) : (
                      <VideoSquare size={14} color="currentColor" />
                    )}
                    <span>
                      {tracks[contextMenu.trackIndex].kind === 'Video'
                        ? 'Convert to Audio Track'
                        : 'Convert to Video Track'}
                    </span>
                  </button>

                  <button
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-red-500 hover:bg-white/10 transition-colors"
                    onClick={() => {
                      deleteTrack(contextMenu.trackIndex);
                      setContextMenu(null);
                    }}
                  >
                    <Trash size={14} color="currentColor" />
                    <span>Delete Track</span>
                  </button>
                </>
              )}
            </div>
          </Popover>
        </div>
      )}
    </div>
  );
}
