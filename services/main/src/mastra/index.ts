import * as dotenv from 'dotenv';
import * as path from 'path';

console.log('Current working directory:', process.cwd());
dotenv.config({ path: path.join(process.cwd(), '.env') });

console.log('GOOGLE_GENERATIVE_AI_API_KEY present:', !!process.env.GOOGLE_GENERATIVE_AI_API_KEY);

import { Mastra } from '@mastra/core';
import { scout } from './agents';

export const mastra = new Mastra({
  agents: {
    scout,
  },
});
