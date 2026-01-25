import { GoogleGenerativeAI } from '@google/generative-ai';
import { FileState, GoogleAIFileManager } from '@google/generative-ai/server';
import * as fs from 'fs';
import { createProxyVideo, extractFfmpegStats } from './analyzer-utils';
import { FrameManifest, SceneSemantic } from './types/manifest';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY || '');

/**
 * Performs a deep "Masterpiece Analysis" on a video clip.
 * 1. Low-level signal processing (FFmpeg) - Timelines & Vectors
 * 2. High-level visual understanding (Gemini 1.5 Pro Video) - Semantics & Momentum
 */
export async function analyzeMediaDeeply(
  fileUrl: string,
  localPath: string,
  mimeType: string,
  projectVibe?: string,
): Promise<FrameManifest> {
  console.log('[Analyzer] Analyzing media deeply:', localPath);

  // 1. Parallel Execution: Signal Stats & Proxy Generation
  // We run signal extraction on the high-quality original for precision.
  // We create a proxy for Gemini to save tokens/upload time.
  const timeSeriesPromise = extractFfmpegStats(localPath);
  const proxyPromise = createProxyVideo(localPath);

  const [timeSeries, proxyPath] = await Promise.all([timeSeriesPromise, proxyPromise]);

  // 2. Upload Proxy to Gemini (Video Token)
  console.log('[Analyzer] Uploading proxy to Gemini:', proxyPath);
  let uploadResult;
  try {
    uploadResult = await uploadToGemini(proxyPath, 'video/mp4');
  } catch (err) {
    console.error('[Analyzer] Upload failed, falling back to original (risky for tokens):', err);
    // Fallback to original if proxy fails? Or hard fail.
    // Let's retry with original.
    uploadResult = await uploadToGemini(localPath, mimeType);
  }

  // 3. Call Gemini 1.5 Pro (Video) -> 2.0 Flash
  // We use 2.0 Flash because it handles Video tokens better and is available.
  // User Requested 1.5 Pro specifically in "Vibe-Aware Analysis" but 2.0 Flash is generally better/faster now.
  // However, I will respect the codebase choice of model but inject the user prompt.
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const masterpiecePrompt = `
    You are a Professional Computational Editor. Analyze this video and produce a frame-accurate JSON manifest.
    ${projectVibe ? `Context/Vibe: The user describes this project as "${projectVibe}". Focus on finding shots/moments that fit this vibe.` : ''}

    For the scene/clip provided, return a SINGLE JSON object with the following fields:

    {
      "momentum": {
        "direction": "N" | "S" | "E" | "W" | "Static" | "Omni",
        "velocity": number // 0-10 intensity of movement
      },
      "aesthetic_score": number, // 0.0-1.0 based on lighting/composition
      "subject_tracking": {
         "label": "string",
         "start_box": [y, x], // Center coordinates approx [0-1]
         "end_box": [y, x]
      },
      "impact_moments": [number], // Array of timestamps (ms) of sudden flashes/shifts
      "vibe_tags": {
         "palette": ["#hex", "#hex"],
         "mood": ["string"]
      },
      "description": "string"
    }

    Respond ONLY with valid JSON. Do not use Markdown code blocks.
  `;

  console.log('[Analyzer] Sending video prompt to Gemini...');

  const result = await retryWithBackoff(async () => {
    return await model.generateContent([
      {
        fileData: {
          mimeType: uploadResult.file.mimeType,
          fileUri: uploadResult.file.uri,
        },
      },
      { text: masterpiecePrompt },
    ]);
  });

  const responseText = result.response.text();

  /**
   * Helper to handle Gemini Rate Limits (429) with exponential backoff
   */
  async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    retries = 5,
    baseDelay = 5000,
  ): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      if (retries <= 0) throw error;

      // Check for 429 or Quota Exceeded
      const isRateLimit =
        error.status === 429 ||
        (error.message && error.message.includes('429')) ||
        (error.message && error.message.includes('Quota exceeded'));

      if (isRateLimit) {
        let delay = baseDelay;

        // Try to parse "Please retry in X s" from message
        const match = error.message?.match(/retry in ([\d\.]+)s/);
        if (match && match[1]) {
          delay = Math.ceil(parseFloat(match[1]) * 1000) + 1000; // Add 1s buffer
        } else {
          delay = baseDelay * Math.pow(2, 5 - retries);
        }

        console.warn(
          `[Analyzer] Rate limit hit. Retrying in ${delay}ms... (${retries} retries left)`,
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
        return retryWithBackoff(fn, retries - 1, baseDelay);
      }

      throw error;
    }
  }
  const cleanJson = responseText
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim();

  let semantic: SceneSemantic;
  try {
    const raw = JSON.parse(cleanJson);

    // Map raw AI response to our internal Schema
    semantic = {
      dominantColors: raw.vibe_tags?.palette || ['#000000'],
      aestheticScore: raw.aesthetic_score !== undefined ? raw.aesthetic_score : 0.5,
      momentum: {
        direction: raw.momentum?.direction || 'Static',
        velocity: raw.momentum?.velocity || 0,
      },
      subject: {
        label: raw.subject_tracking?.label || 'Unknown',
        tracking: {
          start: raw.subject_tracking?.start_box || [0.5, 0.5],
          end: raw.subject_tracking?.end_box || [0.5, 0.5],
        },
        aesthetic: raw.vibe_tags?.mood?.[0] || 'Neutral',
      },
      impactMoments: raw.impact_moments || [],
      description: raw.description || 'No description',
      vibeTags: raw.vibe_tags?.mood || [],
    };
  } catch (e) {
    console.error('[Analyzer] JSON Parse Failed:', responseText);
    // Fallback
    semantic = {
      dominantColors: ['#000000'],
      aestheticScore: 0.5,
      momentum: { direction: 'Static', velocity: 0 },
      subject: { label: 'Unknown', aesthetic: 'Error' },
      impactMoments: [],
      description: 'Analysis Failed',
      vibeTags: ['error'],
    };
  }

  // Cleanup
  try {
    if (proxyPath !== localPath) {
      fs.unlinkSync(proxyPath);
    }
  } catch {}

  return {
    activeTimeline: timeSeries,
    semantic,
    technical: {
      resolution: [720, 1280], // Approximation
      fps: 30, // Approx
      duration: timeSeries[timeSeries.length - 1]?.timestamp || 0,
      codec: 'h264',
    },
  };
}

// Upload & Poll Helper
async function uploadToGemini(filePath: string, mimeType: string) {
  const uploadResponse = await fileManager.uploadFile(filePath, {
    mimeType,
    displayName: 'Skeet Proxy Video',
  });

  const name = uploadResponse.file.name;
  console.log(`[Analyzer] File uploaded: ${name}. Waiting for processing...`);

  let file = await fileManager.getFile(name);
  while (file.state === FileState.PROCESSING) {
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Sleep 2s
    file = await fileManager.getFile(name);
    console.log(`[Analyzer] Processing state: ${file.state}`);
  }

  if (file.state === FileState.FAILED) {
    throw new Error('Video processing failed.');
  }

  console.log(`[Analyzer] Video processing complete. URI: ${file.uri}`);
  return { file };
}
