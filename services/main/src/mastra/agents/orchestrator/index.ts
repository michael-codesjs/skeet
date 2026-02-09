import { Agent } from '@mastra/core/agent';
import { MessageListInput } from '@mastra/core/dist/agent/message-list';
import { Memory } from '@mastra/memory';
import { PostgresStore } from '@mastra/pg';
import { createTools } from './create-tools';
import { prompt } from './instructions';

const connectionString = process.env.DATABASE_URL!;

type SkeetConfig = {
  projectId: string;
};

export class Skeet {
  private orchestrator: Agent;
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
        lastMessages: 10,
        generateTitle: true,
      },
      storage,
    });
  }

  private setupOrchestratorAgent() {
    const tools = createTools(this.projectId);

    // Initialize the Orchestrator with all project tools directly
    this.orchestrator = new Agent({
      id: `skeet-${this.projectId}`,
      name: 'Skeet Orchestrator',
      model: 'google/gemini-3-flash-preview',
      instructions: {
        role: 'system',
        content: prompt,
        providerOptions: {
          google: {
            thinkingConfig: {
              thinkingLevel: 'high',
              includeThoughts: true,
            },
          },
        },
      },
      memory: this.memory,
      tools: {
        getProjectManifest: tools.getProjectManifest,
        searchSegments: tools.searchSegments,
        getCurrentTimeline: tools.getCurrentTimeline,
        clearTimeline: tools.clearTimeline,
        getClipDetails: tools.getClipDetails,
        getCreativeLibrary: tools.getCreativeLibrary,
        applyEditOperations: tools.applyEditOperations,
      },
    });
  }

  public createThread() {
    return this.memory.createThread({
      resourceId: this.projectId,
    });
  }

  public listThreads(params: { page?: number; perPage?: number }) {
    return this.memory.listThreads({
      filter: {
        resourceId: this.projectId,
      },
      orderBy: {
        direction: 'DESC',
        field: 'createdAt',
      },
      page: params.page || 0,
      perPage: params.perPage || 10,
    });
  }

  public getThreadHistory(threadId: string, params: { page?: number; perPage?: number }) {
    return this.memory.recall({
      threadId,
      page: params.page || 0,
      perPage: params.perPage || 20,
    });
  }

  private async getOrCreateThread(threadId?: string) {
    if (threadId) return threadId;

    const thread = await this.createThread();
    return thread.id;
  }

  public async stream(messages: MessageListInput, threadId?: string) {
    const activeThreadId = await this.getOrCreateThread(threadId);

    // console.log(`[Skeet] 🚀 Streaming session for ${this.projectId} (Thread: ${activeThreadId})`);

    const runOutput = await this.orchestrator.stream(messages, {
      memory: {
        resource: this.projectId,
        thread: activeThreadId,
      },
      maxSteps: 20, // Allow agent to complete tool workflow + generate response
      providerOptions: {
        google: {
          thinkingConfig: {
            thinkingLevel: 'high',
            includeThoughts: true,
          },
        },
      },
    });

    return {
      runOutput,
      threadId: activeThreadId,
    };
  }
}
