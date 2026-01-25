import { extendType, nonNull, objectType, stringArg } from 'nexus';
import * as NexusPrisma from 'nexus-prisma';
import { createDraftFromVibe, EditDecisionList, modifyDraft } from '../../../lib/director';
import { triggerPusherEvent } from '../../../lib/pusher';
import { enqueueAssembleSkeetJob, enqueueVideoProcessingJobs } from '../../../lib/qstash';
import { s3 } from '../../../lib/storage/s3';

const { Project: ProjectNexus } = NexusPrisma;

export const Project = objectType({
  name: ProjectNexus.$name,
  description: ProjectNexus.$description,
  definition(t) {
    t.field(ProjectNexus.id);
    t.field(ProjectNexus.createdAt);
    t.field(ProjectNexus.updatedAt);
    t.field(ProjectNexus.title);
    t.field(ProjectNexus.prompt);
    t.field(ProjectNexus.finalS3Key);
    t.field(ProjectNexus.status);
    t.field(ProjectNexus.editJson);
    t.field(ProjectNexus.clips);
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
        prompt: nonNull(stringArg()),
      },
      resolve: async (_root, { title, prompt }, ctx) => {
        return ctx.prisma.project.create({
          data: {
            title,
            prompt,
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
        prompt: stringArg(),
      },
      resolve: async (_root, { id, title, prompt }, ctx) => {
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
            prompt: prompt || undefined,
          },
        });
      },
    });

    t.field('reanalyzeProjectAssets', {
      type: 'Project',
      args: {
        id: nonNull(stringArg()),
      },
      resolve: async (_root, { id }, ctx) => {
        if (!ctx.user) throw new Error('Not authenticated');

        const project = await ctx.prisma.project.findUnique({
          where: { id },
          include: { clips: true },
        });

        if (!project || project.userId !== ctx.user.id) {
          throw new Error('Project not found or unauthorized');
        }

        console.log(
          `[Reanalyze] Restarting processing for ${project.clips.length} clips in project ${id}`,
        );

        // Process in parallel
        await Promise.all(
          project.clips.map(async (clip) => {
            // Reset status
            await ctx.prisma.videoFile.update({
              where: { id: clip.id },
              data: {
                status: 'PROCESSING',
                analysisReady: false,
                thumbnailReady: false,
              },
            });
            await enqueueVideoProcessingJobs(clip.id, project.id);
          }),
        );

        return project;
      },
    });

    t.field('generateSkeet', {
      type: 'Project',
      args: {
        id: nonNull(stringArg()),
        pacing: stringArg(), // 'fast' | 'slow' | 'mixed'
        intensity: stringArg(), // 'high' | 'chill' | 'cinematic'
        musicStyle: stringArg(),
        focusSubject: stringArg(),
      },
      resolve: async (_root, args: any, ctx) => {
        // Legacy support or redirect to new flow?
        // For now, let's keep it but maybe it should just call the new draft logic + export immediately?
        // But the user specifically asked for an interactive flow.
        // Let's leave this as is for 'One-Click' generation if we still want it,
        // but we will implement the new mutations below.
        throw new Error('Use generateProjectDraft for the new Studio flow.');
      },
    });

    t.field('generateProjectDraft', {
      type: 'Project',
      args: {
        id: nonNull(stringArg()),
        vibe: nonNull(stringArg()),
        pacing: stringArg(),
      },
      resolve: async (_root, { id, vibe }, ctx) => {
        if (!ctx.user) throw new Error('Not authenticated');

        const project = await ctx.prisma.project.findUnique({
          where: { id },
          include: { clips: true },
        });

        if (!project || project.userId !== ctx.user.id) {
          throw new Error('Project not found or unauthorized');
        }

        // Fire and forget draft generation
        (async () => {
          try {
            const assetMetadata = project.clips.map((c) => ({
              id: c.id,
              fileName: c.fileName,
              duration: c.duration,
              tags: c.tags,
              summary: c.summary,
              analysisData: c.analysisData,
              // Legacy fallbacks
              shotBreakdown: c.shotBreakdown,
            }));

            const pusherChannel = `project-${id}`;
            const edl = await createDraftFromVibe(id, vibe, assetMetadata, pusherChannel);

            await ctx.prisma.project.update({
              where: { id },
              data: { editJson: edl as any, status: 'DRAFT_READY' },
            });

            await triggerPusherEvent(pusherChannel, 'draft-ready', { projectId: id });
          } catch (err) {
            console.error('Draft generation failed', err);
            await triggerPusherEvent(`project-${id}`, 'error', {
              message: 'Draft generation failed',
            });
          }
        })();

        return project;
      },
    });

    t.field('updateProjectDraft', {
      type: 'Project',
      args: {
        id: nonNull(stringArg()),
        editJson: nonNull(stringArg()), // Passing JSON as string to avoid complex input types for now
      },
      resolve: async (_root, { id, editJson }, ctx) => {
        if (!ctx.user) throw new Error('Not authenticated');

        const project = await ctx.prisma.project.findUnique({ where: { id } });
        if (!project || project.userId !== ctx.user.id) throw new Error('Unauthorized');

        const updated = await ctx.prisma.project.update({
          where: { id },
          data: { editJson: JSON.parse(editJson) },
        });

        // Notify others
        await triggerPusherEvent(`project-${id}`, 'draft-updated', {
          edl: updated.editJson,
          source: 'manual',
        });
        return updated;
      },
    });

    t.field('aiEditProjectDraft', {
      type: 'Project',
      args: {
        id: nonNull(stringArg()),
        instruction: nonNull(stringArg()),
      },
      resolve: async (_root, { id, instruction }, ctx) => {
        if (!ctx.user) throw new Error('Not authenticated');

        const project = await ctx.prisma.project.findUnique({ where: { id } });
        if (!project || project.userId !== ctx.user.id) throw new Error('Unauthorized');
        if (!project.editJson) throw new Error('No draft exists to edit');

        (async () => {
          try {
            const pusherChannel = `project-${id}`;
            const currentEdl = project.editJson as unknown as EditDecisionList;

            const newEdl = await modifyDraft(currentEdl, instruction, pusherChannel);

            await ctx.prisma.project.update({
              where: { id },
              data: { editJson: newEdl as any },
            });
          } catch (err) {
            console.error('AI Edit failed', err);
            await triggerPusherEvent(`project-${id}`, 'error', { message: 'AI Edit failed' });
          }
        })();

        return project;
      },
    });

    t.field('exportProjectVideo', {
      type: 'Project',
      args: {
        id: nonNull(stringArg()),
      },
      resolve: async (_root, { id }, ctx) => {
        if (!ctx.user) throw new Error('Not authenticated');

        const project = await ctx.prisma.project.findUnique({ where: { id } });
        if (!project || project.userId !== ctx.user.id) throw new Error('Unauthorized');
        if (!project.editJson) throw new Error('No draft to export');

        await ctx.prisma.project.update({
          where: { id },
          data: { status: 'PROCESSING' },
        });

        await enqueueAssembleSkeetJob({ projectId: id, edl: project.editJson });

        return project;
      },
    });
  },
});
