import { GoogleGenerativeAI } from '@google/generative-ai';
import { triggerPusherEvent } from './pusher';
import { FrameManifest } from './types/manifest';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface EditOptions {
  duration?: number; // Target duration in seconds
  pacing?: string; // "Fast", "Slow", "Dynamic"
  intensity?: string;
  musicStyle?: string;
  focusSubject?: string;
}

export interface EditDecisionList {
  clips: {
    fileId: string;
    start: number;
    end: number;
    speed?: number;
    transition?: {
      type: 'fade' | 'wipeleft' | 'wiperight' | 'pixelize' | 'circleopen' | 'none';
      duration?: number;
    };
    effects?: {
      type: string;
      timestamp: number;
      parameters?: any;
    }[]; // Semantic Triggers
  }[];
  audioTrack?: string;
  globalEffects?: {
    colorGrade?: 'teal-orange' | 'bw-contrast' | 'vintage' | 'none';
    filmGrain?: boolean;
  };
}

// Helper: Calculate similarity between two clips' vibe/motion using Topological Flow
function calculateMatchScore(prevClip: FrameManifest | null, candidate: FrameManifest): number {
  if (!prevClip) return 1.0; // First clip has no constraint

  // 1. Motion Continuity (Scalar Energy)
  // We want to match the END energy of prev with START energy of next
  const prevEndMotion =
    prevClip.activeTimeline[prevClip.activeTimeline.length - 1]?.motionScore || 0;
  const nextStartMotion = candidate.activeTimeline[0]?.motionScore || 0;
  const motionDelta = Math.abs(prevEndMotion - nextStartMotion);
  const energyScore = 1.0 - motionDelta;

  // 2. Topological Flow Matching (Vector Alignment)
  // Calculate Exit Vector (avg of last 5 frames)
  const prevLastFrames = prevClip.activeTimeline.slice(-5);
  const avgPrevDx = prevLastFrames.reduce((s, f) => s + (f.flowDx || 0), 0) / prevLastFrames.length;
  const avgPrevDy = prevLastFrames.reduce((s, f) => s + (f.flowDy || 0), 0) / prevLastFrames.length;
  const exitAngle = Math.atan2(avgPrevDy, avgPrevDx) * (180 / Math.PI);

  // Calculate Entry Vector (avg of first 5 frames)
  const nextFirstFrames = candidate.activeTimeline.slice(0, 5);
  const avgNextDx =
    nextFirstFrames.reduce((s, f) => s + (f.flowDx || 0), 0) / nextFirstFrames.length;
  const avgNextDy =
    nextFirstFrames.reduce((s, f) => s + (f.flowDy || 0), 0) / nextFirstFrames.length;
  const entryAngle = Math.atan2(avgNextDy, avgNextDx) * (180 / Math.PI);

  let flowScore = 0.0;
  // If magnitude is significant enough to have a direction (> 1px/frame roughly, normalized is diff)
  // Using motionScore as proxy for magnitude significance
  if (prevEndMotion > 0.1 && nextStartMotion > 0.1) {
    let angleDiff = Math.abs(exitAngle - entryAngle);
    if (angleDiff > 180) angleDiff = 360 - angleDiff;

    // 15 Degrees tolerance (User Requirement)
    if (angleDiff <= 15) {
      flowScore = 1.0;
    } else if (angleDiff <= 45) {
      // Partial credit for up to 45 deg
      flowScore = 1.0 - (angleDiff - 15) / 30;
    }
  } else {
    // If static, flow matching is irrelevant, default to neutral
    flowScore = 0.5;
  }

  // 3. Color Compatibility (Simple overlap check)
  const prevColors = new Set(prevClip.semantic.dominantColors);
  const nextColors = candidate.semantic.dominantColors;
  const commonColors = nextColors.filter((c) => prevColors.has(c)).length;
  const colorScore = commonColors > 0 ? 1.0 : 0.5;

  // 4. Gemini High-Level Momentum Matching (The "Perfect Pair" Logic)
  // Directions: 'N', 'S', 'E', 'W', 'Static', 'Omni'
  const prevMom = prevClip.semantic.momentum;
  const nextMom = candidate.semantic.momentum;

  let geminiMomScore = 0.5;
  if (prevMom && nextMom) {
    if (prevMom.direction === 'Static' || nextMom.direction === 'Static') {
      geminiMomScore = 0.5; // Neutral
    } else if (prevMom.direction === nextMom.direction) {
      geminiMomScore = 1.0; // Perfect Match Cut (e.g. Pan Right -> Pan Right)
    } else if (
      (prevMom.direction === 'N' && nextMom.direction === 'S') ||
      (prevMom.direction === 'S' && nextMom.direction === 'N') ||
      (prevMom.direction === 'E' && nextMom.direction === 'W') ||
      (prevMom.direction === 'W' && nextMom.direction === 'E')
    ) {
      geminiMomScore = 0.2; // Clashing movement (unless intentional conflict)
    }

    // Velocity Synergy (Bonus for matching intensity)
    const velDiff = Math.abs(prevMom.velocity - nextMom.velocity);
    const velScore = 1.0 - velDiff / 10;
    geminiMomScore = (geminiMomScore + velScore) / 2;
  }

  // 5. Aesthetic Quality
  const aestheticScore = candidate.semantic.aestheticScore || 0.5;

  // Weighted Score: Prioritize Flow & Momentum
  return flowScore * 0.4 + geminiMomScore * 0.3 + aestheticScore * 0.2 + colorScore * 0.1;
}

