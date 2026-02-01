import { Client } from '@upstash/qstash';

export type PostMediaUploadJobPayload = {
  mediaId: string;
  projectId: string;
  userId: string;
};

class QueueService {
  private static instance: QueueService;
  private client: Client;
  private workerBaseUrl: string;

  private constructor() {
    this.client = new Client({
      token: process.env.QSTASH_TOKEN || '',
    });
    this.workerBaseUrl = process.env.WORKER_BASE_URL || 'http://localhost:5445';
  }

  public static getInstance(): QueueService {
    if (!QueueService.instance) {
      QueueService.instance = new QueueService();
    }
    return QueueService.instance;
  }

  public enqueuePostMediaUploadJobs = async (
    payloads: PostMediaUploadJobPayload[],
  ): Promise<void> => {
    console.log(`[QStash] Enqueueing ${payloads.length} post-media-upload jobs`);
    await this.client.batchJSON(
      payloads.map((payload) => ({
        url: `${this.workerBaseUrl}/api/workers/post-media-upload`,
        body: payload,
        retries: 3,
      })),
    );
  };
}

export const queue = QueueService.getInstance();
