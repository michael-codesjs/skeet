import { Prisma } from '@/generated/prisma_client';
import { s3 } from '@/lib/storage/s3';
import { GoogleGenAI } from '@google/genai';
import { Request, Response, Router } from 'express';
import { getPrisma } from '../context';
import { triggerPusherEvent } from '../lib/pusher';
import { GeminiScoutJobPayload } from '../lib/qstash';
import { verifyQStashSignature } from '../middleware/qstash-verify';

const router = Router();

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface ShotMoment {
  timestamp: number;
  description: string;
}

interface VideoAnalysis {
  tags: string[];
  summary: string;
  shotBreakdown: ShotMoment[];
  duration?: number;
  technical?: {
    stability: number;
    lighting: number;
    focus: number;
  };
  cameraMovement?: string;
}

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
 * POST /api/workers/gemini-scout
 * QStash-triggered endpoint for Gemini video analysis
 */
router.post(
  '/gemini-scout',
  verifyQStashSignature,
  async (req: Request, res: Response): Promise<void> => {
    const { videoFileId, projectVibe } = req.body as GeminiScoutJobPayload;

    console.log(`[Gemini Scout Worker] Starting for video: ${videoFileId}`);

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
      if (videoFile.analysisReady) {
        console.log(`[Gemini Scout Worker] Already processed, skipping: ${videoFileId}`);
        res.status(200).json({ status: 'already_processed' });
        return;
      }

      // 2. Generate Remote URL (Signed S3 URL) - 10 minutes expiry
      console.log(`[Gemini Scout Worker] Generating signed URL for: ${videoFile.s3Key}`);
      const signedUrl = await s3.getDownloadUrl(videoFile.s3Key, 600);

      // 3. Analyze with Gemini (Remote Ingestion)
      console.log(`[Gemini Scout Worker] Starting Gemini analysis...`);
      const analysis = await analyzeVideoWithGemini(signedUrl, videoFile.mimeType, projectVibe);

      // 5. Update database
      await prisma.videoFile.update({
        where: { id: videoFileId },
        data: {
          tags: analysis.tags,
          summary: analysis.summary,
          // We store the technical/camera metadata INSIDE the shotBreakdown JSON column
          // to avoid schema changes for now.
          shotBreakdown: {
            moments: analysis.shotBreakdown,
            technical: analysis.technical,
            cameraMovement: analysis.cameraMovement,
          } as unknown as Prisma.InputJsonValue,
          duration: analysis.duration,
          analysisReady: true,
        },
      });

      // Trigger update event
      if (videoFile.projectId) {
        await triggerPusherEvent(`project-${videoFile.projectId}`, 'asset-updated', {
          fileId: videoFileId,
          status: 'PROCESSING',
          analysisReady: true,
        });
      }

      console.log(`[Gemini Scout Worker] Complete for: ${videoFileId}`);

      // 6. Check if both jobs are done
      await checkAndFinalizeStatus(videoFileId);

      res.status(200).json({ status: 'success', analysis });
    } catch (error) {
      console.error(`[Gemini Scout Worker] Error for ${videoFileId}:`, error);
      res.status(500).json({ error: 'Gemini analysis failed' });
    }
  },
);

/**
 * Analyze video using Gemini API with Remote Ingestion
 */
async function analyzeVideoWithGemini(
  videoUrl: string,
  mimeType: string,
  projectVibe?: string,
): Promise<VideoAnalysis> {
  console.log('[Gemini Scout] analyzed via Remote URL:', videoUrl);

  const prompt = `You are a professional film director and editor. Watch this video clip carefully and provide a detailed analysis.
  ${projectVibe ? `\nContext/Vibe: The user describes this project as "${projectVibe}". Focus on finding shots/moments that fit this vibe.\n` : ''}

Return your response as a valid JSON object with the following structure:
{
  "tags": ["tag1", "tag2", ...],
  "summary": "A brief narrative description of what happens in this clip",
  "technical": {
    "stability": 8,
    "lighting": 7,
    "focus": 9
  },
  "cameraMovement": "static" | "pan_left" | "pan_right" | "tilt_up" | "tilt_down" | "dolly_in" | "dolly_out" | "handheld_shaky",
  "shotBreakdown": [
    { "timestamp": 0.5, "description": "Description of the shot/moment" },
    { "timestamp": 2.3, "description": "Another key moment" }
  ],
  "duration": 10.5
}

Guidelines:
- tags: Include 5-10 descriptive tags (e.g., "exterior", "action", "golden-hour", "urban").
- summary: Write 2-3 sentences describing the content, mood, and visual style.
- technical: Rate 1-10. 
  - Stability: 10=Tripod, 1=Unusable Shaky.
  - Lighting: 10=Perfectly exposed, 1=Too dark/blown out.
  - Focus: 10=Razor sharp, 1=Blurry.
- cameraMovement: Choose the single most dominant movement.
- shotBreakdown: Identify ALL distinct, useful shots or moments that fit the project Vibe. Do not limit the number.
- duration: Total duration in seconds.

Important: Return ONLY the JSON object, no markdown.`;

  // Retry logic wrapper
  const retryWithBackoff = async <T>(
    fn: () => Promise<T>,
    retries = 3,
    delay = 2000,
  ): Promise<T> => {
    try {
      return await fn();
    } catch (error: any) {
      if (retries > 0 && (error.status === 429 || error?.error?.code === 429)) {
        console.warn(
          `[Gemini Scout] Rate limited. Retrying in ${delay / 1000}s... (${retries} attempts left)`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        return retryWithBackoff(fn, retries - 1, delay * 2);
      }
      throw error;
    }
  };

  const result = await retryWithBackoff(() =>
    ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              fileData: {
                mimeType: mimeType,
                fileUri: videoUrl,
              },
            },
            { text: prompt },
          ],
        },
      ],
    }),
  );

  const responseText = result.text || '';

  // 4. Parse the JSON response
  try {
    const cleanedResponse = responseText
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    const analysis = JSON.parse(cleanedResponse);

    return {
      tags: Array.isArray(analysis.tags) ? analysis.tags : [],
      summary: typeof analysis.summary === 'string' ? analysis.summary : '',
      technical: analysis.technical || { stability: 5, lighting: 5, focus: 5 },
      cameraMovement: analysis.cameraMovement || 'static',
      shotBreakdown: Array.isArray(analysis.shotBreakdown) ? analysis.shotBreakdown : [],
      duration: typeof analysis.duration === 'number' ? analysis.duration : undefined,
    };
  } catch (parseError) {
    console.error('[Gemini Scout] Failed to parse response:', responseText);
    return {
      tags: ['unanalyzed'],
      summary: 'Video could not be fully analyzed.',
      shotBreakdown: [],
    };
  }
}

export default router;
