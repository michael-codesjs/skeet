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
        // console.log(`[Tool] 📂 Fetching project manifest for: ${projectId}`);
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
        // console.log(`[Tool] 🔍 Searching segments for query: ${query}`);

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

          // console.log(`[Tool] ✅ Found ${results?.length || 0} matching segments.`);

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

    getCreativeLibrary: createTool({
      id: 'getCreativeLibrary',
      description:
        'Returns the creative palette of Skeet: Visual filters, cinematic presets, and transition types.',
      inputSchema: z.object({}),
      execute: async () => {
        // console.log(`[Tool] 🎨 Fetching creative library...`);
        const standardParams = {
          easeIn: 'Duration in ms (e.g. 500)',
          easeOut: 'Duration in ms (e.g. 1000)',
        };

        return {
          filters: [
            { name: 'Grayscale', vibe: 'Classic/Noir', params: { ...standardParams } },
            { name: 'Sepia', vibe: 'Vintage/Nostalgic', params: { ...standardParams } },
            {
              name: 'Blur',
              vibe: 'Dreamy/Soft Focus',
              params: { intensity: '1-10', ...standardParams },
            },
            { name: 'Glitch', vibe: 'Tech/Chaotic/Action', params: { ...standardParams } },
            {
              name: 'Pixelate',
              vibe: 'Retro/Censored',
              params: { size: '2-20', ...standardParams },
            },
            {
              name: 'Zoom',
              vibe: 'Dynamic/Emphasis',
              params: { level: '1.0-2.0', ...standardParams },
            },
          ],
          vibePresets: [
            {
              name: 'The Cinematic Punch',
              recipe:
                'Fast cuts (200-400ms) on T0 + Glitch effects on transitions + Bass impacts on T3.',
            },
            {
              name: 'Drift & Flow',
              recipe: 'Long 3-5s clips on T0 + Cross-dissolves + Ambient pads on T1.',
            },
            {
              name: 'The Narrative Hook',
              recipe: 'Close-ups from Scout on T0 + Voiceover on T1 + Text overlays on T2.',
            },
          ],
        };
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
        // console.log(`[Tool] 📺 Fetching timeline for project: ${projectId}`);
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
        const intervalMs = sampleRateMs || 2000; // Default to 2s for a broader overview

        // Increase sample count for better creative overview
        const maxSamples = 50;
        let sampleCount = 0;

        for (let t = startWindow; t < endWindow && sampleCount < maxSamples; t += intervalMs) {
          const layers = semanticTracks
            .map((track: any) => {
              const active = track.segments.find((s: any) => t >= s.start && t < s.end);
              return active
                ? {
                    track: track.trackName,
                    type: active.type,
                    id: active.id,
                    mediaId: active.mediaId,
                  }
                : null;
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
          verticalStack, // Return all collected samples
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

    clearTimeline: createTool({
      id: 'clearTimeline',
      description: 'DANGEROUS: Wipes all clips from all tracks. Use only if explicitly requested.',
      inputSchema: z.object({
        confirm: z.boolean().describe('Must be true to proceed.'),
      }),
      execute: async ({ confirm }) => {
        if (!confirm) return { status: 'error', message: 'Not confirmed.' };
        const timeline = {
          name: 'tracks',
          tracks: [
            { name: 'Main Visuals', kind: 'Video', children: [], metadata: {} },
            { name: 'Soundtrack', kind: 'Audio', children: [], metadata: {} },
            { name: 'FX & Overlays', kind: 'Video', children: [], metadata: {} },
            { name: 'Sound Effects', kind: 'Audio', children: [], metadata: {} },
          ],
          metadata: { lastCleared: new Date().toISOString() },
        };
        await saveTimeline(projectId, timeline as any);
        await triggerPusherEvent(`project-${projectId}`, 'project-updated', {
          projectId,
          timeline,
          editSummary: { title: 'Clear Timeline', reasoning: 'User requested reset' },
        });
        return { status: 'success', message: 'Timeline cleared.' };
      },
    }),

    applyEditOperations: createTool({
      id: 'applyEditOperations',
      description:
        'Surgical tool for modifying (UPDATE), trimming (TRIM), or deleting (DELETE) clips.',
      inputSchema: z.object({
        reasoning: z.string().describe('Creative rationale.'),
        operations: z.array(
          z.object({
            type: z.enum(['INSERT', 'OVERLAY', 'UPDATE', 'TRIM', 'EFFECT', 'DELETE', 'RIPPLE']),
            id: z
              .string()
              .optional()
              .describe('Target clip unique ID (Required for UPDATE/DELETE/TRIM).'),
            mediaId: z
              .string()
              .optional()
              .describe('Media asset ID (Required for INSERT/OVERLAY).'),
            trackId: z
              .number()
              .min(0)
              .max(3)
              .optional()
              .describe(
                'Track index: 0=Visuals, 1=Audio, 2=Overlays, 3=SFX. Required for INSERT/OVERLAY/RIPPLE. Optional for UPDATE (will search all tracks if omitted).',
              ),
            start: z
              .number()
              .optional()
              .describe('Timeline position in ms (where the clip sits on the timeline).'),
            duration: z
              .number()
              .optional()
              .describe('How long the clip plays on the timeline (ms).'),
            sourceStart: z
              .number()
              .optional()
              .describe(
                'Offset into the source media file (ms). E.g., sourceStart=2000 means start playing from 2 seconds into the original video.',
              ),
            fromTime: z
              .number()
              .optional()
              .describe('For RIPPLE: Start shifting clips from this timeline position (ms).'),
            delta: z
              .number()
              .optional()
              .describe(
                'For RIPPLE: Amount to shift clips (ms). Positive shifts right (later), negative shifts left (earlier).',
              ),
            effectType: z
              .enum(['Grayscale', 'Blur', 'Sepia', 'Glitch', 'Pixelate', 'Zoom'])
              .optional(),
            parameters: z.record(z.string(), z.any()).optional(),
          }),
        ),
      }),
      execute: async ({ reasoning, operations }) => {
        try {
          console.log(`[Tool] 🎬 applyEditOperations called with reasoning: "${reasoning}"`);
          console.log(`[Tool] 📋 Operations:`, JSON.stringify(operations, null, 2));

          const currentTimeline = (await getTimeline(projectId)) || {
            name: 'tracks',
            tracks: [],
            metadata: { createdAt: new Date().toISOString() },
          };

          // console.log(`[Tool] 📊 Current timeline has ${currentTimeline.tracks.length} tracks`);
          // currentTimeline.tracks.forEach((track, idx) => {
          //   console.log(`  Track ${idx}: ${track.children.length} clips`);
          // });

          const { timeline, warnings } = await applyOperationsToTimeline(
            currentTimeline,
            operations as any,
          );
          await saveTimeline(projectId, timeline);

          // console.log(`[Tool] ✅ Timeline updated successfully`);
          // timeline.tracks.forEach((track, idx) => {
          //   console.log(`  Track ${idx}: ${track.children.length} clips (after)`);
          // });

          await triggerPusherEvent(`project-${projectId}`, 'project-updated', {
            projectId,
            timeline,
            editSummary: { title: 'Surgical Edit', reasoning },
          });

          if (warnings.length > 0) {
            return {
              status: 'error',
              message:
                `❌ ${warnings.length} operation(s) FAILED due to collisions:\n\n` +
                warnings.join('\n') +
                `\n\n🔧 FIX: Use RIPPLE operation to make room BEFORE inserting clips.\n` +
                `Example: { type: "RIPPLE", trackId: 0, fromTime: 20500, delta: 10140 }`,
              warnings,
            };
          }

          return { status: 'success' };
        } catch (err: any) {
          console.error(`[Tool] ❌ applyEditOperations error:`, err);
          return { status: 'error', message: err.message };
        }
      },
    }),
  };
};
