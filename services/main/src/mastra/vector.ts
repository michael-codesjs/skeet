import { UpstashVector } from '@mastra/upstash';

let vectorStore: UpstashVector | null = null;

export const getMediaVectorStore = () => {
  if (vectorStore) return vectorStore;

  const url = process.env.UPSTASH_VECTOR_URL;
  const token = process.env.UPSTASH_VECTOR_TOKEN;

  if (!url || !token) {
    throw new Error(
      'MISSING UPSTASH CREDENTIALS: Please add UPSTASH_VECTOR_URL and UPSTASH_VECTOR_TOKEN to your .env file.',
    );
  }

  vectorStore = new UpstashVector({
    id: 'skeet-media-segments',
    url,
    token,
  });

  return vectorStore;
};
