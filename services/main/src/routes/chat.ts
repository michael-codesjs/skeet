import { getProjectSummary } from '@/lib/project-context';
import { Skeet } from '@/mastra/agents/orchestrator';
import { Router } from 'express';

const router = Router();

// Get all threads
router.get('/threads', async (req, res) => {
  try {
    const projectId = req.query.projectId as string;
    const page = parseInt(req.query.page as string) || 0;
    const perPage = parseInt(req.query.perPage as string) || 10;

    if (!projectId) throw new Error('Project id is required');

    const skeet = new Skeet({ projectId });
    const result = await skeet.listThreads({ page, perPage });

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
    const projectId = req.query.projectId as string;
    const page = parseInt(req.query.page as string) || 0;
    const perPage = parseInt(req.query.perPage as string) || 20;

    if (!projectId) throw new Error('Project id is required');

    const skeet = new Skeet({ projectId });
    const result = await skeet.getThreadHistory(threadId, { page, perPage });

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

    const skeet = new Skeet({ projectId });

    console.log(
      `[Chat] Using Encapsulated Skeet for project ${projectId} (Thread: ${threadId || 'new'})`,
    );

    const messages = [];

    // Inject summary on new threads to give agent a starting point
    const projectSummary = await getProjectSummary(projectId).catch(() => '');
    if (projectSummary) {
      messages.push({ role: 'system' as const, content: projectSummary });
    }

    messages.push({ role: 'user' as const, content: prompt });

    const { runOutput, threadId: activeThreadId } = await skeet.stream(messages, threadId);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // If it's a new thread (no threadId provided in request), notify the client
    if (!threadId) {
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