// Helper: Find "interesting" segments (remove dead zones)
function findBestSegments(
  manifest: FrameManifest,
  minDuration = 2.0,
): { start: number; end: number; score: number }[] {
  const segments: { start: number; end: number; score: number }[] = [];
  let currentStart = -1;
  let currentScoreSum = 0;
  let framesCount = 0;

  for (const frame of manifest.activeTimeline) {
    const isInteresting = frame.motionScore > 0.2 || frame.audioEnergy > 0.1;

    if (isInteresting) {
      if (currentStart === -1) currentStart = frame.timestamp;
      currentScoreSum += frame.motionScore;
      framesCount++;
    } else {
      // End segment
      if (currentStart !== -1) {
        const duration = frame.timestamp - currentStart;
        if (duration >= minDuration) {
          segments.push({
            start: currentStart,
            end: frame.timestamp,
            score: currentScoreSum / framesCount,
          });
        }
        currentStart = -1;
        currentScoreSum = 0;
        framesCount = 0;
      }
    }
  }

  // Close final segment
  if (currentStart !== -1) {
    const lastTs = manifest.activeTimeline[manifest.activeTimeline.length - 1].timestamp;
    if (lastTs - currentStart >= minDuration) {
      segments.push({ start: currentStart, end: lastTs, score: currentScoreSum / framesCount });
    }
  }

  return segments.sort((a, b) => b.score - a.score); // Best first
}

