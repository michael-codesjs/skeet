'use client';

import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { TimelineClip, useStudioStore } from '@/stores/studio';
import { Magicpen } from 'iconsax-react';
import { useEffect, useRef, useState } from 'react';

interface TrimModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackIndex: number;
  clipIndex: number;
}

export function TrimModal({ isOpen, onClose, trackIndex, clipIndex }: TrimModalProps) {
  const { project, updateClip, pushOperation } = useStudioStore();
  const videoRef = useRef<HTMLVideoElement>(null);

  const clip = project?.timeline?.tracks[trackIndex]?.children[clipIndex] as TimelineClip;
  const media = project?.media.find((m) => m.id === clip?.mediaId);

  const [trimStart, setTrimStart] = useState<number>(clip?.sourceStart || 0);
  const [trimDuration, setTrimDuration] = useState<number>(clip?.duration || 0);
  const [zoom, setZoom] = useState<number>(clip?.metadata?.zoom || 1);
  const [panX, setPanX] = useState<number>(clip?.metadata?.panX || 0);
  const [panY, setPanY] = useState<number>(clip?.metadata?.panY || 0);
  const [isReady, setIsReady] = useState(false);

  // Derived end time
  const trimEnd = trimStart + trimDuration;
  const totalMediaDuration = (media?.duration || 0) * 1000;

  // Interaction State for Pan/Zoom
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (clip) {
      setTrimStart(clip.sourceStart);
      setTrimDuration(clip.duration);
      setZoom(clip.metadata?.zoom || 1);
      setPanX(clip.metadata?.panX || 0);
      setPanY(clip.metadata?.panY || 0);
    }
  }, [clip]);

  const handleSave = () => {
    if (!clip || !media) return;

    updateClip(trackIndex, clipIndex, {
      sourceStart: trimStart,
      duration: trimDuration,
      metadata: {
        ...clip.metadata,
        zoom,
        panX,
        panY,
      },
    });

    pushOperation({
      type: 'TRIM',
      mediaId: media.id,
      trackId: trackIndex,
      sourceStart: trimStart,
      duration: trimDuration,
      start: clip.start,
    });

    onClose();
  };

  const syncVideo = (timeMs: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timeMs / 1000;
    }
  };

  // Pan & Zoom Event Handlers
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    setZoom((prev: number) => Math.min(3, Math.max(1, prev + delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - lastMousePos.x;
    const deltaY = e.clientY - lastMousePos.y;

    setPanX((prev: number) => prev + deltaX);
    setPanY((prev: number) => prev - deltaY);

    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (!clip || !media) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Trim & Crop Media"
      maxWidth="2xl"
      className="bg-[#0A0A0A] border-white/10 rounded-2xl"
      footer={
        <div className="flex justify-end gap-2 w-full px-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-neutral-400 hover:text-white h-8 text-xs"
          >
            Cancel
          </Button>
          <Button onClick={handleSave} variant="blue" size="sm" className="h-8 text-xs px-4">
            Save Changes
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5 p-4 select-none">
        {/* Preview Area (Interactive) */}
        <div
          className="relative aspect-video w-full rounded-xl overflow-hidden bg-neutral-900 border border-white/5 ring-1 ring-white/10 shadow-xl cursor-move group"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Instructions Overlay */}
          <div className="absolute inset-x-0 top-4 z-20 flex justify-center pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100">
            <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-medium text-white/80 border border-white/10 shadow-lg">
              SCROLL to Zoom • DRAG to Pan
            </div>
          </div>

          <video
            ref={videoRef}
            src={media.videoUrl || media.proxyUrl || ''}
            className="w-full h-full object-contain transition-transform duration-75 ease-out will-change-transform"
            style={{
              transform: `scale(${zoom}) translate(${panX / zoom}px, ${-panY / zoom}px)`,
            }}
            onLoadedData={() => {
              setIsReady(true);
              syncVideo(trimStart);
            }}
          />
          {!isReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-neutral-900 pointer-events-none">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Controls Grid */}
        <div className="grid grid-cols-1 gap-2">
          {/* Trimming UI (Full Width) */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-blue-500/10 text-blue-500">
                  <Magicpen size={12} variant="Bulk" />
                </div>
                <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                  Trim Duration
                </h4>
              </div>
              <p className="text-xs font-bold text-white font-mono">
                {(trimDuration / 1000).toFixed(2)}s
              </p>
            </div>

            <div className="relative h-8 flex items-center group">
              <div className="absolute inset-x-0 h-1 bg-neutral-800 rounded-full" />
              <div
                className="absolute h-1 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)] rounded-full transition-all duration-75"
                style={{
                  left: `${(trimStart / totalMediaDuration) * 100}%`,
                  width: `${(trimDuration / totalMediaDuration) * 100}%`,
                }}
              />

              <input
                type="range"
                min={0}
                max={totalMediaDuration}
                step={10}
                value={trimStart}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  const newStart = Math.min(val, trimEnd - 100);
                  setTrimStart(newStart);
                  setTrimDuration(trimEnd - newStart);
                  syncVideo(newStart);
                }}
                className="absolute w-full h-1 appearance-none bg-transparent pointer-events-none z-20 
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:pointer-events-auto 
                  [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full 
                  [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500 
                  [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
              />
              <input
                type="range"
                min={0}
                max={totalMediaDuration}
                step={10}
                value={trimEnd}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  const newEnd = Math.max(val, trimStart + 100);
                  setTrimDuration(newEnd - trimStart);
                  syncVideo(newEnd);
                }}
                className="absolute w-full h-1 appearance-none bg-transparent pointer-events-none z-10 
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:pointer-events-auto 
                  [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full 
                  [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500 
                  [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>
            <div className="flex justify-between text-[9px] font-bold text-neutral-600 uppercase tracking-tighter">
              <span>0.00s</span>
              <span className="text-white/40">
                {(trimStart / 1000).toFixed(1)}s — {(trimEnd / 1000).toFixed(1)}s
              </span>
              <span>{(totalMediaDuration / 1000).toFixed(2)}s</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
