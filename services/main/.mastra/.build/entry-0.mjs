import * as dotenv from 'dotenv';
import * as path from 'path';
import { Mastra } from '@mastra/core';
import { Agent } from '@mastra/core/agent';

const prompt = `
    You are a professional post-production editor with years of experience in the industry. 
`;

const scout = new Agent({
  id: "scout",
  name: "Scout Agent",
  instructions: {
    role: "system",
    content: prompt,
    providerOptions: {
      google: {}
    }
  },
  model: "google/gemini-3-pro-preview",
  tools: {}
});

console.log("Current working directory:", process.cwd());
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
console.log("GOOGLE_GENERATIVE_AI_API_KEY present:", !!process.env.GOOGLE_GENERATIVE_AI_API_KEY);
const mastra = new Mastra({
  agents: {
    scout
  }
});

export { mastra };
