import { getPrisma } from '@/context';
import { PostMediaUploadJobPayload } from '@/lib/messaging/qstash';
import { refreshProjectContext } from '@/lib/project-context';
import { triggerPusherEvent } from '@/lib/pusher';
import { s3 } from '@/lib/storage/s3';
import { mastra } from '@/mastra';
import { MediaAnalysisSchema } from '@/mastra/agents/media-analyzer/schema';
import { getMediaVectorStore } from '@/mastra/vector';
import { ModelRouterEmbeddingModel } from '@mastra/core/llm';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { extractMetadata, generateVideoProxy } from './extract-streams';
import { generateThumbnail } from './generate-thumbnail';
import { downloadFile, getMediaType, uploadFile } from './utils';

/**
 * Core worker logic for post-media-upload processing.
 * Decoupled from HTTP req/res for future queue flexibility.
 */
export const postMediaUploadWorker = async (payload: PostMediaUploadJobPayload): Promise<void> => {
  const { mediaId, projectId } = payload;
  const prisma = getPrisma();

  console.log(`[Post-Upload Worker] Processing media: ${mediaId} in project: ${projectId}`);

  try {
    // 1. Fetch media record
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
    });

    if (!media) {
      console.error(`[Post-Upload Worker] Media record ${mediaId} not found`);
      return;
    }

    // 2. Check if file exists in S3
    const exists = await s3.checkFileExists(media.s3Key);
    if (!exists) {
      console.error(`[Post-Upload Worker] File not found in S3: ${media.s3Key}`);
      await prisma.media.update({
        where: { id: mediaId },
        data: { status: 'FAILED' },
      });
      return;
    }

    // Initialize finalThumbnailUrl with existing URL, update if generated
    let finalThumbnailUrl = media.thumbnailUrl;

    // 3. Update status to PROCESSING
    await prisma.media.update({
      where: { id: mediaId },
      data: { status: 'PROCESSING' },
    });

    // Notify UI that we've started processing
    await triggerPusherEvent(`project-${projectId}`, 'asset-updated', {
      mediaId,
      status: 'PROCESSING',
    });

    // 4. Handle Media specific processing
    const mediaType = getMediaType(media.mimeType);

    if (mediaType === 'video') {
      console.log(
        `[Post-Upload Worker] Video detected for ${mediaId}, starting thumbnail generation...`,
      );

      const tempDir = os.tmpdir();
      const tempVideoPath = path.join(tempDir, `${mediaId}-${media.fileName}`);
      let tempThumbPath: string | null = null;
      let generatedThumbnailUrl: string | null = null;

      try {
        // Download video
        await downloadFile(media.s3Key, tempVideoPath);

        // --- EXTRACT METADATA ---
        try {
          const { duration } = await extractMetadata(tempVideoPath);
          console.log(`[Post-Upload Worker] Extracted duration: ${duration}s for ${mediaId}`);
          await prisma.media.update({
            where: { id: mediaId },
            data: { duration },
          });
        } catch (metadataError) {
          console.error(
            `[Post-Upload Worker] Failed to extract metadata for ${mediaId}:`,
            metadataError,
          );
        }

        // Generate thumbnail
        tempThumbPath = await generateThumbnail(tempVideoPath, mediaId);

        // Upload thumbnail
        const thumbKey = media.s3Key.replace(/^(.*\/)?([^/]+)$/, `$1thumbnails/${mediaId}.jpg`);

        console.log(`[Post-Upload Worker] Uploading thumbnail to ${thumbKey}`);
        generatedThumbnailUrl = await uploadFile(tempThumbPath, thumbKey, 'image/jpeg');

        // Generate signed URL for immediate display
        const signedThumbnailUrl = await s3.getDownloadUrl(thumbKey);
        finalThumbnailUrl = signedThumbnailUrl;

        await prisma.media.update({
          where: { id: mediaId },
          data: {
            thumbnailUrl: generatedThumbnailUrl, // Store direct reference
            thumbnailReady: true,
            status: 'READY',
          },
        });

        console.log(
          `[Post-Upload Worker] Thumbnail generated and status set to READY for ${mediaId}`,
        );

        // Notify UI that thumbnail is ready
        await triggerPusherEvent(`project-${projectId}`, 'asset-updated', {
          mediaId,
          thumbnailUrl: finalThumbnailUrl,
          thumbnailReady: true,
        });

        // --- GENERATE PROXY VIDEO (720p) ---
        try {
          console.log(`[Post-Upload Worker] Generating proxy for ${mediaId}...`);
          const proxyPath = await generateVideoProxy(tempVideoPath, tempDir, mediaId);
          const proxyKey = media.s3Key.replace(/^(.*\/)?([^/]+)$/, `$1proxies/${mediaId}.mp4`);
          await uploadFile(proxyPath, proxyKey, 'video/mp4');

          // Update original media with proxy S3 key
          await prisma.media.update({
            where: { id: mediaId },
            data: { proxyUrl: proxyKey },
          });
          console.log(`[Post-Upload Worker] Generated proxy: ${proxyKey}`);

          // Get a temporary signed URL for immediate UI notification
          const signedProxyUrl = await s3.getDownloadUrl(proxyKey);

          // Notify UI that proxy is ready
          await triggerPusherEvent(`project-${projectId}`, 'asset-updated', {
            mediaId,
            proxyUrl: signedProxyUrl,
          });

          // Cleanup proxy file
          await fs.promises.unlink(proxyPath).catch((err) => {
            console.warn(`[Post-Upload Worker] Failed to unlink proxyPath: ${err.message}`);
          });
        } catch (proxyError) {
          console.error(`[Post-Upload Worker] Proxy generation failed for ${mediaId}:`, proxyError);
          // Don't fail the parent job
        }
      } catch (thumbError) {
        console.error(
          `[Post-Upload Worker] Thumbnail generation failed for ${mediaId}:`,
          thumbError,
        );
        await prisma.media.update({
          where: { id: mediaId },
          data: { status: 'READY' },
        });
      } finally {
        // Cleanup
        try {
          await Promise.allSettled([
            fs.promises.unlink(tempVideoPath),
            tempThumbPath ? fs.promises.unlink(tempThumbPath) : Promise.resolve(),
          ]);
        } catch (cleanupError) {
          console.warn('[Post-Upload Worker] Cleanup error:', cleanupError);
        }
      }
    } else {
      // For images, audio or unknown, we just mark as READY for now
      await prisma.media.update({
        where: { id: mediaId },
        data: { status: 'READY' },
      });
    }

    // 5. Run AI Analysis
    console.log(`[Post-Upload Worker] Starting AI analysis for ${mediaId}...`);
    try {
      const mediaAnalyzer = mastra.getAgent('mediaAnalyzer');
      // Always use the original media file for analysis (signed URL)
      // This ensures we analyze the video itself (not just a thumbnail) and avoid 403 errors on private buckets
      const analysisUrl = await s3.getDownloadUrl(media.s3Key);

      if (analysisUrl && mediaType === 'video') {
        try {
          const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { title: true, description: true },
          });

          const projectContext = project
            ? `\n\nProject Context:\nTitle: ${project.title || 'Untitled'}\nDescription: ${project.description || 'No description provided.'}\nUse this context to inform your analysis and tagging, prioritizing elements relevant to this project's theme.`
            : '';

          console.log(`[Post-Upload Worker] Sending to AI Analyzer: ${analysisUrl}`);
          const response = await mediaAnalyzer.generate(
            [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: `Analyze this video content.${projectContext}`,
                  },
                  {
                    type: 'file',
                    data: analysisUrl,
                    mimeType: media.mimeType,
                  },
                ],
              },
            ],
            {
              structuredOutput: {
                schema: MediaAnalysisSchema,
              },
            },
          );

          console.log(`[Post-Upload Worker] AI Analysis complete for ${mediaId}`);

          const analysisData = response.object;

          if (analysisData) {
            // Aggregate tags from all segments
            const allTags = analysisData.segments
              .flatMap((segment) => [
                ...(segment.usageTags || []),
                segment.aesthetics?.lighting,
                segment.aesthetics?.texture,
                segment.camera?.shotSize,
                segment.camera?.movement,
                ...(segment.aesthetics?.colors || []),
              ])
              .filter(Boolean);

            await prisma.media.update({
              where: { id: mediaId },
              data: {
                analysisReady: true,
                summary: analysisData.summary, // Use the overall summary
                tags: [...new Set(allTags)], // Distinct tags across all segments
                shotBreakdown: analysisData, // Store the full structure with segments
              },
            });

            // --- RAG INGESTION ---
            console.log(
              `[Post-Upload Worker] Ingesting ${analysisData.segments.length} segments into RAG...`,
            );

            try {
              const embedder = new ModelRouterEmbeddingModel('google/text-embedding-004');
              const { embeddings } = await embedder.doEmbed({
                values: analysisData.segments.map((s) => s.vectorContext),
              });

              await getMediaVectorStore().upsert({
                indexName: 'media-segments',
                vectors: embeddings,
                metadata: analysisData.segments.map((s, i) => ({
                  mediaId,
                  projectId,
                  startTime: s.startTime,
                  endTime: s.endTime,
                  subject: s.subject,
                  energy: s.metrics.energy,
                  text: s.vectorContext,
                })),
              });

              console.log(`[Post-Upload Worker] RAG Ingestion complete for ${mediaId}`);
            } catch (ragError) {
              console.error(`[Post-Upload Worker] RAG Ingestion failed:`, ragError);
              // Don't fail the whole process if RAG fails, but log it
            }

            // Notify UI that AI analysis is complete
            await triggerPusherEvent(`project-${projectId}`, 'asset-updated', {
              mediaId,
              analysisReady: true,
              summary: analysisData.summary,
              tags: [...new Set(allTags)],
              aiStatus: 'SUCCESS',
            });
          }
        } catch (error) {
          console.error(`[Post-Upload Worker] AI Analysis failed for ${mediaId}:`, error);
          await triggerPusherEvent(`project-${projectId}`, 'asset-updated', {
            mediaId,
            aiStatus: 'FAILED',
            error: 'AI analysis failed to process response structure',
          });
        }
      }
    } catch (aiError) {
      console.error(`[Post-Upload Worker] AI Analysis failed for ${mediaId}:`, aiError);
      await triggerPusherEvent(`project-${projectId}`, 'asset-updated', {
        mediaId,
        aiStatus: 'FAILED',
        error: 'AI analysis connection or API error',
      });
      // We don't fail the whole job if AI fails, just log it
    }

    // 6. Final Notification
    const updatedMedia = await prisma.media.findUnique({ where: { id: mediaId } });

    await triggerPusherEvent(`project-${projectId}`, 'asset-updated', {
      mediaId,
      status: 'READY',
      thumbnailUrl: finalThumbnailUrl,
      analysisReady: updatedMedia?.analysisReady || false,
    });

    console.log(`[Post-Upload Worker] Job completed for media: ${mediaId}`);

    // Refresh project context in Redis so AI agents have up-to-date awareness
    await refreshProjectContext(projectId!).catch((err) => {
      console.error(`[Post-Upload Worker] Failed to refresh context for ${projectId}:`, err);
    });
  } catch (error) {
    console.error(`[Post-Upload Worker] Error processing media ${mediaId}:`, error);
    await prisma.media.update({
      where: { id: mediaId },
      data: { status: 'FAILED' },
    });

    await triggerPusherEvent(`project-${projectId}`, 'asset-updated', {
      mediaId,
      status: 'FAILED',
    });
  }
};
