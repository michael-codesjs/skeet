import { Agent } from '@mastra/core/agent';
import { createTools } from '../create-tools';
import { prompt } from './instructions';

export const getEditorAgent = (tools: ReturnType<typeof createTools>) => {
  const { getCurrentTimeline, getClipDetails, applyEditOperations, getAvailableEffects } = tools;
  return new Agent({
    id: 'editor',
    name: 'Director/Editor Agent',
    instructions: {
      role: 'system',
      content: prompt,
    },
    model: 'google/gemini-3-flash-preview',
    tools: {
      getCurrentTimeline,
      getClipDetails,
      applyEditOperations,
      getAvailableEffects,
    },
  });
};
