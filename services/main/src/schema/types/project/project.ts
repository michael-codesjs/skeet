import { triggerPusherEvent } from '@/lib/pusher';
import { s3 } from '@/lib/storage/s3';
import { getProjectMetadata, getTimeline, saveTimeline } from '@/lib/timeline/persistence';
import { extendType, inputObjectType, nonNull, objectType, stringArg } from 'nexus';
import * as NexusPrisma from 'nexus-prisma';
import { Media } from '../media/media';

const { Project: ProjectNexus } = NexusPrisma;

export const Project = objectType({
  name: ProjectNexus.$name,
  description: ProjectNexus.$description,
  definition(t) {
    t.field(ProjectNexus.id);
    t.field(ProjectNexus.createdAt);
    t.field(ProjectNexus.updatedAt);
    t.field(ProjectNexus.title);
    t.field(ProjectNexus.description);
    t.field(ProjectNexus.finalS3Key);
    t.field(ProjectNexus.status);
    t.field('timeline', {
      type: ProjectNexus.timeline.type,
      resolve: async (parent) => {
        // Computed field: Try Redis cache first, fallback to DB
        const timeline = await getTimeline(parent.id);
        return timeline || (parent as any).timeline;
      },
    });
    t.list.field('media', {
      type: Media,
      args: {
        search: stringArg(),
        type: stringArg(),
      },
      resolve: async (parent, { search, type }, ctx) => {
        const where: any = { projectId: parent.id, parentMediaId: null };

        if (type && type !== 'all') {
          if (type === 'photo') where.mimeType = { startsWith: 'image/' };
          else if (type === 'video') where.mimeType = { startsWith: 'video/' };
          else if (type === 'audio') where.mimeType = { startsWith: 'audio/' };
        }

        if (search) {
          where.OR = [
            { fileName: { contains: search, mode: 'insensitive' } },
            { tags: { has: search } },
          ];
        }

        return ctx.prisma.media.findMany({
          where,
          orderBy: { createdAt: 'desc' },
        });
      },
    });
    t.field(ProjectNexus.userId);
    t.field(ProjectNexus.user);

    t.nullable.string('finalVideoUrl', {
      resolve: async (parent) => {
        if (!parent.finalS3Key) return null;
        return s3.getDownloadUrl(parent.finalS3Key);
      },
    });
  },
});

export const ProjectQueries = extendType({
  type: 'Query',
  definition(t) {
    t.field('project', {
      type: 'Project',
      args: {
        id: nonNull(stringArg()),
      },
      resolve: async (_root, { id }, ctx) => {
        return ctx.prisma.project.findUnique({
          where: { id, userId: ctx.user?.id },
        });
      },
    });
    t.list.field('projects', {
      type: 'Project',
      resolve: async (_root, _args, ctx) => {
        if (!ctx.user) throw new Error('Not authenticated');
        return ctx.prisma.project.findMany({
          where: { userId: ctx.user.id },
          orderBy: { createdAt: 'desc' },
        });
      },
    });
  },
});

export const TimelineTrackChildInput = inputObjectType({
  name: 'TimelineTrackChildInput',
  definition(t) {
    t.nonNull.string('type'); // 'Clip' | 'Gap' | 'Effect'
    t.nonNull.int('start');
    t.nonNull.int('duration');
    // Clip fields
    t.string('mediaId');
    t.int('sourceStart');
    // Effect fields
    t.string('effectType');
    t.field('parameters', { type: 'Json' });
    // Common
    t.string('name');
    t.field('metadata', { type: 'Json' });
  },
});

export const TimelineTrackInput = inputObjectType({
  name: 'TimelineTrackInput',
  definition(t) {
    t.nonNull.string('name');
    t.nonNull.string('kind'); // 'Video' | 'Audio'
    t.nonNull.list.nonNull.field('children', { type: TimelineTrackChildInput });
    t.field('metadata', { type: 'Json' });
  },
});

export const TimelineInput = inputObjectType({
  name: 'TimelineInput',
  definition(t) {
    t.nonNull.string('name');
    t.nonNull.list.nonNull.field('tracks', { type: TimelineTrackInput });
    t.field('metadata', { type: 'Json' });
  },
});