async function retryWithBackoff<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error.message?.includes('429') || error.status === 429)) {
      console.log(`[Director] Rate limited. Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return retryWithBackoff(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

// Helper: Construct sensible prompt from metadata
function constructAssetContext(assets: any[]): string {
  return assets
    .map(
      (a, i) =>
        `Asset ID: ${a.id} (File: ${a.fileName})
         Duration: ${a.duration}s
         Description: ${a.semantic?.description || a.summary || 'No description'}
         Vibe Tags: ${a.semantic?.vibeTags?.join(', ') || a.tags?.join(', ') || 'None'}
         Movement: ${a.semantic?.momentum?.direction || 'Unknown'} (${a.semantic?.momentum?.velocity || 0}/10)
         Impact Moments: ${a.semantic?.impactMoments?.join(', ') || 'None'}
        `,
    )
    .join('\n---\n');
}

export async function createDraftFromVibe(
  projectId: string,
  userPrompt: string,
  assetMetadata: any[],
  pusherChannel?: string,
): Promise<EditDecisionList> {
  if (pusherChannel) {
    await triggerPusherEvent(pusherChannel, 'ai-status', {
      step: 'analyzing',
      message: 'Director is watching your clips...',
    });
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  const assetContext = constructAssetContext(assetMetadata);

  const systemPrompt = `
    You are an expert Film Editor and Post-Production Director.
    Your task is to create a JSON Edit Decision List (EDL) based on the user's creative request (Vibe) and the available footage.

    Input Data:
    - User Vibe: "${userPrompt}"
    - Available Assets:
    ${assetContext}

    Instructions:
    1. Select the best clips that match the vibe.
    2. Trim them to interesting segments (avoid static or shaky parts unless requested).
    3. Arrange them in a narrative order.
    4. Apply effects ONLY if the vibe specifically demands it (e.g. "glitchy", "vintage").
    5. Output valid JSON matching the schema below.

    JSON Schema:
    {
      "clips": [
        {
          "fileId": "string (Asset ID)",
          "start": number (seconds),
          "end": number (seconds),
          "speed": number (default 1.0),
          "transition": { "type": "fade" | "wipeleft" | "none", "duration": number },
          "effects": [{ "type": "glitch" | "zoom", "timestamp": number }]
        }
      ],
      "globalEffects": {
        "colorGrade": "teal-orange" | "bw-contrast" | "vintage" | "none",
        "filmGrain": boolean
      }
    }
  `;

  if (pusherChannel) {
    await triggerPusherEvent(pusherChannel, 'ai-status', {
      step: 'drafting',
      message: 'Drafting the timeline...',
    });
  }

  const result = await retryWithBackoff(() =>
    model.generateContent({
      contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
    }),
  );

  const responseText = result.response.text();
  const cleanJson = responseText
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim();

  try {
    const edl = JSON.parse(cleanJson);

    if (pusherChannel) {
      await triggerPusherEvent(pusherChannel, 'draft-generated', { edl });
    }

    return edl;
  } catch (e) {
    console.error('[Director] Failed to parse EDL API response:', responseText);
    throw new Error('Failed to generate valid EDL');
  }
}

export async function modifyDraft(
  currentEdl: EditDecisionList,
  userInstruction: string,
  pusherChannel?: string,
): Promise<EditDecisionList> {
  if (pusherChannel) {
    await triggerPusherEvent(pusherChannel, 'ai-status', {
      step: 'modifying',
      message: 'Applying your feedback...',
    });
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

  const prompt = `
    Current EDL: ${JSON.stringify(currentEdl)}
    User Instruction: "${userInstruction}"

    Task: Modify the EDL to satisfy the user's instruction.
    Return ONLY the updated JSON.
  `;

  const result = await retryWithBackoff(() => model.generateContent(prompt));
  const cleanJson = result.response
    .text()
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim();

  try {
    const newEdl = JSON.parse(cleanJson);
    if (pusherChannel) {
      await triggerPusherEvent(pusherChannel, 'draft-updated', { edl: newEdl });
    }
    return newEdl;
  } catch (e) {
    throw new Error('Failed to modify EDL');
  }
}

// Legacy function kept for compatibility if needed, but we prefer createDraftFromVibe
export async function generateEditDecisionList(
  userPrompt: string,
  assetMetadata: any[],
  options: EditOptions = {},
): Promise<EditDecisionList> {
  // Redirect legacy calls to new logic if possible, or keep as fallback.
  // For now, let's just wrap the new logic (without pusher)
  return createDraftFromVibe('legacy-project', userPrompt, assetMetadata);
}

export async function generateContent(systemPrompt: string, userPrompt: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await retryWithBackoff(() => model.generateContent([systemPrompt, userPrompt]));
  return result.response.text();
}
