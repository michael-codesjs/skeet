import { z } from 'zod';

const SegmentSchema = z.object({
  startTime: z.string().describe('Start time of the segment in HH:MM:SS format.'),
  endTime: z.string().describe('End time of the segment in HH:MM:SS format.'),
  subject: z.string().describe('Concise description of the action or subject matter.'),
  aesthetics: z.object({
    lighting: z.string().describe('Lighting style (e.g., High Key, Low Key, Natural).'),
    texture: z.string().describe('Visual texture (e.g., Clean, Grainy, Motion Blur).'),
    colors: z.array(z.string()).describe('List of 3-4 dominant hex codes or color names.'),
  }),
  camera: z.object({
    movement: z.string().describe('Camera movement type (e.g., Static, Handheld, Gimbal).'),
    vector: z.string().describe('Camera vector (e.g., Push In, Pull Out, Truck).'),
    shotSize: z.string().describe('Shot size (e.g., Wide, Close-Up).'),
  }),
  metrics: z.object({
    energy: z
      .number()
      .min(0)
      .max(1)
      .describe('Energy level from 0.0 (meditative) to 1.0 (high action).'),
    momentum: z.string().describe('Perceived momentum (High, Medium, Low, None).'),
  }),
  audio: z
    .object({
      bpm: z.number().optional().describe('Beats per minute (estimated from audio track).'),
      peaks: z.array(z.number()).describe('Timestamps of loud audio transients/beats.'),
      mood: z.string().describe('Mood of the audio (e.g., Upbeat, Melancholic, Tense).'),
      keywords: z
        .array(z.string())
        .describe('Keywords describing audio content (e.g., "Violin", "Siren", "Dialogue").'),
      description: z
        .string()
        .describe(
          'Brief description of what is heard (e.g. "A man speaking over soft piano music").',
        ),
    })
    .optional(),
  usageTags: z.array(z.string()).describe('Context-aware tags for usage (e.g., Chaos, Dreamy).'),
  vectorContext: z
    .string()
    .describe(
      'Dense natural language paragraph summarizing the visual content for vector embedding.',
    ),
});

export const MediaAnalysisSchema = z.object({
  segments: z.array(SegmentSchema).describe('List of distinct video segments/shots.'),
  summary: z.string().describe('Overall summary of the entire video content.'),
});
