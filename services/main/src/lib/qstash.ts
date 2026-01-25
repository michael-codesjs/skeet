import { Client } from '@upstash/qstash';

// Initialize QStash client
const qstash = new Client({
  token: process.env.QSTASH_TOKEN || '',
});

// Base URL for worker endpoints (your server's public URL)
const WORKER_BASE_URL = process.env.WORKER_BASE_URL || 'http://localhost:5445';

export interface ThumbnailJobPayload {
  videoFileId: string;
}

export interface GeminiScoutJobPayload {
  videoFileId: string;
  projectVibe?: string;
}

/**
 * Enqueue a thumbnail generation job
 */
export async function enqueueThumbnailJob(payload: ThumbnailJobPayload): Promise<void> {
  console.log(`[QStash] Enqueueing thumbnail job for: ${payload.videoFileId}`);

  await qstash.publishJSON({
    url: `${WORKER_BASE_URL}/api/workers/generate-thumbnail`,
    body: payload,
    retries: 3,
  });
}

/**
 * Enqueue a Gemini scouting job
 */
export async function enqueueGeminiScoutJob(payload: GeminiScoutJobPayload): Promise<void> {
  console.log(`[QStash] Enqueueing Gemini scout job for: ${payload.videoFileId}`);

  await qstash.publishJSON({
    url: `${WORKER_BASE_URL}/api/workers/gemini-scout`,
    body: payload,
    retries: 3,
  });
}

export interface GeminiAnalyzerJobPayload {
  videoFileId: string;
  projectId?: string;
}

export async function enqueueGeminiAnalyzerJob(payload: GeminiAnalyzerJobPayload): Promise<void> {
  console.log(`[QStash] Enqueueing Gemini Analyzer job for: ${payload.videoFileId}`);
  await qstash.publishJSON({
    url: `${WORKER_BASE_URL}/api/workers/gemini-analyzer`,
    body: payload,
    retries: 3,
  });
}

/**
 * Enqueue both jobs for a newly uploaded video
 */
export async function enqueueVideoProcessingJobs(
  videoFileId: string,
  projectId?: string,
): Promise<void> {
  // We now use the deep analyzer instead of the basic scout
  await Promise.all([
    enqueueThumbnailJob({ videoFileId }),
    // enqueueGeminiScoutJob({ videoFileId, projectVibe }), // Deprecated
    enqueueGeminiAnalyzerJob({ videoFileId, projectId }),
  ]);
}

export { qstash };

export interface AssembleSkeetJobPayload {
  projectId: string;
  edl: any; // Using 'any' for now to avoid circular dependency with director.ts, or import it if possible
}

export async function enqueueAssembleSkeetJob(payload: AssembleSkeetJobPayload): Promise<void> {
  console.log(`[QStash] Enqueueing assemble skeet job for project: ${payload.projectId}`);
  await qstash.publishJSON({
    url: `${WORKER_BASE_URL}/api/workers/assemble-skeet`,
    body: payload,
    retries: 0, // Don't retry automatically during dev/debug of heavy process
  });
}
