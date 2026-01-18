import { objectType } from 'nexus';
import * as NexusPrisma from 'nexus-prisma';

const { Account: AccountNexus } = NexusPrisma;

export const Account = objectType({
  name: AccountNexus.$name,
  description: AccountNexus.$description,
  definition(t) {
    t.field('id', AccountNexus.id);
    t.field('accountId', AccountNexus.accountId);
    t.field('providerId', AccountNexus.providerId);
    t.field('userId', AccountNexus.userId);
    t.field('user', AccountNexus.user);
    // Not exposing sensitive tokens like accessToken, refreshToken, password, etc.
    t.field('createdAt', AccountNexus.createdAt);
    t.field('updatedAt', AccountNexus.updatedAt);
  },
});
