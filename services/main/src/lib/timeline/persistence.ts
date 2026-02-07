import { getPrisma } from '@/context';
import redis from '../redis';
import { Timeline } from './types';

const TIMELINE_CACHE_TTL = 60 * 30; // 30 minutes

/**
 * Get cache key for timeline data
 */
const getTimelineKey = (projectId: string) => `timeline:${projectId}`;

/**
 * Get timeline with cache-aside pattern:
 * 1. Try Redis first (fast)
 * 2. Fallback to DB if cache miss
 * 3. Cache the DB result if found
 */
export async function getTimeline(projectId: string): Promise<Timeline | null> {
  try {
    // Try Redis cache first
    const cacheKey = getTimelineKey(projectId);
    const cached = await redis.get<Timeline>(cacheKey);

    if (cached) {
      console.log(`[Timeline] ✅ Cache HIT for project ${projectId}`);
      // Reset TTL on read to keep active timelines in cache
      await redis.expire(cacheKey, TIMELINE_CACHE_TTL);
      return cached;
    }

    console.log(`[Timeline] ❌ Cache MISS for project ${projectId}, loading from DB`);

    // Cache miss - load from DB
    const prisma = getPrisma();
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { timeline: true },
    });

    if (!project || !project.timeline) {
      return null;
    }

    const timeline = project.timeline as unknown as Timeline;

    // Cache it for next time
    await redis.set(cacheKey, timeline, { ex: TIMELINE_CACHE_TTL });
    console.log(`[Timeline] 💾 Loaded from DB and cached: ${projectId}`);

    return timeline;
  } catch (error) {
    console.error(`[Timeline] Error fetching timeline:`, error);
    return null;
  }
}

/**
 * Get cache key for project metadata
 */
const getProjectKey = (projectId: string) => `project:${projectId}`;

/**
 * Get project metadata (cached)
 * Only fetches minimal ID/Owner info
 */
export async function getProjectMetadata(projectId: string): Promise<{
  id: string;
  userId: string;
  title: string;
  description: string;
  status: any;
  createdAt: string | Date;
  updatedAt: string | Date;
} | null> {
  const cacheKey = getProjectKey(projectId);
  const cached = await redis.get<{
    id: string;
    userId: string;
    title: string;
    description: string;
    status: any;
    createdAt: string | Date;
    updatedAt: string | Date;
  }>(cacheKey);

  if (cached) return cached;

  const prisma = getPrisma();
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      userId: true,
      title: true,
      description: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!project) return null;

  await redis.set(cacheKey, project, { ex: 60 * 60 * 24 }); // Cache for 24h
  return project;
}

/**
 * Save timeline with write-through caching:
 * 1. Save to Redis (fast, for reads)
 * 2. Save to DB (persistent storage)
 * Both happen in parallel for speed
 */
export async function saveTimeline(projectId: string, timeline: Timeline): Promise<void> {
  try {
    const cacheKey = getTimelineKey(projectId);
    const prisma = getPrisma();

    // Write to both Redis and DB in parallel (write-through)
    await Promise.all([
      // Save to Redis cache
      redis.set(cacheKey, timeline, { ex: TIMELINE_CACHE_TTL }),

      // Save to DB
      prisma.project.update({
        where: { id: projectId },
        data: { timeline: timeline as any },
      }),
    ]);

    console.log(`[Timeline] 💾 Saved to both Redis and DB: ${projectId}`);
  } catch (error) {
    console.error(`[Timeline] Error saving timeline:`, error);
    throw error;
  }
}

/**
 * Invalidate timeline cache
 * Use when you want to force next read to fetch from DB
 */
export async function invalidateTimeline(projectId: string): Promise<void> {
  try {
    const cacheKey = getTimelineKey(projectId);
    const projKey = getProjectKey(projectId);
    await Promise.all([redis.del(cacheKey), redis.del(projKey)]);
    console.log(`[Timeline] 🗑️ Invalidated cache for ${projectId}`);
  } catch (error) {
    console.error(`[Timeline] Error invalidating cache:`, error);
  }
}
