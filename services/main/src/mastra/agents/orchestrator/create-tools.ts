import { getPrisma } from '@/context';
import { triggerPusherEvent } from '@/lib/pusher';
import { applyOperationsToTimeline } from '@/lib/timeline/builder';
import { getTimeline, saveTimeline } from '@/lib/timeline/persistence';
import { ModelRouterEmbeddingModel } from '@mastra/core/llm';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { getMediaVectorStore } from '../../vector';

const timeToSeconds = (timeStr: string) => {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return parts[0] * 60 + parts[1];
};

export const createTools = (projectId: string) => {
  return {
    getProjectManifest: createTool({
      id: 'getProjectManifest',
      description:
        'Returns a complete list of all available media assets in the project, including their IDs, filenames, and summaries. Use this to get an overview of what "ingredients" you have to work with.',
      inputSchema: z.object({}),
      execute: async () => {
        console.log(`[Tool] 📂 Fetching project manifest for: ${projectId}`);
        const prisma = getPrisma();
        const media = await prisma.media.findMany({
          where: { projectId },
        });

        return media.map((m) => ({
          id: m.id,
          fileName: m.fileName,
          summary: m.summary,
          duration: m.duration,
          mimeType: m.mimeType,
          tags: m.tags,
        }));
      },
    }),

    searchSegments: createTool({
      id: 'searchSegments',
      description:
        'Searches for specific visual or narrative moments within the project assets using semantic search. Use this when the user asks for things like "find a shot of a cat" or "find something energetic".',
      inputSchema: z.object({
        query: z
          .string()
          .describe('The search query (e.g. "beach at sunset", "close up of face").'),
      }),
      execute: async ({ query }) => {
        console.log(`[Tool] 🔍 Searching segments for query: ${query}`);

        try {
          // 1. Generate Embedding for query
          const embedder = new ModelRouterEmbeddingModel('google/gemini-embedding-001');
          const { embeddings } = await embedder.doEmbed({ values: [query] });
          const slicedVector = embeddings[0].slice(0, 1536);

          // 2. Query Vector Store
          const vectorStore = getMediaVectorStore();
          const results = await vectorStore.query({
            indexName: 'media-segments',
            topK: 10,
            queryVector: slicedVector,
            filter: {
              projectId: projectId,
            },
          });

          console.log(`[Tool] ✅ Found ${results?.length || 0} matching segments.`);

          if (!results || results.length === 0) {
            return [];
          }

          // 3. Return formatted results
          return results.map((res: any) => ({
            mediaId: res.metadata.mediaId,
            startTime: res.metadata.startTime,
            endTime: res.metadata.endTime,
            summary: res.metadata.subject || res.metadata.text,
            relevanceScore: res.score,
          }));
        } catch (error) {
          console.error(`[Tool] ❌ Vector search failed:`, error);
          // Fallback to basic summary search if vector failed
          const prisma = getPrisma();
          const media = await prisma.media.findMany({
            where: {
              projectId,
              OR: [{ summary: { contains: query, mode: 'insensitive' } }, { tags: { has: query } }],
            },
            take: 5,
          });
          return media.map((m) => ({ mediaId: m.id, summary: m.summary, isFallback: true }));
        }
      },
    }),

    getAvailableEffects: createTool({
      id: 'getAvailableEffects',
      description:
        'Returns the list of available cinematic effects and visual filters that can be applied to the timeline via the "EFFECT" operation.',
      inputSchema: z.object({}),
      execute: async () => {
        console.log(`[Tool] ✨ Fetching library of cinematic effects...`);
        const standardParams = {
          easeIn: 'Duration in ms (e.g. 500)',
          easeOut: 'Duration in ms (e.g. 1000)',
        };

        return [
          {
            name: 'Grayscale',
            description: 'Converts video to black and white for a classic or moody look.',
            parameters: { ...standardParams },
          },
          {
            name: 'Sepia',
            description: 'Applies a warm, reddish-brown tone for a vintage or nostalgic feel.',
            parameters: { ...standardParams },
          },
          {
            name: 'Blur',
            description: 'Softens the image. Useful for backgrounds or transitions.',
            parameters: {
              intensity: 'Number (1-10)',
              ...standardParams,
            },
          },
          {
            name: 'Glitch',
            description: 'Adds digital artifacts and timing errors for an edgy, tech-focused vibe.',
            parameters: { ...standardParams },
          },
          {
            name: 'Pixelate',
            description: 'Reduces resolution for a retro 8-bit or censored look.',
            parameters: {
              size: 'Number (2-20)',
              ...standardParams,
            },
          },
          {
            name: 'Zoom',
            description: 'Dynamic camera push-in or pull-out.',
            parameters: {
              level: 'Scale factor (1.0 to 2.0)',
              ...standardParams,
            },
          },
        ];
      },
    }),

    getCurrentTimeline: createTool({
      id: 'getCurrentTimeline',
      description:
        'Retrieves the current state of the video timeline, including all tracks, clips, and their positions. Use the "focus" parameters to only see a specific window of time.',
      inputSchema: z.object({
        focusStartMs: z
          .number()
          .optional()
          .describe('Only return clips starting after this time (ms).'),
        focusEndMs: z
          .number()
          .optional()
          .describe('Only return clips ending before this time (ms).'),
        trackId: z
          .number()
          .optional()
          .describe('Filter results to only include this specific track index.'),
        sampleRateMs: z
          .number()
          .optional()
          .describe(
            'The resolution of the Vertical Stack analysis (e.g. 100 for 10 samples per second). Default is 1000ms.',
          ),
      }),
      execute: async ({ focusStartMs, focusEndMs, trackId, sampleRateMs }) => {
        console.log(`[Tool] 📺 Fetching timeline for project: ${projectId}`);
        const prisma = getPrisma();

        const project = await prisma.project.findUnique({
          where: { id: projectId },
          include: { media: true },
        });

        if (!project) {
          return { message: 'Project not found.' };
        }

        // Use cached timeline if available
        const timeline = (await getTimeline(projectId)) as any;

        if (!timeline) {
          return { message: 'Timeline is empty.' };
        }

        const mediaMap = new Map((project.media as any[]).map((m) => [m.id, m]));

        // Define Window
        const startWindow = focusStartMs || 0;
        const endWindow = focusEndMs || Number.MAX_SAFE_INTEGER;

        const allTracks = timeline.tracks || [];
        const filteredTracks =
          trackId !== undefined
            ? allTracks.filter((_: any, idx: number) => idx === trackId)
            : allTracks;

        // Calculate actual project duration across ALL tracks
        let totalDurationMs = 0;
        allTracks.forEach((track: any) => {
          track.children?.forEach((child: any) => {
            const endMs = (child.start || 0) + (child.duration || 0);
            if (endMs > totalDurationMs) totalDurationMs = endMs;
          });
        });

        const semanticTracks = filteredTracks.map((track: any, trackIdx: number) => {
          let currentMs = 0;
          const segments = (track.children || [])
            .map((child: any) => {
              const startMs = child.start || 0;
              const durationMs = child.duration || 0;
              const endMs = startMs + durationMs;
              currentMs = Math.max(currentMs, endMs);

              // Skip if completely outside window
              if (endMs < startWindow || startMs > endWindow) {
                return null;
              }

              if (child.type === 'Gap' || child.name === 'Gap') {
                return {
                  type: 'GAP',
                  start: startMs,
                  end: endMs,
                  duration: durationMs,
                };
              }

              const mediaId = child.mediaId || child.metadata?.mediaId;
              const mediaInfo = mediaId ? mediaMap.get(mediaId) : null;

              const sourceStartMs = child.sourceStart || 0;
              const sourceEndMs = sourceStartMs + durationMs;

              let segmentSummary = '';
              if (mediaInfo?.shotBreakdown) {
                const segments = (mediaInfo.shotBreakdown as any).segments || [];
                const overlappingSegments = segments.filter((seg: any) => {
                  const segStart = timeToSeconds(seg.startTime) * 1000;
                  const segEnd = timeToSeconds(seg.endTime) * 1000;
                  return segStart < sourceEndMs && segEnd > sourceStartMs;
                });

                if (overlappingSegments.length > 0) {
                  segmentSummary = overlappingSegments
                    .map((s: any) => s.narrative_log || s.subject)
                    .join(' ')
                    .slice(0, 150);
                }
              }

              return {
                type: 'CLIP',
                id: child.id || child.name,
                mediaId: mediaId,
                mimeType: mediaInfo?.mimeType,
                start: startMs,
                end: endMs,
                duration: durationMs,
                sourceStart: sourceStartMs,
                summary: segmentSummary || mediaInfo?.summary || 'No summary available.',
                tags: (mediaInfo?.tags || []).slice(0, 5),
                effects: child.effects || [],
              };
            })
            .filter(Boolean);

          return {
            trackIndex: trackId !== undefined ? trackId : trackIdx,
            trackName: track.name || `Track ${trackIdx}`,
            kind: track.kind,
            duration: currentMs,
            segments,
          };
        });

        // Vertical Composition Analysis
        const verticalStack: any[] = [];
        const intervalMs = sampleRateMs || 1000;

        // Cap samples at 100 to handle up to 100s at 1s intervals
        const maxSamples = 100;
        let sampleCount = 0;

        for (let t = startWindow; t < endWindow && sampleCount < maxSamples; t += intervalMs) {
          const layers = semanticTracks
            .map((track: any) => {
              const active = track.segments.find((s: any) => t >= s.start && t < s.end);
              return active ? { track: track.trackName, type: active.type, id: active.id } : null;
            })
            .filter(Boolean);

          if (layers.length > 0) {
            verticalStack.push({ timeMs: t, layers });
          }
          sampleCount++;
        }

        console.log(
          `[Tool] ✅ Timeline state synthesized (${semanticTracks.length} tracks, total duration: ${totalDurationMs}ms).`,
        );
        return {
          projectId: project.id,
          title: project.title,
          totalDurationMs,
          viewWindow: { start: startWindow, end: endWindow },
          tracks: semanticTracks,
          verticalStack: verticalStack.slice(0, 20),
        };
      },
    }),

    getClipDetails: createTool({
      id: 'getClipDetails',
      description: 'Fetches technical details and shot breakdown for a specific media clip.',
      inputSchema: z.object({
        mediaId: z.string().describe('The database ID of the media asset.'),
      }),
      execute: async ({ mediaId }) => {
        const prisma = getPrisma();
        const media = await prisma.media.findUnique({
          where: { id: mediaId },
        });

        if (!media) throw new Error(`Clip ${mediaId} not found`);
        return media;
      },
    }),

    applyEditOperations: createTool({
      id: 'applyEditOperations',
      description:
        'Applies a sequence of edit operations to the project timeline. THE PROJECT HAS A FIXED 4-TRACK ARCHITECTURE: Track 0 (Visuals), Track 1 (Soundtrack), Track 2 (FX/Overlays), Track 3 (Sound Effects).',
      inputSchema: z.object({
        title: z.string().describe('Descriptive title for the edit.'),
        reasoning: z.string().describe('Creative rationale.'),
        operations: z.array(
          z.object({
            type: z.enum([
              'APPEND',
              'INSERT',
              'OVERLAY',
              'TRIM',
              'EFFECT',
              'DELETE',
              'EMPTY_TRACK',
              'UPDATE',
            ]),
            id: z
              .string()
              .optional()
              .describe('Unique ID of the clip to update/delete (surgical).'),
            mediaId: z.string().optional().describe('The media ID (required for CLIP operations).'),
            trackId: z
              .number()
              .min(0)
              .max(3)
              .default(0)
              .describe('T0: Visuals | T1: Soundtrack | T2: FX/Overlays | T3: SFX. ONLY use 0-3.'),
            sourceStart: z.number().optional().describe('Point in source video (ms). Default 0.'),
            duration: z.number().optional().describe('Duration of segment/effect (ms).'),
            start: z.number().optional().describe('Target point on timeline (ms).'),
            effectType: z
              .enum(['Grayscale', 'Blur', 'Sepia', 'Glitch', 'Pixelate', 'Zoom'])
              .optional()
              .describe('Type of visual effect to apply.'),
            parameters: z
              .record(z.string(), z.any())
              .optional()
              .describe(
                'Effect or Clip parameters. For audio clips, use "volume" (0.0 to 1.0), "fadeIn" (ms), and "fadeOut" (ms) for blending.',
              ),
            kind: z.enum(['Video', 'Audio']).optional().describe('Kind of track to add.'),
          }),
        ),
      }),
      execute: async ({ title, reasoning, operations }) => {
        try {
          console.log(`[Tool] 🎬 Applying ${operations.length} operations for ${projectId}`);

          let currentTimeline = await getTimeline(projectId);
          if (!currentTimeline) {
            currentTimeline = {
              name: 'tracks',
              tracks: [],
              metadata: { createdAt: new Date().toISOString() },
            };
          }

          const timeline = await applyOperationsToTimeline(currentTimeline, operations as any);
          await saveTimeline(projectId, timeline);

          await triggerPusherEvent(`project-${projectId}`, 'project-updated', {
            projectId: projectId,
            timeline: timeline,
            editSummary: { title, reasoning },
          });

          return { status: 'success', appliedTitle: title };
        } catch (err: any) {
          console.error(`[Tool] ❌ applyEditOperations Error:`, err);
          return { status: 'error', message: err.message };
        }
      },
    }),
  };
};
