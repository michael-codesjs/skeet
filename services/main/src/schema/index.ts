import { applyMiddleware } from 'graphql-middleware';
import { makeSchema } from 'nexus';
import { join } from 'path';
import { permissions } from './permissions';
import { DateTime, Json } from './scalars';
import * as types from './types';

const baseSchema = makeSchema({
  types: [types, DateTime, Json],
  outputs: {
    schema: join(process.cwd(), 'src/generated/schema.graphql'),
    typegen: join(process.cwd(), 'src/generated/nexus-typegen.ts'),
  },
  contextType: {
    module: join(process.cwd(), 'src/context.ts'),
    export: 'Context',
  },
  sourceTypes: {
    modules: [
      {
        module: '@prisma/client',
        alias: 'prisma',
      },
    ],
  },
});

export const schema = applyMiddleware(baseSchema, permissions);
