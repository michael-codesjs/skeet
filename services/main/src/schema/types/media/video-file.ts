import { enqueueVideoProcessingJobs } from '@/lib/qstash';
import { extendType, inputObjectType, list, nonNull, objectType, stringArg } from 'nexus';
import * as NexusPrisma from 'nexus-prisma';
import { v4 as uuidv4 } from 'uuid';
import { s3 } from '../../../lib/storage/s3';

const { VideoFile: VideoFileNexus } = NexusPrisma;

export const VideoFile = objectType({
  name: VideoFileNexus.$name,
  description: VideoFileNexus.$description,
  definition(t) {
    t.field(VideoFileNexus.id);
    t.field(VideoFileNexus.createdAt);
    t.field(VideoFileNexus.updatedAt);
    t.field(VideoFileNexus.s3Key);
    t.field(VideoFileNexus.bucket);
    t.field(VideoFileNexus.fileName);
    t.field(VideoFileNexus.mimeType);
    t.field(VideoFileNexus.size);
    t.field(VideoFileNexus.duration);
    t.field(VideoFileNexus.status);
    t.field(VideoFileNexus.tags);
    t.field(VideoFileNexus.summary);
    t.field(VideoFileNexus.shotBreakdown); // Expose shotBreakdown JSON
    t.field(VideoFileNexus.thumbnailReady);
    t.field(VideoFileNexus.analysisReady);
    t.field(VideoFileNexus.analysisData); // Expose analysisData JSON
    t.field(VideoFileNexus.ownerId);
    t.field(VideoFileNexus.owner);
    t.field(VideoFileNexus.projectId);
    t.field(VideoFileNexus.project);

    // Computed field: returns a presigned URL for the thumbnail
    t.nullable.string('thumbnail', {
      description: 'Presigned URL to the generated thumbnail image',
      resolve: async (parent, _args, ctx) => {
        if (!parent.thumbnailReady) return null;

        const userId = ctx.user?.id;
        // Verify ownership
        if (!userId || parent.ownerId !== userId) {
          return null;
        }

        // Generate the thumbnail key from the s3Key
        const thumbKey = parent.s3Key.replace(/^(.*\/)?([^/]+)$/, `$1thumbnails/${parent.id}.jpg`);
        return s3.getDownloadUrl(thumbKey);
      },
    });

    t.nullable.string('videoUrl', {
      resolve: async (parent) => s3.getDownloadUrl(parent.s3Key),
    });
  },
});

export const VideoUploadInput = inputObjectType({
  name: 'VideoUploadInput',
  definition(t) {
    t.nonNull.string('fileName');
    t.nonNull.string('contentType');
    t.nonNull.int('size');
  },
});

export const VideoCreateResult = objectType({
  name: 'VideoCreateResult',
  definition(t) {
    t.nonNull.string('id');
    t.nonNull.string('uploadUrl');
  },
});

export const VideoFileMutations = extendType({
  type: 'Mutation',
  definition(t) {
    t.nonNull.list.nonNull.field('createVideos', {
      type: 'VideoCreateResult',
      args: {
        projectId: nonNull(stringArg()),
        files: nonNull(list(nonNull('VideoUploadInput'))),
      },
      resolve: async (_root, { projectId, files }, ctx) => {
        const userId = ctx.user!.id;

        // Verify project ownership
        const project = await ctx.prisma.project.findUnique({
          where: { id: projectId, userId },
        });

        if (!project) {
          throw new Error('Project not found');
        }

        // Prepare file data with keys
        const validFiles = files.map((file) => ({
          ...file,
          key: `projects/${projectId}/uploads/${uuidv4()}-${file.fileName}`,
        }));

        // Create all video entities in a single transaction
        const createdVideos = await ctx.prisma.$transaction(
          validFiles.map((file) =>
            ctx.prisma.videoFile.create({
              data: {
                s3Key: file.key,
                bucket: process.env.STORAGE_BUCKET || `skeet-media-${process.env.STAGE || 'dev'}`,
                fileName: file.fileName,
                mimeType: file.contentType,
                size: file.size,
                status: 'UPLOADING',
                ownerId: userId,
                projectId,
              },
            }),
          ),
        );

        // Generate upload URLs for each created video
        const results = await Promise.all(
          createdVideos.map(async (video) => {
            const uploadUrl = await s3.getUploadUrl(video.s3Key, video.mimeType);
            return {
              id: video.id,
              uploadUrl,
            };
          }),
        );

        return results;
      },
    });

    t.nonNull.list.nonNull.field('confirmVideoUploads', {
      type: 'VideoFile',
      args: {
        projectId: nonNull(stringArg()),
        ids: nonNull(list(nonNull(stringArg()))),
      },
      resolve: async (_root, { projectId, ids }, ctx) => {
        const userId = ctx.user!.id;

        // Verify project ownership
        const project = await ctx.prisma.project.findUnique({
          where: { id: projectId, userId },
        });

        if (!project) {
          throw new Error('Project not found');
        }

        // Fetch all video files pending upload for these IDs
        const videosToConfirm = await ctx.prisma.videoFile.findMany({
          where: {
            id: { in: ids },
            projectId,
            ownerId: userId,
            // We could optionally restrict to status: 'UPLOADING'
            // status: 'UPLOADING',
          },
        });

        const confirmedFiles = [];

        for (const video of videosToConfirm) {
          // Verify file exists in S3
          const exists = await s3.checkFileExists(video.s3Key);

          if (exists) {
            // Update status to PROCESSING
            const updated = await ctx.prisma.videoFile.update({
              where: { id: video.id },
              data: { status: 'PROCESSING' },
            });
            confirmedFiles.push(updated);

            // Enqueue background job
            enqueueVideoProcessingJobs(updated.id, projectId).catch((err) => {
              console.error(`[QStash] Failed to enqueue jobs for ${updated.id}:`, err);
            });
          } else {
            console.warn(
              `[confirmVideoUploads] File not found in S3: ${video.s3Key} (${video.id})`,
            );
            // Optionally set status to FAILED
            await ctx.prisma.videoFile.update({
              where: { id: video.id },
              data: { status: 'FAILED' },
            });
          }
        }

        return confirmedFiles;
      },
    });

    t.nonNull.field('deleteVideoFile', {
      type: 'VideoFile',
      args: {
        id: nonNull(stringArg()),
      },
      resolve: async (_root, { id }, ctx) => {
        const userId = ctx.user!.id;

        const file = await ctx.prisma.videoFile.findUnique({
          where: { id },
        });

        if (!file || file.ownerId !== userId) {
          throw new Error('File not found or unauthorized');
        }

        // Delete from S3
        try {
          await s3.deleteFile(file.s3Key);
        } catch (error) {
          console.error(`Failed to delete file from S3: ${file.s3Key}`, error);
          // Proceed with DB deletion even if S3 fails, or handle as needed
        }

        return ctx.prisma.videoFile.delete({
          where: { id },
        });
      },
    });
  },
});
