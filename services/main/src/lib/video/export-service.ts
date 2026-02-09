import { getPrisma } from '@/context';
import { s3 } from '@/lib/storage/s3';
import {
  Timeline,
  TimelineClip,
  TimelineEffectClip,
  TimelineTrackChild,
} from '@/lib/timeline/types';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { FFmpegEngine, FilterComplex } from './ffmpeg-engine';

/**
 * ExportService
 * Responsible for translating TSG timelines into high-resolution FFmpeg renders.
 */
export class ExportService {
  /**
   * Main entry point for exporting a project.
   */
  public exportProject = async (projectId: string): Promise<string> => {
    const prisma = getPrisma();

    // 1. Fetch Project and Timeline
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { media: true },
    });

    if (!project || !project.timeline) {
      throw new Error('Project or Timeline not found');
    }

    const timeline = project.timeline as unknown as Timeline;
    const engine = new FFmpegEngine();

    // 2. Prepare Inputs & Calculate Timeline Bounds
    const mediaMap = new Map<
      string,
      { label: string; s3Key: string; url: string; mimeType?: string }
    >();
    const clipsByTrack: Record<number, TimelineTrackChild[]> = {};
    let totalDurationMs = 0;

    // First pass: Find all unique media and calculate total duration
    for (let trackIdx = 0; trackIdx < timeline.tracks.length; trackIdx++) {
      const track = timeline.tracks[trackIdx];
      clipsByTrack[trackIdx] = track.children;

      for (const item of track.children) {
        const itemEndMs = item.start + item.duration;
        if (itemEndMs > totalDurationMs) totalDurationMs = itemEndMs;

        if (item.type === 'Clip') {
          const mediaId = (item as TimelineClip).mediaId;
          if (mediaId && !mediaMap.has(mediaId)) {
            const mediaRecord = project.media.find((m) => m.id === mediaId);
            if (mediaRecord?.s3Key) {
              const url = await s3.getDownloadUrl(mediaRecord.s3Key, 7200);
              const label = engine.addInput(url);
              mediaMap.set(mediaId, {
                label,
                s3Key: mediaRecord.s3Key,
                url,
                mimeType: mediaRecord.mimeType || undefined,
              });
            }
          }
        }
      }
    }

    const renderDurationS = Math.max(0.1, totalDurationMs / 1000);
    const canvasWidth = 1080;
    const canvasHeight = 1920;

    // 3. Build Filter Graph (Canvas Approach)
    const allFilters: FilterComplex[] = [];

    // --- PHASE 1: INITIALIZE BLACK BACKGROUND ---
    const bgLabel = '[v_bg]';
    allFilters.push({
      filter: `color=c=black:s=${canvasWidth}x${canvasHeight}:d=${renderDurationS}`,
      outputs: bgLabel,
    });

    let currentVideoLabel = bgLabel;
    const audioLabels: string[] = [];

    // --- PHASE 2: PROCESS TRACKS SEQUENTIALLY ---
    // Track order: Main Visuals (0) -> FX & Overlays (2)
    const visualTrackIndices = [0, 2];

    for (const trackIdx of visualTrackIndices) {
      const children = clipsByTrack[trackIdx] || [];

      for (let i = 0; i < children.length; i++) {
        const item = children[i];
        if (item.type === 'Clip') {
          const clip = item as TimelineClip;
          const media = mediaMap.get(clip.mediaId);
          if (!media) continue;

          const startS = clip.start / 1000;
          const durS = clip.duration / 1000;
          const srcStartS = (clip.sourceStart || 0) / 1000;
          const inputLabel = media.label;
          const preProcLabel = `v_prep_${trackIdx}_${i}`;
          const compositeLabel = `v_comp_${trackIdx}_${i}`;

          // Metadata-driven transitions
          const transIn = clip.metadata?.transitionIn;
          const transInDur = Number(clip.metadata?.transitionInDuration || 0) / 1000;
          const transOut = clip.metadata?.transitionOut;
          const transOutDur = Number(clip.metadata?.transitionOutDuration || 0) / 1000;

          let clipFilters = `trim=start=${srcStartS}:duration=${durS},setpts=PTS-STARTPTS+(${startS}/TB),scale=${canvasWidth}:${canvasHeight}:force_original_aspect_ratio=decrease,pad=${canvasWidth}:${canvasHeight}:(ow-iw)/2:(oh-ih)/2`;

          if (transIn === 'fade' && transInDur > 0) {
            clipFilters += `,fade=t=in:st=${startS}:d=${transInDur}`;
          }
          if (transOut === 'fade' && transOutDur > 0) {
            clipFilters += `,fade=t=out:st=${startS + durS - transOutDur}:d=${transOutDur}`;
          }

          allFilters.push({
            filter: clipFilters,
            inputs: inputLabel,
            outputs: preProcLabel,
          });

          // Overlay onto current canvas
          allFilters.push({
            filter: `overlay=enable='between(t,${startS},${startS + durS})'`,
            inputs: [currentVideoLabel, preProcLabel],
            outputs: compositeLabel,
          });

          currentVideoLabel = compositeLabel;
        } else if (item.type === 'Effect') {
          const effect = item as TimelineEffectClip;
          const startS = effect.start / 1000;
          const durS = effect.duration / 1000;
          const endS = startS + durS;
          const effectLabel = `v_fx_${trackIdx}_${i}`;

          let fxFilter = '';
          if (effect.effectType === 'Zoom') {
            const level = effect.parameters?.u_level || 1.1;
            fxFilter = `scale=iw*${level}:ih*${level},crop=iw/${level}:ih/${level}`;
          } else if (effect.effectType === 'Glitch') {
            const intensity = effect.parameters?.u_intensity || 0.5;
            fxFilter = `hue=h='if(between(t,${startS},${endS}),random(1)*360,0)':s='if(between(t,${startS},${endS}),${intensity * 5},1)',noise=c0s=${intensity * 50}:allf=t`;
          } else if (effect.effectType === 'Grayscale') {
            fxFilter = 'format=gray';
          }

          if (fxFilter) {
            allFilters.push({
              filter: `${fxFilter}`,
              inputs: currentVideoLabel,
              outputs: effectLabel,
              options: { enable: `between(t,${startS},${endS})` },
            });
            currentVideoLabel = effectLabel;
          }
        }
      }
    }

    // --- PHASE 3: PROCESS AUDIO ---
    // Track order: Soundtrack (1) -> Sound Effects (3)
    const audioTrackIndices = [1, 3];
    for (const trackIdx of audioTrackIndices) {
      const children = clipsByTrack[trackIdx] || [];
      for (let i = 0; i < children.length; i++) {
        const item = children[i];
        if (item.type !== 'Clip') continue;

        const clip = item as TimelineClip;
        const media = mediaMap.get(clip.mediaId);
        if (!media) continue;

        const startS = clip.start / 1000;
        const durS = clip.duration / 1000;
        const srcStartS = (clip.sourceStart || 0) / 1000;
        const inputLabel = media.label.replace(':v', ':a');
        const prepLabel = `a_prep_${trackIdx}_${i}`;

        allFilters.push({
          filter: `atrim=start=${srcStartS}:duration=${durS},asetpts=PTS-STARTPTS,adelay=${clip.start}|${clip.start}`,
          inputs: inputLabel,
          outputs: prepLabel,
        });
        audioLabels.push(prepLabel);
      }
    }

    if (audioLabels.length > 0) {
      const afinalLabel = '[afinal]';
      allFilters.push({
        filter: `amix=inputs=${audioLabels.length}:duration=longest:dropout_transition=0`,
        inputs: audioLabels,
        outputs: afinalLabel,
      });
      engine.addMap(currentVideoLabel);
      engine.addMap(afinalLabel);
    } else {
      engine.addMap(currentVideoLabel);
    }

    engine.addFilters(allFilters);

    // 4. Render
    const tempDir = os.tmpdir();
    const outputFileName = `render-${projectId}-${Date.now()}.mp4`;
    const outputPath = path.join(tempDir, outputFileName);

    console.log(
      `[Export Service] 🚀 Rendering project ${projectId} (${renderDurationS.toFixed(2)}s)`,
    );
    await engine.render(outputPath);

    // 5. Upload and Cleanup
    const finalS3Key = `projects/${projectId}/renders/${outputFileName}`;
    const fileStream = fs.createReadStream(outputPath);
    await s3.uploadStream(finalS3Key, fileStream, 'video/mp4');

    await prisma.project.update({
      where: { id: projectId },
      data: { finalS3Key, status: 'READY' },
    });

    try {
      fs.unlinkSync(outputPath);
    } catch (e) {
      console.warn('Failed to cleanup temp render file', e);
    }

    return finalS3Key;
  };
}

export const exportService = new ExportService();
