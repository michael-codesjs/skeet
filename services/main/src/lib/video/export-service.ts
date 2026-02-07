import { getPrisma } from '@/context';
import { s3 } from '@/lib/storage/s3';
import { TimelineClip, TimelineData } from '@/lib/timeline/builder';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { FFmpegEngine, FilterComplex } from './ffmpeg-engine';

/**
 * ExportService
 * Responsible for translating OTIO timelines into high-resolution FFmpeg renders.
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

    const timeline = project.timeline as unknown as TimelineData;
    const engine = new FFmpegEngine();

    // 2. Prepare Inputs & Calculate Timeline Bounds
    const mediaMap = new Map<
      string,
      { label: string; s3Key: string; url: string; mimeType?: string }
    >();
    const clipsToProcess: { clip: TimelineClip; trackIndex: number }[] = [];
    let totalDurationMs = 0;

    for (let trackIndex = 0; trackIndex < timeline.tracks.children.length; trackIndex++) {
      const track = timeline.tracks.children[trackIndex];

      for (const item of track.children) {
        if (item.type === 'Clip') {
          const clip = item as TimelineClip;
          const mediaId = clip.mediaId;

          if (mediaId && !mediaMap.has(mediaId)) {
            const mediaRecord = project.media.find((m) => m.id === mediaId);
            if (mediaRecord?.s3Key) {
              const url = await s3.getDownloadUrl(mediaRecord.s3Key, 7200);
              const isImage = mediaRecord.mimeType?.startsWith('image/');

              // For images, we loop them. For videos, we just add them.
              const inputOptions = isImage ? ['-loop 1'] : [];
              const label = engine.addInput(url, inputOptions);

              mediaMap.set(mediaId, {
                label,
                s3Key: mediaRecord.s3Key,
                url,
                mimeType: mediaRecord.mimeType || undefined,
              });
            }
          }

          if (mediaId) {
            clipsToProcess.push({ clip, trackIndex });
          }
          const itemEndMs = clip.start + clip.duration;
          if (itemEndMs > totalDurationMs) totalDurationMs = itemEndMs;
        } else if (item.type === 'Gap') {
          const itemEndMs = item.start + item.duration;
          if (itemEndMs > totalDurationMs) totalDurationMs = itemEndMs;
        }
      }
    }

    // Default duration if timeline is empty
    const renderDuration = Math.max(1, totalDurationSeconds);

    // 3. Build Filter Graph
    const allFilters: FilterComplex[] = [];

    // START WITH A BLACK BACKGROUND
    // Use the color filter as a internal source within the complex filter graph to avoid '-f lavfi' errors.
    const bgOutputLabel = 'bg';
    allFilters.push({
      filter: `color=c=black:s=1080x1920:d=${renderDuration}`,
      outputs: bgOutputLabel,
    });
    let lastVideoLabel = bgOutputLabel;
    let lastAudioLabel = '';

    const videoClips = clipsToProcess.filter(
      (c) => timeline.tracks.children[c.trackIndex].kind === 'Video',
    );
    // Sort clips to ensure they are processed in layering order (Tracks bottom -> top)
    // and then sequentially.
    videoClips.sort((a, b) => {
      if (a.trackIndex !== b.trackIndex) return a.trackIndex - b.trackIndex;
      return a.clip.start - b.clip.start;
    });

    const audioClips = clipsToProcess.filter(
      (c) => timeline.tracks.children[c.trackIndex].kind === 'Audio',
    );

    // Build Video Streams
    videoClips.forEach((item, i) => {
      const media = mediaMap.get(item.clip.media_reference.metadata.mediaId)!;
      // Get the correct stream label (0:v, 1:v, etc.)
      const inputLabel = media.label;
      const outputLabel = `v${i}`;

      const start =
        item.clip.source_range.start_time.value / item.clip.source_range.start_time.rate;
      const duration = item.clip.source_range.duration.value / item.clip.source_range.duration.rate;

      // Filter: Trim -> SetPTS (position on global timeline) -> Scale/Pad (standard resolution)
      allFilters.push({
        filter: `trim=start=${start}:duration=${duration},setpts=PTS-STARTPTS+(${timelineStart}/TB),scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2`,
        inputs: inputLabel,
        outputs: outputLabel,
      });

      // Chain overlays on top of the black background
      const compositeLabel = `vcomp${i}`;
      allFilters.push({
        filter: 'overlay=eof_action=pass',
        inputs: [lastVideoLabel, outputLabel],
        outputs: compositeLabel,
      });
      lastVideoLabel = compositeLabel;
    });

    // Build Audio Streams
    audioClips.forEach((item, i) => {
      const media = mediaMap.get(item.clip.media_reference.metadata.mediaId)!;
      const inputLabel = media.label.replace(':v', ':a'); // Switch to audio stream
      const outputLabel = `a${i}`;

      const start =
        item.clip.source_range.start_time.value / item.clip.source_range.start_time.rate;
      const duration = item.clip.source_range.duration.value / item.clip.source_range.duration.rate;

      allFilters.push({
        filter: `atrim=start=${start}:duration=${duration},asetpts=PTS-STARTPTS+(${timelineStart}/TB)`,
        inputs: inputLabel,
        outputs: outputLabel,
      });
    });

    if (audioClips.length > 0) {
      const audioInputs = audioClips.map((_, i) => `a${i}`);
      const mixLabel = 'afinal';
      allFilters.push({
        filter: `amix=inputs=${audioClips.length}:dropout_transition=0`,
        inputs: audioInputs,
        outputs: mixLabel,
      });
      lastAudioLabel = mixLabel;
    }

    // 4. Setup Engine
    engine.addFilters(allFilters);
    if (lastVideoLabel) engine.addMap(lastVideoLabel);
    if (lastAudioLabel) engine.addMap(lastAudioLabel);

    // 5. Render
    const tempDir = os.tmpdir();
    const outputFileName = `render-${projectId}-${Date.now()}.mp4`;
    const outputPath = path.join(tempDir, outputFileName);

    await engine.render(outputPath);

    // 6. Upload and Cleanup
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
