import { Router } from 'express';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { pipeline } from 'stream/promises';
import { getPrisma } from '../context';
import { analyzeMediaDeeply } from '../lib/analyzer';
import { triggerPusherEvent } from '../lib/pusher';
import { s3 } from '../lib/storage/s3';
import { verifyQStashSignature } from '../middleware/qstash-verify';

const router = Router();

export interface AnalyzeJobPayload {
  projectId?: string; // Optional context
  videoFileId: string;
}

router.post('/gemini-analyzer', verifyQStashSignature, async (req, res) => {
  const { videoFileId, projectId } = req.body as AnalyzeJobPayload;
  console.log(`[Analyzer] Starting deep analysis for file: ${videoFileId}`);

  const prisma = getPrisma();

  // Temp directory
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), `analyzer-${videoFileId}-`));

  try {
    const videoFile = await prisma.videoFile.findUnique({ where: { id: videoFileId } });
    if (!videoFile) throw new Error('Video file not found');

    let projectVibe: string | undefined;
    if (projectId) {
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      projectVibe = project?.prompt;
    }

    const extension = path.extname(videoFile.fileName);
    const localPath = path.join(tempDir, `input${extension}`);

    // Download
    console.log('[Analyzer] Downloading video...');
    const stream = await s3.getObjectStream(videoFile.s3Key);
    await pipeline(stream, fs.createWriteStream(localPath));

    // Analyze
    console.log('[Analyzer] Running Masterpiece Engine Analysis...');
    // We pass S3 URL if we need Gemini to download directly,
    // but for now we pass localPath for FFmpeg and assume AnalyzeDeep handles Gemini upload internally if needed.
    const downloadUrl = await s3.getDownloadUrl(videoFile.s3Key);
    const manifest = await analyzeMediaDeeply(
      downloadUrl,
      localPath,
      videoFile.mimeType,
      projectVibe,
    );

    console.log('[Analyzer] Analysis Complete. Saving Manifest...');

    // Update DB
    await prisma.videoFile.update({
      where: { id: videoFileId },
      data: {
        analysisData: manifest as any, // Cast to JSON
        analysisReady: true,
        // We might want to save dominant color or vibe tags to searchable columns later
      },
    });

    // Notify Frontend
    if (projectId) {
      await triggerPusherEvent(`project-${projectId}`, 'asset-analyzed', {
        fileId: videoFileId,
        manifestSummary: {
          colors: manifest.semantic.dominantColors,
          vibe: manifest.semantic.vibeTags,
        },
      });
    }

    res.status(200).json({ status: 'success', manifest });
  } catch (error) {
    console.error('[Analyzer] Fatal Error:', error);
    // Don't mark file as failed? Or maybe just log it.
    // We want to be resilient. If deep analysis fails, we can fall back to basic.
    res.status(500).json({ error: 'Analysis failed' });
  } finally {
    // Cleanup
    try {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    } catch {}
  }
});

export default router;
