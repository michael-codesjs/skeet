import { randomUUID } from 'crypto';
import { extendType, nonNull, objectType, stringArg } from 'nexus';
import { S3Service } from '../../../lib/storage/s3';

export const ProfilePictureUploadUrlResult = objectType({
  name: 'ProfilePictureUploadUrlResult',
  definition(t) {
    t.nonNull.string('uploadUrl');
    t.nonNull.string('key');
  },
});

export const ProfileMutations = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('requestProfilePictureUploadUrl', {
      type: 'ProfilePictureUploadUrlResult',
      args: {
        contentType: nonNull(stringArg()),
      },
      resolve: async (_root, { contentType }, ctx) => {
        const userId = ctx.user!.id; // Safe due to permissions

        const key = `users/${userId}/profile-picture-${randomUUID()}`;
        const uploadUrl = await S3Service.getInstance().getUploadUrl(key, contentType);

        return {
          uploadUrl,
          key,
        };
      },
    });

    t.field('confirmProfilePictureUpload', {
      type: 'User',
      args: {
        key: nonNull(stringArg()),
      },
      resolve: async (_root, { key }, ctx) => {
        const userId = ctx.user!.id; // Safe due to permissions

        return ctx.prisma.user.update({
          where: { id: userId },
          data: {
            profilePictureKey: key,
          },
        });
      },
    });
  },
});
