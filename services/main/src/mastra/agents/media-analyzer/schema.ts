import { z } from 'zod';

const SegmentSchema = z.object({
  startTime: z.string().describe('Start time of the segment in HH:MM:SS format.'),
  endTime: z.string().describe('End time of the segment in HH:MM:SS format.'),
  narrative_log: z
    .string()
    .describe(
      'A dense, frame-by-frame style log of EXACTLY what is happening. Do not just say "A man walks." Say "A man in a torn denim jacket stumbles forward, looking over his left shoulder with a fearful expression before breaking into a run." Capture micro-actions, interactions, and specific movements.',
    ),
  visual_details: z
    .object({
      lighting: z.object({
        style: z.string().describe('e.g., "High Key", "Chiaroscuro", "Natural", "Neon"'),
        quality: z.string().describe('e.g., "Hard/Harsh", "Soft/Diffused", "Dappled"'),
        source_direction: z.string().describe('e.g., "Top-down", "Backlit", "Side-lit"'),
      }),
      composition: z.object({
        shot_size: z.string().describe('e.g., "Extreme Close-Up", "Medium Shot", "Wide"'),
        angle: z.string().describe('e.g., "Low Angle", "Eye Level", "High Angle/God\'s Eye"'),
        movement: z
          .string()
          .describe('e.g., "Static", "Handheld Shake", "Smooth Gimbal", "Whip Pan"'),
        depth_of_field: z.string().describe('e.g., "Shallow (Bokeh)", "Deep focus"'),
      }),
      aesthetics: z.object({
        colors: z
          .array(z.string())
          .describe('List of 3-5 dominant hex codes or specific color names.'),
        texture: z
          .string()
          .describe('e.g., "Clean/Digital", "Film Grain", "VHS Artifacts", "Glossy"'),
      }),
      detected_elements: z
        .array(z.string())
        .describe(
          'Specific objects, people, or distinct visual elements visible (e.g., "Red Ferrari", "Stop Sign", "Guitar Amp").',
        ),
    })
    .optional(),
  audio_details: z
    .object({
      mood: z
        .string()
        .describe(
          'Emotional tone of the audio (e.g., "Anticipatory", "Aggressive", "Melancholic").',
        ),
      instruments: z
        .array(z.string())
        .describe(
          'Specific instruments or sound sources (e.g., "Distorted Electric Guitar", "808 Kick", "Synth Pad").',
        ),
      timbre: z
        .string()
        .describe(
          'Textural quality of the sound (e.g., "Warm", "Metallic", "Lo-fi", "Reverberant").',
        ),
      vocals: z.object({
        present: z.boolean(),
        description: z
          .string()
          .describe(
            'Details on the voice if present (e.g., "Male, raspy, yelling", "Female, whispered").',
          ),
        lyrics_or_dialogue: z
          .string()
          .optional()
          .describe(
            'Key lyrics, dialogue, or spoken words heard in this specific segment. Transcribe distinct phrases.',
          ),
      }),
      dynamics: z
        .string()
        .describe('Description of volume changes or intensity shifts within the segment.'),
      bpm: z.number().optional(),
    })
    .optional(),
  metrics: z.object({
    energy: z.number().min(0).max(1).describe('Overall energy level 0.0-1.0.'),
    valence: z
      .number()
      .min(0)
      .max(1)
      .describe(
        'Emotional positivity: 0.0 (Negative/Sad/Scary) to 1.0 (Positive/Happy/Triumphant).',
      ),
    momentum: z.string().describe('Perceived forward motion intensity.'),
  }),
  usageTags: z
    .array(z.string())
    .describe(
      'Context-aware tags for usage (e.g., "Action Sequence", "Emotional Peak", "B-Roll").',
    ),
  vectorContext: z
    .string()
    .describe(
      'A massive, high-density feature map for semantic search. You MUST weave every detail from "narrative_log", "visual_details" (lighting, composition, objects), and "audio_details" (instruments, lyrics) into this single paragraph. If a detail (like "dirt patch" or "red Ferrari") is mentioned in another field, it MUST appear here. Do not summarize; aggregate all facts.',
    ),
});

export const MediaAnalysisSchema = z.object({
  segments: z.array(SegmentSchema).describe('List of distinct segments.'),
  summary: z
    .string()
    .describe(
      'Deeply descriptive, comprehensive overall summary of the entire media. Log every relevant detail about subject, tone, narrative context, and visual style.',
    ),
});
