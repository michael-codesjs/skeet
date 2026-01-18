import { objectType } from 'nexus';
import * as NexusPrisma from 'nexus-prisma';

const { Session: SessionNexus } = NexusPrisma;

export const Session = objectType({
  name: SessionNexus.$name,
  description: SessionNexus.$description,
  definition(t) {
    t.field('id', SessionNexus.id);
    t.field('userId', SessionNexus.userId);
    t.field('expiresAt', SessionNexus.expiresAt);
    t.field('token', SessionNexus.token);
    t.field('createdAt', SessionNexus.createdAt);
    t.field('updatedAt', SessionNexus.updatedAt);
    t.field('ipAddress', SessionNexus.ipAddress);
    t.field('userAgent', SessionNexus.userAgent);
    t.field('user', SessionNexus.user);
  },
});
