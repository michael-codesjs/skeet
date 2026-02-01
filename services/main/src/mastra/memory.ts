import { Memory } from '@mastra/memory';
import { PostgresStore } from '@mastra/pg';

const connectionString = process.env.DATABASE_URL!;

export const memory = new Memory({
  options: {
    lastMessages: 20,
    generateTitle: true,
    workingMemory: {
      enabled: true,
      scope: 'resource',
    },
  },
  storage: new PostgresStore({
    id: 'pg-storage',
    connectionString,
  }),
});
