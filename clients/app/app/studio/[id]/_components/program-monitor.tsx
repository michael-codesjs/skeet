import { useStudioStore } from '@/stores/studio';
import { Backward10Seconds, Forward10Seconds, Maximize2, Pause, Play } from 'iconsax-react';
import { useRef } from 'react';
import { usePlayer } from './player/use-player';

export function ProgramMonitor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { compositor } = usePlayer(canvasRef);

  const isPlaying = useStudioStore((state) => state.isPlaying);
  const setPlaying = useStudioStore((state) => state.setPlaying);
  const setTime = useStudioStore((state) => state.setTime);
  const currentTime = useStudioStore((state) => state.currentTime);

  const togglePlay = () => setPlaying(!isPlaying);
  const seek = (delta: number) => setTime(Math.max(0, currentTime + delta));

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-black relative group p-6">
      {/* Video Canvas Area */}
      <div className="flex-1 flex items-center bg-gray-800 justify-center bg-transparent relative overflow-hidden">
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#333 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        ></div>

        <div className="relative aspect-video w-full max-h-full flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={1920}
            height={1080}
            className="w-full h-full object-contain shadow-2xl bg-black"
          />
        </div>
      </div>

      {/* Floating Controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 bg-neutral-900/80 backdrop-blur-md rounded-full border border-white/10 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-50">
        <button
          onClick={() => seek(-5)}
          className="text-neutral-400 hover:text-white transition-colors"
        >
          <Backward10Seconds size={20} color="currentColor" variant="Bold" />
        </button>

        <button
          onClick={togglePlay}
          className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
        >
          {isPlaying ? (
            <Pause size={24} color="currentColor" variant="Bold" />
          ) : (
            <Play size={24} color="currentColor" variant="Bold" className="ml-1" />
          )}
        </button>

        <button
          onClick={() => seek(5)}
          className="text-neutral-400 hover:text-white transition-colors"
        >
          <Forward10Seconds size={20} color="currentColor" variant="Bold" />
        </button>

        <div className="w-px h-6 bg-white/10 mx-2" />

        <button className="text-neutral-400 hover:text-white transition-colors">
          <Maximize2 size={18} color="currentColor" />
        </button>
      </div>
    </div>
  );
}
