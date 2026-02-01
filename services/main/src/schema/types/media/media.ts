import { queue } from '@/lib/messaging/qstash';
import { extendType, inputObjectType, list, nonNull, objectType, stringArg } from 'nexus';
import * as NexusPrisma from 'nexus-prisma';
import { v4 as uuidv4 } from 'uuid';
import { s3 } from '../../../lib/storage/s3';

const { Media: MediaNexus } = NexusPrisma;

export const Media = objectType({
  name: MediaNexus.$name,
  description: MediaNexus.$description,
  definition(t) {
    t.field(MediaNexus.id);
    t.field(MediaNexus.createdAt);
    t.field(MediaNexus.updatedAt);

    t.field(MediaNexus.s3Key);
    t.field(MediaNexus.bucket);
    t.field(MediaNexus.fileName);
    t.field(MediaNexus.mimeType);
    t.field(MediaNexus.size);
    t.field(MediaNexus.duration);

    t.field(MediaNexus.status);
    t.field(MediaNexus.tags);
    t.field(MediaNexus.summary);
    t.field(MediaNexus.shotBreakdown);

    t.field(MediaNexus.thumbnailReady);
    t.field(MediaNexus.analysisReady);

    t.field(MediaNexus.userId);
    t.field(MediaNexus.user);
    t.field(MediaNexus.projectId);
    t.field(MediaNexus.project);

    // Computed field: returns a presigned URL for the thumbnail
    t.nullable.string('thumbnail', {
      description: 'Presigned URL to the generated thumbnail image',
      resolve: async (parent, _args, ctx) => {
        if (parent.mimeType && parent.mimeType.startsWith('image/')) {
          return s3.getDownloadUrl(parent.s3Key);
        }

        if (!parent.thumbnailReady) return null;

        const userId = ctx.user?.id;
        // Verify ownership
        if (!userId || parent.userId !== userId) {
          return null;
        }

        const thumbKey = parent.s3Key.replace(/^(.*\/)?([^/]+)$/, `$1thumbnails/${parent.id}.jpg`);
        return s3.getDownloadUrl(thumbKey);
      },
    });

    t.nullable.string('proxyUrl', {
      resolve: async (parent) => {
        const proxyKey = (parent as any).proxyUrl;
        if (!proxyKey) return null;
        return s3.getDownloadUrl(proxyKey);
      },
    });

    t.nullable.string('videoUrl', {
      resolve: async (parent) => s3.getDownloadUrl(parent.s3Key),
    });
  },
});

export const MediaUploadInput = inputObjectType({
  name: 'MediaUploadInput',
  definition(t) {
    t.nonNull.string('fileName');
    t.nonNull.string('contentType');
    t.nonNull.int('size');
  },
});

export const MediaCreateResult = objectType({
  name: 'MediaCreateResult',
  definition(t) {
    t.nonNull.string('id');
    t.nonNull.string('uploadUrl');
  },
});

export const MediaFilesMutations = extendType({
  type: 'Mutation',
  definition(t) {
    t.nonNull.list.nonNull.field('createMedia', {
      // Renamed from createVideos
      type: 'MediaCreateResult',
      args: {
        projectId: nonNull(stringArg()),
        files: nonNull(list(nonNull('MediaUploadInput'))),
      },
      resolve: async (_root, { projectId, files }, ctx) => {
        const userId = ctx.user!.id;

        const project = await ctx.prisma.project.findUnique({
          where: { id: projectId, userId },
        });

        if (!project) throw new Error('Project not found');

        const validFiles = files.map((file) => ({
          ...file,
          key: `projects/${projectId}/uploads/${uuidv4()}-${file.fileName}`,
        }));

        const createdMedia = await ctx.prisma.$transaction(
          validFiles.map((file) =>
            ctx.prisma.media.create({
              data: {
                s3Key: file.key,
                bucket: process.env.STORAGE_BUCKET || `skeet-media-${process.env.STAGE || 'dev'}`,
                fileName: file.fileName,
                mimeType: file.contentType,
                size: file.size,
                status: 'UPLOADING',
                userId: userId,
                projectId,
              },
            }),
          ),
        );

        const results = await Promise.all(
          createdMedia.map(async (media) => {
            const uploadUrl = await s3.getUploadUrl(media.s3Key, media.mimeType);
            return {
              id: media.id,
              uploadUrl,
            };
          }),
        );

        return results;
      },
    });

    t.nonNull.field('confirmMediaUploads', {
      type: 'Boolean',
      args: {
        projectId: nonNull(stringArg()),
        ids: nonNull(list(nonNull(stringArg()))),
      },
      resolve: async (_root, { projectId, ids }, ctx) => {
        const userId = ctx.user!.id;

        const project = await ctx.prisma.project.findUnique({
          where: { id: projectId, userId },
          include: {
            media: {
              where: { id: { in: ids } },
            },
          },
        });

        if (!project) throw new Error('Project not found');

        const mediaToConfirm = project.media;

        if (!mediaToConfirm.length) throw new Error('Need media to confirm upload');

        if (mediaToConfirm.length > 0) {
          await queue
            .enqueuePostMediaUploadJobs(
              mediaToConfirm.map((media) => ({
                mediaId: media.id,
                projectId: media.projectId!,
                userId,
              })),
            )
            .catch((err) => {
              console.error(`[QStash] Failed to enqueue post-upload jobs:`, err);
            });
        }

        return true;
      },
    });

    t.nonNull.field('deleteMedia', {
      type: Media,
      args: {
        id: nonNull(stringArg()),
      },
      resolve: async (_root, { id }, ctx) => {
        const userId = ctx.user!.id;

        const media = await ctx.prisma.media.findUnique({
          where: { id },
        });

        if (!media || media.userId !== userId) {
          throw new Error('File not found or unauthorized');
        }

        try {
          await s3.deleteFile(media.s3Key);
        } catch (error) {
          console.error(`Failed to delete file from S3: ${media.s3Key}`, error);
        }

        return ctx.prisma.media.delete({
          where: { id },
        });
      },
    });
  },
});
