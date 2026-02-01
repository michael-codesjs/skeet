import { useAssetManager } from '@/hooks/use-asset-manager';
import { useStudioStore } from '@/stores/studio';
import { useEffect, useRef } from 'react';
import { VideoCompositor } from './video-compositor';

export function usePlayer(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const compositorRef = useRef<VideoCompositor | null>(null);
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const project = useStudioStore((state) => state.project);
  const isPlaying = useStudioStore((state) => state.isPlaying);
  const currentTime = useStudioStore((state) => state.currentTime);
  const setTime = useStudioStore((state) => state.setTime);

  const { getAsset } = useAssetManager();

  // Initialize Compositor
  useEffect(() => {
    if (!canvasRef.current || compositorRef.current) return;

    try {
      const compositor = new VideoCompositor(canvasRef.current);
      compositor.setAssetResolver(async (mediaId) => {
        const blob = await getAsset(mediaId);
        if (blob) return URL.createObjectURL(blob);
        return null;
      });
      compositorRef.current = compositor;
      console.log('VideoCompositor initialized with AssetResolver');
    } catch (e) {
      console.error('Failed to init VideoCompositor', e);
    }

    return () => {
      compositorRef.current?.dispose();
      compositorRef.current = null;
    };
  }, [canvasRef]);

  // Sync Timeline Data
  useEffect(() => {
    if (project?.otio && compositorRef.current) {
      compositorRef.current.loadTimeline(project.otio);
      // Determine max duration?
    }
  }, [project?.otio]);

  // Sync Seek (Manual time change)
  useEffect(() => {
    if (compositorRef.current && !isPlaying) {
      compositorRef.current.render(currentTime, false);
    }
  }, [currentTime, isPlaying]);

  // Playback Loop
  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = performance.now();

      const loop = (now: number) => {
        const delta = (now - lastTimeRef.current) / 1000;
        lastTimeRef.current = now;

        let nextTime = useStudioStore.getState().currentTime + delta;

        // Calculate project end time
        let maxTime = 0;
        const otio = useStudioStore.getState().project?.otio;
        if (otio) {
          otio.tracks.children.forEach((track) => {
            let trackTime = 0;
            track.children.forEach((item) => {
              trackTime += item.source_range.duration.value / item.source_range.duration.rate;
            });
            if (trackTime > maxTime) maxTime = trackTime;
          });
        }

        // If it's a completely empty project, allow up to 30s or just stop
        if (maxTime === 0) maxTime = 30;

        if (nextTime > maxTime) {
          nextTime = 0;
          useStudioStore.getState().setPlaying(false);
        }

        setTime(nextTime);
        compositorRef.current?.render(nextTime, true);

        animationFrameRef.current = requestAnimationFrame(loop);
      };

      animationFrameRef.current = requestAnimationFrame(loop);
    } else {
      cancelAnimationFrame(animationFrameRef.current);
    }

    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [isPlaying, setTime]);

  return {
    compositor: compositorRef.current,
  };
}
