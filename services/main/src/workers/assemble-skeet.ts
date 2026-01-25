import { Router } from 'express';
import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { pipeline } from 'stream/promises';
import { getPrisma } from '../context';
import { triggerPusherEvent } from '../lib/pusher';
import { AssembleSkeetJobPayload } from '../lib/qstash';
import { S3Service } from '../lib/storage/s3';
import { getStyleProfile } from '../lib/video-fx';
import { verifyQStashSignature } from '../middleware/qstash-verify';

type ClipMetadata = {
  path: string;
  duration: number; // in seconds
  fileId: string;
};

const router = Router();

// Helper to normalize a clip to a standard intermediate format
const normalizeClip = (
  inputPath: string,
  outputPath: string,
  trimStart: number,
  trimEnd: number,
  speed: number,
  extraFilters: string[] = [], // Global clip filters
  semanticTriggers: any[] = [], // Time-based VFX triggers
): Promise<number> => {
  return new Promise((resolve, reject) => {
    // 1. Calculate duration after trim and speed
    const rawDuration = Math.max(0.1, trimEnd - trimStart);
    const finalDuration = rawDuration / speed;

    const atempo = Math.max(0.5, Math.min(2.0, speed));
    const setPtsVal = (1 / speed).toFixed(4);

    // Build filter chain
    const filters = [
      'scale=1080:1920:force_original_aspect_ratio=increase',
      'crop=1080:1920',
      'setsar=1',
      // Apply speed first
      `setpts=${setPtsVal}*PTS`,
      // Then apply creative filters (e.g., zoompan, glitch)
      ...extraFilters,
    ];

    // Inject Semantic Triggers (Time-based VFX)
    // Example: { type: 'glitch', timestamp: 1.5 } -> enable='between(t,1.5,1.7)'
    semanticTriggers.forEach((trigger) => {
      if (trigger.type === 'glitch') {
        const start = trigger.timestamp;
        const end = start + 0.2; // 200ms glitch duration
        // Use shift logic without expressions, but limit to time window
        // Note: rgbashift doesn't support 'enable'. We use 'smartblur' or 'noise' for glitchiness that supports enable
        // OR we rely on a filter that supports it. 'noise' is good.
        filters.push(`noise=c0s=20:allf=t+u:enable='between(t,${start},${end})'`);
        filters.push(`chromashift=cbh=8:cbv=-8:enable='between(t,${start},${end})'`);
      }
    });

    ffmpeg(inputPath)
      .seekInput(trimStart)
      .duration(rawDuration)
      .videoFilters(filters)
      .audioFilters([`atempo=${atempo}`])
      .outputOptions([
        '-c:v libx264', // Keep software enc for intermediate to allow complex filters safely
        '-preset ultrafast',
        '-r 30', // Force 30fps
        '-g 60',
        '-c:a aac',
        '-ar 48000',
        '-ac 2',
        '-pix_fmt yuv420p',
      ])
      .output(outputPath)
      .on('end', () => resolve(finalDuration))
      .on('error', (err) => reject(err))
      .run();
  });
};

