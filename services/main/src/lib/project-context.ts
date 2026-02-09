import { getPrisma } from '@/context';
import redis from './redis';
import { getTimeline } from './timeline/persistence';

const CONTEXT_TTL = 60 * 60 * 24; // 24 hours

export async function getProjectSummary(projectId: string): Promise<string> {
  const cacheKey = `project_summary:${projectId}`;
  try {
    const cached = await redis.get<string>(cacheKey);
    if (cached) return cached;
  } catch (err) {}

  const prisma = getPrisma();
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      title: true,
      description: true,
      media: {
        where: { status: 'READY' },
        select: { id: true },
      },
    },
  });

  if (!project) return '';

  // Get timeline from Redis cache (or DB fallback)
  const timeline = await getTimeline(projectId);
  const trackCount = timeline?.tracks?.length || 0;
  const clipCount =
    timeline?.tracks?.reduce((acc: number, track: any) => acc + (track.children?.length || 0), 0) ||
    0;

  const summary = `Project ID: ${project.id} | Project: "${project.title || 'Untitled'}" | Description: "${project.description || 'No description'}" | Assets: ${project.media.length} | Timeline: ${trackCount} tracks, ${clipCount} clips. Use getProjectManifest if details seem outdated.`;
  await redis.set(cacheKey, summary, { ex: CONTEXT_TTL });
  return summary;
}

export async function getProjectContext(projectId: string): Promise<string> {
  const cacheKey = `project_context:${projectId}`;
  try {
    const cached = await redis.get<string>(cacheKey);
    if (cached) return cached;
  } catch (err) {}

  return await buildAndCacheContext(projectId);
}

async function buildAndCacheContext(projectId: string): Promise<string> {
  const prisma = getPrisma();
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      media: {
        where: { status: 'READY' },
        select: {
          id: true,
          fileName: true,
          summary: true,
          tags: true,
          duration: true,
          mimeType: true,
        },
      },
    },
  });

  if (!project) return '';

  const contextString = await formatContextForLLM(project);
  // Get timeline from Redis cache (or DB fallback)
  const timeline = await getTimeline(projectId);
  const trackCount = timeline?.tracks?.length || 0;
  const clipCount =
    timeline?.tracks?.reduce((acc: number, track: any) => acc + (track.children?.length || 0), 0) ||
    0;

  const summary = `Project: "${project.title || 'Untitled'}" | Description: "${project.description || 'No description'}" | Assets: ${(project as any).media?.length || 0} | Timeline: ${trackCount} tracks, ${clipCount} clips. Use getProjectManifest if details seem outdated.`;

  await Promise.all([
    redis.set(`project_context:${projectId}`, contextString, { ex: CONTEXT_TTL }),
    redis.set(`project_summary:${projectId}`, summary, { ex: CONTEXT_TTL }),
  ]);

  return contextString;
}

export async function refreshProjectContext(projectId: string): Promise<void> {
  await buildAndCacheContext(projectId);
}

async function formatContextForLLM(project: any): Promise<string> {
  const mediaList = project.media
    .map((m: any) => {
      const tags = m.tags?.length ? `Tags: [${m.tags.join(', ')}]` : '';
      const summary = m.summary ? `Summary: ${m.summary}` : 'No summary available.';
      const duration = m.duration ? `Duration: ${m.duration.toFixed(1)}s` : '';
      return `- [${m.id}] ${m.fileName} (${m.mimeType}). ${duration}. ${summary} ${tags}`;
    })
    .join('\n');

  // Get timeline for detailed track info
  const timeline = await getTimeline(project.id);
  const tracksSummary = (timeline?.tracks || [])
    .map((track: any, i: number) => {
      const clips = (track.children || [])
        .map((clip: any) => {
          if (clip.type === 'Gap') return '[Gap]';
          return `[Clip: ${clip.name}]`;
        })
        .join(' -> ');
      return `Track ${i} (${track.kind}): ${clips || 'Empty'}`;
    })
    .join('\n');

  return `
### ACTIVE PROJECT CONTEXT ###
Project ID: ${project.id}
Title: ${project.title || 'Untitled Project'}
Description: ${project.description || 'No description provided.'}

Available Media Clips (${project.media.length}):
${mediaList || 'No ready media clips found in this project yet.'}

Current Timeline State:
${tracksSummary || 'Timeline is completely empty.'}
##############################
`;
}
