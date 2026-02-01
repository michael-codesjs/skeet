import { s3 } from '@/lib/storage/s3';
import { extendType, objectType, stringArg } from 'nexus';
import * as NexusPrisma from 'nexus-prisma';
const { User: UserNexus } = NexusPrisma;

export const User = objectType({
  name: UserNexus.$name,
  description: UserNexus.$description,
  definition(t) {
    t.field('id', UserNexus.id);
    t.field('name', UserNexus.name);
    t.field('email', UserNexus.email);
    t.field('phoneNumber', UserNexus.phoneNumber);
    t.field('image', UserNexus.image);
    t.field('profilePictureKey', UserNexus.profilePictureKey);
    t.field('createdAt', UserNexus.createdAt);
    t.field('updatedAt', UserNexus.updatedAt);
    t.field(UserNexus.projects);
    t.field(UserNexus.media);
    t.string('profilePictureComputed', {
      resolve: async (root) => {
        if (!root.profilePictureKey) return null;
        return s3.getDownloadUrl(root.profilePictureKey);
      },
    });
  },
});

export const UserQueries = extendType({
  type: 'Query',
  definition(t) {
    t.field('me', {
      type: 'User',
      description: 'Returns the currently authenticated user based on the session.',
      resolve: async (_root, _args, ctx) => {
        if (!ctx.user?.id) {
          return null;
        }

        return ctx.prisma.user.findUnique({
          where: { id: ctx.user.id },
        });
      },
    });
  },
});

export const UserMutations = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('updateUser', {
      type: 'User',
      args: {
        name: stringArg(),
      },
      resolve: async (_root, { name }, ctx) => {
        return ctx.prisma.user.update({
          where: { id: ctx.user!.id },
          data: {
            name: name || undefined,
          },
        });
      },
    });
  },
});