router.post('/assemble-skeet', verifyQStashSignature, async (req, res) => {
  const { projectId, edl } = req.body as AssembleSkeetJobPayload;
  console.log(`[Assembler] Starting Masterpiece Engine for project: ${projectId}`);

  if (!edl || !edl.clips || edl.clips.length === 0) {
    res.status(400).json({ error: 'Invalid EDL' });
    return;
  }

  const prisma = getPrisma();
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), `skeet-${projectId}-`));
  const finalOutputPath = path.join(tempDir, `final_${projectId}.mp4`);

  try {
    // 0. DETERMINE STYLE PROFILE
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new Error('Project not found');

    const styleProfile = getStyleProfile(project.prompt); // "Vibe" analysis
    console.log(`[Assembler] Selected Style Profile: ${styleProfile.name}`);

    // ==========================================
    // PHASE 1: DOWNLOAD & SMART NORMALIZE
    // ==========================================
    const processedClips: ClipMetadata[] = [];

    for (let i = 0; i < edl.clips.length; i++) {
      const clip = edl.clips[i];

      try {
        console.log(`[Assembler] Processing clip ${i + 1}/${edl.clips.length}: ${clip.fileId}`);

        const videoFile = await prisma.videoFile.findUnique({ where: { id: clip.fileId } });
        if (!videoFile) throw new Error(`Video file ${clip.fileId} not found`);

        const rawPath = path.join(tempDir, `raw_${i}${path.extname(videoFile.fileName)}`);
        const normPath = path.join(tempDir, `norm_${i}.mp4`);

        // Download
        const stream = await S3Service.getInstance().getObjectStream(videoFile.s3Key);
        await pipeline(stream, fs.createWriteStream(rawPath));

        // Get Style-Specific Filters for this clip
        // (e.g., zoompan for high energy, or glitch sync)
        const clipFilters = styleProfile.filters.clip
          ? styleProfile.filters.clip(clip.fileId, i)
          : [];

        // Check for Semantic Triggers from Reasoning Engine
        // @ts-ignore - EDL type update pending propagation
        const semanticTriggers = clip.effects || [];

        // Normalize with FX baked in
        const actualDuration = await normalizeClip(
          rawPath,
          normPath,
          clip.start,
          clip.end,
          clip.speed || styleProfile.speedFactor,
          clipFilters,
          semanticTriggers,
        );

        processedClips.push({
          fileId: clip.fileId,
          path: normPath,
          duration: actualDuration,
        });
      } catch (clipErr) {
        console.error(`[Assembler] Failed to process clip ${clip.fileId}`, clipErr);
      }
    }

    if (processedClips.length < 1) throw new Error('No clips successfully processed');

    // ==========================================
    // PHASE 2: ADVANCED FILTER GRAPH ASSEMBLY
    // ==========================================
    console.log('[Assembler] Constructing Multi-Layer Filter Graph...');

    let complexFilter: string[] = [];
    let inputsCount = processedClips.length;
    let runningDuration = processedClips[0].duration;
    let lastVideoLabel = '0:v';
    let lastAudioLabel = '0:a';

    let command = ffmpeg();
    processedClips.forEach((c) => command.input(c.path));

    if (inputsCount === 1) {
      lastVideoLabel = '0:v';
      lastAudioLabel = '0:a';
    } else {
      for (let i = 1; i < inputsCount; i++) {
        const nextClip = processedClips[i];

        // Use Profile default transition unless EDL overrides
        const edlTrans = edl.clips[i].transition;
        const transType =
          edlTrans?.type !== 'none' && edlTrans?.type
            ? edlTrans.type
            : styleProfile.transitionDefault;

        // Calculate Safe Duration
        // Cap at 40% of min clip length to be super safe allowing for other FX
        const suggestedDur = edlTrans?.duration || styleProfile.transitionDuration;
        const maxDur = Math.min(runningDuration, nextClip.duration);
        const transDur = Math.min(suggestedDur, maxDur * 0.4);

        let offset = runningDuration - transDur;
        if (offset < 0) offset = 0;

        const outV = `v_m${i}`;
        const outA = `a_m${i}`;

        // Video Xfade
        complexFilter.push(
          `[${lastVideoLabel}][${i}:v]xfade=transition=${transType}:duration=${transDur.toFixed(3)}:offset=${offset.toFixed(3)}[${outV}]`,
        );

        // Audio Crossfade
        complexFilter.push(
          `[${lastAudioLabel}][${i}:a]acrossfade=d=${transDur.toFixed(3)}:c1=tri:c2=tri[${outA}]`,
        );

        lastVideoLabel = outV;
        lastAudioLabel = outA;
        runningDuration = offset + nextClip.duration;
      }
    }

    // ==========================================
    // PHASE 3: MASTERING (Grade + Overlay + Audio)
    // ==========================================
    let gradedV = 'v_graded';

    // Apply Master Filters from Profile
    // (e.g., Grain, Vignette, EQ)
    const masterFilters = styleProfile.filters.master || [];
    let masterFilterChain = masterFilters.join(',');

    // Fallback if no master filters
    if (!masterFilterChain) {
      masterFilterChain = 'eq=saturation=1.1:contrast=1.05';
    }

    complexFilter.push(`[${lastVideoLabel}]${masterFilterChain}[${gradedV}]`);

    // Audio Ambience
    complexFilter.push(`anoisesrc=d=120:c=brown:a=0.01:r=48000,pan=stereo|c0=c0|c1=c0[ambience]`);
    let masterA = 'a_mastered';
    complexFilter.push(
      `[${lastAudioLabel}][ambience]amix=inputs=2:duration=first:dropout_transition=2[${masterA}]`,
    );

    // ==========================================
    // EXECUTE WITH HARDWARE ACCELERATION
    // ==========================================
    command
      .complexFilter(complexFilter)
      .outputOptions([
        '-map',
        `[${gradedV}]`,
        '-map',
        `[${masterA}]`,
        // Hardware Acceleration for Final Render
        '-c:v',
        'h264_videotoolbox',
        '-b:v',
        '6000k', // High bitrate for quality
        '-allow_sw',
        '1', // Allow software fallback if needed
        '-c:a',
        'aac',
        '-b:a',
        '192k',
        '-pix_fmt',
        'yuv420p',
        '-movflags',
        '+faststart',
      ])
      .output(finalOutputPath)
      .on('start', (cmd) => console.log('[Assembler] Final Render Command:', cmd))
      .on('error', (err) => {
        console.error('[Assembler] Final Render failed:', err);
        throw err;
      })
      .on('end', async () => {
        console.log('[Assembler] Final Render Success!');
        const fileBuffer = await fs.promises.readFile(finalOutputPath);
        const s3Key = `skeets/${projectId}/final-${Date.now()}.mp4`;
        await S3Service.getInstance().uploadBuffer(s3Key, fileBuffer, 'video/mp4');

        await prisma.project.update({
          where: { id: projectId },
          data: {
            status: 'READY',
            finalS3Key: s3Key,
          },
        });

        await triggerPusherEvent(`project-${projectId}`, 'skeet-ready', {
          s3Key,
          url: await S3Service.getInstance().getDownloadUrl(s3Key),
        });

        await fs.promises.rm(tempDir, { recursive: true, force: true });
        res.status(200).json({ status: 'success', s3Key });
      })
      .run();
  } catch (error) {
    console.error('[Assembler] Fatal Job Error:', error);
    await prisma.project.update({ where: { id: projectId }, data: { status: 'FAILED' } });
    await triggerPusherEvent(`project-${projectId}`, 'skeet-failed', { error: 'Assembly failed' });
    try {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    } catch {}
    if (!res.headersSent) res.status(500).json({ error: 'Assembly failed' });
  }
});

export default router;