export const ProjectMutations = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('createProject', {
      type: 'Project',
      args: {
        title: stringArg(),
        description: nonNull(stringArg()),
      },
      resolve: async (_root, { title, description }, ctx) => {
        return ctx.prisma.project.create({
          data: {
            title,
            description,
            userId: ctx.user.id,
            status: 'READY',
          },
        });
      },
    });

    t.field('updateProject', {
      type: 'Project',
      args: {
        id: nonNull(stringArg()),
        title: stringArg(),
        description: stringArg(),
      },
      resolve: async (_root, { id, title, description }, ctx) => {
        const project = await ctx.prisma.project.findUnique({
          where: { id },
        });

        if (!project) {
          throw new Error('Project not found');
        }

        if (project.userId !== ctx.user.id) {
          throw new Error('Not authorized');
        }

        const updatedProject = await ctx.prisma.project.update({
          where: { id },
          data: {
            title: title || undefined,
            description: description || undefined,
          },
        });

        // Broadcast update via Pusher
        await triggerPusherEvent(`project-${id}`, 'project-updated', {
          projectId: id,
          title: updatedProject.title,
          description: updatedProject.description,
        });

        return updatedProject;
      },
    });

    t.field('saveProjectTimeline', {
      type: 'Project',
      args: {
        id: nonNull(stringArg()),
        timeline: nonNull(TimelineInput),
      },
      resolve: async (_root, { id, timeline }: any, ctx) => {
        // 1. Ownership Check (Cached Metadata)
        const projectMetadata = await getProjectMetadata(id);
        if (!projectMetadata || projectMetadata.userId !== ctx.user.id) {
          throw new Error('Project not found');
        }

        // 2. Save entire timeline to both Redis and DB (write-through)
        await saveTimeline(id, timeline as any);

        // 3. Broadcast update to other connected clients
        await triggerPusherEvent(`project-${id}`, 'project-updated', {
          projectId: id,
          timeline: timeline,
        });

        return {
          ...projectMetadata,
          timeline: timeline,
        } as any;
      },
    });

    t.field('exportProjectVideo', {
      type: 'Project',
      args: {
        id: nonNull(stringArg()),
      },
      resolve: async (_root, { id }, ctx) => {
        const project = await ctx.prisma.project.findUnique({
          where: { id },
        });

        if (!project) throw new Error('Project not found');
        if (project.userId !== ctx.user.id) throw new Error('Not authorized');

        console.log(`[Export] 🎬 Starting export for project: ${id}`);

        try {
          // 1. Update status to processing
          await ctx.prisma.project.update({
            where: { id },
            data: { status: 'PROCESSING' },
          });

          // 2. Broadcast export started
          await triggerPusherEvent(`project-${id}`, 'export-started', {
            projectId: id,
            startedAt: new Date().toISOString(),
          });

          // 3. Execute export (synchronous)
          const { exportService } = await import('@/lib/video/export-service');
          const finalKey = await exportService.exportProject(id);

          console.log(`[Export] ✅ Project ${id} exported successfully to ${finalKey}`);

          // 4. Update project with final S3 key and status
          const updatedProject = await ctx.prisma.project.update({
            where: { id },
            data: {
              finalS3Key: finalKey,
              status: 'READY',
            },
          });

          // 5. Broadcast export completed
          await triggerPusherEvent(`project-${id}`, 'export-completed', {
            projectId: id,
            finalS3Key: finalKey,
            completedAt: new Date().toISOString(),
          });

          return updatedProject;
        } catch (error) {
          console.error(`[Export] ❌ Export failed for project ${id}:`, error);

          // Update status to FAILED
          await ctx.prisma.project.update({
            where: { id },
            data: { status: 'FAILED' },
          });

          // Broadcast export failed
          await triggerPusherEvent(`project-${id}`, 'export-failed', {
            projectId: id,
            error: error instanceof Error ? error.message : 'Unknown error',
            failedAt: new Date().toISOString(),
          });

          throw error;
        }
      },
    });
  },
});
