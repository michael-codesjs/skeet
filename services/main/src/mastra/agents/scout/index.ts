import { Agent } from '@mastra/core/agent';
import { prompt } from './instructions';

export const scout = new Agent({
  id: 'scout',
  name: 'Scout Agent',
  instructions: {
    role: 'system',
    content: prompt,
    providerOptions: {
      google: {},
    },
  },
  model: 'google/gemini-3-pro-preview',
  tools: {},
});
