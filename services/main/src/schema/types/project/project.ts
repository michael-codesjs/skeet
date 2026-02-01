import { extendType, nonNull, objectType, stringArg } from 'nexus';
import * as NexusPrisma from 'nexus-prisma';
import { s3 } from '../../../lib/storage/s3';
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
    t.field('otio', {
      type: ProjectNexus.otio.type,
      resolve: async (parent) => {
        return (parent as any).otio;
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

        return ctx.prisma.project.update({
          where: { id },
          data: {
            title: title || undefined,
            description: description || undefined,
          },
        });
      },
    });
  },
});
