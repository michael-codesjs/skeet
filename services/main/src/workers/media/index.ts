import { PostMediaUploadJobPayload } from '@/lib/messaging/qstash';
import { verifyQStashSignature } from '@/middleware/qstash-verify';
import { Router } from 'express';
import { createWorkerHandler } from '../adapter';
import { postMediaUploadWorker } from './post-upload';

const router = Router();

/**
 * Media Worker HTTP Endpoints (QStash Webhooks)
 */
router.post(
  '/post-media-upload',
  verifyQStashSignature,
  createWorkerHandler<PostMediaUploadJobPayload>(postMediaUploadWorker),
);

export default router;
