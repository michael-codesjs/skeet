import { Request, Response } from 'express';

/**
 * Higher-order function to adapt a pure worker function to an Express handler.
 * It extracts the request body and passes it to the worker.
 */
export const createWorkerHandler = <T>(worker: (payload: T) => Promise<void>) => {
  return async (req: Request, res: Response) => {
    try {
      // In QStash, the body is already parsed by express.json()
      const payload = req.body as T;

      await worker(payload);

      res.status(200).json({
        success: true,
        message: 'Worker executed successfully',
      });
    } catch (error) {
      console.error('[Worker Handler Error]:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal worker error',
      });
    }
  };
};
