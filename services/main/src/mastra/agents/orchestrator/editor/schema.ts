import { z } from 'zod';

const OperationType = z.enum(['APPEND', 'INSERT', 'OVERLAY', 'TRIM', 'EFFECT']);

const BaseOperation = z.object({
  type: OperationType,
  mediaId: z.string().describe('The ID of the media asset to operate on.'),
  trackId: z.number().default(0).describe('The video track index (0 = main, 1 = overlay, etc.).'),
});

const AppendOperation = BaseOperation.extend({
  type: z.literal('APPEND'),
  sourceStartTime: z.number().optional().describe('Start time in the source clip (seconds).'),
  sourceDuration: z.number().optional().describe('Duration to use from the source clip (seconds).'),
});

const InsertOperation = BaseOperation.extend({
  type: z.literal('INSERT'),
  timelineStartTime: z
    .number()
    .describe('Exact time on the timeline to insertion point (seconds).'),
  sourceStartTime: z.number().optional().describe('Start time in the source clip (seconds).'),
  sourceDuration: z.number().optional().describe('Duration to use from the source clip (seconds).'),
});

const OverlayOperation = BaseOperation.extend({
  type: z.literal('OVERLAY'),
  timelineStartTime: z
    .number()
    .describe('Exact time on the timeline to place the overlay (seconds).'),
  sourceStartTime: z.number().optional().describe('Start time in the source clip (seconds).'),
  sourceDuration: z.number().optional().describe('Duration to use from the source clip (seconds).'),
  trackId: z.number().min(1).describe('Must be a higher track index (>= 1).'),
});

const TrimOperation = BaseOperation.extend({
  type: z.literal('TRIM'),
  timelineStartTime: z.number().describe('Start time of the clip on timeline to trim.'),
  newDuration: z.number().describe('New duration for the clip.'),
});

const EffectOperation = BaseOperation.extend({
  type: z.literal('EFFECT'),
  effectType: z.enum(['GLITCH', 'ZOOM', 'FILTER', 'COLOR_GRADE', 'TRANSITION', 'SPEED_RAMP']),
  parameters: z
    .object({
      intensity: z.number().min(0).max(1).optional().describe('Effect intensity (0-1)'),
      scale: z.number().optional().describe('Zoom scale factor'),
      transitionType: z.enum(['DISSOLVE', 'WIPE', 'GLITCH', 'CUT']).optional(),
      colorProfile: z.string().optional().describe('LUT or color grade name'),
      speed: z.number().optional().describe('Speed multiplier for speed ramps'),
      audioSync: z.boolean().optional().describe('Whether to sync effect to audio peaks'),
    })
    .optional()
    .describe('Parameters for the effect.'),
  timelineStartTime: z.number().describe('Start time on timeline to apply effect.'),
  duration: z.number().describe('Duration of the effect.'),
});

export const EditDecisionListSchema = z.object({
  title: z.string().describe('Suggested title for this edit sequence.'),
  reasoning: z.string().describe('The "Director\'s Commentary". Why these shots? Why this rhythm?'),
  operations: z
    .array(
      z.union([AppendOperation, InsertOperation, OverlayOperation, TrimOperation, EffectOperation]),
    )
    .describe('Ordered list of atomic edit operations to build the timeline.'),
});
