import { Agent } from '@mastra/core/agent';
import { createTools } from '../create-tools';
import { prompt } from './instructions';

export const getScoutAgent = (tools: ReturnType<typeof createTools>) => {
  const { getProjectManifest, searchSegments, getCurrentTimeline, getClipDetails } = tools;
  return new Agent({
    id: 'scout',
    name: 'Scout',
    instructions: {
      role: 'system',
      content: prompt,
      providerOptions: {
        google: {},
      },
    },
    model: 'google/gemini-3-flash-preview',
    tools: {
      getProjectManifest,
      searchSegments,
      getCurrentTimeline,
      getClipDetails,
    },
  });
};
