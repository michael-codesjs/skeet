import { Request, Response, Router } from 'express';
import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { pipeline } from 'stream/promises';
import { getPrisma } from '../context';
import { triggerPusherEvent } from '../lib/pusher';
import { ThumbnailJobPayload } from '../lib/qstash';
import { S3Service } from '../lib/storage/s3';
import { verifyQStashSignature } from '../middleware/qstash-verify';

const router = Router();

/**
 * Check if both jobs are complete and update status to READY
 */
async function checkAndFinalizeStatus(videoFileId: string): Promise<void> {
  const prisma = getPrisma();
  const videoFile = await prisma.videoFile.findUnique({
    where: { id: videoFileId },
    select: { thumbnailReady: true, analysisReady: true, projectId: true },
  });

  if (videoFile?.thumbnailReady && videoFile?.analysisReady) {
    const updatedFile = await prisma.videoFile.update({
      where: { id: videoFileId },
      data: { status: 'READY' },
    });
    console.log(`[Worker] Video ${videoFileId} is fully processed and READY!`);

    // Trigger final completion event
    if (updatedFile.projectId) {
      await triggerPusherEvent(`project-${updatedFile.projectId}`, 'asset-updated', {
        fileId: videoFileId,
        status: 'READY',
      });
    }
  }
}

/**
 * POST /api/workers/generate-thumbnail
 * QStash-triggered endpoint for thumbnail generation
 */
router.post(
  '/generate-thumbnail',
  verifyQStashSignature,
  async (req: Request, res: Response): Promise<void> => {
    const { videoFileId } = req.body as ThumbnailJobPayload;

    console.log(`[Thumbnail Worker] Starting for video: ${videoFileId}`);

    try {
      // 1. Get the video file record
      const prisma = getPrisma();
      const videoFile = await prisma.videoFile.findUnique({
        where: { id: videoFileId },
      });

      if (!videoFile) {
        res.status(404).json({ error: 'VideoFile not found' });
        return;
      }

      // Idempotency check: skip if already processed
      if (videoFile.thumbnailReady) {
        console.log(`[Thumbnail Worker] Already processed, skipping: ${videoFileId}`);
        res.status(200).json({ status: 'already_processed' });
        return;
      }

      const tempDir = os.tmpdir();
      const tempVideoPath = path.join(tempDir, `${videoFileId}-${videoFile.fileName}`);
      const tempThumbPath = path.join(tempDir, `${videoFileId}-thumb.jpg`);

      try {
        // 2. Download video from S3 to temp file
        console.log(`[Thumbnail Worker] Downloading from S3: ${videoFile.s3Key}`);
        const videoStream = await S3Service.getInstance().getObjectStream(videoFile.s3Key);
        await pipeline(videoStream, fs.createWriteStream(tempVideoPath));

        // 3. Generate thumbnail with FFmpeg
        const thumbnailUrl = await generateThumbnail(
          videoFile.id,
          videoFile.s3Key,
          tempVideoPath,
          tempThumbPath,
        );

        // 4. Update database
        await prisma.videoFile.update({
          where: { id: videoFileId },
          data: {
            thumbnailUrl,
            thumbnailReady: true,
          },
        });

        // Trigger update event
        if (videoFile.projectId) {
          await triggerPusherEvent(`project-${videoFile.projectId}`, 'asset-updated', {
            fileId: videoFileId,
            status: 'PROCESSING',
            thumbnailReady: true,
          });
        }

        console.log(`[Thumbnail Worker] Complete for: ${videoFileId}`);

        // 5. Check if both jobs are done
        await checkAndFinalizeStatus(videoFileId);

        res.status(200).json({ status: 'success', thumbnailUrl });
      } finally {
        // Cleanup temp files
        try {
          if (fs.existsSync(tempVideoPath)) fs.unlinkSync(tempVideoPath);
          if (fs.existsSync(tempThumbPath)) fs.unlinkSync(tempThumbPath);
        } catch (cleanupError) {
          console.warn('[Thumbnail Worker] Cleanup error:', cleanupError);
        }
      }
    } catch (error) {
      console.error(`[Thumbnail Worker] Error for ${videoFileId}:`, error);
      res.status(500).json({ error: 'Thumbnail generation failed' });
    }
  },
);

/**
 * Generate thumbnail using FFmpeg
 */
async function generateThumbnail(
  videoFileId: string,
  s3Key: string,
  videoPath: string,
  thumbPath: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, async (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }

      const duration = metadata.format.duration || 10;
      const seekTime = Math.max(1, duration * 0.1);

      ffmpeg(videoPath)
        .screenshots({
          timestamps: [seekTime],
          filename: path.basename(thumbPath),
          folder: path.dirname(thumbPath),
          // size: '640x360', // REMOVED to keep original quality/resolution
        })
        .outputOptions(['-q:v 2']) // High quality JPEG (2-31, lower is better)
        .on('end', async () => {
          try {
            const thumbBuffer = fs.readFileSync(thumbPath);
            const thumbKey = s3Key.replace(/^(.*\/)?([^/]+)$/, `$1thumbnails/${videoFileId}.jpg`);

            const thumbnailUrl = await S3Service.getInstance().uploadBuffer(
              thumbKey,
              thumbBuffer,
              'image/jpeg',
            );

            resolve(thumbnailUrl);
          } catch (uploadError) {
            reject(uploadError);
          }
        })
        .on('error', reject);
    });
  });
}

export default router;
