import { Mastra } from '@mastra/core';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { Skeet } from './agents';
import { mediaAnalyzer } from './agents/media-analyzer';

console.log('Current working directory:', process.cwd());
dotenv.config({ path: path.join(process.cwd(), '.env') });

const skeet = new Skeet({ projectId: '' });

export const mastra = new Mastra({
  agents: {
    skeet: skeet.getAgent(),
    mediaAnalyzer,
  },
  workflows: {},
});
