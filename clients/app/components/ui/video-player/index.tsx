'use client';

import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { Maximize4, Pause, Play, Refresh, Setting2, VolumeCross, VolumeHigh } from 'iconsax-react';
import React, { useEffect, useRef, useState } from 'react';

type VideoPlayerProps = {
  src: string;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
};

export function VideoPlayer({ src, poster, className, autoPlay = false }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (autoPlay && videoRef.current) {
      videoRef.current.play().catch(() => console.warn('Autoplay blocked'));
    }
  }, [autoPlay, src]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if the user is typing in an input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, hasEnded]); // Re-bind when state changes to capture correct toggle logic

  const togglePlay = (e?: React.MouseEvent | KeyboardEvent) => {
    if (e && 'stopPropagation' in e) e.stopPropagation();

    if (videoRef.current) {
      if (hasEnded) {
        videoRef.current.currentTime = 0;
        videoRef.current
          .play()
          .then(() => {
            setHasEnded(false);
            setIsPlaying(true);
          })
          .catch((err) => console.error('Playback failed:', err));
      } else if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => console.error('Playback failed:', err));
      }
    }
  };

  const handleProgress = () => {
    if (videoRef.current) {
      const currentProgress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(currentProgress);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && containerRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = (x / rect.width) * 100;
      const seekTime = (percentage / 100) * videoRef.current.duration;
      videoRef.current.currentTime = seekTime;
      setProgress(percentage);
      if (hasEnded) setHasEnded(false);
    }
  };

  const toggleMute = (e?: React.MouseEvent | KeyboardEvent) => {
    if (e && 'stopPropagation' in e) e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = (e?: React.MouseEvent | KeyboardEvent) => {
    if (e && 'stopPropagation' in e) e.stopPropagation();
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 2500);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'group relative w-full h-full bg-neutral-950 rounded-2xl overflow-hidden transition-all duration-500',
        className,
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain cursor-pointer"
        onClick={() => togglePlay()}
        onTimeUpdate={handleProgress}
        onPlay={() => {
          setIsPlaying(true);
          setHasEnded(false);
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setHasEnded(true);
          setIsPlaying(false);
          setShowControls(true);
        }}
        playsInline
      />

      {/* Center Action Overlay */}
      <AnimatePresence>
        {(!isPlaying || hasEnded) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/10 backdrop-blur-[1px] pointer-events-none"
          >
            <button
              onClick={(e) => togglePlay(e)}
              className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-center text-white shadow-[0_0_50px_rgba(0,0,0,0.5)] group/btn hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer pointer-events-auto"
            >
              {hasEnded ? (
                <Refresh
                  size={48}
                  variant="Bold"
                  color="currentColor"
                  className="group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-all"
                />
              ) : (
                <Play
                  size={48}
                  variant="Bold"
                  color="currentColor"
                  className="ml-2 group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-all"
                />
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Interface */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute inset-x-0 bottom-0 z-30 p-6 flex flex-col gap-4 bg-linear-to-t from-black/90 via-black/40 to-transparent pt-20"
          >
            {/* Progress Bar */}
            <div
              className="relative w-full cursor-pointer py-2 group/progress"
              onClick={handleSeek}
            >
              <div className="h-0.5 w-full bg-white/10 rounded-full overflow-hidden transition-all duration-300 group-hover/progress:h-1.5">
                <motion.div className="h-full bg-white relative" style={{ width: `${progress}%` }}>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,1)] opacity-0 group-hover/progress:opacity-100 transition-opacity" />
                </motion.div>
              </div>
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <button
                  onClick={togglePlay}
                  className="text-white hover:scale-110 transition-all hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                >
                  {hasEnded ? (
                    <Refresh size={24} variant="Bold" color="currentColor" />
                  ) : isPlaying ? (
                    <Pause size={24} variant="Bold" color="currentColor" />
                  ) : (
                    <Play size={24} variant="Bold" color="currentColor" />
                  )}
                </button>

                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleMute}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    {isMuted ? (
                      <VolumeCross size={20} variant="Bold" color="currentColor" />
                    ) : (
                      <VolumeHigh size={20} variant="Bold" color="currentColor" />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-white/50">
                  <span className="text-white/90">
                    {videoRef.current ? formatTime(videoRef.current.currentTime) : '0:00'}
                  </span>
                  <span className="opacity-30">/</span>
                  <span>{videoRef.current ? formatTime(videoRef.current.duration) : '0:00'}</span>
                </div>
              </div>

              <div className="flex items-center gap-5">
                <button className="text-white/40 hover:text-white transition-colors">
                  <Setting2 size={20} variant="Linear" color="currentColor" />
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="text-white/40 hover:text-white transition-all hover:scale-110"
                >
                  <Maximize4 size={20} variant="Linear" color="currentColor" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
