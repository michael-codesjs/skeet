import { TimelineClip, TimelineEffectClip, TimelineTrack, useStudioStore } from '@/stores/studio';
import { Magicpen, Scissor, Trash } from 'iconsax-react';
import { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { EffectsModal } from '../modals/effects-modal';
import { TrimModal } from '../modals/trim-modal';

interface TracksProps {
  tracks: TimelineTrack[];
  zoom: number;
}

export function Tracks({ tracks, zoom }: TracksProps) {
  const {
    project,
    selectedClip,
    setSelectedClip,
    updateClip,
    deleteClip,
    emptyTrack,
    addClipToTrack,
    addEffectToTrack,
    moveClip,
    pushOperation,
  } = useStudioStore(
    useShallow((state) => ({
      project: state.project,
      selectedClip: state.selectedClip,
      setSelectedClip: state.setSelectedClip,
      updateClip: state.updateClip,
      deleteClip: state.deleteClip,
      emptyTrack: state.emptyTrack,
      addClipToTrack: state.addClipToTrack,
      addEffectToTrack: state.addEffectToTrack,
      moveClip: state.moveClip,
      pushOperation: state.pushOperation,
    })),
  );

  // Dragging state
  const [isDragging, setIsDragging] = useState<{
    type: 'start' | 'end' | 'move';
    trackIndex: number;
    clipIndex: number;
    initialX: number;
    initialStartTime: number;
    initialDuration: number;
    targetTrackIndex?: number;
    currentStartTime?: number;
  } | null>(null);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    trackIndex: number;
    clipIndex: number;
  } | null>(null);

  const [activeModal, setActiveModal] = useState<{
    type: 'trim' | 'effects';
    trackIndex: number;
    clipIndex: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Handle Global Mouse Events for Dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - isDragging.initialX;
      const deltaMs = (deltaX / zoom) * 1000;

      const track = tracks[isDragging.trackIndex];
      const item = track.children[isDragging.clipIndex];

      if (!item || (item.type !== 'Clip' && item.type !== 'Effect')) return;

      // Find media to get limits
      const clip = item as TimelineClip;
      const media = project?.media.find((m) => m.id === clip.mediaId);
      const mediaDurationMs = media?.duration ? media.duration * 1000 : Infinity;

      if (isDragging.type === 'end') {
        // Calculate max allowed duration based on media length and current source start
        const maxDuration = Math.max(100, mediaDurationMs - clip.sourceStart);

        let newDuration = Math.max(100, isDragging.initialDuration + deltaMs);
        // Clamp to media duration
        newDuration = Math.min(newDuration, maxDuration);

        updateClip(isDragging.trackIndex, isDragging.clipIndex, {
          duration: newDuration,
        });
      } else if (isDragging.type === 'start') {
        const maxDelta = isDragging.initialDuration - 100; // Max we can trim from left (reducing duration)
        // Min delta is limited by sourceStart (can't go below 0)
        // newSourceStart = initialStartTime + delta >= 0  =>  delta >= -initialStartTime
        const minDelta = -isDragging.initialStartTime;

        const actualDelta = Math.max(minDelta, Math.min(deltaMs, maxDelta));

        const newSourceStart = isDragging.initialStartTime + actualDelta;
        const newDuration = isDragging.initialDuration - actualDelta;

        updateClip(isDragging.trackIndex, isDragging.clipIndex, {
          sourceStart: newSourceStart,
          duration: newDuration,
          start: item.start + actualDelta,
        });
      } else if (isDragging.type === 'move') {
        const newStartTime = isDragging.initialStartTime + deltaMs;

        // Determine destination track based upon mouse Y position
        // This relies on the tracks being rendered in order and having a known height
        // A more robust way might be using elementFromPoint, but let's try a simple calculation first based on visual order
        // OR we can rely on `onDragOver` events if we used HTML5 DnD, but we are using custom mouse events.

        // Let's use elementFromPoint to find which track we are hovering over
        // We will add a data-track-index attribute to the track container
        const elements = document.elementsFromPoint(e.clientX, e.clientY);
        const trackElement = elements.find((el) => el.hasAttribute('data-track-index'));
        const targetTrackIndex = trackElement
          ? parseInt(trackElement.getAttribute('data-track-index')!)
          : isDragging.trackIndex;

        setIsDragging((prev) =>
          prev ? { ...prev, targetTrackIndex, currentStartTime: newStartTime } : null,
        );

        // Note: moved moveClip to mouseUp for performance.
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        const track = tracks[isDragging.trackIndex];
        const item = track.children[isDragging.clipIndex];

        if (item && (item.type === 'Clip' || item.type === 'Effect')) {
          const clip = item as TimelineClip;
          const mediaId = clip.mediaId;
          const sourceStartTime = clip.sourceStart / 1000;
          const sourceDuration = clip.duration / 1000;
          const timelineStartTime = clip.start / 1000;

          // Finalize Track Move if needed
          if (
            isDragging.type === 'move' &&
            isDragging.targetTrackIndex !== undefined &&
            isDragging.targetTrackIndex !== isDragging.trackIndex
          ) {
            moveClip(
              isDragging.trackIndex,
              isDragging.clipIndex,
              item.start,
              isDragging.targetTrackIndex,
            );
          } else if (isDragging.type === 'move' && isDragging.currentStartTime !== undefined) {
            // Same track move commit
            moveClip(isDragging.trackIndex, isDragging.clipIndex, isDragging.currentStartTime);
          }

          if (mediaId && (isDragging.type === 'start' || isDragging.type === 'end')) {
            pushOperation({
              type: 'TRIM',
              mediaId,
              trackId: isDragging.trackIndex,
              sourceStart: clip.sourceStart,
              duration: clip.duration,
              start: clip.start,
            });
          }
        }
      }
      setIsDragging(null);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, tracks, updateClip, zoom]);

  const getTrackColor = (kind: string) => {
    return kind === 'Video'
      ? 'bg-blue-500/20 border-blue-500/50'
      : 'bg-green-500/20 border-green-500/50';
  };

  const handleContextMenu = (e: React.MouseEvent, trackIndex: number, clipIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      trackIndex,
      clipIndex,
    });
    // Also select the clip
    setSelectedClip({ trackIndex, itemIndex: clipIndex });
  };

  return (
    <div className="flex flex-col select-none" ref={containerRef}>
      {tracks.map((track, i) => {
        let currentTimeOffset = 0;

        return (
          <div
            key={`${track.name}-${i}-content`}
            data-track-index={i}
            className={`group relative h-14 w-full border-b border-white/5 bg-transparent ${
              isDragging?.type === 'move' && isDragging.targetTrackIndex === i ? 'bg-white/10' : ''
            }`}
            onClick={() => {
              setSelectedClip(null);
              setContextMenu(null);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              if (track.metadata?.locked) return;

              const mimeType = e.dataTransfer.types.includes('mimetype') ? '' : ''; // Cannot read during dragover easily
              e.dataTransfer.dropEffect = 'copy';
              e.currentTarget.classList.add('bg-white/5');
            }}
            onDragLeave={(e) => {
              e.currentTarget.classList.remove('bg-white/5');
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('bg-white/5');

              if (track.metadata?.locked) return;

              const mediaId = e.dataTransfer.getData('mediaid');
              const mimeType = e.dataTransfer.getData('mimetype');
              const effectType = e.dataTransfer.getData('effecttype') as any;

              if (effectType) {
                if (track.kind === 'Video') {
                  // Use the existing addEffectToTrack action from store
                  // Note: Store doesn't have addEffectToTrack in the Tracks props destructuring yet
                  // but it's in the state. I missed it in lines 14-24.
                  addEffectToTrack(i, effectType);
                } else {
                  console.warn('Cannot drop effects onto Audio tracks');
                }
                return;
              }

              if (!mediaId) return;

              const isAudioMedia = mimeType.startsWith('audio/');
              const isVideoOrImageMedia =
                mimeType.startsWith('video/') || mimeType.startsWith('image/');

              if (track.kind === 'Audio' && isAudioMedia) {
                addClipToTrack(i, mediaId);
              } else if (track.kind === 'Video' && isVideoOrImageMedia) {
                addClipToTrack(i, mediaId);
              } else {
                console.warn(`Cannot drop ${mimeType} onto ${track.kind} track`);
              }
            }}
          >
            {/* Render Clips */}
            {track.children.map((item, j) => {
              const isDraggingThis =
                isDragging?.type === 'move' &&
                isDragging.clipIndex === j &&
                isDragging.trackIndex === i;
              const effectiveStart =
                isDraggingThis && isDragging.currentStartTime !== undefined
                  ? isDragging.currentStartTime
                  : item.start;
              const durationSeconds = item.duration / 1000;
              const startSeconds = effectiveStart / 1000;

              // Only render visual for Clips and Effects
              if (item.type !== 'Clip' && item.type !== 'Effect') return null;

              const isEffect = item.type === 'Effect';
              const clip = item as TimelineClip;
              const effect = item as TimelineEffectClip;

              const isSelected = selectedClip?.trackIndex === i && selectedClip?.itemIndex === j;
              const isLocked = track.metadata?.locked;

              return (
                <div
                  key={item.id}
                  className={`absolute top-2 bottom-2 rounded border-l-2 shadow-lg transition-all overflow-hidden
                    ${isEffect ? 'bg-purple-600/40 border-purple-400 text-purple-100 ring-purple-500/50' : getTrackColor(track.kind)}
                    ${isSelected ? 'ring-2 ring-white z-10 brightness-110' : 'group-hover:brightness-125'}
                    ${isDragging?.type === 'move' && isDragging.clipIndex === j && isDragging.trackIndex === i ? 'cursor-grabbing z-50' : isLocked ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}
                  `}
                  style={{
                    left: `${startSeconds * zoom}px`,
                    width: `${durationSeconds * zoom}px`,
                    // Visual Ghosting for Cross-Track Drag
                    transform:
                      isDragging?.type === 'move' &&
                      isDragging.clipIndex === j &&
                      isDragging.trackIndex === i &&
                      isDragging.targetTrackIndex !== undefined
                        ? `translateY(${(isDragging.targetTrackIndex - i) * 56}px)` // 56px = h-14
                        : undefined,
                    zIndex:
                      isDragging?.type === 'move' &&
                      isDragging.clipIndex === j &&
                      isDragging.trackIndex === i
                        ? 50
                        : 10,
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    if (isLocked) return;

                    // Only start move if not clicking handles (handles stop propagation)
                    if (e.button === 0) {
                      setIsDragging({
                        type: 'move',
                        trackIndex: i,
                        clipIndex: j,
                        initialX: e.clientX,
                        initialStartTime: item.start,
                        initialDuration: item.duration,
                        targetTrackIndex: i, // initially same track
                        currentStartTime: item.start,
                      });
                      setSelectedClip({ trackIndex: i, itemIndex: j });
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Ensure selection is confirmed on click (redundant but safe)
                    setSelectedClip({ trackIndex: i, itemIndex: j });
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    console.log('Open Clip Options');
                  }}
                  onContextMenu={(e) => handleContextMenu(e, i, j)}
                >
                  {/* Drag Handles (Only when selected) */}
                  {isSelected && (
                    <>
                      {/* Left Handle */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize bg-white/50 hover:bg-white z-50 flex items-center justify-center group/handle"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setIsDragging({
                            type: 'start',
                            trackIndex: i,
                            clipIndex: j,
                            initialX: e.clientX,
                            initialStartTime: isEffect ? item.start : clip.sourceStart,
                            initialDuration: item.duration,
                          });
                        }}
                      >
                        <div className="h-4 w-0.5 bg-black/50" />
                      </div>

                      {/* Right Handle */}
                      <div
                        className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize bg-white/50 hover:bg-white z-50 flex items-center justify-center"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setIsDragging({
                            type: 'end',
                            trackIndex: i,
                            clipIndex: j,
                            initialX: e.clientX,
                            initialStartTime: 0, // Not needed for end trim
                            initialDuration: item.duration,
                          });
                        }}
                      >
                        <div className="h-4 w-0.5 bg-black/50" />
                      </div>
                    </>
                  )}

                  {/* Name Label */}
                  <div className="absolute inset-0 flex items-center px-2 pointer-events-none select-none z-20">
                    <div className="flex items-center gap-1.5 max-w-full">
                      {isEffect && (
                        <div className="flex items-center justify-center p-0.5 rounded bg-white/20">
                          <Magicpen
                            color="currentColor"
                            size={10}
                            variant="Bold"
                            className="text-white/90"
                          />
                        </div>
                      )}
                      <span className="text-[10px] font-bold truncate opacity-90 drop-shadow-md text-white">
                        {isEffect
                          ? effect.effectType
                          : project?.media.find((m) => m.id === clip.mediaId)?.fileName ||
                            `Clip (${clip.mediaId?.slice(-6)})`}
                      </span>
                    </div>
                  </div>

                  {track.kind === 'Audio' && (
                    <div className="absolute inset-x-0 bottom-0 top-1/2 opacity-30 pointer-events-none">
                      <svg width="100%" height="100%" preserveAspectRatio="none">
                        <path
                          d="M0 10 L5 2 L10 12 L15 5 L20 15 L25 8 L30 18"
                          stroke="currentColor"
                          fill="none"
                          strokeWidth="1"
                          className="text-green-400"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Context Menu */}
      {contextMenu && (
        <>
          {/* Backdrop to close menu */}
          <div
            className="fixed inset-0 z-50"
            onClick={() => setContextMenu(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu(null);
            }}
          />

          {/* Menu */}
          <div
            className="fixed z-50 w-48 overflow-hidden rounded-md border border-white/10 bg-[#0A0A0A] p-1 text-popover-foreground shadow-md animate-in fade-in-80 zoom-in-95"
            style={{
              top: contextMenu.y,
              left: contextMenu.x,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-1">
              <button
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-white/90 hover:bg-white/10 transition-colors"
                onClick={() => {
                  setActiveModal({
                    type: 'trim',
                    trackIndex: contextMenu.trackIndex,
                    clipIndex: contextMenu.clipIndex,
                  });
                  setContextMenu(null);
                }}
              >
                <Scissor size={14} color="currentColor" />
                <span>Trim</span>
              </button>

              <button
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-white/90 hover:bg-white/10 transition-colors"
                onClick={() => {
                  setActiveModal({
                    type: 'effects',
                    trackIndex: contextMenu.trackIndex,
                    clipIndex: contextMenu.clipIndex,
                  });
                  setContextMenu(null);
                }}
              >
                <Magicpen size={14} color="currentColor" />
                <span>Effects</span>
              </button>

              <div className="h-px bg-white/5 my-1" />

              <button
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-red-500 hover:bg-white/10 transition-colors"
                onClick={() => {
                  deleteClip(contextMenu.trackIndex, contextMenu.clipIndex);
                  setContextMenu(null);
                }}
              >
                <Trash size={14} color="currentColor" />
                <span>Delete Clip</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      {activeModal?.type === 'trim' && (
        <TrimModal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          trackIndex={activeModal.trackIndex}
          clipIndex={activeModal.clipIndex}
        />
      )}

      {activeModal?.type === 'effects' && (
        <EffectsModal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          trackIndex={activeModal.trackIndex}
          clipIndex={activeModal.clipIndex}
        />
      )}
    </div>
  );
}
