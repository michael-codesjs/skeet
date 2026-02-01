import { Prisma, PrismaClient } from '@/generated/prisma_client';
import { GoogleGenAI } from '@google/genai';
import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { pipeline } from 'stream/promises';
import { S3Service } from './storage/s3';

// Initialize Gemini with the new SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// Types for the analysis result
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
 * Main scouting function - processes an uploaded video file
 */
export async function processUploadedVideo(
  prisma: PrismaClient,
  videoFileId: string,
): Promise<void> {
  console.log(`[Scout] Starting processing for video: ${videoFileId}`);

  // 1. Get the video file record
  const videoFile = await prisma.media.findUnique({
    where: { id: videoFileId },
  });

  if (!videoFile) {
    throw new Error(`VideoFile not found: ${videoFileId}`);
  }

  const tempDir = os.tmpdir();
  const tempVideoPath = path.join(tempDir, `${videoFileId}-${videoFile.fileName}`);
  const tempThumbPath = path.join(tempDir, `${videoFileId}-thumb.jpg`);

  try {
    // 2. Download video from S3 to temp file
    console.log(`[Scout] Downloading video from S3: ${videoFile.s3Key}`);
    const videoStream = await S3Service.getInstance().getObjectStream(videoFile.s3Key);
    await pipeline(videoStream, fs.createWriteStream(tempVideoPath));
    console.log(`[Scout] Video downloaded to: ${tempVideoPath}`);

    // 3. Generate thumbnail with FFmpeg
    console.log(`[Scout] Generating thumbnail...`);
    const thumbnailUrl = await generateThumbnail(
      videoFile.id,
      videoFile.s3Key,
      tempVideoPath,
      tempThumbPath,
    );
    console.log(`[Scout] Thumbnail generated: ${thumbnailUrl}`);

    // 4. Analyze with Gemini
    console.log(`[Scout] Starting Gemini analysis...`);
    const analysis = await analyzeVideoWithGemini(tempVideoPath, videoFile.mimeType);
    console.log(`[Scout] Gemini analysis complete`);

    // 5. Update database with results
    await prisma.media.update({
      where: { id: videoFileId },
      data: {
        thumbnailUrl,
        tags: analysis.tags,
        summary: analysis.summary,
        shotBreakdown: analysis.shotBreakdown as unknown as Prisma.InputJsonValue,
        duration: analysis.duration,
        status: 'READY',
      },
    });

    console.log(`[Scout] Video ${videoFileId} processing complete!`);
  } catch (error) {
    console.error(`[Scout] Error processing video ${videoFileId}:`, error);

    // Mark as failed
    await prisma.media.update({
      where: { id: videoFileId },
      data: { status: 'FAILED' },
    });

    throw error;
  } finally {
    // Cleanup temp files
    try {
      if (fs.existsSync(tempVideoPath)) fs.unlinkSync(tempVideoPath);
      if (fs.existsSync(tempThumbPath)) fs.unlinkSync(tempThumbPath);
    } catch (cleanupError) {
      console.warn('[Scout] Error cleaning up temp files:', cleanupError);
    }
  }
}

/**
 * Generate a thumbnail from the video using FFmpeg
 */
async function generateThumbnail(
  videoFileId: string,
  s3Key: string,
  videoPath: string,
  thumbPath: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    // First, get video duration
    ffmpeg.ffprobe(videoPath, async (err, metadata) => {
      if (err) {
        console.error('[Scout] FFprobe error:', err);
        reject(err);
        return;
      }

      const duration = metadata.format.duration || 10;
      // Take thumbnail at 10% into the video or 1 second, whichever is later
      const seekTime = Math.max(1, duration * 0.1);

      ffmpeg(videoPath)
        .screenshots({
          timestamps: [seekTime],
          filename: path.basename(thumbPath),
          folder: path.dirname(thumbPath),
          size: '640x360',
        })
        .on('end', async () => {
          try {
            // Upload thumbnail to S3
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
        .on('error', (ffmpegError) => {
          console.error('[Scout] FFmpeg error:', ffmpegError);
          reject(ffmpegError);
        });
    });
  });
}

/**
 * Upload video to Gemini and analyze it using the new @google/genai SDK
 */
async function analyzeVideoWithGemini(videoPath: string, mimeType: string): Promise<VideoAnalysis> {
  // 1. Upload video to Gemini File API
  console.log('[Scout] Uploading video to Gemini...');

  const uploadResult = await ai.files.upload({
    file: videoPath,
    config: {
      mimeType,
      displayName: path.basename(videoPath),
    },
  });

  console.log(`[Scout] Uploaded to Gemini: ${uploadResult.name}`);

  // 2. Wait for file to be processed
  let file = await ai.files.get({ name: uploadResult.name! });
  while (file.state === 'PROCESSING') {
    console.log('[Scout] Waiting for Gemini to process video...');
    await new Promise((resolve) => setTimeout(resolve, 5000));
    file = await ai.files.get({ name: uploadResult.name! });
  }

  if (file.state === 'FAILED') {
    throw new Error('Gemini failed to process the video');
  }

  console.log('[Scout] Video ready for analysis');

  // 3. Analyze with Gemini
  const prompt = `You are a professional film director and editor. Watch this video clip carefully and provide a detailed analysis.

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
- shotBreakdown: Identify ALL distinct, useful shots or moments. Do not limit the number. If there are 20 good shots, list them all.
- duration: Total duration in seconds.

Important: Return ONLY the JSON object, no markdown.`;

  const result = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [
          {
            fileData: {
              mimeType: file.mimeType!,
              fileUri: file.uri!,
            },
          },
          { text: prompt },
        ],
      },
    ],
  });

  const responseText = result.text || '';

  // 4. Parse the JSON response
  try {
    const cleanedResponse = responseText
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    const analysis = JSON.parse(cleanedResponse);

    // Validate and provide defaults
    return {
      tags: Array.isArray(analysis.tags) ? analysis.tags : [],
      summary: typeof analysis.summary === 'string' ? analysis.summary : '',
      // @ts-ignore - Dynamic JSON storage for technical/movement which doesn't strictly match the old interface but will be stored in JSON
      technical: analysis.technical || { stability: 5, lighting: 5, focus: 5 },
      cameraMovement: analysis.cameraMovement || 'static',
      shotBreakdown: Array.isArray(analysis.shotBreakdown) ? analysis.shotBreakdown : [],
      duration: typeof analysis.duration === 'number' ? analysis.duration : undefined,
    };
  } catch (parseError) {
    console.error('[Scout] Failed to parse Gemini response:', responseText);

    return {
      tags: ['unanalyzed'],
      summary: 'Video could not be fully analyzed.',
      shotBreakdown: [],
    };
  }
}
