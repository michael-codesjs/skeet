import { getProjectSummary } from '@/lib/project-context';
import { Skeet } from '@/mastra/agents/orchestrator';
import { memory } from '@/mastra/memory';
import { Router } from 'express';

const router = Router();

// Get all threads
router.get('/threads', async (req, res) => {
  try {
    const resourceId = req.query.resourceId as string;
    const page = parseInt(req.query.page as string) || 0;
    const perPage = parseInt(req.query.perPage as string) || 10;

    if (!resourceId) throw new Error('Resource id is required');
    const result = await memory.listThreads({
      filter: {
        resourceId,
      },
      orderBy: {
        direction: 'DESC',
        field: 'createdAt',
      },
      page,
      perPage,
    });
    res.json(result);
  } catch (err: any) {
    console.error('Error fetching threads:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get message history for a thread
router.get('/history/:threadId', async (req, res) => {
  try {
    const { threadId } = req.params;
    const page = parseInt(req.query.page as string) || 0;
    const perPage = parseInt(req.query.perPage as string) || 20;

    const result = await memory.recall({
      threadId,
      page,
      perPage,
    });
    res.json(result);
  } catch (err: any) {
    console.error('Error fetching history:', err);
    res.status(500).json({ error: err.message });
  }
});

// Chat endpoint (Mastra-triggered)
router.post('/', async (req, res) => {
  try {
    const { projectId, prompt, threadId } = req.body;

    if (!projectId || !prompt) {
      return res.status(400).json({ error: 'Missing projectId or prompt' });
    }

    // Use provided threadId or create a new one
    let activeThreadId = threadId;
    let isNewThread = false;

    if (!activeThreadId) {
      const newThread = await memory.createThread({
        resourceId: projectId,
      });
      activeThreadId = newThread.id;
      isNewThread = true;
    }

    console.log(
      `[Chat] Using Encapsulated Skeet for project ${projectId} (Thread: ${activeThreadId})`,
    );

    const skeet = new Skeet({ projectId });

    const messages = [];

    // Inject summary on new threads to give agent a starting point
    const projectSummary = await getProjectSummary(projectId).catch(() => '');
    if (projectSummary) {
      messages.push({ role: 'system' as const, content: projectSummary });
    }

    messages.push({ role: 'user' as const, content: prompt });

    const runOutput = await skeet.stream(messages, activeThreadId);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // If it's a new thread, notify the client immediately
    if (isNewThread) {
      res.write(
        `data: ${JSON.stringify({ type: 'thread-created', payload: { threadId: activeThreadId } })}\n\n`,
      );
    }

    const reader = runOutput.fullStream.getReader();

    req.on('close', () => {
      reader.cancel();
    });

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      console.log('data:', value);
      res.write(`data: ${JSON.stringify(value)}\n\n`);
    }
    res.end();
  } catch (err: any) {
    console.error('Chat error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', payload: { error: err.message } })}\n\n`);
      res.end();
    }
  }
});

export default router;
