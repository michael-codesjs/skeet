import { ModelRouterEmbeddingModel } from '@mastra/core/llm';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { getPrisma } from '../../../context';
import { getMediaVectorStore } from '../../vector';

export const createTools = (projectId: string) => {
  return {
    getProjectManifest: createTool({
      id: 'getProjectManifest',
      description:
        'Returns the project overview and list of clips (IDs/names) for the current project.',
      inputSchema: z.object({}), // Empty schema!
      execute: async () => {
        console.log(`[Tool] 📂 Verbatim Fetch: Manifest for ${projectId}`);
        const prisma = getPrisma();
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          select: {
            id: true,
            title: true,
            description: true,
            media: {
              select: {
                id: true,
                fileName: true,
                status: true,
                summary: true,
                tags: true,
                mimeType: true,
                duration: true,
              },
            },
          },
        });
        return project;
      },
    }),

    searchSegments: createTool({
      id: 'searchSegments',
      description:
        'Searches for specific video segments across all project media using semantic search. Use this for finding specific "vibes", "actions", or "content" (e.g., "fast cars", "sunset", "smiling people"). Returns mediaId, timestamps, and segment description.',
      inputSchema: z.object({
        query: z
          .string()
          .describe('The search query (e.g., "dramatic landscape", "engine closeup").'),
        limit: z.number().optional().default(5).describe('How many segments to return (max 10).'),
      }),
      execute: async ({ query, limit }) => {
        console.log(`[Tool] 🔍 Semantic search: "${query}" for ${projectId}`);
        try {
          const embedder = new ModelRouterEmbeddingModel('google/text-embedding-004');
          const { embeddings } = await embedder.doEmbed({
            values: [query],
          });
          const embedding = embeddings[0];

          const results = await getMediaVectorStore().query({
            indexName: 'media-segments',
            queryVector: embedding,
            topK: Math.min(limit || 5, 10),
            filter: { projectId } as any,
          });

          console.log(`[Tool] ✅ Found ${results?.length || 0} relevant segments.`);
          return (results || []).map((r) => ({
            ...(r.metadata as any),
            score: r.score,
          }));
        } catch (err) {
          console.error(`[Tool] ❌ Search segments error:`, err);
          return [];
        }
      },
    }),

    getCurrentTimeline: createTool({
      id: 'getCurrentTimeline',
      description:
        'Fetches the current OTIO timeline structure and high-level clip summaries. Use this to understand what is already on the timeline.',
      inputSchema: z.object({}),
      execute: async () => {
        console.log(`[Tool] 🎬 Fetching Timeline Structure for ${projectId}`);
        const prisma = getPrisma();
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          select: {
            id: true,
            title: true,
            description: true,
            otio: true,
            media: {
              select: {
                id: true,
                fileName: true,
                status: true,
                summary: true,
                duration: true,
                tags: true,
              },
            },
          },
        });
        console.log(`[Tool] ✅ Timeline fetched (${project?.media?.length || 0} clips available)`);
        return project;
      },
    }),

    getClipDetails: createTool({
      id: 'getClipDetails',
      description:
        'Fetches the complete technical breakdown for a specific clip, including shot segments, camera movements, audio peaks, and aesthetic metrics. Use this when you need frame-level precision for effects, transitions, or timing decisions.',
      inputSchema: z.object({
        mediaId: z.string().describe('The database ID of the media asset to analyze.'),
      }),
      execute: async ({ mediaId }) => {
        console.log(`[Tool] 🔬 Fetching detailed breakdown for clip: ${mediaId}`);
        const prisma = getPrisma();

        const media = await prisma.media.findUnique({
          where: { id: mediaId },
          select: {
            id: true,
            fileName: true,
            duration: true,
            summary: true,
            tags: true,
            shotBreakdown: true,
            projectId: true,
          },
        });

        if (!media) {
          throw new Error(`Clip ${mediaId} not found`);
        }

        if (media.projectId !== projectId) {
          throw new Error('Access Denied: This clip does not belong to the current project.');
        }

        console.log(
          `[Tool] ✅ Clip details fetched (${(media.shotBreakdown as any)?.segments?.length || 0} segments)`,
        );
        return media;
      },
    }),

    applyEditOperations: createTool({
      id: 'applyEditOperations',
      description:
        'Applies a sequence of edit operations to the project timeline. IMPORTANT: For long videos (or to avoid full-clip joins), you MUST provide "sourceStartTime" and "sourceDuration" for every operation. If you do not, the tool will default to the full clip duration which is usually WRONG for creative editing.',
      inputSchema: z.object({
        title: z.string().describe('A descriptive title for this edit sequence.'),
        reasoning: z
          .string()
          .describe("The creative rationale behind these operations (the Director's 'why')."),
        operations: z
          .array(
            z.object({
              type: z.enum(['APPEND', 'INSERT', 'OVERLAY', 'TRIM', 'EFFECT']),
              mediaId: z.string().describe('The ID of the media asset.'),
              trackId: z.number().optional().default(0).describe('Video track (0=main, 1=overlay)'),
              sourceStartTime: z
                .number()
                .describe('The starting point in the source video in seconds.'),
              sourceDuration: z.number().describe('The length of the segment to use in seconds.'),
              timelineStartTime: z
                .number()
                .optional()
                .describe(
                  'The landing point on the timeline in seconds (Required for INSERT/OVERLAY/TRIM).',
                ),
              effectType: z.string().optional(),
              parameters: z.record(z.string(), z.any()).optional(),
            }),
          )
          .describe('Ordered list of precise edit operations.'),
      }),
      execute: async ({ title, reasoning, operations }) => {
        try {
          console.log(`[Tool] 🎬 Applying ${operations.length} edit operations for ${projectId}`);

          const { buildOTIOFromOperations, saveTimelineToProject } =
            await import('@/lib/otio/builder');

          // Build and save the timeline
          const timeline = await buildOTIOFromOperations(operations as any, projectId);
          await saveTimelineToProject(projectId, timeline);

          // Notify frontend via Pusher
          try {
            const { triggerPusherEvent } = await import('@/lib/pusher');
            await triggerPusherEvent(`project-${projectId}`, 'project-updated', {
              projectId: projectId,
              otio: timeline,
              editSummary: { title, reasoning },
            });
          } catch (pusherErr) {
            console.error(`[Tool] ❌ Pusher notification failed:`, pusherErr);
          }

          return {
            status: 'success',
            message: `Successfully applied ${operations.length} operations.`,
            appliedTitle: title,
          };
        } catch (err: any) {
          console.error(`[Tool] ❌ applyEditOperations Error:`, err);
          return {
            status: 'error',
            message: err.message,
          };
        }
      },
    }),
  };
};
