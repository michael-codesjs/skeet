import { objectType } from 'nexus';
import * as NexusPrisma from 'nexus-prisma';

const { Verification: VerificationNexus } = NexusPrisma;

export const Verification = objectType({
  name: VerificationNexus.$name,
  description: VerificationNexus.$description,
  definition(t) {
    t.field('id', VerificationNexus.id);
    t.field('identifier', VerificationNexus.identifier);
    t.field('value', VerificationNexus.value);
    t.field('expiresAt', VerificationNexus.expiresAt);
    t.field('createdAt', VerificationNexus.createdAt);
    t.field('updatedAt', VerificationNexus.updatedAt);
  },
});
