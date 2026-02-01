import { Agent } from '@mastra/core/agent';
import { prompt } from './instructions';

export const mediaAnalyzer = new Agent({
  id: 'mediaAnalyzer',
  name: 'Media Analyzer Agent',
  instructions: {
    role: 'system',
    content: prompt,
    providerOptions: {
      google: {
        thinkingConfig: {
          includeThoughts: true,
          thinkingLevel: 'high',
        },
      },
    },
  },
  model: 'google/gemini-3-pro-preview',
});
