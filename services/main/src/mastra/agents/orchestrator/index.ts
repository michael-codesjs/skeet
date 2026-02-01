import { Agent } from '@mastra/core/agent';
import { MessageListInput } from '@mastra/core/dist/agent/message-list';
import { createTool } from '@mastra/core/tools';
import { Memory } from '@mastra/memory';
import { PostgresStore } from '@mastra/pg';
import { z } from 'zod';
import { createTools } from './create-tools';
import { getEditorAgent } from './editor';
import { prompt } from './instructions';
import { getScoutAgent } from './scout';

const connectionString = process.env.DATABASE_URL!;

type SkeetConfig = {
  projectId: string;
};

export class Skeet {
  private orchestrator: Agent;
  private scout: Agent;
  private editor: Agent;
  private memory: Memory;
  private projectId: string;

  constructor(config: SkeetConfig) {
    this.projectId = config.projectId;
    this.initializeMemory();
    this.setupOrchestratorAgent();
  }

  public getAgent() {
    return this.orchestrator;
  }

  private initializeMemory() {
    const storage = new PostgresStore({
      id: 'pg-storage',
      connectionString,
    });
    this.memory = new Memory({
      options: {
        lastMessages: 20,
        generateTitle: true,
        workingMemory: {
          enabled: true,
          scope: 'resource',
        },
      },
      storage,
    });
  }

  private setupOrchestratorAgent() {
    const tools = createTools(this.projectId);

    // 1. Initialize specialized sub-agents with baked tools
    this.scout = getScoutAgent(tools);
    this.editor = getEditorAgent(tools);

    // 2. Initialize the Orchestrator with sub-agent tools
    this.orchestrator = new Agent({
      id: `skeet-${this.projectId}`,
      name: 'Skeet Orchestrator',
      model: 'google/gemini-3-pro-preview',
      instructions: {
        role: 'system',
        content: prompt,
      },
      memory: this.memory,
      tools: {
        scout: createTool({
          id: 'scout',
          description: 'Calls the Scout to search for clips or retrieve technical details.',
          inputSchema: z.object({
            question: z
              .string()
              .describe('The search query or technical question about the media.'),
          }),
          execute: async ({ question }) => {
            try {
              console.log(`[Skeet] 🔍 [${this.projectId}] Consulting Analyst: ${question}`);
              const result = await this.scout.generate(`Question: ${question}`);
              console.log(`[Skeet] ✅ Analyst finished (${result.text?.length || 0} chars).`);
              return result.text;
            } catch (err: any) {
              console.error(`[Skeet] ❌ Analyst Error:`, err);
              return `Error consulting Scout: ${err.message}`;
            }
          },
        }),
        editor: createTool({
          id: 'editor',
          description:
            'Calls the Editor to perform creative edits or update the timeline OTIO. For complex requests, call this tool multiple times for different segments or chunks of the edit.',
          inputSchema: z.object({
            request: z
              .string()
              .describe(
                "The user's creative editing instructions for this specific chunk or the whole edit.",
              ),
            context: z
              .string()
              .describe('Recommended clips and technical data provided by the Scout.'),
          }),
          execute: async ({ request, context }) => {
            try {
              console.log(
                `[Skeet] 🎬 [${this.projectId}] Consulting Director... (Request: ${request.length} chars)`,
              );

              const result = await this.editor.generate(
                `Clips Context: ${context}\nCreative Request: ${request}`,
              );

              console.log(`[Skeet] ✨ Editor finished (${result.text?.length || 0} chars).`);
              return result.text;
            } catch (err: any) {
              console.error(`[Skeet] 🎬 Editor Error:`, err);
              return `The director failed to respond: ${err.message}`;
            }
          },
        }),
      },
    });
  }

  public async stream(messages: MessageListInput, threadId: string) {
    console.log(`[Skeet] 🚀 Streaming session for ${this.projectId} (Thread: ${threadId})`);

    return await this.orchestrator.stream(messages, {
      memory: {
        resource: this.projectId,
        thread: threadId,
      },
      providerOptions: {
        google: {
          thinkingConfig: {
            thinkingLevel: 'low',
            includeThoughts: true,
          },
        },
      },
    });
  }
}
